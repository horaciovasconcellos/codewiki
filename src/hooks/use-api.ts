import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface UseApiResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(endpoint: string, initialData: T): UseApiResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useApi] Buscando: ${API_BASE}${endpoint}`);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[useApi] Dados recebidos de ${endpoint}:`, Array.isArray(result) ? `${result.length} itens` : result);
      
      // Se a resposta tem formato { success: true, data: {...} }, extrair apenas o data
      if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
        console.log(`[useApi] Desempacotando resposta com formato { success, data }`);
        setData(result.data);
      } else {
        setData(result);
      }
    } catch (err) {
      console.error(`Erro ao buscar ${endpoint}:`, err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      // Manter dados iniciais em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  console.log('[apiGet] Endpoint:', `${API_BASE}${endpoint}`);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  console.log('[apiGet] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[apiGet] Error response:', errorData);
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log('[apiGet] Success response:', Array.isArray(result) ? `${result.length} itens` : result);
  return result;
}

export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  console.log('[apiPost] Endpoint:', `${API_BASE}${endpoint}`);
  console.log('[apiPost] Data:', data);
  console.log('[apiPost] Is FormData?', data instanceof FormData);
  
  // Se for FormData, não definir Content-Type (navegador define automaticamente)
  // Se não for, enviar como JSON
  const isFormData = data instanceof FormData;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: isFormData ? {
      'ngrok-skip-browser-warning': 'true'
    } : {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: isFormData ? data : JSON.stringify(data),
  });

  console.log('[apiPost] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[apiPost] Error response:', errorData);
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log('[apiPost] Success response:', result);
  return result;
}

export async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  console.log('[apiPut] Endpoint:', `${API_BASE}${endpoint}`);
  console.log('[apiPut] Data:', data);
  console.log('[apiPut] Is FormData?', data instanceof FormData);
  
  const isFormData = data instanceof FormData;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: isFormData ? {
      'ngrok-skip-browser-warning': 'true'
    } : {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: isFormData ? data : JSON.stringify(data),
  });

  console.log('[apiPut] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[apiPut] Error response:', errorData);
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log('[apiPut] Success response:', result);
  return result;
}

export async function apiDelete(endpoint: string): Promise<void> {
  console.log('[apiDelete] Endpoint:', `${API_BASE}${endpoint}`);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  console.log('[apiDelete] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[apiDelete] Error response:', errorData);
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  console.log('[apiDelete] Success');
}
