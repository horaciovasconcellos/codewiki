import { useState } from 'react';
import { Integracao, Comunicacao, Aplicacao } from '@/lib/types';
import { IntegracaoDataTable } from './IntegracaoDataTable';
import { IntegracaoForm } from './IntegracaoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { apiDelete, apiPost, apiPut } from '@/hooks/use-api';

interface IntegracaoViewProps {
  integracoes: Integracao[];
  comunicacoes: Comunicacao[];
  aplicacoes: Aplicacao[];
  onRefresh: () => void;
}

export function IntegracaoView({ 
  integracoes, 
  comunicacoes,
  aplicacoes,
  onRefresh
}: IntegracaoViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedIntegracao, setSelectedIntegracao] = useState<Integracao | undefined>(undefined);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await apiDelete(`/integracoes/${id}`);
        toast.success('Integração excluída com sucesso!');
        onRefresh();
        setSelectedIntegracao(undefined);
      } catch (error) {
        toast.error('Erro ao excluir integração');
        console.error(error);
      }
    }
  };

  const handleNewIntegracao = () => {
    setSelectedIntegracao(undefined);
    setShowForm(true);
  };

  const handleEditIntegracao = (integracao: Integracao) => {
    setSelectedIntegracao(integracao);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedIntegracao(undefined);
  };

  const handleSaveIntegracao = async (integracaoData: Integracao) => {
    try {
      console.log('[IntegracaoView] Dados recebidos do formulário:', {
        comunicacaoId: integracaoData.comunicacaoId,
        tipoAutenticacao: integracaoData.tipoAutenticacao,
        periodicidade: integracaoData.periodicidade,
        frequenciaUso: integracaoData.frequenciaUso
      });
      
      const formData = new FormData();
      formData.append('sigla', integracaoData.sigla);
      formData.append('nome', integracaoData.nome);
      
      if (integracaoData.estiloIntegracao && integracaoData.estiloIntegracao.trim()) {
        formData.append('estiloIntegracao', integracaoData.estiloIntegracao);
      }
      if (integracaoData.padraoCasoUso && integracaoData.padraoCasoUso.trim()) {
        formData.append('padraoCasoUso', integracaoData.padraoCasoUso);
      }
      if (integracaoData.integracaoTecnologica && integracaoData.integracaoTecnologica.trim()) {
        formData.append('integracaoTecnologica', integracaoData.integracaoTecnologica);
      }
      if (integracaoData.tipoIntegracao && integracaoData.tipoIntegracao.trim()) {
        formData.append('tipoIntegracao', integracaoData.tipoIntegracao);
      }
      if (integracaoData.tipoDispositivo && integracaoData.tipoDispositivo.trim()) {
        formData.append('tipoDispositivo', integracaoData.tipoDispositivo);
      }
      if (integracaoData.nomeDispositivo && integracaoData.nomeDispositivo.trim()) {
        formData.append('nomeDispositivo', integracaoData.nomeDispositivo);
      }
      if (integracaoData.aplicacaoOrigemId && integracaoData.aplicacaoOrigemId.trim()) {
        formData.append('aplicacaoOrigemId', integracaoData.aplicacaoOrigemId);
      }
      if (integracaoData.aplicacaoDestinoId && integracaoData.aplicacaoDestinoId.trim()) {
        formData.append('aplicacaoDestinoId', integracaoData.aplicacaoDestinoId);
      }
      
      // Campos obrigatórios - sempre enviar
      if (integracaoData.comunicacaoId) {
        formData.append('comunicacaoId', integracaoData.comunicacaoId);
      }
      if (integracaoData.tipoAutenticacao) {
        formData.append('tipoAutenticacao', integracaoData.tipoAutenticacao);
      }
      if (integracaoData.periodicidade) {
        formData.append('periodicidade', integracaoData.periodicidade);
      }
      if (integracaoData.frequenciaUso) {
        formData.append('frequenciaUso', integracaoData.frequenciaUso);
      }
      
      if (integracaoData.especificacaoFile) {
        formData.append('especificacao', integracaoData.especificacaoFile);
      }

      if (selectedIntegracao) {
        await apiPut(`/integracoes/${selectedIntegracao.id}`, formData);
        toast.success('Integração atualizada com sucesso!');
      } else {
        await apiPost('/integracoes', formData);
        toast.success('Integração criada com sucesso!');
      }
      
      onRefresh();
      handleCloseForm();
    } catch (error) {
      toast.error('Erro ao salvar integração');
      console.error(error);
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {selectedIntegracao ? 'Editar Integração' : 'Nova Integração'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha todos os campos obrigatórios
                </p>
              </div>
              <Button variant="ghost" onClick={handleCloseForm}>
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Integração</CardTitle>
            </CardHeader>
            <CardContent>
              <IntegracaoForm
                integracao={selectedIntegracao}
                aplicacoes={aplicacoes}
                comunicacoes={comunicacoes}
                onSave={handleSaveIntegracao}
                onCancel={handleCloseForm}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Catálogo de Integrações</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie todas as integrações entre sistemas, dispositivos e aplicações
              </p>
            </div>
            <Button onClick={handleNewIntegracao} size="lg">
              <Plus className="mr-2" />
              Nova Integração
            </Button>
          </div>
        </div>

        <IntegracaoDataTable
          data={integracoes || []}
          onEdit={handleEditIntegracao}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
