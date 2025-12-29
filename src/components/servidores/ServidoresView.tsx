import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Servidor } from '@/lib/types';
import { ServidoresDataTable } from './ServidoresDataTable';
import { ServidorWizard } from './ServidorWizard';
import { Button } from '@/components/ui/button';
import { Plus, FileXls } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ServidoresView() {
  const { logClick, logEvent, logError } = useLogging('servidores-view');
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingServidor, setEditingServidor] = useState<Servidor | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServidores();
  }, []);

  const loadServidores = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/servidores`);
      if (response.ok) {
        const data = await response.json();
        setServidores(data);
      } else {
        toast.error('Erro ao carregar servidores');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar servidores:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (servidor: Servidor, aplicacoesServidor?: any[]) => {
    try {
      const isEditing = !!servidor.id && servidores.some(s => s.id === servidor.id);
      
      logEvent('api_call_start', 'api_call');

      
      const response = await fetch(
        isEditing ? `${API_URL}/api/servidores/${servidor.id}` : `${API_URL}/api/servidores`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(servidor)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar servidor');
      }

      const savedServidor = await response.json();
      const servidorId = savedServidor.id || servidor.id;

      // Salvar aplicações do servidor se houver
      if (aplicacoesServidor && aplicacoesServidor.length > 0 && servidorId) {
        await saveAplicacoesServidor(servidorId, aplicacoesServidor);
      }

      await loadServidores();
      setShowWizard(false);
      setEditingServidor(undefined);
      toast.success(isEditing ? 'Servidor atualizado com sucesso' : 'Servidor cadastrado com sucesso');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar servidor:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar servidor');
    }
  };

  const saveAplicacoesServidor = async (servidorId: string, aplicacoesServidor: any[]) => {
    try {
      // Deletar aplicações existentes
      await fetch(`${API_URL}/api/servidores/${servidorId}/aplicacoes`, {
        method: 'DELETE'
      });

      // Salvar novas aplicações
      for (const app of aplicacoesServidor) {
        await fetch(`${API_URL}/api/servidores/${servidorId}/aplicacoes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...app,
            servidorId
          })
        });
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar aplicações do servidor:', error);
      toast.error('Erro ao salvar aplicações do servidor');
    }
  };

  const handleEdit = (servidor: Servidor) => {
    setEditingServidor(servidor);
    setShowWizard(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este servidor?')) {
      return;
    }

    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/servidores/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir servidor');
      }

      await loadServidores();
      toast.success('Servidor excluído com sucesso');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao excluir servidor:', error);
      toast.error('Erro ao excluir servidor');
    }
  };

  const handleExportToExcel = () => {
    if (servidores.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const dataToExport = servidores.map(servidor => ({
      'Sigla': servidor.sigla,
      'Hostname': servidor.hostname,
      'Tipo': servidor.tipo,
      'Ambiente': servidor.ambiente,
      'Finalidade': servidor.finalidade,
      'Status': servidor.status,
      'Provedor': servidor.provedor,
      'Datacenter/Região': servidor.datacenterRegiao || '',
      'Sistema Operacional': servidor.sistemaOperacional,
      'Ferramenta de Monitoramento': servidor.ferramentaMonitoramento || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Servidores');
    XLSX.writeFile(workbook, `servidores_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Dados exportados com sucesso');
  };

  const handleNewServidor = () => {
    setEditingServidor(undefined);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingServidor(undefined);
  };

  if (showWizard) {
    return (
      <ServidorWizard
        servidor={editingServidor}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão de Servidores</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie servidores físicos, virtuais e cloud da organização
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportToExcel}
                disabled={servidores.length === 0}
              >
                <FileXls className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
              <Button onClick={handleNewServidor} size="lg">
                <Plus className="mr-2" />
                Novo Servidor
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando servidores...</p>
          </div>
        ) : (
          <ServidoresDataTable
            data={servidores}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
