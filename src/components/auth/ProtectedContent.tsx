/**
 * Componentes de proteção de acesso baseados em permissões
 */

import { ReactNode } from 'react';
import { useAuth } from '../hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ShieldAlert } from 'lucide-react';

interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
  showAlert?: boolean;
}

interface PermissionProps extends ProtectedProps {
  permission: string;
}

interface MultiPermissionProps extends ProtectedProps {
  permissions: string[];
  requireAll?: boolean;
}

interface RoleProps extends ProtectedProps {
  role: string;
}

interface MultiRoleProps extends ProtectedProps {
  roles: string[];
  requireAll?: boolean;
}

interface ResourceActionProps extends ProtectedProps {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// =====================================================
// COMPONENTES DE PROTEÇÃO POR PERMISSÃO
// =====================================================

/**
 * Protege conteúdo baseado em uma permissão específica
 * Exemplo: <RequirePermission permission="documentacao-projetos.create">...</RequirePermission>
 */
export function RequirePermission({ children, permission, fallback, showAlert = false }: PermissionProps) {
  const { hasPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Autenticação Necessária</AlertTitle>
        <AlertDescription>Você precisa estar autenticado para acessar este conteúdo.</AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  if (!hasPermission(permission)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar este conteúdo. Permissão necessária: <code>{permission}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

/**
 * Protege conteúdo baseado em múltiplas permissões
 * Exemplo: <RequireAnyPermission permissions={["users.create", "users.update"]}>...</RequireAnyPermission>
 */
export function RequireAnyPermission({ children, permissions, fallback, showAlert = false }: MultiPermissionProps) {
  const { hasAnyPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Autenticação Necessária</AlertTitle>
        <AlertDescription>Você precisa estar autenticado para acessar este conteúdo.</AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  if (!hasAnyPermission(...permissions)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem nenhuma das permissões necessárias: <code>{permissions.join(', ')}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

/**
 * Protege conteúdo exigindo todas as permissões
 * Exemplo: <RequireAllPermissions permissions={["users.read", "users.update"]}>...</RequireAllPermissions>
 */
export function RequireAllPermissions({ children, permissions, fallback, showAlert = false }: MultiPermissionProps) {
  const { hasAllPermissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Autenticação Necessária</AlertTitle>
        <AlertDescription>Você precisa estar autenticado para acessar este conteúdo.</AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  if (!hasAllPermissions(...permissions)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem todas as permissões necessárias: <code>{permissions.join(', ')}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

// =====================================================
// COMPONENTES DE PROTEÇÃO POR ROLE
// =====================================================

/**
 * Protege conteúdo baseado em uma role específica
 * Exemplo: <RequireRole role="Administrador">...</RequireRole>
 */
export function RequireRole({ children, role, fallback, showAlert = false }: RoleProps) {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Autenticação Necessária</AlertTitle>
        <AlertDescription>Você precisa estar autenticado para acessar este conteúdo.</AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  if (!hasRole(role)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem a role necessária: <code>{role}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

/**
 * Protege conteúdo baseado em múltiplas roles
 * Exemplo: <RequireAnyRole roles={["Admin", "Gestor"]}>...</RequireAnyRole>
 */
export function RequireAnyRole({ children, roles, fallback, showAlert = false }: MultiRoleProps) {
  const { hasAnyRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Autenticação Necessária</AlertTitle>
        <AlertDescription>Você precisa estar autenticado para acessar este conteúdo.</AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  if (!hasAnyRole(...roles)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem nenhuma das roles necessárias: <code>{roles.join(', ')}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

// =====================================================
// COMPONENTES DE PROTEÇÃO POR AÇÃO EM RECURSO
// =====================================================

/**
 * Protege conteúdo baseado em ação específica em um recurso
 * Exemplo: <CanCreate resource="documentacao-projetos">...</CanCreate>
 */
export function CanCreate({ children, resource, fallback, showAlert = false }: Omit<ResourceActionProps, 'action'>) {
  const { canCreate, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Autenticação Necessária</AlertTitle>
        <AlertDescription>Você precisa estar autenticado para acessar este conteúdo.</AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  if (!canCreate(resource)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para criar em <code>{resource}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

export function CanRead({ children, resource, fallback, showAlert = false }: Omit<ResourceActionProps, 'action'>) {
  const { canRead, isAuthenticated } = useAuth();

  if (!isAuthenticated || !canRead(resource)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para visualizar <code>{resource}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

export function CanUpdate({ children, resource, fallback, showAlert = false }: Omit<ResourceActionProps, 'action'>) {
  const { canUpdate, isAuthenticated } = useAuth();

  if (!isAuthenticated || !canUpdate(resource)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para editar <code>{resource}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

export function CanDelete({ children, resource, fallback, showAlert = false }: Omit<ResourceActionProps, 'action'>) {
  const { canDelete, isAuthenticated } = useAuth();

  if (!isAuthenticated || !canDelete(resource)) {
    return showAlert ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para excluir em <code>{resource}</code>
        </AlertDescription>
      </Alert>
    ) : (fallback as JSX.Element || null);
  }

  return <>{children}</>;
}

// =====================================================
// COMPONENTE DE ALERTA DE IMPERSONATION
// =====================================================

export function ImpersonationAlert() {
  const { isImpersonated, user, stopImpersonate } = useAuth();

  if (!isImpersonated) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Modo Impersonation Ativo</AlertTitle>
      <AlertDescription>
        Você está visualizando o sistema como <strong>{user?.nome}</strong>.
        <button 
          onClick={() => stopImpersonate()}
          className="ml-2 underline font-semibold"
        >
          Voltar para sua conta
        </button>
      </AlertDescription>
    </Alert>
  );
}
