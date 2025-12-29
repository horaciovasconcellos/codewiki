import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Stage } from '@/lib/types';
import { StagesDataTable } from './StagesDataTable';
import { StageWizard } from './StageWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function StagesView() {
  const { logClick, logEvent, logError } = useLogging('stages-view');
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | undefined>();

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/stages`);
      if (response.ok) {
        const data = await response.json();
        setStages(data);
      } else {
        toast.error('Erro ao carregar stages');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar stages:', error);
      toast.error('Erro ao carregar stages');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingStage(undefined);
    setShowWizard(true);
  };

  const handleEdit = async (stage: Stage) => {
    try {
      // Buscar dados completos do stage incluindo yamlContent
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/stages/${stage.id}`);
      if (response.ok) {
        const fullStage = await response.json();
        console.log('🔍 Stage completo carregado:', fullStage);
        setEditingStage(fullStage);
        setShowWizard(true);
      } else {
        toast.error('Erro ao carregar detalhes do stage');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar stage:', error);
      toast.error('Erro ao carregar stage');
    }
  };

  const handleDelete = async (stage: Stage) => {
    if (!confirm(`Deseja excluir o stage "${stage.nome}"?`)) {
      return;
    }

    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/stages/${stage.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Stage excluído com sucesso');
        loadStages();
      } else {
        toast.error('Erro ao excluir stage');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao excluir stage:', error);
      toast.error('Erro ao excluir stage');
    }
  };

  const handleSave = () => {
    setShowWizard(false);
    setEditingStage(undefined);
    loadStages();
  };

  const handleCancel = () => {
    setShowWizard(false);
    setEditingStage(undefined);
  };

  if (showWizard) {
    return (
      <StageWizard
        stage={editingStage}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stages</CardTitle>
            <CardDescription>
              Gerencie os estágios reutilizáveis para pipelines de CI/CD
            </CardDescription>
          </div>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Stage
          </Button>
        </CardHeader>
        <CardContent>
          <StagesDataTable
            stages={stages}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
