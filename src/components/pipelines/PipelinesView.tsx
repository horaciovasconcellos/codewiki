import { useState, useEffect } from 'react';
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
      const response = await fetch(`${API_URL}/api/pipelines`);
      if (response.ok) {
        const data = await response.json();
        setPipelines(data);
      } else {
        toast.error('Erro ao carregar pipelines');
      }
    } catch (error) {
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
      console.error('Erro ao carregar pipeline:', error);
      toast.error('Erro ao carregar pipeline');
    }
  };

  const handleDelete = async (id: string) => {
    try {
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
    <>
      <PipelinesDataTable
        pipelines={pipelines}
        loading={loading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteConfirmId(id)}
      />

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
    </>
  );
}
