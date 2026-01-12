import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Pipeline } from '@/lib/types';
import { PipelinesDataTable } from './PipelinesDataTable';
import { PipelineWizard } from './PipelineWizard';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function PipelinesView() {
  const { logClick, logEvent, logError } = useLogging('pipelines-view');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/pipelines`);
      if (response.ok) {
        const data = await response.json();
        setPipelines(data);
      } else {
        toast.error('Erro ao carregar pipelines');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar pipelines:', error);
      toast.error('Erro ao carregar pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingPipeline(undefined);
    setShowWizard(true);
  };

  const handleEdit = async (pipeline: Pipeline) => {
    try {
      // Buscar dados completos da pipeline incluindo stages
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/pipelines/${pipeline.id}`);
      if (response.ok) {
        const fullPipeline = await response.json();
        console.log('🔍 Pipeline completa carregada:', {
          nome: fullPipeline.nome,
          stagesCount: fullPipeline.stages?.length || 0,
        });
        setEditingPipeline(fullPipeline);
        setShowWizard(true);
      } else {
        toast.error('Erro ao carregar detalhes da pipeline');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar pipeline:', error);
      toast.error('Erro ao carregar pipeline');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/pipelines/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Pipeline excluída com sucesso');
        loadPipelines();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir pipeline');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao excluir pipeline:', error);
      toast.error('Erro ao excluir pipeline');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSave = () => {
    setShowWizard(false);
    setEditingPipeline(undefined);
    loadPipelines();
  };

  const handleCancel = () => {
    setShowWizard(false);
    setEditingPipeline(undefined);
  };

  if (showWizard) {
    return (
      <PipelineWizard
        pipeline={editingPipeline}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Pipelines</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as pipelines de CI/CD da organização
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando pipelines...</p>
          </div>
        ) : (
          <PipelinesDataTable
            pipelines={pipelines}
            loading={loading}
            onNew={handleNew}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirmId(id)}
          />
        )}
      </div>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pipeline? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
