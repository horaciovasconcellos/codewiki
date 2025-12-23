import { useState } from 'react';
import { Comunicacao } from '@/lib/types';
import { ComunicacaoDataTable } from './ComunicacaoDataTable';
import { ComunicacaoForm } from './ComunicacaoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, FileXls } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import * as XLSX from 'xlsx';

interface ComunicacaoViewProps {
  comunicacoes: Comunicacao[];
  onRefresh: () => void;
}

export function ComunicacaoView({ comunicacoes, onRefresh }: ComunicacaoViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingComunicacao, setEditingComunicacao] = useState<Comunicacao | undefined>(undefined);

  const exportToExcel = () => {
    // Preparar dados para exportação
    const dados = comunicacoes.map(com => ({
      'Sigla': com.sigla,
      'Tipo': com.tipo,
      'Tecnologias': com.tecnologias.join(', '),
      'Uso Típico': com.usoTipico || '',
    }));

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comunicações');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // Sigla
      { wch: 15 }, // Tipo
      { wch: 50 }, // Tecnologias
      { wch: 60 }, // Uso Típico
    ];
    ws['!cols'] = colWidths;

    // Gerar arquivo
    const data = new Date();
    const nomeArquivo = `comunicacoes_${data.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
    toast.success('Arquivo Excel exportado com sucesso!');
  };

  const handleSave = async (comunicacao: Comunicacao) => {
    try {
      if (editingComunicacao) {
        await apiPut(`/comunicacoes/${comunicacao.id}`, comunicacao);
        toast.success('Comunicação atualizada com sucesso!');
      } else {
        await apiPost('/comunicacoes', comunicacao);
        toast.success('Comunicação criada com sucesso!');
      }
      setShowForm(false);
      setEditingComunicacao(undefined);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao salvar comunicação');
      console.error(error);
    }
  };

  const handleEdit = (comunicacao: Comunicacao) => {
    setEditingComunicacao(comunicacao);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta comunicação?')) {
      try {
        await apiDelete(`/comunicacoes/${id}`);
        toast.success('Comunicação excluída com sucesso!');
        onRefresh();
      } catch (error) {
        toast.error('Erro ao excluir comunicação');
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingComunicacao(undefined);
  };

  const handleNew = () => {
    setEditingComunicacao(undefined);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Comunicações</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de padrões e tecnologias de comunicação entre sistemas
            </p>
          </div>
        </div>

        <Separator />

        {showForm ? (
          <ComunicacaoForm
            comunicacao={editingComunicacao}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Comunicações</CardTitle>
                  <CardDescription>
                    Gerencie os padrões de comunicação, tecnologias e casos de uso típicos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={exportToExcel} 
                    variant="outline"
                    disabled={comunicacoes.length === 0}
                  >
                    <FileXls className="mr-2" weight="fill" />
                    Exportar Excel
                  </Button>
                  <Button onClick={handleNew}>
                    <Plus className="mr-2" size={16} />
                    Nova Comunicação
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ComunicacaoDataTable
                comunicacoes={comunicacoes}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
