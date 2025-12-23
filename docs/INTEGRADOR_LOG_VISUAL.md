# Visualização de Passos de Criação - Azure DevOps Integration

## Visão Geral

A tela do **Integrador** agora possui um **log visual em tempo real** que mostra todos os passos e chamadas às APIs da Microsoft durante a criação de projetos no Azure DevOps.

## Funcionalidades

### 1. Log de Progresso Visual

Quando você clica em "▶️ Criar no Azure DevOps", um painel de log aparece mostrando:

- ✅ **Status de cada etapa** (Pendente, Executando, Concluído, Erro)
- 🕐 **Timestamp** de quando cada passo foi executado
- ⏱️ **Duração** em milissegundos de cada operação
- 📡 **Detalhes da chamada à API** (método, endpoint, payload, resposta)

### 2. Passos Exibidos

#### Passo 1: Validar Configurações
- **API:** `GET /api/configuracoes`
- **Descrição:** Verifica se o Azure DevOps está configurado
- **Valida:** URL da organização e Personal Access Token

#### Passo 2: Criar Projeto
- **API Microsoft:** `POST /_apis/projects?api-version=7.1`
- **Endpoint Completo:** `https://dev.azure.com/{organization}/_apis/projects`
- **Payload:**
  ```json
  {
    "name": "Nome do Projeto",
    "description": "",
    "visibility": "private",
    "capabilities": {
      "versioncontrol": { "sourceControlType": "Git" },
      "processTemplate": { "templateTypeId": "..." }
    }
  }
  ```
- **Resposta:**
  ```json
  {
    "projectId": "guid-do-projeto",
    "projectName": "Nome do Projeto",
    "projectUrl": "https://dev.azure.com/org/Nome%20do%20Projeto"
  }
  ```

#### Passo 3: Criar Time Principal
- **API Microsoft:** `POST /_apis/projects/{project}/teams?api-version=7.1`
- **Payload:**
  ```json
  {
    "name": "Nome do Time"
  }
  ```
- **Resposta:**
  ```json
  {
    "teamsCreated": 1,
    "teamNames": ["Time Principal", "Sustentação"]
  }
  ```

#### Passo 4: Criar Iterações
- **API Microsoft:** `POST /{project}/_apis/wit/classificationnodes/iterations?api-version=7.1`
- **Descrição:** Cria 26 sprints quinzenais ou 24 iterações mensais
- **Resposta:**
  ```json
  {
    "iterationsCreated": 26,
    "sprints": ["Sprint 1", "Sprint 2", "Sprint 3", "..."]
  }
  ```

#### Passo 5: Criar Áreas
- **API Microsoft:** `POST /{project}/_apis/wit/classificationnodes/areas?api-version=7.1`
- **Descrição:** Cria áreas por categoria-tecnologia
- **Resposta:**
  ```json
  {
    "areasCreated": 3,
    "areaNames": ["backend-Java", "frontend-Angular", "mobile-Flutter"]
  }
  ```

#### Passo 6: Configurar Board
- **API Microsoft:** `PATCH /{project}/{team}/_apis/work/teamsettings?api-version=7.1`
- **Descrição:** Configura colunas, swimlanes e card styles
- **Resposta:**
  ```json
  {
    "configurationsApplied": 2
  }
  ```

## Interface do Log

### Estrutura Visual

Cada passo é exibido com:

```
┌─────────────────────────────────────────────────┐
│ 🟢 1. Validar Configurações           ✅ Concluído│
│ Verificando configurações do Azure DevOps        │
│ 15:30:45 • 234ms                                 │
│                                                   │
│ 📡 GET /api/configuracoes                        │
│ ┌───────────────────────────────────────────┐   │
│ │ 📤 Payload (Request Body)                 │   │
│ │ { ... }                                    │   │
│ │                                            │   │
│ │ ✅ Response (Success)                      │   │
│ │ { urlOrganizacao: "...", ... }             │   │
│ │                                            │   │
│ │ 📋 Comando cURL (para reproduzir)         │   │
│ │ curl -X GET ...                            │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Cores dos Status

- **Cinza:** Pendente (ainda não executado)
- **Azul:** Executando (em progresso)
- **Verde:** Concluído (sucesso)
- **Vermelho:** Erro (falha)

### Detalhes Expansíveis

Cada passo possui seções expansíveis (clique para ver):

1. **📤 Payload (Request Body):** Dados enviados na requisição
2. **✅ Response (Success):** Dados retornados pela API
3. **❌ Erro:** Mensagem de erro (se houver)
4. **📋 Comando cURL:** Comando para reproduzir a chamada

## Como Usar

### 1. Criar um Novo Projeto

1. Acesse **Integrador** no menu
2. Clique em **Novo Projeto**
3. Preencha os dados:
   - Produto
   - Projeto
   - Process Template
   - Nome do Time
   - Data Inicial
   - Repositórios (categoria + tecnologia)
4. Clique em **Salvar e Criar no Azure**

### 2. Acompanhar o Progresso

O painel de log aparecerá automaticamente mostrando:

- ⏳ **Em tempo real:** Status de cada passo
- 📊 **Progresso visual:** Barras de progresso coloridas
- 🔍 **Detalhes técnicos:** Payloads e respostas completas

### 3. Criar de um Projeto Existente

1. Encontre o projeto com status **"Pendente"**
2. Clique no botão **▶️ (Play)**
3. O painel de log aparecerá automaticamente

### 4. Depurar Erros

Se ocorrer erro em algum passo:

1. O passo ficará **vermelho**
2. Clique no passo com erro
3. Veja a mensagem de erro detalhada
4. Use o comando **cURL** para reproduzir manualmente
5. Verifique logs no console (F12)

## Exemplos de Chamadas

### Comando cURL - Criar Projeto

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic <BASE64_ENCODED_PAT>" \
  -d '{
    "name": "Projeto Exemplo",
    "description": "",
    "visibility": "private",
    "capabilities": {
      "versioncontrol": { "sourceControlType": "Git" },
      "processTemplate": { "templateTypeId": "adcc42ab-9882-485e-a3ed-7678f01f66bc" }
    }
  }' \
  https://dev.azure.com/{organization}/_apis/projects?api-version=7.1
```

