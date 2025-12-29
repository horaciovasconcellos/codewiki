import { useState } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { Runbook } from '@/lib/types';
import { RunbookWizard } from './RunbookWizard';
import { RunbooksDataTable } from './RunbooksDataTable';
import { RunbookDetails } from './RunbookDetails';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface RunbooksViewProps {}

export function RunbooksView({}: RunbooksViewProps) {
  const { data: runbooks, loading, refetch } = useApi<Runbook[]>('/runbooks', []);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [editingRunbook, setEditingRunbook] = useState<Runbook | undefined>(undefined);

  console.log('[RunbooksView] Runbooks carregados:', runbooks?.length || 0, runbooks);

  const handleSave = async (runbook: Runbook) => {
    try {
      console.log('[RunbooksView] Salvando runbook:', runbook);
      console.log('[RunbooksView] Riscos e Mitigações recebidos:', runbook.riscosMitigacoes);
      
      if (editingRunbook) {
        console.log('[RunbooksView] Atualizando runbook existente:', runbook.id);
        await apiPut(`/runbooks/${runbook.id}`, runbook);
        toast.success('RunBook atualizado com sucesso!');
      } else {
        const newRunbook = { ...runbook, id: runbook.id || uuidv4() };
        console.log('[RunbooksView] Adicionando novo runbook:', newRunbook.id);
        await apiPost('/runbooks', newRunbook);
        toast.success('RunBook criado com sucesso!');
      }
      
      await refetch();
      setShowWizard(false);
      setEditingRunbook(undefined);
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[RunbooksView] Erro ao salvar runbook:', error);
      toast.error(editingRunbook ? 'Erro ao atualizar RunBook' : 'Erro ao criar RunBook');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('[RunbooksView] Deletando runbook:', id);
      await apiDelete(`/runbooks/${id}`);
      toast.success('RunBook deletado com sucesso!');
      await refetch();
      setSelectedRunbook(null);
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[RunbooksView] Erro ao deletar runbook:', error);
      toast.error('Erro ao deletar RunBook');
    }
  };

  const handleEdit = (runbook: Runbook) => {
    setEditingRunbook(runbook);
    setShowWizard(true);
    setSelectedRunbook(null);
  };

  const handleNewRunbook = () => {
    setEditingRunbook(undefined);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingRunbook(undefined);
  };

  if (showWizard) {
    return (
      <RunbookWizard
        runbook={editingRunbook}
        runbooks={runbooks || []}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  if (selectedRunbook) {
    return (
      <RunbookDetails
        runbook={selectedRunbook}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={() => setSelectedRunbook(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Catálogo de Runbooks</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie todos os runbooks operacionais da instituição
              </p>
            </div>
            <Button onClick={handleNewRunbook} size="lg">
              <Plus className="mr-2" />
              Novo Runbook
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <RunbooksDataTable
            runbooks={runbooks || []}
            onSelect={setSelectedRunbook}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
