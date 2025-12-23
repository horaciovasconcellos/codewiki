import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MicrosoftTeamsLogo } from '@phosphor-icons/react';
import { AzureDevOpsDataTable } from './AzureDevOpsDataTable';
import { AzureDevOpsForm } from './AzureDevOpsForm';
import { ProjetoAzure } from '@/lib/azure-devops-types';
import { toast } from 'sonner';

export function AzureDevOpsView() {
  const [showForm, setShowForm] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<ProjetoAzure | null>(null);
  const [projetos, setProjetos] = useState<ProjetoAzure[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar projetos
  const loadProjetos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/azure-devops-projetos');
      if (response.ok) {
        const data = await response.json();
        setProjetos(data);
      } else {
        toast.error('Erro ao carregar projetos');
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar
  useState(() => {
    loadProjetos();
  });

  const handleNovo = () => {
    setEditingProjeto(null);
    setShowForm(true);
  };

  const handleEdit = (projeto: ProjetoAzure) => {
    setEditingProjeto(projeto);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) {
      return;
    }

    try {
      const response = await fetch(`/api/azure-devops-projetos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Registro excluído com sucesso');
        loadProjetos();
      } else {
        toast.error('Erro ao excluir registro');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir registro');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProjeto(null);
    loadProjetos();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {!showForm ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MicrosoftTeamsLogo className="h-6 w-6" weight="fill" />
                Azure DevOps - Projetos
              </CardTitle>
              <CardDescription>
                Gerenciamento de projetos criados no Azure DevOps
              </CardDescription>
            </div>
            <Button onClick={handleNovo} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </CardHeader>
          <CardContent>
            <AzureDevOpsDataTable
              projetos={projetos}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={loadProjetos}
            />
          </CardContent>
        </Card>
      ) : (
        <AzureDevOpsForm
          projeto={editingProjeto}
          onClose={handleFormClose}
          onSuccess={handleFormClose}
        />
      )}
    </div>
  );
}