### Comando cURL - Criar Time

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic <BASE64_ENCODED_PAT>" \
  -d '{ "name": "Time Alpha" }' \
  https://dev.azure.com/{organization}/_apis/projects/Projeto%20Exemplo/teams?api-version=7.1
```

### Comando cURL - Criar Iteração

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic <BASE64_ENCODED_PAT>" \
  -d '{
    "name": "Sprint 1",
    "attributes": {
      "startDate": "2024-01-01T00:00:00Z",
      "finishDate": "2024-01-14T23:59:59Z"
    }
  }' \
  https://dev.azure.com/{organization}/Projeto%20Exemplo/_apis/wit/classificationnodes/iterations?api-version=7.1
```

## Debug Avançado

### Console do Navegador

Além do painel visual, todos os logs também vão para o console (F12):

```
═══════════════════════════════════════════════════
🚀 CRIAÇÃO DE PROJETO NO AZURE DEVOPS
═══════════════════════════════════════════════════
Endpoint: /api/azure-devops/setup-project
Organização: sua-organizacao
Projeto: Projeto Exemplo
Process Template: Scrum
Time: Time Alpha
Data Inicial: 2024-01-01
Criar Time Sustentação: true
Áreas/Repositórios: ['backend-Java', 'frontend-Angular']
───────────────────────────────────────────────────
Payload Completo: { ... }
═══════════════════════════════════════════════════
```

### Logs no Banco de Dados

Todos os erros são salvos na tabela `logs_auditoria`:

```sql
SELECT 
  timestamp,
  event_name,
  error_message,
  JSON_EXTRACT(attributes, '$.projeto_nome') as projeto,
  JSON_EXTRACT(attributes, '$.error_details') as detalhes
FROM logs_auditoria
WHERE event_name LIKE '%azure%'
ORDER BY timestamp DESC
LIMIT 10;
```

## Componentes Técnicos

### AzureDevOpsProgressLog.tsx

Componente React que exibe o log de progresso:

```tsx
interface LogStep {
  id: string;
  step: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  timestamp?: Date;
  duration?: number;
  apiCall?: {
    method: string;
    endpoint: string;
    payload?: any;
    response?: any;
    error?: string;
  };
}
```

### IntegradorView.tsx

Gerencia o estado dos steps e atualiza em tempo real:

```tsx
const [progressSteps, setProgressSteps] = useState<LogStep[]>([]);
const [showProgress, setShowProgress] = useState(false);

// Durante criação
steps[0].status = 'running';
setProgressSteps([...steps]);

// Após sucesso
steps[0].status = 'success';
steps[0].duration = Date.now() - startTime;
setProgressSteps([...steps]);
```

## Benefícios

### Para Desenvolvedores

- 🔍 **Transparência total:** Veja exatamente o que está acontecendo
- 🐛 **Debug facilitado:** Identifique rapidamente onde falhou
- 📚 **Aprendizado:** Entenda como as APIs funcionam
- 🔄 **Reproduzibilidade:** Use os comandos cURL para testar

### Para Usuários

- 👀 **Visibilidade:** Saiba o que está sendo criado
- ⏱️ **Tempo estimado:** Veja quanto tempo cada passo leva
- ✅ **Confiança:** Confirme que tudo foi criado corretamente
- 🚨 **Alertas:** Saiba imediatamente se algo deu errado

## Troubleshooting

### Passo fica travado em "Executando"

**Solução:**
1. Aguarde até 60 segundos (timeout)
2. Verifique logs do servidor
3. Verifique se Azure DevOps está acessível

### Erro "Configurações incompletas"

**Solução:**
1. Vá em **Configurações → Azure DevOps**
2. Preencha URL da Organização
3. Preencha Personal Access Token
4. Salve e tente novamente

### Erro "Access Denied"

**Solução:**
1. Verifique se o PAT é válido
2. Verifique permissões do PAT:
   - Project (Full)
   - Team (Full)
   - Work Items (Full)
3. Gere novo PAT se necessário

### Painel não aparece

**Solução:**
1. Atualize a página (F5)
2. Limpe cache do navegador
3. Verifique console (F12) por erros

## Referências

- **Documentação APIs Microsoft:** [learn.microsoft.com/rest/api/azure/devops](https://learn.microsoft.com/en-us/rest/api/azure/devops)
- **Guia Completo:** `/docs/APIS_MICROSOFT_AZURE_DEVOPS.md`
- **Debug:** `/docs/DEBUG_AZURE_DEVOPS.md`
- **Troubleshooting:** `/docs/TROUBLESHOOTING_RUNBOOK.md`
