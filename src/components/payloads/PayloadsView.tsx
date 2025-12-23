import { useState, useEffect } from 'react';
import { Payload } from '@/lib/types';
import { PayloadsDataTable } from './PayloadsDataTable';
import { PayloadWizard } from './PayloadWizard';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function PayloadsView() {
  const [payloads, setPayloads] = useState<Payload[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingPayload, setEditingPayload] = useState<Payload | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayloads();
  }, []);

  const loadPayloads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/payloads`);
      if (response.ok) {
        const data = await response.json();
        setPayloads(data);
      } else {
        toast.error('Erro ao carregar payloads');
      }
    } catch (error) {
      console.error('Erro ao carregar payloads:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: Payload) => {
    try {
      const isEditing = !!payload.id && payloads.some(p => p.id === payload.id);
      
      const response = await fetch(
        isEditing ? `${API_URL}/api/payloads/${payload.id}` : `${API_URL}/api/payloads`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar payload');
      }

      await loadPayloads();
      setShowWizard(false);
      setEditingPayload(undefined);
      toast.success(isEditing ? 'Payload atualizado com sucesso' : 'Payload cadastrado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar payload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar payload');
    }
  };

  const handleEdit = (payload: Payload) => {
    setEditingPayload(payload);
    setShowWizard(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/payloads/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir payload');
      }

      await loadPayloads();
    } catch (error) {
      console.error('Erro ao excluir payload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir payload');
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingPayload(undefined);
  };

  const handleNewPayload = () => {
    setEditingPayload(undefined);
    setShowWizard(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Payloads OpenAPI</h2>
            <p className="text-muted-foreground">
              Gerencie especificações de APIs seguindo o padrão OpenAPI
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleNewPayload}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Payload
          </Button>
        </div>
      </div>

      <PayloadsDataTable
        data={payloads}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {showWizard && (
        <PayloadWizard
          open={showWizard}
          onClose={handleCloseWizard}
          onSave={handleSave}
          payload={editingPayload}
        />
      )}
    </div>
  );
}
