import { useState, useEffect } from 'react';
import { TipoComunicacao } from '@/lib/types';
import { TipoComunicacaoForm } from './TipoComunicacaoForm';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { TiposComunicacaoDataTable } from './TiposComunicacaoDataTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useLogging } from '@/hooks/use-logging';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function TiposComunicacaoView() {
  const { logClick, logEvent, logError } = useLogging('tipos-comunicacao-view');
  const [tiposComunicacao, setTiposComunicacao] = useState<TipoComunicacao[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoComunicacao | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTiposComunicacao();
  }, []);

  const loadTiposComunicacao = async () => {
    try {
      setLoading(true);
      logEvent('load_tipos_comunicacao_start', 'load');
      console.log('Carregando tipos de comunicação de:', `${API_URL}/api/tipos-comunicacao`);
      const response = await fetch(`${API_URL}/api/tipos-comunicacao`);
      if (response.ok) {
        const data = await response.json();
        console.log('Tipos de comunicação carregados:', data.length, data);
        setTiposComunicacao(data);
        logEvent('load_tipos_comunicacao_success', 'load', { count: data.length });
      } else {
        console.error('Erro ao carregar tipos de comunicação:', response.status, response.statusText);
        logError(new Error(`HTTP ${response.status}`), 'load_tipos_comunicacao_error', { status: response.status });
        toast.error('Erro ao carregar tipos de comunicação');
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de comunicação:', error);
      logError(error instanceof Error ? error : new Error('Unknown error'), 'load_tipos_comunicacao_error');
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tipo: TipoComunicacao) => {
    try {
      const isEditing = !!tipo.id && tiposComunicacao.some(t => t.id === tipo.id);
      
      console.log('[TiposComunicacaoView] Salvando tipo:', {
        isEditing,
        id: tipo.id,
        sigla: tipo.sigla,
        tipo: tipo.tipo
      });
      
      logEvent(isEditing ? 'update_tipo_start' : 'create_tipo_start', 'api_call', {
        tipo_id: tipo.id,
        sigla: tipo.sigla
      });
      
      const response = await fetch(
        isEditing ? `${API_URL}/api/tipos-comunicacao/${tipo.id}` : `${API_URL}/api/tipos-comunicacao`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tipo)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('[TiposComunicacaoView] Erro na resposta:', error);
        logError(new Error(error.error || 'Erro ao salvar'), 'save_tipo_error', {
          tipo_id: tipo.id,
          status: response.status
        });
        throw new Error(error.error || 'Erro ao salvar tipo de comunicação');
      }

      const savedTipo = await response.json();
      console.log('[TiposComunicacaoView] Tipo salvo:', savedTipo);
      logEvent(isEditing ? 'update_tipo_success' : 'create_tipo_success', 'api_response', {
        tipo_id: savedTipo.id,
        sigla: savedTipo.sigla
      });

      await loadTiposComunicacao();
      setShowForm(false);
      setEditingTipo(undefined);
      logEvent('save_tipo_complete', 'click', { tipo_id: savedTipo.id });
      toast.success(isEditing ? 'Tipo de comunicação atualizado com sucesso' : 'Tipo de comunicação cadastrado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar tipo de comunicação:', error);
      logError(error instanceof Error ? error : new Error('Unknown error'), 'save_tipo_failed');
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar tipo de comunicação');
    }
  };

  const handleEdit = (tipo: TipoComunicacao) => {
    console.log('[TiposComunicacaoView] Editando tipo:', tipo);
    logEvent('edit_tipo_click', 'click', { tipo_id: tipo.id });
    setEditingTipo(tipo);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      logEvent('delete_tipo_start', 'api_call', { tipo_id: id });
      const response = await fetch(`${API_URL}/api/tipos-comunicacao/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        logError(new Error(error.error || 'Erro ao excluir'), 'delete_tipo_error', {
          tipo_id: id,
          status: response.status
        });
        throw new Error(error.error || 'Erro ao excluir tipo de comunicação');
      }

      logEvent('delete_tipo_success', 'api_response', { tipo_id: id });
      await loadTiposComunicacao();
      toast.success('Tipo de comunicação excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir tipo de comunicação:', error);
      logError(error instanceof Error ? error : new Error('Unknown error'), 'delete_tipo_failed');
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir tipo de comunicação');
    }
  };

  const handleNewClick = () => {
    logClick('new_tipo_button');
    setEditingTipo(undefined);
    setShowForm(true);
  };

  const handleCancel = () => {
    logClick('cancel_tipo_form');
    setShowForm(false);
    setEditingTipo(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando tipos de comunicação...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {showForm ? (
        <TipoComunicacaoForm
          tipoComunicacao={editingTipo}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="border-b bg-background">
            <div className="container mx-auto px-6 py-4 max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tipos de Comunicação</h1>
                    <p className="text-sm text-muted-foreground">
                      Gerencie os tipos de comunicação entre aplicações e sistemas
                    </p>
                  </div>
                </div>
                <Button onClick={handleNewClick}>
                  <Plus className="mr-2" size={20} />
                  Tipo de Comunicação
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/30">
            <div className="container mx-auto px-6 py-6 max-w-7xl">
              <TiposComunicacaoDataTable
                tiposComunicacao={tiposComunicacao}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
