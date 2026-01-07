import { useState } from 'react';
import { ProcessoNegocio } from '@/lib/types';
import { ProcessoWizard } from './ProcessoWizard';
import { ProcessosList } from './ProcessosList';
import { ProcessoDetails } from './ProcessoDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { toast } from 'sonner';

interface ProcessosViewProps {}

export function ProcessosView({}: ProcessosViewProps) {
  const { data: processos, refetch } = useApi<ProcessoNegocio[]>('/processos-negocio', []);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoNegocio | null>(null);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoNegocio | undefined>(undefined);

  const handleSave = async (processo: ProcessoNegocio) => {
    try {
      if (editingProcesso) {
        await apiPut(`/processos-negocio/${processo.id}`, processo);
        toast.success('Processo atualizado com sucesso!');
      } else {
        await apiPost('/processos-negocio', processo);
        toast.success('Processo criado com sucesso!');
      }
      setShowWizard(false);
      setEditingProcesso(undefined);
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar processo');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/processos-negocio/${id}`);
      toast.success('Processo excluído com sucesso!');
      setSelectedProcesso(null);
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir processo');
      console.error(error);
    }
  };

  const handleEdit = (processo: ProcessoNegocio) => {
    setEditingProcesso(processo);
    setShowWizard(true);
    setSelectedProcesso(null);
  };

  const handleNewProcesso = () => {
    setEditingProcesso(undefined);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingProcesso(undefined);
  };

  if (showWizard) {
    return (
      <ProcessoWizard
        processo={editingProcesso}
        processos={processos || []}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  if (selectedProcesso) {
    return (
      <ProcessoDetails
        processo={selectedProcesso}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={() => setSelectedProcesso(null)}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Processos de Negócio</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de processos de negócio da instituição
            </p>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Processos de Negócio</CardTitle>
                <CardDescription>
                  Configure e gerencie os processos de negócio da instituição
                </CardDescription>
              </div>
              <Button onClick={handleNewProcesso}>
                <Plus className="mr-2" size={16} />
                Novo Processo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ProcessosList
              processos={processos || []}
              onSelect={setSelectedProcesso}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
