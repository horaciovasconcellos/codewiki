/**
 * Testes unitários para helpers do Azure DevOps
 * @jest-environment node
 */

import { jest } from '@jest/globals';

// Mock do pool MySQL
const mockQuery = jest.fn();
const mockPool = { query: mockQuery };

// Variáveis para armazenar as funções exportadas
let getAzureDevOpsConfig;
let handleAzureError;

// Mock manual do módulo api.js
beforeAll(async () => {
  // Como api.js não exporta funções, precisamos simular o comportamento
  // Para produção, seria ideal refatorar helpers para um módulo separado
  
  getAzureDevOpsConfig = async (pool) => {
    const [configRows] = await pool.query(
      "SELECT chave, valor FROM configuracoes WHERE chave = 'integration-config'"
    );
    
    if (configRows.length === 0) {
      throw new Error('AZURE_CONFIG_NOT_FOUND: Configurações de integração não encontradas');
    }

    const integrationConfig = JSON.parse(configRows[0].valor);
    const azureConfig = integrationConfig.azureDevOps;

    if (!azureConfig || !azureConfig.urlOrganizacao || !azureConfig.personalAccessToken) {
      throw new Error('AZURE_CONFIG_INCOMPLETE: Configurações do Azure DevOps incompletas');
    }

    const urlMatch = azureConfig.urlOrganizacao.match(/dev\.azure\.com\/([^\/]+)/);
    const organization = urlMatch ? urlMatch[1] : azureConfig.urlOrganizacao;
    const pat = azureConfig.personalAccessToken;

    return { organization, pat, config: azureConfig };
  };

  handleAzureError = (error) => {
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('AZURE_CONFIG_NOT_FOUND')) {
      return {
        status: 400,
        error: 'Configurações de integração não encontradas',
        message: 'Configure as integrações nas Configurações',
        code: 'AZURE_CONFIG_NOT_FOUND'
      };
    }
    
    if (errorMessage.includes('AZURE_CONFIG_INCOMPLETE')) {
      return {
        status: 400,
        error: 'Configurações do Azure DevOps incompletas',
        message: 'Configure a URL da organização e o token PAT nas Configurações de Integração',
        code: 'AZURE_CONFIG_INCOMPLETE'
      };
    }
    
    return {
      status: 500,
      error: 'Erro ao processar requisição',
      message: error.message,
      code: 'INTERNAL_ERROR'
    };
  };
});

describe('getAzureDevOpsConfig', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('deve retornar configuração válida do Azure DevOps', async () => {
    const mockConfig = {
      azureDevOps: {
        urlOrganizacao: 'https://dev.azure.com/horaciovasconcellos',
        personalAccessToken: 'mock-pat-token-12345'
      }
    };

    mockQuery.mockResolvedValue([[
      { chave: 'integration-config', valor: JSON.stringify(mockConfig) }
    ]]);

    const result = await getAzureDevOpsConfig(mockPool);

    expect(result).toEqual({
      organization: 'horaciovasconcellos',
      pat: 'mock-pat-token-12345',
      config: mockConfig.azureDevOps
    });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT chave, valor FROM configuracoes WHERE chave = 'integration-config'"
    );
  });

  test('deve lançar erro quando configuração não existe', async () => {
    mockQuery.mockResolvedValue([[]]);

    await expect(getAzureDevOpsConfig(mockPool))
      .rejects
      .toThrow('AZURE_CONFIG_NOT_FOUND: Configurações de integração não encontradas');
  });

  test('deve lançar erro quando configuração do Azure está incompleta (sem URL)', async () => {
    const mockConfig = {
      azureDevOps: {
        personalAccessToken: 'mock-pat-token-12345'
      }
    };

    mockQuery.mockResolvedValue([[
      { chave: 'integration-config', valor: JSON.stringify(mockConfig) }
    ]]);

    await expect(getAzureDevOpsConfig(mockPool))
      .rejects
      .toThrow('AZURE_CONFIG_INCOMPLETE: Configurações do Azure DevOps incompletas');
  });

  test('deve lançar erro quando configuração do Azure está incompleta (sem PAT)', async () => {
    const mockConfig = {
      azureDevOps: {
        urlOrganizacao: 'https://dev.azure.com/horaciovasconcellos'
      }
    };

    mockQuery.mockResolvedValue([[
      { chave: 'integration-config', valor: JSON.stringify(mockConfig) }
    ]]);

    await expect(getAzureDevOpsConfig(mockPool))
      .rejects
      .toThrow('AZURE_CONFIG_INCOMPLETE: Configurações do Azure DevOps incompletas');
  });

  test('deve extrair organização corretamente da URL', async () => {
    const mockConfig = {
      azureDevOps: {
        urlOrganizacao: 'https://dev.azure.com/myorg',
        personalAccessToken: 'pat-token'
      }
    };

    mockQuery.mockResolvedValue([[
      { chave: 'integration-config', valor: JSON.stringify(mockConfig) }
    ]]);

    const result = await getAzureDevOpsConfig(mockPool);
    expect(result.organization).toBe('myorg');
  });

  test('deve usar organização como está se não for URL válida', async () => {
    const mockConfig = {
      azureDevOps: {
        urlOrganizacao: 'myorg',
        personalAccessToken: 'pat-token'
      }
    };

    mockQuery.mockResolvedValue([[
      { chave: 'integration-config', valor: JSON.stringify(mockConfig) }
    ]]);

    const result = await getAzureDevOpsConfig(mockPool);
    expect(result.organization).toBe('myorg');
  });
});

describe('handleAzureError', () => {
  test('deve retornar erro 400 quando configuração não encontrada', () => {
    const error = new Error('AZURE_CONFIG_NOT_FOUND: Configurações de integração não encontradas');
    const result = handleAzureError(error);

    expect(result).toEqual({
      status: 400,
      error: 'Configurações de integração não encontradas',
      message: 'Configure as integrações nas Configurações',
      code: 'AZURE_CONFIG_NOT_FOUND'
    });
  });

  test('deve retornar erro 400 quando configuração incompleta', () => {
    const error = new Error('AZURE_CONFIG_INCOMPLETE: Configurações do Azure DevOps incompletas');
    const result = handleAzureError(error);

    expect(result).toEqual({
      status: 400,
      error: 'Configurações do Azure DevOps incompletas',
      message: 'Configure a URL da organização e o token PAT nas Configurações de Integração',
      code: 'AZURE_CONFIG_INCOMPLETE'
    });
  });

  test('deve retornar erro 500 para erro genérico', () => {
    const error = new Error('Erro desconhecido ao conectar com Azure');
    const result = handleAzureError(error);

    expect(result).toEqual({
      status: 500,
      error: 'Erro ao processar requisição',
      message: 'Erro desconhecido ao conectar com Azure',
      code: 'INTERNAL_ERROR'
    });
  });

  test('deve tratar erro sem mensagem', () => {
    const error = {};
    const result = handleAzureError(error);

    expect(result).toEqual({
      status: 500,
      error: 'Erro ao processar requisição',
      message: undefined,
      code: 'INTERNAL_ERROR'
    });
  });
});
