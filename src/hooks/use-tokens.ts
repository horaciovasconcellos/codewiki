import { useState, useEffect } from 'react';
import { TokenAcesso } from '@/lib/types';

const API_URL = '/api/tokens-acesso';

export function useTokens() {
  const [tokens, setTokens] = useState<TokenAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTokens(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createToken = async (token: Omit<TokenAcesso, 'id' | 'createdAt' | 'updatedAt'>): Promise<TokenAcesso> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar token');
      }

      const newToken = await response.json();
      setTokens((prev) => [...prev, newToken]);
      return newToken;
    } catch (err) {
      console.error('Erro ao criar token:', err);
      throw err;
    }
  };

  const updateToken = async (id: string, updates: Partial<TokenAcesso>): Promise<TokenAcesso> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar token');
      }

      const updatedToken = await response.json();
      setTokens((prev) => prev.map((t) => (t.id === id ? updatedToken : t)));
      return updatedToken;
    } catch (err) {
      console.error('Erro ao atualizar token:', err);
      throw err;
    }
  };

  const regenerateToken = async (id: string, novoToken: string, novaDataExpiracao: string): Promise<TokenAcesso> => {
    try {
      const response = await fetch(`${API_URL}/${id}/renovar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ novoToken, novaDataExpiracao }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao renovar token');
      }

      const updatedToken = await response.json();
      setTokens((prev) => prev.map((t) => (t.id === id ? updatedToken : t)));
      return updatedToken;
    } catch (err) {
      console.error('Erro ao renovar token:', err);
      throw err;
    }
  };

  const revokeToken = async (id: string): Promise<TokenAcesso> => {
    try {
      const response = await fetch(`${API_URL}/${id}/revogar`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao revogar token');
      }

      const updatedToken = await response.json();
      setTokens((prev) => prev.map((t) => (t.id === id ? updatedToken : t)));
      return updatedToken;
    } catch (err) {
      console.error('Erro ao revogar token:', err);
      throw err;
    }
  };

  const deleteToken = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir token');
      }

      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Erro ao excluir token:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
    createToken,
    updateToken,
    regenerateToken,
    revokeToken,
    deleteToken,
  };
}
