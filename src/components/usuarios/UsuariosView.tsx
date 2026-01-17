import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Usuario, Colaborador } from '@/lib/types';
import { UsuarioWizard } from './UsuarioWizard';
import { UsuariosDataTable } from './UsuariosDataTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { apiPost, apiPut, apiDelete, apiGet } from '@/hooks/use-api';
import { toast } from 'sonner';

interface UsuariosViewProps {
  colaboradores: Colaborador[];
}

export function UsuariosView({ colaboradores }: UsuariosViewProps) {
  const { logEvent, logError } = useLogging('usuarios-view');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | undefined>(undefined);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/usuarios');
      setUsuarios(response);
      logEvent('usuarios_loaded', { count: response.length });
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
      logError('load_usuarios', error instanceof Error ? error : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingUsuario(undefined);
    setShowWizard(true);
    logEvent('usuario_new_clicked');
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setShowWizard(true);
    logEvent('usuario_edit_clicked', { usuarioId: usuario.id });
  };

  const handleSave = async (usuario: Usuario) => {
    try {
      // Preparar dados para API (mapear campos)
      const usuarioData = {
        email: usuario.email,
        password: usuario.senha, // API espera 'password' não 'senha'
        role: usuario.role,
        ativo: usuario.ativo,
        colaboradorId: usuario.colaboradorId
      };

      if (usuario.id && usuarios.some(u => u.id === usuario.id)) {
        // Atualizar existente
        await apiPut(`/usuarios/${usuario.id}`, usuarioData);
        toast.success('Usuário atualizado com sucesso');
        logEvent('usuario_updated', { usuarioId: usuario.id });
      } else {
        // Criar novo
        await apiPost('/usuarios', usuarioData);
        toast.success('Usuário criado com sucesso');
        logEvent('usuario_created');
      }
      
      await loadUsuarios();
      setShowWizard(false);
      setEditingUsuario(undefined);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário');
      logError('save_usuario', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/usuarios/${id}`);
      toast.success('Usuário excluído com sucesso');
      logEvent('usuario_deleted', { usuarioId: id });
      await loadUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir usuário');
      logError('delete_usuario', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleCancel = () => {
    setShowWizard(false);
    setEditingUsuario(undefined);
    logEvent('usuario_wizard_cancelled');
  };

  if (showWizard) {
    return (
      <UsuarioWizard
        usuario={editingUsuario}
        usuarios={usuarios}
        colaboradores={colaboradores}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie usuários do sistema e suas permissões de acesso
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <UsuariosDataTable
          usuarios={usuarios}
          colaboradores={colaboradores}
          loading={loading}
          onCreateNew={handleNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
