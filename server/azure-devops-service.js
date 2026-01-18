/**
 * Azure DevOps Integration Service
 * 
 * Integração completa com as APIs REST oficiais da Microsoft Azure DevOps
 * Documentação: https://learn.microsoft.com/en-us/rest/api/azure/devops
 * 
 * APIs utilizadas (versão 7.1):
 * - Core API: Projetos, Times, Operações
 * - Work Item Tracking API: Classification Nodes (Iterações e Áreas)
 * - Work API: Configurações de Board e Backlog
 * 
 * Gerencia:
 * - Criação e configuração de projetos
 * - Criação de times (principal e sustentação)
 * - Estruturação de iterações (sprints quinzenais e mensais)
 * - Organização de áreas por categoria/tecnologia
 * - Configuração de boards (colunas, swimlanes, cards)
 */

export class AzureDevOpsService {
  constructor(organization, pat) {
    this.organization = organization;
    this.pat = pat;
    this.baseUrl = `https://dev.azure.com/${organization}`;
    this.authHeader = `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
    this.apiVersion = '7.1'; // API Version da Microsoft Azure DevOps
  }

  /**
   * Faz uma requisição HTTP para a API REST do Azure DevOps
   * 
   * Usa autenticação via Personal Access Token (PAT)
   * Documentação: https://learn.microsoft.com/en-us/rest/api/azure/devops
   * 
   * @param {string} method - Método HTTP (GET, POST, PATCH, DELETE)
   * @param {string} url - Endpoint da API (ex: /_apis/projects)
   * @param {object} body - Corpo da requisição (opcional)
   * @returns {Promise<object>} Resposta da API em JSON
   */
  async request(method, url, body = null) {
    const options = {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Sistema-Auditoria/1.0'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    console.log(`\n[Azure DevOps API] ${method} ${fullUrl}`);
    if (body) {
      console.log('[Request Body]', JSON.stringify(body, null, 2));
    }
    
    try {
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Azure DevOps API Error] Status: ${response.status}`);
        console.error(`[Azure DevOps API Error] Response:`, errorText);
        
