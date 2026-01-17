/**
 * Funções auxiliares para requisições de API
 * Elimina duplicação de código em múltiplos componentes
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Carrega dados de um endpoint específico
 */
export async function loadData<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (response.ok) {
      return await response.json();
    }
    console.error(`Erro ao carregar dados de ${endpoint}:`, response.statusText);
    return null;
  } catch (error) {
    console.error(`Erro ao carregar dados de ${endpoint}:`, error);
    return null;
  }
}

/**
 * Carrega responsáveis de uma tecnologia
 */
export async function loadResponsaveis(tecnologiaId: string) {
  return loadData(`/api/tecnologias/${tecnologiaId}/responsaveis`);
}

/**
 * Carrega contratos de uma tecnologia
 */
export async function loadContratos(tecnologiaId: string) {
  return loadData(`/api/tecnologias/${tecnologiaId}/contratos`);
}

/**
 * Carrega contratos AMS de uma tecnologia
 */
export async function loadContratosAMS(tecnologiaId: string) {
  return loadData(`/api/tecnologias/${tecnologiaId}/contratos-ams`);
}

/**
 * Carrega custos SaaS de uma tecnologia
 */
export async function loadCustosSaaS(tecnologiaId: string) {
  return loadData(`/api/tecnologias/${tecnologiaId}/custos-saas`);
}

/**
 * Carrega manutenções SaaS de uma tecnologia
 */
export async function loadManutencoesSaaS(tecnologiaId: string) {
  return loadData(`/api/tecnologias/${tecnologiaId}/manutencoes-saas`);
}

/**
 * Função genérica para carregar múltiplos endpoints relacionados
 */
export async function loadRelatedData<T extends Record<string, any>>(
  endpoints: Record<keyof T, string>
): Promise<Partial<T>> {
  const entries = Object.entries(endpoints) as [keyof T, string][];
  const results = await Promise.all(
    entries.map(async ([key, endpoint]) => {
      const data = await loadData(endpoint);
      return [key, data] as const;
    })
  );

  return Object.fromEntries(results) as Partial<T>;
}
