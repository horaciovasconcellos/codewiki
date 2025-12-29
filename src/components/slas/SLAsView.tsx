import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { SLA } from '@/lib/types';
import { SLAWizard } from './SLAWizard';
import { SLAsTable } from './SLAsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface SLAsViewProps {}

export function SLAsView({}: SLAsViewProps) {
  const { logEvent, logError } = useLogging('slas-view');
  const [slas, setSLAs] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SLA | null>(null);

  useEffect(() => {
    loadSLAs();
  }, []);

  const loadSLAs = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch('/api/slas');
      if (!response.ok) throw new Error('Erro ao carregar SLAs');
      const data = await response.json();
      setSLAs(data);
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar SLAs:', error);
      toast.error('Não foi possível carregar os SLAs');
    } finally {
      setLoading(false);
    }
  };

  const handleSLASave = async (sla: SLA) => {
    try {
      const existe = slas.find(s => s.id === sla.id);
      const url = existe ? `/api/slas/${sla.id}` : '/api/slas';
      const method = existe ? 'PUT' : 'POST';

      logEvent('api_call_start', 'api_call');


      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sla)
      });

      if (!response.ok) throw new Error('Erro ao salvar SLA');

      toast.success(`SLA ${existe ? 'atualizado' : 'criado'} com sucesso`);
      setShowForm(false);
      setEditingSLA(null);

      await loadSLAs();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar SLA:', error);
      toast.error('Não foi possível salvar o SLA');
    }
  };

  const handleSLADelete = async (id: string) => {
    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`/api/slas/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar SLA');

      toast.success('SLA deletado com sucesso');

      await loadSLAs();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao deletar SLA:', error);
      toast.error('Não foi possível deletar o SLA');
    }
  };

  const handleEdit = (sla: SLA) => {
    setEditingSLA(sla);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSLA(null);
  };

  if (showForm) {
    return (
      <SLAWizard
        slas={slas}
        onSave={handleSLASave}
        onCancel={handleCancel}
        editingSLA={editingSLA || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">SLAs</h1>
              <p className="text-muted-foreground mt-2">
                Gerenciamento de Service Level Agreements
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de SLAs</CardTitle>
                  <CardDescription>
                    Configure e gerencie os acordos de nível de serviço
                  </CardDescription>
                </div>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2" />
                  Novo SLA
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando SLAs...
                </div>
              ) : (
                <SLAsTable
                  slas={slas}
                  onEdit={handleEdit}
                  onSLADelete={handleSLADelete}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