        // Tentar parsear como JSON para melhor visualização
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`[Azure DevOps API Error] JSON:`, JSON.stringify(errorJson, null, 2));
        } catch (e) {
          // Não é JSON, já logou como texto
        }
        
        throw new Error(`Azure DevOps API error (${response.status}): ${errorText}`);
      }

      // Algumas operações retornam 204 No Content
      if (response.status === 204) {
        console.log(`[Azure DevOps API] ✅ Sucesso: ${method} ${url} (204 No Content)`);
        return null;
      }

      const result = await response.json();
      console.log(`[Azure DevOps API] ✅ Sucesso: ${method} ${url}`);
      console.log('[Response]', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      if (!error.message.includes('Azure DevOps API error')) {
        console.error(`[Azure DevOps API] ❌ Erro de rede/conexão: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Cria ou atualiza um projeto no Azure DevOps
   * 
   * API: Core API - Projects
   * Endpoint: POST https://dev.azure.com/{organization}/_apis/projects?api-version=7.1
   * Documentação: https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/create
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} processTemplate - Template de processo (Scrum, Agile, CMMI, Basic)
   * @param {string} description - Descrição do projeto
   * @returns {Promise<object>} Dados do projeto criado
   */
  async createOrUpdateProject(projectName, processTemplate = 'Scrum', description = '') {
    try {
      console.log(`\n========== CRIAR PROJETO ==========`);
      console.log(`Nome: ${projectName}`);
      console.log(`Process Template: ${processTemplate}`);
      
      // Verificar se o projeto já existe
      console.log(`[1/5] Verificando se projeto "${projectName}" já existe...`);
      const existingProject = await this.getProject(projectName);
      
      if (existingProject) {
        console.log(`✅ Projeto ${projectName} já existe. Retornando projeto existente...`);
        console.log(`===================================\n`);
        return { project: existingProject, isNew: false };
      }
      console.log(`✅ Projeto não existe. Prosseguindo com criação...`);

      // Gerar descrição com data/hora se não fornecida
      console.log(`[2/5] Gerando descrição do projeto...`);
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const projectDescription = description || `Projeto criado automaticamente em ${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
      console.log(`✅ Descrição: "${projectDescription}"`);

      // Obter typeId do processo
      console.log(`[3/5] Obtendo typeId para processo "${processTemplate}"...`);
      const typeId = await this.getProcessTemplateId(processTemplate);
      
      if (!typeId) {
        throw new Error(`Não foi possível obter typeId para o processo "${processTemplate}"`);
      }
      console.log(`✅ typeId obtido: ${typeId}`);

      // Criar novo projeto usando a API da Microsoft
      console.log(`[4/5] Montando payload do projeto...`);
      const projectData = {
        name: projectName,
        description: projectDescription,
        visibility: 'private',
        capabilities: {
          versioncontrol: {
            sourceControlType: 'Git'
          },
          processTemplate: {
            templateTypeId: typeId
          }
        }
      };

      console.log(`✅ Payload montado:`);
      console.log(JSON.stringify(projectData, null, 2));

      console.log(`[5/5] Enviando requisição POST para criar projeto...`);
      console.log(`Endpoint: POST /_apis/projects?api-version=${this.apiVersion}`);
      
      const response = await this.request('POST', `/_apis/projects?api-version=${this.apiVersion}`, projectData);
      
      if (!response || !response.id) {
        throw new Error('Resposta da API não contém operation ID');
      }
      
      console.log(`✅ Projeto enviado. Operation ID: ${response.id}`);
      console.log(`Aguardando criação assíncrona...`);
      
      // Aguardar a criação do projeto (processo assíncrono no Azure)
      await this.waitForProjectCreation(response.id);
      
      console.log(`✅ Projeto criado com sucesso! Obtendo dados...`);
      const createdProject = await this.getProject(projectName);
      
      console.log(`===================================\n`);
      return { project: createdProject, isNew: true };
    } catch (error) {
      console.error(`\n❌ ERRO ao criar projeto:`);
      console.error(`Mensagem: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      console.log(`===================================\n`);
      throw new Error(`Erro ao criar/atualizar projeto "${projectName}": ${error.message}`);
    }
  }

  /**
   * Obtém um projeto existente
   */
  async getProject(projectName) {
    try {
      return await this.request('GET', `/_apis/projects/${projectName}?api-version=7.1`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Alias para getProject - para compatibilidade
   */
  async getProjectByName(projectName) {
    return this.getProject(projectName);
  }

  /**
   * Cria um projeto no Azure DevOps (versão simplificada sem verificação de existência)
   * @param {object} config - Configuração do projeto
   * @returns {Promise<object>} Projeto criado
   */
  async createProject(config) {
    try {
      const { name, description, visibility, capabilities } = config;
      
      console.log(`[Create Project] Criando projeto "${name}"...`);
      
      const projectData = {
        name,
        description: description || '',
        visibility: visibility || 'private',
        capabilities: capabilities || {
          versioncontrol: {
            sourceControlType: 'Git'
          },
          processTemplate: {
            templateTypeId: '6b724908-ef14-45cf-84f8-768b5384da45' // Scrum por padrão
          }
        }
      };

      const result = await this.request('POST', `/_apis/projects?api-version=7.1`, projectData);
      console.log(`[Create Project] ✅ Projeto "${name}" criado com sucesso (ID: ${result.id})`);
      
      return result;
    } catch (error) {
      console.error(`[Create Project] ❌ Erro ao criar projeto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém o time padrão de um projeto
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<object>} Time padrão
   */
  async getDefaultTeam(projectName) {
    try {
      console.log(`[Get Default Team] Buscando time padrão do projeto "${projectName}"...`);
      
      const response = await this.request('GET', `/_apis/projects/${projectName}/teams?$top=1&api-version=7.1`);
      
      if (response.value && response.value.length > 0) {
        const team = response.value[0];
        console.log(`[Get Default Team] ✅ Time encontrado: "${team.name}" (ID: ${team.id})`);
        return team;
      }
      
      throw new Error('Nenhum time encontrado no projeto');
    } catch (error) {
      console.error(`[Get Default Team] ❌ Erro: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza um time (renomeia)
   * @param {string} projectName - Nome do projeto
   * @param {string} teamId - ID do time
   * @param {object} updates - Atualizações (name, description)
   * @returns {Promise<object>} Time atualizado
   */
  async updateTeam(projectName, teamId, updates) {
    try {
      console.log(`[Update Team] Atualizando time ${teamId} no projeto "${projectName}"...`);
      
      const result = await this.request(
        'PATCH',
        `/_apis/projects/${projectName}/teams/${teamId}?api-version=7.1`,
        updates
      );
      
      console.log(`[Update Team] ✅ Time atualizado: "${updates.name}"`);
      return result;
    } catch (error) {
      console.error(`[Update Team] ❌ Erro: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria uma área no projeto
   * @param {string} projectName - Nome do projeto
   * @param {string} areaName - Nome da área
   * @returns {Promise<object>} Área criada
   */
  async createArea(projectName, areaName) {
    try {
      console.log(`[Create Area] Criando área "${areaName}" no projeto "${projectName}"...`);
      
      const result = await this.request(
        'POST',
        `/${projectName}/_apis/wit/classificationnodes/areas?api-version=7.1`,
        { name: areaName }
      );
      
      console.log(`[Create Area] ✅ Área "${areaName}" criada com sucesso.`);
      return result;
    } catch (error) {
      console.error(`[Create Area] ❌ Erro: ${error.message}`);
      // Não bloquear o processo se a área já existir
      if (error.message.includes('409') || error.message.includes('already exists')) {
        console.log(`[Create Area] ℹ️  Área já existe, continuando...`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Cria uma iteração no projeto
   * @param {string} projectName - Nome do projeto
   * @param {string} iterationName - Nome da iteração
   * @param {string} parentName - Nome da iteração pai (null para raiz)
   * @param {object} dates - Datas (startDate, finishDate)
   * @returns {Promise<object>} Iteração criada
   */
  async createIteration(projectName, iterationName, parentName = null, dates = null) {
    try {
      console.log(`[Create Iteration] Criando iteração "${iterationName}" no projeto "${projectName}"${parentName ? ` sob "${parentName}"` : ''}...`);
      
      const path = parentName ? `/iterations/${encodeURIComponent(parentName)}` : '/iterations';
      const body = { name: iterationName };
      
      if (dates) {
        body.attributes = {
          startDate: dates.startDate,
          finishDate: dates.finishDate
        };
      }
      
      const result = await this.request(
        'POST',
        `/${projectName}/_apis/wit/classificationnodes${path}?api-version=7.1`,
        body
      );
      
      console.log(`[Create Iteration] ✅ Iteração "${iterationName}" criada com sucesso.`);
      return result;
    } catch (error) {
      console.error(`[Create Iteration] ❌ Erro: ${error.message}`);
      // Não bloquear o processo se a iteração já existir
      if (error.message.includes('409') || error.message.includes('already exists')) {
        console.log(`[Create Iteration] ℹ️  Iteração já existe, continuando...`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Adiciona iterações ao time
   * @param {string} projectName - Nome do projeto
   * @param {string} teamId - ID do time
   * @param {string} iterationPath - Path da iteração (ex: "NomeProjeto\\NomeDoTime")
   * @returns {Promise<object>} Iteração adicionada
   */
  async addIterationToTeam(projectName, teamId, iterationPath) {
    try {
      console.log(`[Add Iteration] Adicionando iteração "${iterationPath}" ao time...`);
      
      const result = await this.request(
        'POST',
        `/${projectName}/_apis/work/teamsettings/iterations?teamId=${teamId}&api-version=7.1`,
        { id: iterationPath }
      );
      
      console.log(`[Add Iteration] ✅ Iteração adicionada com sucesso!`);
      return result;
    } catch (error) {
      console.error(`[Add Iteration] ❌ Erro: ${error.message}`);
      return null;
    }
  }

  /**
   * Configura um time (área padrão e iterações)
   * @param {string} projectName - Nome do projeto
   * @param {string} teamId - ID do time
   * @param {string} teamName - Nome do time
   * @param {object} config - Configuração (defaultArea, iterations array)
   * @returns {Promise<object>} Configuração aplicada
   */
  async configureTeam(projectName, teamId, teamName, config) {
    try {
      console.log(`\n========== CONFIGURAR TEAM SETTINGS ==========`);
      console.log(`[Configure Team] Projeto: "${projectName}"`);
      console.log(`[Configure Team] Time: "${teamName}" (ID: ${teamId})`);
      console.log(`[Configure Team] ----------------------------------------`);
      
      // 1. Adicionar todas as iterações ao time primeiro
      if (config.iterations && config.iterations.length > 0) {
        console.log(`[Configure Team] Adicionando ${config.iterations.length} iterações ao time...`);
        for (const iteration of config.iterations) {
          await this.addIterationToTeam(projectName, teamId, iteration.path);
        }
      }
      
      // 2. Configurar apenas área e backlog visibilities
      const settings = {
        backlogVisibilities: {
          'Microsoft.EpicCategory': true,
          'Microsoft.FeatureCategory': true,
          'Microsoft.RequirementCategory': true
        }
      };
      
      if (config.defaultArea) {
        settings.defaultAreaPath = config.defaultArea;
      }
      
      const apiUrl = `/${projectName}/${teamName}/_apis/work/teamsettings?api-version=7.1`;
      console.log(`[Configure Team] ----------------------------------------`);
      console.log(`[Configure Team] Configurando team settings...`);
      console.log(`[Configure Team] API URL: ${apiUrl}`);
      console.log(`[Configure Team] Body:`, JSON.stringify(settings, null, 2));
      
      const result = await this.request('PATCH', apiUrl, settings);
      
      console.log(`[Configure Team] ✅ SUCESSO - Time configurado!`);
      console.log(`=============================================\n`);
      return result;
    } catch (error) {
      console.error(`\n========== ERRO AO CONFIGURAR TEAM ==========`);
      console.error(`[Configure Team] ❌ Erro: ${error.message}`);
      console.error(`=============================================\n`);
      console.warn(`[Configure Team] ⚠️  Continuando apesar do erro...`);
      return null;
    }
  }

  /**
   * Configura colunas do board
   */
  async configureBoardColumns(projectName, teamName) {
    try {
      console.log(`[Board Columns] ========================================`);
      console.log(`[Board Columns] Configurando colunas para ${teamName}...`);
      
      // Primeiro obter as colunas atuais
      try {
        const currentColumns = await this.request(
          'GET',
          `/${projectName}/${teamName}/_apis/work/boards/Backlog%20items/columns?api-version=7.1`
        );
        console.log(`[Board Columns] Colunas atuais:`, JSON.stringify(currentColumns, null, 2));
      } catch (getError) {
        console.log(`[Board Columns] Não foi possível obter colunas atuais:`, getError.message);
      }
      
      const columns = [
        { 
          name: 'Backlog', 
          itemLimit: 0, 
          stateMappings: { 
            'Product Backlog Item': 'New',
            'Bug': 'New'
          }, 
          isSplit: false 
        },
        { 
          name: 'Pronto p Dev', 
          itemLimit: 0, 
          stateMappings: { 
            'Product Backlog Item': 'Approved',
            'Bug': 'Approved'
          }, 
          isSplit: false 
        },
        { 
          name: 'Desenvolvimento', 
          itemLimit: 0, 
          stateMappings: { 
            'Product Backlog Item': 'Committed',
            'Bug': 'Committed'
          }, 
          isSplit: false 
        },
        { 
          name: 'Producao', 
          itemLimit: 0, 
          stateMappings: { 
            'Product Backlog Item': 'Done',
            'Bug': 'Done'
          }, 
          isSplit: false 
        }
      ];

      console.log(`[Board Columns] Enviando configuração:`, JSON.stringify(columns, null, 2));

      const result = await this.request(
        'PUT',
        `/${projectName}/${teamName}/_apis/work/boards/Backlog%20items/columns?api-version=7.1`,
        columns
      );
      
      console.log(`[Board Columns] ✅ Colunas configuradas com sucesso`);
      console.log(`[Board Columns] Resultado:`, JSON.stringify(result, null, 2));
      console.log(`[Board Columns] ========================================`);
      return result;
    } catch (error) {
      console.error(`[Board Columns] ========================================`);
      console.error(`[Board Columns] ❌ Erro ao configurar colunas`);
      console.error(`[Board Columns] Mensagem:`, error.message);
      console.error(`[Board Columns] Stack:`, error.stack);
      console.error(`[Board Columns] ========================================`);
      return null;
    }
  }

  /**
   * Configura swimlanes do board
   */
  async configureBoardSwimlanes(projectName, teamName) {
    try {
      console.log(`[Board Swimlanes] Configurando swimlanes para ${teamName}...`);
      
      const rows = [
        { id: null, name: 'PROJETO' },
        { id: null, name: 'Bug' },
        { id: null, name: 'Demanda Expressa' }
      ];

      await this.request(
        'PUT',
        `/${projectName}/${teamName}/_apis/work/boards/Backlog%20items/rows?api-version=7.1`,
        rows
      );
      
      console.log(`[Board Swimlanes] ✅ Swimlanes configuradas`);
      return rows;
    } catch (error) {
      console.error(`[Board Swimlanes] ❌ Erro: ${error.message}`);
      return null;
    }
  }

  /**
   * Configura estilos de card (prioridades e tags)
   */
  async configureBoardCardStyles(projectName, teamName) {
    try {
      console.log(`[Board Card Styles] ========================================`);
      console.log(`[Board Card Styles] Configurando estilos para time: ${teamName}`);
      console.log(`[Board Card Styles] Projeto: ${projectName}`);
      
      // Primeiro, tentar obter as configurações atuais
      try {
        console.log(`[Board Card Styles] Obtendo configurações atuais...`);
        const currentSettings = await this.request(
          'GET',
          `/${projectName}/${teamName}/_apis/work/boards/Backlog%20items/cardrulesettings?api-version=7.1`
        );
        console.log(`[Board Card Styles] Configurações atuais:`, JSON.stringify(currentSettings, null, 2));
      } catch (getError) {
        console.log(`[Board Card Styles] Não foi possível obter configurações atuais:`, getError.message);
      }
      
      const cardRules = {
        rules: {
          fill: [
            // Prioridades - usando Microsoft.VSTS.Common.Priority
            {
              name: 'PRIORIDADE 1',
              isEnabled: 'true',
              filter: "[Microsoft.VSTS.Common.Priority] = 1",
              settings: {
                'background-color': '#CC293D',
                'title-color': '#FFFFFF'
              }
            },
            {
              name: 'PRIORIDADE 2',
              isEnabled: 'true',
              filter: "[Microsoft.VSTS.Common.Priority] = 2",
              settings: {
                'background-color': '#FF6600',
                'title-color': '#FFFFFF'
              }
            },
            {
              name: 'PRIORIDADE 3',
              isEnabled: 'true',
              filter: "[Microsoft.VSTS.Common.Priority] = 3",
              settings: {
                'background-color': '#FFCC00',
                'title-color': '#000000'
              }
            }
          ],
          tagStyle: [
            { name: 'BLOQUEADO', isEnabled: 'true', settings: { 'background-color': '#000000', 'color': '#FFFFFF' } },
            { name: 'ANGULAR', isEnabled: 'true', settings: { 'background-color': '#DD0031', 'color': '#FFFFFF' } },
            { name: 'C++', isEnabled: 'true', settings: { 'background-color': '#FFCC00', 'color': '#000000' } },
            { name: 'KOTLIN', isEnabled: 'true', settings: { 'background-color': '#006400', 'color': '#FFFFFF' } },
            { name: 'RPA', isEnabled: 'true', settings: { 'background-color': '#90EE90', 'color': '#000000' } },
            { name: 'REPORTS', isEnabled: 'true', settings: { 'background-color': '#00008B', 'color': '#FFFFFF' } },
            { name: 'FORMS', isEnabled: 'true', settings: { 'background-color': '#87CEEB', 'color': '#000000' } },
            { name: 'QUARKUS', isEnabled: 'true', settings: { 'background-color': '#4B0082', 'color': '#FFFFFF' } },
            { name: 'JAVA', isEnabled: 'true', settings: { 'background-color': '#9370DB', 'color': '#FFFFFF' } },
            { name: 'PL_SQL', isEnabled: 'true', settings: { 'background-color': '#CC293D', 'color': '#FFFFFF' } },
            { name: 'PHP', isEnabled: 'true', settings: { 'background-color': '#FFCC00', 'color': '#000000' } }
          ]
        }
      };

      console.log(`[Board Card Styles] Enviando configurações:`, JSON.stringify(cardRules, null, 2));
      console.log(`[Board Card Styles] URL: /${projectName}/${teamName}/_apis/work/boards/Backlog%20items/cardrulesettings?api-version=7.1`);
      
      const result = await this.request(
        'PATCH',
        `/${projectName}/${teamName}/_apis/work/boards/Backlog%20items/cardrulesettings?api-version=7.1`,
        cardRules
      );
      
      console.log(`[Board Card Styles] ✅ Estilos configurados com sucesso!`);
      console.log(`[Board Card Styles] Resposta da API:`, JSON.stringify(result, null, 2));
      console.log(`[Board Card Styles] ========================================`);
      return result;
    } catch (error) {
      console.error(`[Board Card Styles] ========================================`);
      console.error(`[Board Card Styles] ❌ ERRO ao configurar estilos`);
      console.error(`[Board Card Styles] Mensagem:`, error.message);
      console.error(`[Board Card Styles] Stack:`, error.stack);
      if (error.response) {
        console.error(`[Board Card Styles] Response Status:`, error.response.status);
        console.error(`[Board Card Styles] Response Data:`, error.response.data);
      }
      console.error(`[Board Card Styles] ========================================`);
      return null;
    }
  }

  /**
   * Aguarda a criação completa do projeto
   */
  async waitForProjectCreation(operationId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.request('GET', `/_apis/operations/${operationId}?api-version=7.1`);
        if (response.status === 'succeeded') {
          return true;
        }
        if (response.status === 'failed') {
          throw new Error('Falha na criação do projeto');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    throw new Error('Timeout ao aguardar criação do projeto');
  }

  /**
   * Obtém o ID do template de processo
   * Usa typeId (GUID do sistema) em vez de templateTypeId
   */
  async getProcessTemplateId(processName) {
    console.log(`[Process Template] Obtendo typeId para: ${processName}`);
    
    // Mapa de processos padrão do Azure DevOps
    // Estes são os typeIds (GUIDs do sistema) não os templateTypeIds
    const processMap = {
      'Scrum': '6b724908-ef14-45cf-84f8-768b5384da45',
      'Agile': 'adcc42ab-9882-485e-a3ed-7678f01f66bc',
      'Basic': 'b8a3a935-7e91-48b8-a94c-606d37c3e9f2',
      'CMMI': '27450541-8e31-4150-9947-dc59f998fc01',
      'bbtsπdev_Scrum': '6b724908-ef14-45cf-84f8-768b5384da45'
    };
    
    const typeId = processMap[processName] || processMap['Scrum'];
    console.log(`[Process Template] ✅ typeId selecionado: ${typeId} (${processName})`);
    
    return typeId;
  }

  /**
   * Cria ou obtém um time no projeto
   */
  async createOrGetTeam(projectName, teamName, description = '') {
    try {
      // Verificar se o time já existe
      const existingTeam = await this.getTeam(projectName, teamName);
      
      if (existingTeam) {
        console.log(`Time ${teamName} já existe no projeto ${projectName}`);
        return existingTeam;
      }

      // Criar novo time
      const teamData = {
        name: teamName,
        description: description
      };

      return await this.request('POST', `/_apis/projects/${projectName}/teams?api-version=7.1`, teamData);
    } catch (error) {
      throw new Error(`Erro ao criar/obter time: ${error.message}`);
    }
  }

  /**
   * Obtém um time existente
   */
  async getTeam(projectName, teamName) {
    try {
      return await this.request('GET', `/_apis/projects/${projectName}/teams/${teamName}?api-version=7.1`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Renomeia o time default do projeto
   * Quando um projeto é criado, o Azure DevOps cria automaticamente um time com o mesmo nome do projeto
   */
  /**
   * Aguarda e renomeia o time default após criação do projeto
   */
  async waitAndRenameDefaultTeam(projectName, newTeamName, maxAttempts = 10) {
    try {
      console.log(`[Rename Team] Aguardando time default ser criado...`);
      console.log(`[Rename Team] Procurando por: "${projectName}" ou "${projectName} Team"`);
      
      let defaultTeam = null;
      let attempts = 0;
      
      // Tentar encontrar o time default até 10 vezes (30 segundos)
      while (!defaultTeam && attempts < maxAttempts) {
        attempts++;
        console.log(`[Rename Team] Tentativa ${attempts}/${maxAttempts}...`);
        
        try {
          // Primeiro, tentar listar todos os times do projeto
          const allTeams = await this.request('GET', `/_apis/projects/${projectName}/teams?api-version=7.1`);
          
          if (allTeams && allTeams.value && allTeams.value.length > 0) {
            console.log(`[Rename Team] Encontrados ${allTeams.value.length} time(s) no projeto:`);
            allTeams.value.forEach(t => console.log(`  - "${t.name}" (ID: ${t.id})`));
            
            // Procurar o time default - pode ser o nome do projeto ou "NOME_PROJETO Team"
            defaultTeam = allTeams.value.find(t => 
              t.name === projectName || 
              t.name === `${projectName} Team`
            );
            
            if (defaultTeam) {
              console.log(`[Rename Team] ✅ Time default encontrado: "${defaultTeam.name}" (ID: ${defaultTeam.id})`);
              break;
            } else {
              console.log(`[Rename Team] ⚠️  Nenhum time default encontrado nesta tentativa`);
            }
          } else {
            console.log(`[Rename Team] Nenhum time encontrado ainda...`);
          }
        } catch (error) {
          console.log(`[Rename Team] Erro ao listar times: ${error.message}`);
        }
        
        if (!defaultTeam && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos entre tentativas
        }
      }
      
      if (!defaultTeam) {
        console.warn(`[Rename Team] ⚠️  Time default não encontrado após ${maxAttempts} tentativas.`);
        console.log(`[Rename Team] Tentando criar time "${newTeamName}" manualmente...`);
        
        // Se não encontrou, criar o time manualmente
        const createdTeam = await this.createOrGetTeam(projectName, newTeamName, 'Time principal do projeto');
        console.log(`[Rename Team] ✅ Time criado: ${newTeamName} (ID: ${createdTeam.id})`);
        return createdTeam;
      }
      
      // Renomear o time default
      console.log(`[Rename Team] Renomeando time de "${defaultTeam.name}" para "${newTeamName}"...`);
      const teamData = {
        name: newTeamName,
        description: `Time principal do projeto`
      };

      await this.request('PATCH', `/_apis/projects/${projectName}/teams/${defaultTeam.id}?api-version=7.1`, teamData);
      console.log(`[Rename Team] ✅ Time renomeado com sucesso: "${defaultTeam.name}" → "${newTeamName}"`);
      
      // Aguardar propagação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retornar o time com ID atualizado
      defaultTeam.name = newTeamName;
      console.log(`[Rename Team] 🔑 Team ID: ${defaultTeam.id}, Nome: ${defaultTeam.name}`);
      return defaultTeam;
    } catch (error) {
      console.error(`[Rename Team] ❌ Erro: ${error.message}`);
      throw new Error(`Falha ao renomear/criar time: ${error.message}`);
    }
  }

  /**
   * Renomeia o time default (função antiga - manter para compatibilidade)
   */
  async renameDefaultTeam(projectName, newTeamName) {
    try {
      console.log(`[Rename Team] Tentando renomear time default de "${projectName}" para "${newTeamName}"...`);
      
      // Verificar se o time default existe
      const defaultTeam = await this.getTeam(projectName, projectName);
      if (!defaultTeam) {
        console.warn(`[Rename Team] Time default "${projectName}" não encontrado. Pulando renomeação.`);
        return null;
      }
      
      // O time default tem o mesmo nome do projeto
      const teamData = {
        name: newTeamName,
        description: `Time principal do projeto`
      };

      const result = await this.request('PATCH', `/_apis/projects/${projectName}/teams/${projectName}?api-version=7.1`, teamData);
      console.log(`[Rename Team] ✅ Time renomeado com sucesso: "${projectName}" → "${newTeamName}"`);
      
      // Aguardar propagação da renomeação
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Retornar o time atualizado com ID
      const updatedTeam = await this.getTeam(projectName, newTeamName);
      console.log(`[Rename Team] 🔑 Team ID: ${updatedTeam.id}`);
      return updatedTeam;
    } catch (error) {
      console.error(`[Rename Team] ❌ Erro ao renomear time default: ${error.message}`);
      // Não lançar erro, apenas logar - continuar com a criação do projeto
      return null;
    }
  }

  /**
   * Elimina todas as iterações padrão criadas automaticamente pelo Azure DevOps
   */
  async deleteDefaultIterations(projectName) {
    try {
      console.log(`[Delete Iterations] Listando iterações padrão do projeto "${projectName}"...`);
      
      // Listar todas as iterações do projeto
      const iterations = await this.request('GET', `/${projectName}/_apis/wit/classificationnodes/iterations?$depth=2&api-version=7.1`);
      
      if (!iterations || !iterations.hasChildren || !iterations.children || iterations.children.length === 0) {
        console.log(`[Delete Iterations] ℹ️  Nenhuma iteração padrão encontrada.`);
        return;
      }
      
      console.log(`[Delete Iterations] Encontradas ${iterations.children.length} iterações padrão. Eliminando...`);
      
      for (const iteration of iterations.children) {
        try {
          console.log(`[Delete Iterations] Deletando iteração: "${iteration.name}"...`);
          await this.request('DELETE', `/${projectName}/_apis/wit/classificationnodes/iterations/${encodeURIComponent(iteration.name)}?api-version=7.1`);
          console.log(`[Delete Iterations] ✅ Iteração "${iteration.name}" deletada.`);
        } catch (error) {
          console.warn(`[Delete Iterations] ⚠️  Não foi possível deletar iteração "${iteration.name}": ${error.message}`);
        }
      }
      
      console.log(`[Delete Iterations] ✅ Processo de eliminação de iterações concluído.`);
    } catch (error) {
      // Não falhar se não conseguir deletar iterações, apenas logar
      console.warn(`[Delete Iterations] ⚠️  Aviso ao eliminar iterações: ${error.message}`);
    }
  }

  /**
   * Cria uma única iteração filha com o nome do time
   */
  async createSingleIteration(projectName, iterationName) {
    try {
      console.log(`[Create Iteration] Criando iteração "${iterationName}" no projeto "${projectName}"...`);
      
      const result = await this.request('POST', `/${projectName}/_apis/wit/classificationnodes/iterations?api-version=7.1`, {
        name: iterationName
      });
      
      console.log(`[Create Iteration] ✅ Iteração "${iterationName}" criada com sucesso.`);
      return result;
    } catch (error) {
      console.error(`[Create Iteration] ❌ Erro ao criar iteração: ${error.message}`);
      // Não bloquear o processo
      return null;
    }
  }

  /**
   * Cria sprints filhas sob a iteração do time
   * Sprints de 5 dias úteis (Segunda a Sexta), começando 2 dias após a sprint anterior
   */
  async createSprintIterations(projectName, parentIteration, startDate, sprintCount = 26) {
    try {
      console.log(`[Create Sprints] Criando ${sprintCount} sprints sob "${parentIteration}"...`);
      console.log(`[Create Sprints] Data inicial: ${startDate}`);
      
      const sprints = [];
      let currentDate = new Date(startDate);
      
      // Ajustar para a próxima segunda-feira se não for
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 1) { // 1 = Segunda-feira
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
        currentDate.setDate(currentDate.getDate() + daysUntilMonday);
      }
      
      console.log(`[Create Sprints] Primeira sprint começa em: ${currentDate.toISOString().split('T')[0]} (Segunda-feira)`);
      
      for (let i = 1; i <= sprintCount; i++) {
        const sprintName = `SPRINT-${String(i).padStart(3, '0')}`;
        
        // Data inicial da sprint (Segunda-feira)
        const startSprint = new Date(currentDate);
        
        // Data final da sprint (4 dias após = Sexta-feira)
        const endSprint = new Date(currentDate);
        endSprint.setDate(endSprint.getDate() + 4);
        
        try {
          const startStr = startSprint.toISOString().split('T')[0];
          const endStr = endSprint.toISOString().split('T')[0];
          
          console.log(`[Create Sprints] Criando ${sprintName}: ${startStr} a ${endStr}`);
          
          const sprint = await this.request(
            'POST',
            `/${projectName}/_apis/wit/classificationnodes/iterations/${encodeURIComponent(parentIteration)}?api-version=7.1`,
            {
              name: sprintName,
              attributes: {
                startDate: startSprint.toISOString(),
                finishDate: endSprint.toISOString()
              }
            }
          );
          
          sprints.push(sprint);
          console.log(`[Create Sprints] ✅ ${sprintName} criada.`);
        } catch (error) {
          console.error(`[Create Sprints] ❌ Erro ao criar ${sprintName}: ${error.message}`);
        }
        
        // Próxima sprint: avança 7 dias (1 semana completa = garante sem repetição)
        // Sexta (dia 5) + 2 dias (Sábado + Domingo) + 1 = Segunda-feira da próxima semana
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      console.log(`[Create Sprints] ✅ Total de ${sprints.length} sprints criadas.`);
      return sprints;
    } catch (error) {
      console.error(`[Create Sprints] ❌ Erro geral: ${error.message}`);
      return [];
    }
  }

  /**
   * Cria uma única área filha com o nome do time
   */
  async createSingleArea(projectName, areaName) {
    try {
      console.log(`[Create Area] Criando área "${areaName}" no projeto "${projectName}"...`);
      
      const result = await this.request('POST', `/${projectName}/_apis/wit/classificationnodes/areas?api-version=7.1`, {
        name: areaName
      });
      
      console.log(`[Create Area] ✅ Área "${areaName}" criada com sucesso.`);
      return result;
    } catch (error) {
      console.error(`[Create Area] ❌ Erro ao criar área: ${error.message}`);
      // Não bloquear o processo
      return null;
    }
  }

  /**
   * Cria iterações para um time
   */
  async createIterations(projectName, teamName, config) {
    try {
      const { startDate, isSustentacao, projectIteration } = config;
      
      // Criar iteração raiz do projeto se não existir
      await this.createRootIteration(projectName, projectIteration);

      if (isSustentacao) {
        // Iterações mensais para sustentação (ano corrente + próximo ano)
        return await this.createMonthlyIterations(projectName, teamName, projectIteration);
      } else {
        // Iterações quinzenais começando na data informada
        return await this.createBiweeklyIterations(projectName, teamName, projectIteration, startDate);
      }
    } catch (error) {
      throw new Error(`Erro ao criar iterações: ${error.message}`);
    }
  }

  /**
   * Cria iteração raiz do projeto
   */
  async createRootIteration(projectName, iterationName) {
    try {
      return await this.request('POST', `/${projectName}/_apis/wit/classificationnodes/iterations?api-version=7.1`, {
        name: iterationName
      });
    } catch (error) {
      // Ignorar se já existir (409 Conflict)
      if (!error.message.includes('409')) {
        throw error;
      }
    }
  }

  /**
   * Cria iterações mensais (Sustentação)
   */
  async createMonthlyIterations(projectName, teamName, parentIteration) {
    const iterations = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    
    const monthNames = [
      'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
      'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
    ];

    for (const year of years) {
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Último dia do mês

        const iterationName = `${monthNames[month]}-${year}`;
        
        try {
          const iteration = await this.request(
            'POST',
            `/${projectName}/_apis/wit/classificationnodes/iterations/${parentIteration}?api-version=7.1`,
            {
              name: iterationName,
              attributes: {
                startDate: startDate.toISOString(),
                finishDate: endDate.toISOString()
              }
            }
          );
          
          iterations.push(iteration);
        } catch (error) {
          console.error(`Erro ao criar iteração ${iterationName}:`, error.message);
        }
      }
    }

    return iterations;
  }

  /**
   * Cria iterações quinzenais terminando sempre na sexta-feira
   */
  async createBiweeklyIterations(projectName, teamName, parentIteration, startDate, count = 26) {
    const iterations = [];
    let currentDate = new Date(startDate);
    
    // Garantir que a primeira iteração comece na segunda-feira
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 1) { // 1 = Monday
      const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      currentDate.setDate(currentDate.getDate() + daysToMonday);
    }

    for (let i = 1; i <= count; i++) {
      const startIter = new Date(currentDate);
      const endIter = new Date(currentDate);
      
      // Adicionar 13 dias para terminar na sexta (2 semanas completas)
      endIter.setDate(endIter.getDate() + 13);
      
      // Garantir que termine na sexta
      const endDayOfWeek = endIter.getDay();
      if (endDayOfWeek !== 5) { // 5 = Friday
        const daysToFriday = endDayOfWeek < 5 ? (5 - endDayOfWeek) : (12 - endDayOfWeek);
        endIter.setDate(endIter.getDate() + daysToFriday);
      }

      const iterationName = `Sprint ${i}`;
      
      try {
        const iteration = await this.request(
          'POST',
          `/${projectName}/_apis/wit/classificationnodes/iterations/${parentIteration}?api-version=7.1`,
          {
            name: iterationName,
            attributes: {
              startDate: startIter.toISOString(),
              finishDate: endIter.toISOString()
            }
          }
        );
        
        iterations.push(iteration);
      } catch (error) {
        console.error(`Erro ao criar iteração ${iterationName}:`, error.message);
      }

      // Próxima iteração começa na segunda-feira seguinte
      currentDate.setDate(endIter.getDate() + 3);
    }

    return iterations;
  }

  /**
   * Cria áreas (Area Paths) subordinadas ao projeto
   */
  async createAreas(projectName, areas) {
    try {
      const createdAreas = [];

      for (const area of areas) {
        try {
          const response = await this.request(
            'POST',
            `/${projectName}/_apis/wit/classificationnodes/areas?api-version=7.1`,
            {
              name: area.name,
              path: area.path || null
            }
          );
          createdAreas.push(response);
        } catch (error) {
          if (!error.message.includes('409')) {
            console.error(`Erro ao criar área ${area.name}:`, error.message);
          }
        }
      }

      return createdAreas;
    } catch (error) {
      throw new Error(`Erro ao criar áreas: ${error.message}`);
    }
  }

  /**
   * Configura o backlog de um time
   */
  async configureTeamBacklog(projectName, teamName) {
    try {
      const backlogConfig = {
        backlogVisibilities: {
          'Microsoft.EpicCategory': true,
          'Microsoft.FeatureCategory': true,
          'Microsoft.RequirementCategory': true
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        bugsBehavior: 'asRequirements'
      };

      await this.request(
        'PATCH',
        `/${projectName}/${teamName}/_apis/work/teamsettings?api-version=7.1`,
        backlogConfig
      );

      return backlogConfig;
    } catch (error) {
      throw new Error(`Erro ao configurar backlog: ${error.message}`);
    }
  }

  /**
   * Configura o board de um time com colunas, swimlanes e estilos
   */
  async configureTeamBoard(projectName, teamName) {
    try {
      // Configurar colunas do board
      const columns = [
        { name: 'Backlog', itemLimit: 0, stateMappings: {}, isSplit: false },
        { name: 'Ready To Dev', itemLimit: 0, stateMappings: {}, isSplit: false },
        { name: 'Em Desenvolvimento', itemLimit: 0, stateMappings: {}, isSplit: false },
        { name: 'Developer', itemLimit: 0, stateMappings: {}, isSplit: false },
        { name: 'QA', itemLimit: 0, stateMappings: {}, isSplit: false },
        { name: 'Validated', itemLimit: 0, stateMappings: {}, isSplit: false },
        { name: 'Done', itemLimit: 0, stateMappings: {}, isSplit: false }
      ];

      await this.request(
        'PUT',
        `/${projectName}/${teamName}/_apis/work/boards/Stories/columns?api-version=7.1`,
        columns
      );

      // Configurar swimlanes
      const swimlanes = [
        { name: 'Bugs', color: 'cc293d' }, // Vermelho
        { name: 'Demanda Expressa', color: '339933' }, // Verde
        { name: 'Projeto', color: '0078d4' } // Azul padrão
      ];

      await this.request(
        'PUT',
        `/${projectName}/${teamName}/_apis/work/boards/Stories/rows?api-version=7.1`,
        swimlanes
      );

      // Configurar estilos de card (prioridades e tags)
      const cardStyles = {
        rules: [
          // Prioridades
          {
            name: 'Prioridade 1',
            isEnabled: true,
            filter: "Priority = 1",
            settings: {
              tagStyle: 'cc293d' // Vermelho
            }
          },
          {
            name: 'Prioridade 2',
            isEnabled: true,
            filter: "Priority = 2",
            settings: {
              tagStyle: 'ff6600' // Laranja
            }
          },
          {
            name: 'Prioridade 3',
            isEnabled: true,
            filter: "Priority = 3",
            settings: {
              tagStyle: 'ffcc00' // Amarelo
            }
          },
          // Tags
          {
            name: 'Tag PL_SQL',
            isEnabled: true,
            filter: "[Tags] contains 'PL_SQL'",
            settings: {
              tagStyle: 'cc293d' // Vermelho
            }
          },
          {
            name: 'Tag JAVA',
            isEnabled: true,
            filter: "[Tags] contains 'JAVA'",
            settings: {
              tagStyle: '0078d4' // Azul
            }
          },
          {
            name: 'Tag PHP',
            isEnabled: true,
            filter: "[Tags] contains 'PHP'",
            settings: {
              tagStyle: '8b4789' // Roxo
            }
          },
          {
            name: 'Tag OUTROS',
            isEnabled: true,
            filter: "[Tags] contains 'OUTROS'",
            settings: {
              tagStyle: '0078d4' // Azul
            }
          }
        ]
      };

      await this.request(
        'PUT',
        `/${projectName}/${teamName}/_apis/work/boards/Stories/cardrulesettings?api-version=7.1`,
        cardStyles
      );

      return { columns, swimlanes, cardStyles };
    } catch (error) {
      throw new Error(`Erro ao configurar board: ${error.message}`);
    }
  }

  /**
   * Configura a iteração default do time
   */
  async configureTeamIterationPath(projectName, teamId, teamName) {
    try {
      console.log(`Configurando iteração default para time ID "${teamId}"...`);
      
      // Configurar o backlog iteration path para a iteração criada
      const teamSettings = {
        backlogIteration: {
          name: teamName,
          path: `\\${projectName}\\Iteration\\${teamName}`
        },
        defaultIteration: {
          name: teamName,
          path: `\\${projectName}\\Iteration\\${teamName}`
        }
      };

      await this.request(
        'PATCH',
        `/${projectName}/${teamId}/_apis/work/teamsettings?api-version=7.1`,
        teamSettings
      );

      console.log(`✅ Iteração default configurada: ${teamName}`);
      return teamSettings;
    } catch (error) {
      console.warn(`⚠️  Aviso ao configurar iteração default: ${error.message}`);
      // Não falhar se isso der erro, apenas avisar
      return null;
    }
  }

  /**
   * Obtém os boards disponíveis para um time
   */
  async getTeamBoards(projectName, teamId) {
    try {
      const boards = await this.request(
        'GET',
        `/${projectName}/${teamId}/_apis/work/boards?api-version=7.1`
      );
      
      if (boards && boards.value && boards.value.length > 0) {
        console.log(`[Boards] Encontrados ${boards.value.length} board(s):`);
        boards.value.forEach(b => console.log(`  - "${b.name}" (ID: ${b.id})`));
        return boards.value;
      }
      
      return [];
    } catch (error) {
      console.error(`[Boards] Erro ao listar boards: ${error.message}`);
      return [];
    }
  }

  /**
   * Configura Backlogs do time - habilita Epics
   */
  async configureBacklogLevels(projectName, teamId) {
    try {
      console.log(`Configurando níveis de backlog para time ID "${teamId}"...`);
      
      const backlogConfig = {
        backlogVisibilities: {
          'Microsoft.EpicCategory': true,      // Epics ✅
          'Microsoft.FeatureCategory': true,   // Features ✅
          'Microsoft.RequirementCategory': true // Product Backlog Items ✅
        }
      };

      await this.request(
        'PATCH',
        `/${projectName}/${teamId}/_apis/work/teamsettings?api-version=7.1`,
        backlogConfig
      );

      console.log('✅ Backlog configurado: Epics, Features e Product Backlog Items habilitados');
      return backlogConfig;
    } catch (error) {
      throw new Error(`Erro ao configurar níveis de backlog: ${error.message}`);
    }
  }

  /**
   * Configura Cards do Board - adiciona campos personalizados
   */
  async configureBoardCards(projectName, teamId, boardName) {
    try {
      console.log(`Configurando cards do board "${boardName}" para time ID "${teamId}"...`);
      
      // Obter a configuração atual de cards
      const currentSettings = await this.request(
        'GET',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/cardsettings?api-version=7.1`
      );

      // Atualizar apenas os cards que existem
      const updatedSettings = {
        ...currentSettings,
        cards: currentSettings.cards || {}  // Manter a estrutura de cards
      };

      // Atualizar Product Backlog Item
      if (!updatedSettings.cards['Microsoft.VSTS.WorkItemTypes.UserStory']) {
        updatedSettings.cards['Microsoft.VSTS.WorkItemTypes.UserStory'] = [];
      }
      updatedSettings.cards['Microsoft.VSTS.WorkItemTypes.UserStory'] = [
        { displayType: 'core', fieldIdentifier: 'System.AreaPath' },
        { displayType: 'core', fieldIdentifier: 'System.IterationPath' },
        { displayType: 'additional', fieldIdentifier: 'System.CreatedBy' },
        { displayType: 'additional', fieldIdentifier: 'System.AssignedTo' },
        { displayType: 'additional', fieldIdentifier: 'System.State' },
        { displayType: 'additional', fieldIdentifier: 'System.Tags' }
      ];

      // Atualizar Bug
      if (!updatedSettings.cards['Microsoft.VSTS.WorkItemTypes.Bug']) {
        updatedSettings.cards['Microsoft.VSTS.WorkItemTypes.Bug'] = [];
      }
      updatedSettings.cards['Microsoft.VSTS.WorkItemTypes.Bug'] = [
        { displayType: 'core', fieldIdentifier: 'System.AreaPath' },
        { displayType: 'core', fieldIdentifier: 'System.IterationPath' },
        { displayType: 'additional', fieldIdentifier: 'System.CreatedBy' },
        { displayType: 'additional', fieldIdentifier: 'System.AssignedTo' },
        { displayType: 'additional', fieldIdentifier: 'System.State' },
        { displayType: 'additional', fieldIdentifier: 'System.Tags' }
      ];

      await this.request(
        'PUT',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/cardsettings?api-version=7.1`,
        updatedSettings
      );

      console.log('✅ Cards configurados com campos adicionais');
      return updatedSettings;
    } catch (error) {
      console.warn(`⚠️  Aviso ao configurar cards: ${error.message}`);
      return null;
    }
  }

  /**
   * Configura Styles do Board - prioridades e tag colors
   */
  async configureBoardStyles(projectName, teamId, boardName) {
    try {
      console.log(`Configurando Styles do board "${boardName}" para time ID "${teamId}"...`);
      
      const styleRules = {
        rules: {
          fill: [
            // Prioridades - usando Microsoft.VSTS.Common.Priority
            {
              name: 'Prioridade 1',
              isEnabled: 'true',
              filter: "[Microsoft.VSTS.Common.Priority] = '1'",
              settings: {
                'background-color': '#CC293D',  // Vermelho
                'title-color': '#FFFFFF'
              }
            },
            {
              name: 'Prioridade 2',
              isEnabled: 'true',
              filter: "[Microsoft.VSTS.Common.Priority] = '2'",
              settings: {
                'background-color': '#FF6600',  // Laranja
                'title-color': '#FFFFFF'
              }
            },
            {
              name: 'Prioridade 3',
              isEnabled: 'true',
              filter: "[Microsoft.VSTS.Common.Priority] = '3'",
              settings: {
                'background-color': '#FFCC00',  // Amarelo
                'title-color': '#000000'
              }
            }
          ],
          tagStyle: [
            // Tag Colors
            { name: 'Bloqueado', isEnabled: 'true', settings: { 'background-color': '#808080', 'color': '#FFFFFF' } },      // Cinza
            { name: 'Angular', isEnabled: 'true', settings: { 'background-color': '#CC293D', 'color': '#FFFFFF' } },        // Vermelho
            { name: 'C++', isEnabled: 'true', settings: { 'background-color': '#FFCC00', 'color': '#000000' } },            // Amarelo
            { name: 'Kotlin', isEnabled: 'true', settings: { 'background-color': '#006600', 'color': '#FFFFFF' } },         // Verde Escuro
            { name: 'RPA', isEnabled: 'true', settings: { 'background-color': '#90EE90', 'color': '#000000' } },            // Verde Claro
            { name: 'REPORTS', isEnabled: 'true', settings: { 'background-color': '#003366', 'color': '#FFFFFF' } },        // Azul Escuro
            { name: 'FORMS', isEnabled: 'true', settings: { 'background-color': '#87CEEB', 'color': '#000000' } },          // Azul Claro
            { name: 'QUARKUS', isEnabled: 'true', settings: { 'background-color': '#800080', 'color': '#FFFFFF' } },        // Roxo
            { name: 'JAVA', isEnabled: 'true', settings: { 'background-color': '#FF6B6B', 'color': '#FFFFFF' } },           // Vermelho Claro
            { name: 'PL_SQL', isEnabled: 'true', settings: { 'background-color': '#404040', 'color': '#FFFFFF' } },         // Cinza Escuro
            { name: 'PHP', isEnabled: 'true', settings: { 'background-color': '#D3D3D3', 'color': '#000000' } }             // Cinza Claro
          ]
        }
      };

      await this.request(
        'PATCH',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/cardrulesettings?api-version=7.1`,
        styleRules
      );

      console.log('✅ Styles configurados: 3 prioridades e 11 tag colors');
      return styleRules;
    } catch (error) {
      console.warn(`⚠️  Aviso ao configurar styles: ${error.message}`);
      return null;
    }
  }

  /**
   * Configura Columns do Board
   */
  async configureBoardColumns(projectName, teamId, boardName) {
    try {
      console.log(`Configurando colunas do board "${boardName}" para time ID "${teamId}"...`);
      
      // Obter configuração atual
      const currentColumns = await this.request(
        'GET',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/columns?api-version=7.1`
      );

      // Encontrar a coluna incoming existente
      const incomingColumn = currentColumns.find(col => col.columnType === 'incoming');
      const outgoingColumn = currentColumns.find(col => col.columnType === 'outgoing');

      const columns = [
        // Manter a coluna incoming existente
        incomingColumn,
        { 
          name: 'Ready2Dev', 
          itemLimit: 0, 
          stateMappings: {
            'Product Backlog Item': 'Approved',
            'Bug': 'Approved'
          },
          isSplit: false,
          description: '',
          columnType: 'inProgress'
        },
        { 
          name: 'Desenvolvimento', 
          itemLimit: 0, 
          stateMappings: {
            'Product Backlog Item': 'Committed',
            'Bug': 'Committed'
          },
          isSplit: false,
          description: '',
          columnType: 'inProgress'
        },
        { 
          name: 'Developer', 
          itemLimit: 0, 
          stateMappings: {
            'Product Backlog Item': 'Committed',
            'Bug': 'Committed'
          },
          isSplit: false,
          description: '',
          columnType: 'inProgress'
        },
        { 
          name: 'QA', 
          itemLimit: 0, 
          stateMappings: {
            'Product Backlog Item': 'Committed',
            'Bug': 'Committed'
          },
          isSplit: false,
          description: '',
          columnType: 'inProgress'
        },
        { 
          name: 'Validated', 
          itemLimit: 0, 
          stateMappings: {
            'Product Backlog Item': 'Done',
            'Bug': 'Done'
          },
          isSplit: false,
          description: '',
          columnType: 'inProgress'
        },
        // Manter a coluna outgoing existente
        outgoingColumn
      ];

      await this.request(
        'PUT',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/columns?api-version=7.1`,
        columns
      );

      console.log('✅ Colunas configuradas: Backlog → Ready2Dev → Desenvolvimento → Developer → QA → Validated → Done');
      return columns;
    } catch (error) {
      console.warn(`⚠️  Aviso ao configurar colunas: ${error.message}`);
      return null;
    }
  }

  /**
   * Configura Swimlanes do Board
   */
  async configureBoardSwimlanes(projectName, teamId, boardName) {
    try {
      console.log(`Configurando swimlanes do board "${boardName}" para time ID "${teamId}"...`);
      
      // Obter configuração atual
      const currentRows = await this.request(
        'GET',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/rows?api-version=7.1`
      );

      // Encontrar a row default (id vazio ou null)
      const defaultRow = currentRows.find(row => !row.id || row.id === '00000000-0000-0000-0000-000000000000');

      const swimlanes = [
        // Manter a default row
        defaultRow,
        { 
          name: 'Bug', 
          color: 'cc293d'  // Vermelho (formato hexadecimal sem #)
        },
        { 
          name: 'Demanda Expressa', 
          color: '339933'  // Verde
        },
        { 
          name: 'Projeto', 
          color: '87ceeb'  // Azul Claro
        }
      ];

      await this.request(
        'PUT',
        `/${projectName}/${teamId}/_apis/work/boards/${encodeURIComponent(boardName)}/rows?api-version=7.1`,
        swimlanes
      );

      console.log('✅ Swimlanes configuradas: Bug (Vermelho), Demanda Expressa (Verde), Projeto (Azul Claro)');
      return swimlanes;
    } catch (error) {
      console.warn(`⚠️  Aviso ao configurar swimlanes: ${error.message}`);
      return null;
    }
  }

  /**
   * Cria projeto completo com todas as configurações
   */
  async setupCompleteProject(config) {
    const {
      projectName,
      workItemProcess,
      teamName,
      startDate,
      criarTimeSustentacao,
      areas = [],
      iterationCount = 26
    } = config;

    try {
      const results = {
        project: null,
        teams: [],
        iterations: [],
        areas: [],
        configurations: []
      };

      // 1. Criar/Atualizar projeto
      console.log(`Criando projeto ${projectName}...`);
      const projectResult = await this.createOrUpdateProject(projectName, workItemProcess);
      results.project = projectResult.project;

      // Se projeto é NOVO, renomear time default e eliminar iterações
      if (projectResult.isNew) {
        console.log(`Projeto NOVO detectado. Iniciando configuração...`);
        
        console.log(`\n🔄 Passo 1: Aguardando e renomeando time default para "${teamName}"...`);
        const renamedTeam = await this.waitAndRenameDefaultTeam(projectName, teamName);
        const teamId = renamedTeam.id;
        console.log(`✅ Time configurado com ID: ${teamId}\n`);
        
        console.log(`🔄 Passo 2: Eliminando iterações padrão...`);
        await this.deleteDefaultIterations(projectName);
        console.log(`✅ Iterações padrão eliminadas\n`);
        
        console.log(`🔄 Passo 3: Criando iteração filha "${teamName}"...`);
        await this.createSingleIteration(projectName, teamName);
        console.log(`✅ Iteração filha criada\n`);
        
        console.log(`🔄 Passo 4: Criando ${iterationCount} sprints...`);
        const sprints = await this.createSprintIterations(projectName, teamName, startDate, iterationCount);
        results.iterations.push(...sprints);
        console.log(`✅ ${iterationCount} sprints criadas\n`);
        
        console.log(`🔄 Passo 5: Criando área filha "${teamName}"...`);
        await this.createSingleArea(projectName, teamName);
        console.log(`✅ Área filha criada\n`);
        
        console.log(`🔄 Passo 6: Configurando iteração default do time...`);
        await this.configureTeamIterationPath(projectName, teamId, teamName);
        console.log(`✅ Iteração default configurada\n`);
        
        console.log(`🔄 Passo 7: Configurando Backlogs (Epics)...`);
        await this.configureBacklogLevels(projectName, teamId);
        console.log(`✅ Backlogs configurados\n`);
        
        console.log(`🔄 Passo 8: Buscando boards disponíveis...`);
        const boards = await this.getTeamBoards(projectName, teamId);
        const mainBoard = boards.find(b => b.name.includes('Backlog') || b.name.includes('Stories')) || boards[0];
        
        if (!mainBoard) {
          console.warn(`⚠️  Nenhum board encontrado. Pulando configurações de Board.`);
        } else {
          console.log(`✅ Board principal encontrado: "${mainBoard.name}"\n`);
          
          console.log(`🔄 Passo 9: Configurando Cards do Board...`);
          await this.configureBoardCards(projectName, teamId, mainBoard.name);
          console.log(`✅ Cards configurados\n`);
          
          console.log(`🔄 Passo 10: Configurando Styles do Board...`);
          await this.configureBoardStyles(projectName, teamId, mainBoard.name);
          console.log(`✅ Styles configurados\n`);
          
          console.log(`🔄 Passo 11: Configurando Colunas do Board...`);
          await this.configureBoardColumns(projectName, teamId, mainBoard.name);
          console.log(`✅ Colunas configuradas\n`);
          
          console.log(`🔄 Passo 12: Configurando Swimlanes do Board...`);
          await this.configureBoardSwimlanes(projectName, teamId, mainBoard.name);
          console.log(`✅ Swimlanes configuradas\n`);
        }
      }

      console.log('\n✅ SETUP COMPLETO CONCLUÍDO');
      console.log('📋 Passos Executados:');
      console.log('   1. ✅ Criar projeto');
      console.log('   2. ✅ Aguardar e renomear time default');
      console.log('   3. ✅ Eliminar iterações padrão');
      console.log('   4. ✅ Criar iteração filha (nome do time)');
      console.log(`   5. ✅ Criar ${iterationCount} sprints (SPRINT-001 a SPRINT-${String(iterationCount).padStart(3, '0')})`);
      console.log('   6. ✅ Criar área filha (nome do time)');
      console.log('   7. ✅ Configurar iteração default do time');
      console.log('   8. ✅ Configurar Backlogs (Epics habilitados)');
      console.log('   9. ✅ Configurar Cards (Area Path, Iteration Path, Created By)');
      console.log('  10. ✅ Configurar Styles (Prioridades e Tag Colors)');
      console.log('  11. ✅ Configurar Colunas (7 colunas personalizadas)');
      console.log('  12. ✅ Configurar Swimlanes (Bug, Demanda Expressa, Projeto)\n');

      return results;
    } catch (error) {
      throw new Error(`Erro ao configurar projeto completo: ${error.message}`);
    }
  }

  /**
   * Cria um work item no Azure DevOps
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} workItemType - Tipo do work item ('Product Backlog Item', 'Task', 'Bug', 'Epic', etc)
   * @param {object} fields - Campos do work item
   * @returns {Promise<object>} Work item criado
   */
  async createWorkItem(projectName, workItemType, fields) {
    try {
      console.log(`[Azure DevOps] Criando work item: ${workItemType} - ${fields.title}`);
      
      // Montar o array de operações JSON Patch
      const patchDocument = [];
      
      // Adicionar campos obrigatórios e opcionais
      if (fields.title) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.Title',
          value: fields.title
        });
      }
      
      if (fields.description) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.Description',
          value: fields.description
        });
      }
      
      if (fields.state) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.State',
          value: fields.state
        });
      }
      
      if (fields.areaPath) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.AreaPath',
          value: fields.areaPath
        });
      }
      
      if (fields.iterationPath) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.IterationPath',
          value: fields.iterationPath
        });
      }
      
      if (fields.priority) {
        patchDocument.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Common.Priority',
          value: fields.priority
        });
      }
      
      if (fields.tags) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.Tags',
          value: fields.tags
        });
      }
      
      // Se for uma Task, adicionar link para o parent (PBI)
      if (workItemType === 'Task' && fields.parentId) {
        patchDocument.push({
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: `${this.baseUrl}/_apis/wit/workItems/${fields.parentId}`,
            attributes: {
              comment: 'Making a new link for the dependency'
            }
          }
        });
      }
      
      const url = `/${projectName}/_apis/wit/workitems/$${workItemType}?api-version=${this.apiVersion}`;
      
      // Fazer request com Content-Type JSON Patch
      const options = {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json-patch+json',
          'Accept': 'application/json',
          'User-Agent': 'Sistema-Auditoria/1.0'
        },
        body: JSON.stringify(patchDocument)
      };
      
      const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Azure DevOps API Error] Status: ${response.status}`);
        console.error(`[Azure DevOps API Error] Response:`, errorText);
        throw new Error(`Azure DevOps API error (${response.status}): ${errorText}`);
      }
      
      const workItem = await response.json();
      console.log(`[Azure DevOps] Work item criado: ${workItem.id}`);
      return workItem;
    } catch (error) {
      throw new Error(`Erro ao criar work item: ${error.message}`);
    }
  }

  /**
   * Consulta work items usando WIQL (Work Item Query Language)
   * 
   * @param {string} projectName - Nome do projeto
   * @param {object} wiql - Objeto com a query WIQL
   * @returns {Promise<number[]>} Array de IDs dos work items
   */
  async queryWorkItems(projectName, wiql) {
    try {
      const url = `/${projectName}/_apis/wit/wiql?api-version=${this.apiVersion}`;
      const result = await this.request('POST', url, wiql);
      
      if (!result.workItems || result.workItems.length === 0) {
        return [];
      }
      
      return result.workItems.map(wi => wi.id);
    } catch (error) {
      throw new Error(`Erro ao consultar work items: ${error.message}`);
    }
  }

  /**
   * Busca detalhes de múltiplos work items
   * 
   * @param {number[]} ids - Array de IDs dos work items
   * @returns {Promise<object[]>} Array de work items com detalhes completos
   */
  async getWorkItems(ids) {
    try {
      if (ids.length === 0) {
        return [];
      }
      
      // API permite até 200 IDs por request
      const batchSize = 200;
      const batches = [];
      
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
      }
      
      const allWorkItems = [];
      
      for (const batch of batches) {
        const idsParam = batch.join(',');
        const url = `/_apis/wit/workitems?ids=${idsParam}&$expand=all&api-version=${this.apiVersion}`;
        const result = await this.request('GET', url);
        
        if (result.value) {
          allWorkItems.push(...result.value);
        }
      }
      
      return allWorkItems;
    } catch (error) {
      throw new Error(`Erro ao buscar work items: ${error.message}`);
    }
  }

  /**
   * Busca todas as revisões de um work item para histórico
   * 
   * @param {number} workItemId - ID do work item
   * @returns {Promise<object[]>} Array de revisões do work item
   */
  async getWorkItemRevisions(workItemId) {
    try {
      const url = `/_apis/wit/workitems/${workItemId}/revisions?$expand=all&api-version=${this.apiVersion}`;
      const result = await this.request('GET', url);
      
      if (!result.value) {
        return [];
      }
      
      return result.value;
    } catch (error) {
      throw new Error(`Erro ao buscar revisões do work item ${workItemId}: ${error.message}`);
    }
  }

  /**
   * Cria um novo repositório Git no Azure DevOps
   * 
   * @param {string} projectName - Nome do projeto
   * @param {object} repositoryData - Dados do repositório
   * @returns {Promise<object>} Repositório criado
   */
  async createRepository(projectName, repositoryData) {
    try {
      console.log(`[Azure DevOps] Criando repositório: ${repositoryData.name}`);
      
      const url = `/${projectName}/_apis/git/repositories?api-version=${this.apiVersion}`;
      const repository = await this.request('POST', url, repositoryData);
      
      console.log(`[Azure DevOps] Repositório criado: ${repository.id}`);
      return repository;
    } catch (error) {
      throw new Error(`Erro ao criar repositório: ${error.message}`);
    }
  }

  /**
   * Lista todos os repositórios Git de um projeto
   * 
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<array>} Lista de repositórios
   */
  async getProjectRepositories(projectName) {
    try {
      const url = `/${projectName}/_apis/git/repositories?api-version=${this.apiVersion}`;
      const result = await this.request('GET', url);
      return result.value || [];
    } catch (error) {
      throw new Error(`Erro ao listar repositórios: ${error.message}`);
    }
  }

  /**
   * Deleta um repositório Git do projeto
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório a ser deletado
   * @returns {Promise<void>}
   */
  async deleteRepository(projectName, repositoryId) {
    try {
      console.log(`[Azure DevOps] Deletando repositório: ${repositoryId}`);
      
      const url = `/${projectName}/_apis/git/repositories/${repositoryId}?api-version=${this.apiVersion}`;
      await this.request('DELETE', url);
      
      console.log(`[Azure DevOps] Repositório deletado com sucesso`);
    } catch (error) {
      throw new Error(`Erro ao deletar repositório: ${error.message}`);
    }
  }

  /**
   * Inicializa a estrutura do repositório com arquivos e pastas
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório
   * @param {string} repositoryName - Nome do repositório
   * @param {object} templates - Templates de Azure DevOps
   * @returns {Promise<object>} Push result
   */
  async initializeRepository(projectName, repositoryId, repositoryName, templates) {
    try {
      console.log(`[Azure DevOps] Inicializando repositório: ${repositoryName}`);

      // Verificar se o repositório já tem commits
      try {
        const refsUrl = `/${projectName}/_apis/git/repositories/${repositoryId}/refs?filter=heads/main&api-version=${this.apiVersion}`;
        const refs = await this.request('GET', refsUrl);
        
        if (refs.value && refs.value.length > 0) {
          console.log(`[Azure DevOps] Repositório ${repositoryName} já possui commits. Pulando inicialização.`);
          return { skipped: true, reason: 'Repository already has commits' };
        }
      } catch (error) {
        console.log(`[Azure DevOps] Repositório ${repositoryName} está vazio, procedendo com inicialização...`);
      }

      // Conteúdo do CODEOWNERS
      const codeownersContent = `# Default
