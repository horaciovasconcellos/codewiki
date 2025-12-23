import { useState } from 'react';
import { TipoAfastamento } from '@/lib/types';
import { TiposAfastamentoDataTable } from './TiposAfastamentoDataTable';
import { TiposAfastamentoForm } from './TiposAfastamentoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { apiPost, apiPut, apiDelete } from '@/hooks/use-api';

interface TiposAfastamentoViewProps {
  tiposAfastamento: TipoAfastamento[];
  onRefresh: () => void;
}

export function TiposAfastamentoView({ tiposAfastamento, onRefresh }: TiposAfastamentoViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAfastamento | undefined>(undefined);

  const handleSave = async (tipo: TipoAfastamento) => {
    try {
      if (editingTipo) {
        await apiPut(`/tipos-afastamento/${tipo.id}`, tipo);
        toast.success('Tipo de afastamento atualizado com sucesso!');
      } else {
        await apiPost('/tipos-afastamento', tipo);
        toast.success('Tipo de afastamento criado com sucesso!');
      }
      setShowForm(false);
      setEditingTipo(undefined);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao salvar tipo de afastamento');
      console.error(error);
    }
  };

  const handleEdit = (tipo: TipoAfastamento) => {
    setEditingTipo(tipo);
    setShowForm(true);
  };

  const handleDelete = async (tipo: TipoAfastamento) => {
    if (confirm(`Tem certeza que deseja excluir o tipo "${tipo.descricao}"?`)) {
      try {
        await apiDelete(`/tipos-afastamento/${tipo.id}`);
        toast.success('Tipo de afastamento excluído com sucesso!');
        onRefresh();
      } catch (error) {
        toast.error('Erro ao excluir tipo de afastamento');
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTipo(undefined);
  };

  const handleNew = () => {
    setEditingTipo(undefined);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Afastamento</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de tipos de afastamento de colaboradores
            </p>
          </div>
        </div>

        <Separator />

        {showForm ? (
          <TiposAfastamentoForm
            tipo={editingTipo}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Tipos de Afastamento</CardTitle>
                  <CardDescription>
                    Configure os tipos de afastamento disponíveis no sistema
                  </CardDescription>
                </div>
                <Button onClick={handleNew}>
                  <Plus className="mr-2" size={16} />
                  Novo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TiposAfastamentoDataTable
                tiposAfastamento={tiposAfastamento}
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
