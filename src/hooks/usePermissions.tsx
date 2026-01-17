/**
 * Hook customizado para verificação de permissões
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  nome: string;
  email: string;
  roles: string[];
  nivelHierarquia: number;
}

interface PermissionsByResource {
  [resource: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    execute?: boolean;
    export?: boolean;
    import?: boolean;
    approve?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  permissionsByResource: PermissionsByResource;
  isAuthenticated: boolean;
  isImpersonated: boolean;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (...permissionCodes: string[]) => boolean;
  hasAllPermissions: (...permissionCodes: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (...roleNames: string[]) => boolean;
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  impersonate: (userId: number) => Promise<void>;
  stopImpersonate: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsByResource, setPermissionsByResource] = useState<PermissionsByResource>({});
  const [token, setToken] = useState<string | null>(null);
  const [isImpersonated, setIsImpersonated] = useState(false);

  // Carregar token do localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      loadUserData(storedToken);
    }
  }, []);

  const loadUserData = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPermissions(data.permissions);
        setPermissionsByResource(data.permissionsByResource);
        setIsImpersonated(data.isImpersonated);
      } else {
        // Token inválido
        logout();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      logout();
    }
  };

  const login = async (email: string, senha: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer login');
      }

      const data = await response.json();
      
      setToken(data.token);
      setUser(data.user);
      setPermissions(data.permissions);
      setPermissionsByResource(data.permissionsByResource);
      setIsImpersonated(false);

      // Salvar no localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setToken(null);
      setUser(null);
      setPermissions([]);
      setPermissionsByResource({});
      setIsImpersonated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (...permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (...permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => permissions.includes(code));
  };

  const hasRole = (roleName: string): boolean => {
    return user?.roles.includes(roleName) || false;
  };

  const hasAnyRole = (...roleNames: string[]): boolean => {
    return roleNames.some(role => user?.roles.includes(role));
  };

  const canCreate = (resource: string): boolean => {
    return permissionsByResource[resource]?.create || false;
  };

  const canRead = (resource: string): boolean => {
    return permissionsByResource[resource]?.read || false;
  };

  const canUpdate = (resource: string): boolean => {
    return permissionsByResource[resource]?.update || false;
  };

  const canDelete = (resource: string): boolean => {
    return permissionsByResource[resource]?.delete || false;
  };

  const impersonate = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/impersonate/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao iniciar impersonation');
      }

      const data = await response.json();
      
      // Salvar token antigo
      localStorage.setItem('admin_token', token!);
      
      // Usar novo token
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      
      await loadUserData(data.token);
      setIsImpersonated(true);

    } catch (error) {
      console.error('Erro ao impersonar:', error);
      throw error;
    }
  };

  const stopImpersonate = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/stop-impersonate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Restaurar token de admin
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        setToken(adminToken);
        localStorage.setItem('auth_token', adminToken);
        localStorage.removeItem('admin_token');
        await loadUserData(adminToken);
        setIsImpersonated(false);
      } else {
        logout();
      }

    } catch (error) {
      console.error('Erro ao parar impersonation:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      permissionsByResource,
      isAuthenticated: !!user,
      isImpersonated,
      token,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      impersonate,
      stopImpersonate
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

// Hook para proteger componentes que exigem permissão
export function useRequirePermission(permissionCode: string) {
  const { hasPermission, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !hasPermission(permissionCode)) {
      console.warn(`Permissão negada: ${permissionCode}`);
    }
  }, [isAuthenticated, hasPermission, permissionCode]);

  return hasPermission(permissionCode);
}

// Hook para verificar múltiplas permissões
export function useRequireAnyPermission(...permissionCodes: string[]) {
  const { hasAnyPermission, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !hasAnyPermission(...permissionCodes)) {
      console.warn(`Nenhuma das permissões encontrada: ${permissionCodes.join(', ')}`);
    }
  }, [isAuthenticated, hasAnyPermission, permissionCodes]);

  return hasAnyPermission(...permissionCodes);
}