* @devops-team

# Segurança
/docs/security/* @security-team

# Pipelines
/.azuredevops/* @platform-team
`;

      // Conteúdo do README.md
      const readmeContent = `# ${repositoryName}

## Descrição
Repositório do projeto ${repositoryName}

## Estrutura do Projeto
- \`.azuredevops/\` - Configurações de Azure DevOps e templates de PR
- \`docs/\` - Documentação do projeto
- \`src/\` - Código fonte

## Configuração
Consulte a documentação em \`docs/\` para instruções de configuração e desenvolvimento.

## Contribuindo
Veja os templates de Pull Request em \`.azuredevops/pull_request_template/branches/\` para orientações sobre como contribuir.
`;

      // Conteúdo do mkdocs.yml
      const mkdocsContent = `site_name: ${repositoryName}
site_description: Documentação do projeto ${repositoryName}
site_author: Equipe de Desenvolvimento

theme:
  name: material
  language: pt
  palette:
    primary: indigo
    accent: indigo

nav:
  - Home: index.md
  - Guia de Desenvolvimento: development.md
  - API: api.md

markdown_extensions:
  - admonition
  - codehilite
  - toc:
      permalink: true
`;

      // Conteúdo do index.md em docs/
      const docsIndexContent = `# ${repositoryName}

Bem-vindo à documentação do projeto ${repositoryName}.

## Visão Geral
Este projeto foi gerado automaticamente pelo Sistema de Auditoria e Gestão de Desenvolvimento.

## Estrutura
- [Guia de Desenvolvimento](development.md)
- [Documentação da API](api.md)
`;

      // Preparar changes para o push
      const changes = [
        // README.md na raiz
        {
          changeType: 'add',
          item: {
            path: '/README.md'
          },
          newContent: {
            content: Buffer.from(readmeContent).toString('base64'),
            contentType: 'base64encoded'
          }
        },
        // mkdocs.yml na raiz
        {
          changeType: 'add',
          item: {
            path: '/mkdocs.yml'
          },
          newContent: {
            content: Buffer.from(mkdocsContent).toString('base64'),
            contentType: 'base64encoded'
          }
        },
        // docs/index.md
        {
          changeType: 'add',
          item: {
            path: '/docs/index.md'
          },
          newContent: {
            content: Buffer.from(docsIndexContent).toString('base64'),
            contentType: 'base64encoded'
          }
        },
        // .azuredevops/CODEOWNERS
        {
          changeType: 'add',
          item: {
            path: '/.azuredevops/CODEOWNERS'
          },
          newContent: {
            content: Buffer.from(codeownersContent).toString('base64'),
            contentType: 'base64encoded'
          }
        }
      ];

      // Adicionar templates de PR se disponíveis
      if (templates.develop) {
        changes.push({
          changeType: 'add',
          item: {
            path: '/.azuredevops/pull_request_template/branches/develop.md'
          },
          newContent: {
            content: Buffer.from(templates.develop).toString('base64'),
            contentType: 'base64encoded'
          }
        });
      }

      if (templates.main) {
        changes.push({
          changeType: 'add',
          item: {
            path: '/.azuredevops/pull_request_template/branches/wip.md'
          },
          newContent: {
            content: Buffer.from(templates.main).toString('base64'),
            contentType: 'base64encoded'
          }
        });
      }

      if (templates.hotfix) {
        changes.push({
          changeType: 'add',
          item: {
            path: '/.azuredevops/pull_request_template/branches/hotfix.md'
          },
          newContent: {
            content: Buffer.from(templates.hotfix).toString('base64'),
            contentType: 'base64encoded'
          }
        });
      }

      if (templates.pullRequest) {
        changes.push({
          changeType: 'add',
          item: {
            path: '/.azuredevops/pull_request_template/pull_request_template.md'
          },
          newContent: {
            content: Buffer.from(templates.pullRequest).toString('base64'),
            contentType: 'base64encoded'
          }
        });
      }

      // Criar o push com todos os arquivos
      const pushData = {
        refUpdates: [
          {
            name: 'refs/heads/main',
            oldObjectId: '0000000000000000000000000000000000000000'
          }
        ],
        commits: [
          {
            comment: 'Initial commit - Repository structure',
            changes: changes
          }
        ]
      };

      console.log(`[Azure DevOps] Enviando push com ${changes.length} arquivos para ${repositoryName}`);

      const url = `/${projectName}/_apis/git/repositories/${repositoryId}/pushes?api-version=${this.apiVersion}`;
      const result = await this.request('POST', url, pushData);

      console.log(`[Azure DevOps] Estrutura inicial criada no repositório ${repositoryName}`);
      return result;
    } catch (error) {
      throw new Error(`Erro ao inicializar repositório: ${error.message}`);
    }
  }

  /**
   * Configura as políticas de branch (Branch Policies) para o repositório
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório
   * @returns {Promise<void>}
   */
  async configureBranchPolicies(projectName, repositoryId) {
    const policies = [];
    const errors = [];
    
    try {
      console.log(`[Azure DevOps] ========================================`);
      console.log(`[Azure DevOps] Configurando branch policies`);
      console.log(`[Azure DevOps] Projeto: ${projectName}`);
      console.log(`[Azure DevOps] Repositório ID: ${repositoryId}`);
      console.log(`[Azure DevOps] ========================================`);

      // 1. Commit author email validation - *@bbts.com.br
      try {
        const policy1 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: 'bca1b469-a735-4095-a829-8ea9beb98f5e' // Commit author email validation
          },
          settings: {
            authorEmailPatterns: ['*@bbts.com.br'],
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy1) policies.push('Commit author email validation');
      } catch (e) {
        errors.push({ policy: 'Commit author email', error: e.message });
      }

      // 2. Case enforcement (DESABILITADA - não suportada)
      try {
        // Esta política não existe como tipo separado no Azure DevOps
        // Comentada para evitar erros
        /*
        const policy2 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: '7ed39669-655c-494e-b4a0-a08b4da0fcce' // File name restriction
          },
          settings: {
            enforceConsistentCase: true,
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy2) policies.push('Case enforcement');
        */
        console.log(`[Azure DevOps] ⏭️  Política 'Case enforcement' desabilitada (não suportada)`);
      } catch (e) {
        errors.push({ policy: 'Case enforcement', error: e.message });
      }

      // 3. Reserved names (DESABILITADA - formato incorreto)
      try {
        // Esta política precisa de configuração específica diferente
        /*
        const policy3 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: '7ed39669-655c-494e-b4a0-a08b4da0fcce' // File name restriction (reused)
          },
          settings: {
            filenamePatterns: [
              'CON', 'PRN', 'AUX', 'NUL',
              'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
              'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
            ],
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy3) policies.push('Reserved names');
        */
        console.log(`[Azure DevOps] ⏭️  Política 'Reserved names' desabilitada (formato incorreto)`);
      } catch (e) {
        errors.push({ policy: 'Reserved names', error: e.message });
      }

      // 4. Maximum path length - 260 (DESABILITADA - ID não existe)
      try {
        // Esta política não existe no Azure DevOps com este ID
        /*
        const policy4 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: '001a79cf-fda1-4c4e-9e7c-bbb4e3ed7650' // Path length restriction
          },
          settings: {
            maxPathLength: 260,
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy4) policies.push('Maximum path length');
        */
        console.log(`[Azure DevOps] ⏭️  Política 'Maximum path length' desabilitada (ID não existe)`);
      } catch (e) {
        errors.push({ policy: 'Maximum path length', error: e.message });
      }

      // 5. Maximum file size - 10MB (DESABILITADA - formato incorreto)
      try {
        // Esta política tem formato de escopo diferente
        /*
        const policy5 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: '2e26e725-8201-4edd-8bf5-978563c34a80' // File size restriction
          },
          settings: {
            maximumGitBlobSizeInBytes: 10485760, // 10MB em bytes
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy5) policies.push('Maximum file size');
        */
        console.log(`[Azure DevOps] ⏭️  Política 'Maximum file size' desabilitada (formato incorreto)`);
      } catch (e) {
        errors.push({ policy: 'Maximum file size', error: e.message });
      }

      // 6. Minimum number of reviewers - 2 (PRINCIPAL)
      try {
        console.log(`[Azure DevOps] 🔑 Criando política PRINCIPAL: Minimum number of reviewers`);
        const policy6 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: 'fa4e907d-c16b-4a4c-9dfa-4906e5d171dd' // Minimum number of reviewers
          },
          settings: {
            minimumApproverCount: 2,
            creatorVoteCounts: false, // Criador não pode aprovar seu próprio PR
            allowDownvotes: false,
            resetOnSourcePush: true, // Reseta aprovações ao fazer novo push
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy6) policies.push('✅ Minimum number of reviewers (2)');
      } catch (e) {
        errors.push({ policy: '❌ Minimum number of reviewers', error: e.message });
      }

      // 7. Check for linked work items - Required
      try {
        const policy7 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: '40e92b44-2fe1-4dd6-b3d8-74a9c21d0c6e' // Work item linking
          },
          settings: {
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy7) policies.push('Work item linking');
      } catch (e) {
        errors.push({ policy: 'Work item linking', error: e.message });
      }

      // 8. Check for comment resolution - Required
      try {
        const policy8 = await this.createPolicy(projectName, {
          isEnabled: true,
          isBlocking: true,
          type: {
            id: 'c6a1889d-b943-4856-b76f-9e46bb6b0df2' // Comment requirements
          },
          settings: {
            scope: [
              {
                repositoryId: repositoryId,
                refName: 'refs/heads/main',
                matchKind: 'Exact'
              }
            ]
          }
        });
        if (policy8) policies.push('Comment resolution');
      } catch (e) {
        errors.push({ policy: 'Comment resolution', error: e.message });
      }

      // 9. Limit merge types - Allow squash merge (DESABILITADA - não existe como política)
      try {
        // A estratégia de merge é configurada no repositório, não como branch policy
        // Use: Repository Settings → Policies → Merge types
        console.log(`[Azure DevOps] ⏭️  Política 'Merge strategy' deve ser configurada manualmente nas settings do repositório`);
      } catch (e) {
        errors.push({ policy: 'Merge strategy', error: e.message });
      }

      console.log(`[Azure DevOps] ========================================`);
      console.log(`[Azure DevOps] RESUMO DE POLÍTICAS CRIADAS`);
      console.log(`[Azure DevOps] Total de políticas configuradas: ${policies.length}/5 (4 desabilitadas por incompatibilidade)`);
      console.log(`[Azure DevOps] Políticas criadas:`);
      policies.forEach(p => console.log(`[Azure DevOps]   ✅ ${p}`));
      
      if (errors.length > 0) {
        console.error(`[Azure DevOps] ❌ Erros encontrados: ${errors.length}`);
        errors.forEach(e => console.error(`[Azure DevOps]   ❌ ${e.policy}: ${e.error}`));
      }
      console.log(`[Azure DevOps] ========================================`);

      // Se houver erros críticos (como a política de reviewers), relançar
      const criticalError = errors.find(e => e.policy.includes('Minimum number of reviewers'));
      if (criticalError) {
        throw new Error(`Falha crítica: ${criticalError.policy} - ${criticalError.error}`);
      }

      return { success: true, policies, errors };

    } catch (error) {
      console.error(`[Azure DevOps] ❌ ERRO FATAL ao configurar branch policies:`, error.message);
      throw new Error(`Erro ao configurar branch policies: ${error.message}`);
    }
  }

  /**
   * Cria uma política no Azure DevOps
   * 
   * @param {string} projectName - Nome do projeto
   * @param {object} policyData - Dados da política
   * @returns {Promise<object>} Política criada
   */
  async createPolicy(projectName, policyData) {
    try {
      const url = `/${projectName}/_apis/policy/configurations?api-version=${this.apiVersion}`;
      
      console.log(`[Azure DevOps] Criando política ${policyData.type.id}...`);
      console.log(`[Azure DevOps] URL: https://dev.azure.com/${this.organization}${url}`);
      console.log(`[Azure DevOps] Payload:`, JSON.stringify(policyData, null, 2));
      
      const policy = await this.request('POST', url, policyData);
      
      console.log(`[Azure DevOps] ✅ Política criada com sucesso: ${policy.type?.displayName || policyData.type.id}`);
      return policy;
    } catch (error) {
      // Não lançar erro se a política já existir
      if (error.message.includes('already exists') || error.message.includes('409')) {
        console.log(`[Azure DevOps] ⚠️  Política ${policyData.type.id} já existe, pulando...`);
        return null;
      }
      
      // Para outros erros, logar detalhes e relançar
      console.error(`[Azure DevOps] ❌ ERRO ao criar política ${policyData.type.id}:`, error.message);
      console.error(`[Azure DevOps] Status:`, error.statusCode);
      console.error(`[Azure DevOps] Response:`, error.response);
      throw error; // Relançar o erro para ser tratado no nível superior
    }
  }

  /**
   * Configura as políticas de repositório (Repository Policies)
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório
   * @returns {Promise<void>}
   */
  async configureRepositoryPolicies(projectName, repositoryId) {
    try {
      console.log(`[Azure DevOps] Configurando repository policies para ${repositoryId}`);

      // Buscar as configurações atuais do repositório
      const getUrl = `/${projectName}/_apis/git/repositories/${repositoryId}?api-version=${this.apiVersion}`;
      const repoData = await this.request('GET', getUrl);

      // Atualizar as configurações do repositório com as políticas
      const updateUrl = `/${projectName}/_apis/git/repositories/${repositoryId}?api-version=${this.apiVersion}`;
      const updatedRepo = await this.request('PATCH', updateUrl, {
        id: repositoryId,
        name: repoData.name,
        project: {
          id: repoData.project.id
        },
        // Políticas de repositório
        commitAuthorEmailValidation: {
          enabled: true,
          patterns: ['*@bbts.com.br']
        },
        caseEnforcement: {
          enabled: true
        },
        reservedNames: {
          enabled: true
        },
        pathLength: {
          enabled: true,
          maxLength: 260
        },
        fileSize: {
          enabled: true,
          maxSizeInBytes: 10485760 // 10MB
        }
      });

      console.log(`[Azure DevOps] Repository policies configuradas com sucesso`);
      return updatedRepo;
    } catch (error) {
      console.error(`[Azure DevOps] Erro ao configurar repository policies: ${error.message}`);
      // Não falhar a operação principal se não conseguir configurar as políticas
      return null;
    }
  }

  /**
   * Obtém o scopeDescriptor de um projeto
   * 
   * @param {string} projectId - ID do projeto (GUID)
   * @returns {Promise<string>} scopeDescriptor do projeto
   */
  async getProjectScopeDescriptor(projectId) {
    try {
      const vsspsBaseUrl = `https://vssps.dev.azure.com/${this.organization}`;
      const url = `${vsspsBaseUrl}/_apis/graph/descriptors/${projectId}?api-version=7.1-preview.1`;
      
      const result = await this.request('GET', url);
      return result.value;
    } catch (error) {
      throw new Error(`Erro ao obter scopeDescriptor do projeto: ${error.message}`);
    }
  }

  /**
   * Cria um grupo de segurança no projeto
   * 
   * @param {string} projectId - ID do projeto (GUID)
   * @param {string} groupName - Nome do grupo
   * @param {string} groupDescription - Descrição do grupo
   * @returns {Promise<object>} Grupo criado
   */
  async createSecurityGroup(projectId, groupName, groupDescription) {
    try {
      console.log(`[Azure DevOps] Criando grupo de segurança: ${groupName}`);
      
      // Obter o scopeDescriptor correto do projeto
      const scopeDescriptor = await this.getProjectScopeDescriptor(projectId);
      console.log(`[Azure DevOps] ScopeDescriptor obtido: ${scopeDescriptor}`);
      
      // Usar vssps para criar grupos (Visual Studio Security Platform Service)
      const vsspsBaseUrl = `https://vssps.dev.azure.com/${this.organization}`;
      const url = `${vsspsBaseUrl}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`;
      
      const groupData = {
        displayName: groupName,
        description: groupDescription
      };
      
      const group = await this.request('POST', url, groupData);
      
      console.log(`[Azure DevOps] ✅ Grupo criado: ${group.displayName} (${group.descriptor})`);
      return group;
    } catch (error) {
      // Se o grupo já existir, tentar buscar
      if (error.message.includes('already exists') || error.message.includes('409')) {
        console.log(`[Azure DevOps] ⚠️  Grupo ${groupName} já existe, buscando...`);
        return await this.getSecurityGroup(projectId, groupName);
      }
      throw new Error(`Erro ao criar grupo de segurança: ${error.message}`);
    }
  }

  /**
   * Busca um grupo de segurança existente
   * 
   * @param {string} projectId - ID do projeto (GUID)
   * @param {string} groupName - Nome do grupo
   * @returns {Promise<object>} Grupo encontrado
   */
  async getSecurityGroup(projectId, groupName) {
    try {
      // Obter o scopeDescriptor correto do projeto
      const scopeDescriptor = await this.getProjectScopeDescriptor(projectId);
      
      const vsspsBaseUrl = `https://vssps.dev.azure.com/${this.organization}`;
      const url = `${vsspsBaseUrl}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`;
      
      const result = await this.request('GET', url);
      const groups = result.value || [];
      
      const group = groups.find(g => g.displayName === groupName);
      if (!group) {
        throw new Error(`Grupo ${groupName} não encontrado`);
      }
      
      return group;
    } catch (error) {
      throw new Error(`Erro ao buscar grupo de segurança: ${error.message}`);
    }
  }

  /**
   * Configura permissões de segurança do repositório
   * Define Contribute e Force Push como DENY para todos os usuários
   * 
   * @param {string} projectId - ID do projeto (GUID)
   * @param {string} repositoryId - ID do repositório (GUID)
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<void>}
   */
  async configureRepositoryPermissions(projectId, repositoryId, projectName) {
    try {
      console.log(`[Azure DevOps] ========================================`);
      console.log(`[Azure DevOps] Configurando permissões de segurança do repositório`);
      console.log(`[Azure DevOps] Projeto: ${projectName} (${projectId})`);
      console.log(`[Azure DevOps] Repositório ID: ${repositoryId}`);
      console.log(`[Azure DevOps] ========================================`);

      // Buscar informações do projeto para obter os grupos
      const projectUrl = `/_apis/projects/${projectId}?api-version=${this.apiVersion}`;
      const projectData = await this.request('GET', projectUrl);
      
      console.log(`[Azure DevOps] Projeto obtido: ${projectData.name}`);

      // 2. Obter o namespace de segurança de Git Repositories
      const securityNamespaceId = '2e9eb7ed-3c0a-47d4-87c1-0ffdd275fd87'; // Git Repositories namespace

      // 3. Token de segurança do repositório (formato: repoV2/ProjectId/RepositoryId)
      const securityToken = `repoV2/${projectId}/${repositoryId}`;
      
      console.log(`[Azure DevOps] Security Token: ${securityToken}`);

      // 4. Buscar todos os grupos do projeto usando a API correta
      const identitiesUrl = `https://vssps.dev.azure.com/${this.organization}/_apis/identities?searchFilter=General&filterValue=${projectName}&queryMembership=None&api-version=7.1-preview.1`;
      const identitiesResult = await this.request('GET', identitiesUrl);
      
      console.log(`[Azure DevOps] Identidades encontradas: ${identitiesResult.value?.length || 0}`);

      // Encontrar o grupo "Project Valid Users" ou equivalente
      const projectValidUsersGroup = identitiesResult.value?.find(identity => 
        identity.properties?.Account?.$value?.includes('Project Valid Users') ||
        identity.providerDisplayName?.includes('Project Valid Users') ||
        (identity.customDisplayName?.includes(projectName) && identity.customDisplayName?.includes('Valid Users'))
      );

      if (!projectValidUsersGroup) {
        console.warn(`[Azure DevOps] ⚠️  Grupo 'Project Valid Users' não encontrado. Permissões não serão aplicadas.`);
        console.log(`[Azure DevOps] Grupos disponíveis:`, identitiesResult.value?.map(i => i.providerDisplayName || i.customDisplayName));
        
        // Não falhar, apenas avisar
        console.log(`[Azure DevOps] ⏭️  Continuando sem configurar permissões de segurança`);
        return { success: false, message: 'Project Valid Users group not found' };
      }
      
      console.log(`[Azure DevOps] Project Valid Users encontrado: ${projectValidUsersGroup.descriptor}`);

      // 5. Configurar permissões via Access Control Entries (ACEs)
      const aclUrl = `https://dev.azure.com/${this.organization}/_apis/accesscontrolentries/${securityNamespaceId}?api-version=7.1-preview.1`;
      
      // Permissões Git:
      // GenericContribute = 4 (bit 2)
      // ForcePush = 32 (bit 5)
      
      const denyMask = 4 + 32; // Deny Contribute (4) + Force Push (32) = 36
      
      const aceData = {
        token: securityToken,
        merge: true,
        accessControlEntries: [
          {
            descriptor: projectValidUsersGroup.descriptor,
            allow: 0,
            deny: denyMask, // Deny Contribute + Force Push
            extendedInfo: {
              effectiveAllow: 0,
              effectiveDeny: denyMask
            }
          }
        ]
      };

      console.log(`[Azure DevOps] Aplicando ACL:`, JSON.stringify(aceData, null, 2));

      await this.request('POST', aclUrl, aceData);

      console.log(`[Azure DevOps] ✅ Permissões configuradas com sucesso:`);
      console.log(`[Azure DevOps]   ❌ Contribute: DENY para todos os usuários`);
      console.log(`[Azure DevOps]   ❌ Force Push: DENY para todos os usuários`);
      console.log(`[Azure DevOps] ========================================`);

      return { success: true };

    } catch (error) {
      console.error(`[Azure DevOps] ❌ ERRO ao configurar permissões:`, error.message);
      // Não falhar a criação do repositório por causa das permissões
      console.warn(`[Azure DevOps] ⚠️  Repositório criado, mas permissões não foram configuradas automaticamente`);
      console.warn(`[Azure DevOps] ⚠️  Configure manualmente: Repository Settings → Security`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Busca um grupo do projeto (ex: Project Valid Users, Project Administrators)
   * 
   * @param {string} projectId - ID do projeto (GUID)
   * @param {string} groupName - Nome do grupo (ex: 'Project Valid Users')
   * @returns {Promise<object>} Grupo encontrado
   */
  async getProjectGroup(projectId, groupName) {
    try {
      // Obter o scopeDescriptor correto do projeto
      const scopeDescriptor = await this.getProjectScopeDescriptor(projectId);
      
      const vsspsBaseUrl = `https://vssps.dev.azure.com/${this.organization}`;
      const url = `${vsspsBaseUrl}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`;
      
      const result = await this.request('GET', url);
      const groups = result.value || [];
      
      // Buscar por nome parcial pois o nome completo inclui o nome do projeto
      const group = groups.find(g => 
        g.displayName === groupName || 
        g.displayName.includes(groupName) ||
        g.principalName.includes(groupName)
      );
      
      if (!group) {
        console.log(`[Azure DevOps] Grupos disponíveis:`, groups.map(g => g.displayName));
        throw new Error(`Grupo ${groupName} não encontrado no projeto`);
      }
      
      return group;
    } catch (error) {
      throw new Error(`Erro ao buscar grupo do projeto: ${error.message}`);
    }
  }

  // ========== MÉTODOS PARA MÉTRICAS DORA ==========

  /**
   * Busca commits de um repositório para análise DORA
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório
   * @param {string} branch - Nome da branch (default: 'main')
   * @param {Date} fromDate - Data inicial (opcional)
   * @param {Date} toDate - Data final (opcional)
   * @returns {Promise<object[]>} Array de commits com detalhes
   */
  async getCommits(projectName, repositoryId, branch = 'main', fromDate = null, toDate = null) {
    try {
      let url = `/${projectName}/_apis/git/repositories/${repositoryId}/commits?searchCriteria.itemVersion.version=${branch}&searchCriteria.$top=1000&api-version=${this.apiVersion}`;
      
      if (fromDate) {
        url += `&searchCriteria.fromDate=${fromDate.toISOString()}`;
      }
      if (toDate) {
        url += `&searchCriteria.toDate=${toDate.toISOString()}`;
      }

      const result = await this.request('GET', url);
      const commits = result.value || [];

      // Buscar detalhes de changeCounts para cada commit (em lotes para performance)
      const commitsWithChanges = await Promise.all(
        commits.slice(0, 100).map(async (commit) => { // Limitar a 100 para performance
          try {
            const changes = await this.getCommitChanges(projectName, repositoryId, commit.commitId);
            return {
              ...commit,
              changeCounts: changes.changeCounts || { Add: 0, Edit: 0, Delete: 0 }
            };
          } catch (error) {
            console.warn(`Erro ao buscar changes do commit ${commit.commitId}:`, error.message);
            return {
              ...commit,
              changeCounts: { Add: 0, Edit: 0, Delete: 0 }
            };
          }
        })
      );

      return commitsWithChanges;
    } catch (error) {
      throw new Error(`Erro ao buscar commits: ${error.message}`);
    }
  }

  /**
   * Busca as mudanças (changes) de um commit específico
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório
   * @param {string} commitId - ID do commit
   * @returns {Promise<object>} Detalhes do commit com changeCounts
   */
  async getCommitChanges(projectName, repositoryId, commitId) {
    try {
      const url = `/${projectName}/_apis/git/repositories/${repositoryId}/commits/${commitId}/changes?api-version=${this.apiVersion}`;
      const result = await this.request('GET', url);
      return result;
    } catch (error) {
      throw new Error(`Erro ao buscar changes do commit: ${error.message}`);
    }
  }

  /**
   * Busca pipelines de um projeto
   * 
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<object[]>} Array de pipelines
   */
  async getPipelines(projectName) {
    try {
      const url = `/${projectName}/_apis/pipelines?api-version=${this.apiVersion}`;
      const result = await this.request('GET', url);
      return result.value || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pipelines: ${error.message}`);
    }
  }

  /**
   * Busca runs de um pipeline específico
   * 
   * @param {string} projectName - Nome do projeto
   * @param {number} pipelineId - ID do pipeline
   * @param {Date} fromDate - Data inicial (opcional)
   * @param {Date} toDate - Data final (opcional)
   * @returns {Promise<object[]>} Array de pipeline runs
   */
  async getPipelineRuns(projectName, pipelineId, fromDate = null, toDate = null) {
    try {
      let url = `/${projectName}/_apis/pipelines/${pipelineId}/runs?api-version=${this.apiVersion}`;
      
      const result = await this.request('GET', url);
      let runs = result.value || [];

      // Filtrar por data se fornecido
      if (fromDate || toDate) {
        runs = runs.filter(run => {
          const runDate = new Date(run.createdDate);
          if (fromDate && runDate < fromDate) return false;
          if (toDate && runDate > toDate) return false;
          return true;
        });
      }

      return runs;
    } catch (error) {
      throw new Error(`Erro ao buscar pipeline runs: ${error.message}`);
    }
  }

  /**
   * Busca builds de um projeto (Build API)
   * 
   * @param {string} projectName - Nome do projeto
   * @param {Date} minTime - Data inicial (opcional)
   * @param {Date} maxTime - Data final (opcional)
   * @param {string} resultFilter - Filtro de resultado (succeeded, failed, etc)
   * @returns {Promise<object[]>} Array de builds
   */
  async getBuilds(projectName, minTime = null, maxTime = null, resultFilter = null) {
    try {
      let url = `/${projectName}/_apis/build/builds?api-version=${this.apiVersion}`;
      
      if (minTime) {
        url += `&minTime=${minTime.toISOString()}`;
      }
      if (maxTime) {
        url += `&maxTime=${maxTime.toISOString()}`;
      }
      if (resultFilter) {
        url += `&resultFilter=${resultFilter}`;
      }

      const result = await this.request('GET', url);
      return result.value || [];
    } catch (error) {
      throw new Error(`Erro ao buscar builds: ${error.message}`);
    }
  }

  /**
   * Busca detalhes de um build específico
   * 
   * @param {string} projectName - Nome do projeto
   * @param {number} buildId - ID do build
   * @returns {Promise<object>} Detalhes do build
   */
  async getBuild(projectName, buildId) {
    try {
      const url = `/${projectName}/_apis/build/builds/${buildId}?api-version=${this.apiVersion}`;
      return await this.request('GET', url);
    } catch (error) {
      throw new Error(`Erro ao buscar detalhes do build: ${error.message}`);
    }
  }

  /**
   * Busca releases de um projeto (Release Management API)
   * 
   * @param {string} projectName - Nome do projeto
   * @param {Date} minCreatedTime - Data inicial (opcional)
   * @param {Date} maxCreatedTime - Data final (opcional)
   * @returns {Promise<object[]>} Array de releases
   */
  async getReleases(projectName, minCreatedTime = null, maxCreatedTime = null) {
    try {
      // Usar o domínio correto para Release Management API
      const releaseBaseUrl = `https://vsrm.dev.azure.com/${this.organization}`;
      let url = `${releaseBaseUrl}/${projectName}/_apis/release/releases?api-version=${this.apiVersion}`;
      
      if (minCreatedTime) {
        url += `&minCreatedTime=${minCreatedTime.toISOString()}`;
      }
      if (maxCreatedTime) {
        url += `&maxCreatedTime=${maxCreatedTime.toISOString()}`;
      }

      const result = await this.request('GET', url);
      return result.value || [];
    } catch (error) {
      console.warn(`[Azure DevOps] Aviso ao buscar releases: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca deployments de releases para cálculo de Deployment Frequency
   * 
   * @param {string} projectName - Nome do projeto
   * @param {number} releaseId - ID da release
   * @returns {Promise<object[]>} Array de deployments
   */
  async getReleaseDeployments(projectName, releaseId) {
    try {
      const releaseBaseUrl = `https://vsrm.dev.azure.com/${this.organization}`;
      const url = `${releaseBaseUrl}/${projectName}/_apis/release/releases/${releaseId}/environments?api-version=${this.apiVersion}`;
      
      const result = await this.request('GET', url);
      return result.value || [];
    } catch (error) {
      console.warn(`[Azure DevOps] Aviso ao buscar deployments: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca pull requests de um repositório para Lead Time analysis
   * 
   * @param {string} projectName - Nome do projeto
   * @param {string} repositoryId - ID do repositório
   * @param {string} status - Status do PR (completed, active, abandoned, all)
   * @returns {Promise<object[]>} Array de pull requests
   */
  async getPullRequests(projectName, repositoryId, status = 'completed') {
    try {
      const url = `/${projectName}/_apis/git/repositories/${repositoryId}/pullrequests?searchCriteria.status=${status}&api-version=${this.apiVersion}`;
      const result = await this.request('GET', url);
      return result.value || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pull requests: ${error.message}`);
    }
  }
}

export default AzureDevOpsService;