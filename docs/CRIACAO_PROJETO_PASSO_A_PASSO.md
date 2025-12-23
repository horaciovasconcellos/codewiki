# Criação de Projeto no Azure DevOps - Passo a Passo

## Visão Geral

Este documento descreve o processo detalhado de criação de projetos no Azure DevOps através do Integrador.

## Parâmetros de Criação do Projeto

### Mapeamento Integrador → Azure DevOps

| Campo Integrador | Propriedade Azure DevOps | Valor |
|------------------|--------------------------|-------|
| Nome do Projeto | `name` | Nome do Projeto |
| (auto) | `description` | "Projeto criado em DD/MM/YYYY HH:MM:SS pelo programa github-spark" |
| Work Item Process | `capabilities.processTemplate.templateTypeId` | ID do template (Scrum, Agile, Basic, CMMI) |
| (fixo) | `capabilities.processTemplate.detectTeamProject` | `false` |
| (fixo) | `capabilities.versioncontrol.sourceControlType` | `git` |
| (fixo) | `visibility` | `private` |

### Payload de Criação

```json
{
  "name": "Nome do Projeto",
  "description": "Projeto criado em 24/11/2025 14:30:00 pelo programa github-spark",
  "visibility": "private",
  "capabilities": {
    "versioncontrol": {
      "sourceControlType": "git"
    },
    "processTemplate": {
      "templateTypeId": "adcc42ab-9882-485e-a3ed-7678f01f66bc",
      "detectTeamProject": false
    }
  }
}
```

## Fluxo de Criação - Projetos Novos vs Existentes

### Cenário 1: Projeto NOVO

Quando um projeto é criado pela primeira vez:

#### Passo 1: Criar Projeto
```http
POST https://dev.azure.com/{organization}/_apis/projects?api-version=7.1
Content-Type: application/json

{
  "name": "Projeto XYZ",
  "description": "Projeto criado em 24/11/2025 14:30:00 pelo programa github-spark",
  "visibility": "private",
  "capabilities": {
    "versioncontrol": {
      "sourceControlType": "git"
    },
    "processTemplate": {
      "templateTypeId": "adcc42ab-9882-485e-a3ed-7678f01f66bc",
      "detectTeamProject": false
    }
  }
}
```

**Resposta:**
```json
{
  "id": "operation-id-12345",
  "status": "inProgress",
  "url": "https://dev.azure.com/{organization}/_apis/operations/operation-id-12345"
}
```

#### Passo 2: Aguardar Criação Assíncrona
```http
GET https://dev.azure.com/{organization}/_apis/operations/{operationId}?api-version=7.1
```

Polling até `status === "succeeded"` (máximo 30 tentativas, 2s entre cada).

#### Passo 3: Renomear Time Default
O Azure DevOps cria automaticamente um time com o mesmo nome do projeto. Este time precisa ser renomeado para o nome configurado no Integrador.

```http
PATCH https://dev.azure.com/{organization}/_apis/projects/{project}/teams/{project}?api-version=7.1
Content-Type: application/json

{
  "name": "Nome do Time Configurado",
  "description": "Time principal do projeto"
}
```

**Exemplo:**
- Projeto criado: "Projeto XYZ"
- Time default automático: "Projeto XYZ"
- Nome desejado no Integrador: "Squad Desenvolvimento"
- **Ação:** Renomear "Projeto XYZ" → "Squad Desenvolvimento"

#### Passo 4: Eliminar Iterações Padrão
O Azure DevOps cria automaticamente iterações padrão (ex: "Sprint 1", "Sprint 2", etc.). Essas iterações devem ser eliminadas.

```http
GET https://dev.azure.com/{organization}/{project}/_apis/wit/classificationnodes/iterations?$depth=2&api-version=7.1
```

Para cada iteração retornada:
```http
DELETE https://dev.azure.com/{organization}/{project}/_apis/wit/classificationnodes/iterations/{iterationName}?api-version=7.1
```

#### Passo 5: Criar Estrutura Personalizada
Após limpar as iterações padrão, criar a estrutura conforme configuração:
- Iteração raiz do projeto
- Iterações quinzenais ou mensais (dependendo do tipo de time)
- Áreas por categoria/tecnologia
- Configurações de board

### Cenário 2: Projeto EXISTENTE

Quando o projeto já existe no Azure DevOps:

#### Passo 1: Verificar Existência
```http
GET https://dev.azure.com/{organization}/_apis/projects/{projectName}?api-version=7.1
```

Se retornar 200 OK com dados do projeto:
- **Retornar projeto existente**
- **NÃO renomear time** (já está configurado)
- **NÃO eliminar iterações** (estrutura já existe)
- **Pular para configurações adicionais** (se necessário)

## Propriedades Técnicas

### detectTeamProject = false

Esta propriedade impede que o Azure DevOps tente detectar automaticamente estruturas de projeto existentes. 

**Comportamento:**
- `false`: Cria projeto limpo sem tentar importar estruturas
- `true`: Tentaria detectar e importar estruturas de outros projetos

**Por que usar `false`:**
- Controle total sobre a estrutura criada
- Evita conflitos com estruturas existentes
- Garante estado limpo e previsível

### sourceControlType = git

Define o sistema de controle de versão do projeto.

**Opções:**
- `git`: Git (recomendado)
- `tfvc`: Team Foundation Version Control (legado)

### visibility = private

Define a visibilidade do projeto na organização.

**Opções:**
- `private`: Apenas membros autorizados podem ver
- `public`: Visível para todos na organização

## Mapeamento de Process Templates

| Nome no Integrador | Template ID | Descrição |
|-------------------|-------------|-----------|
| Scrum | `adcc42ab-9882-485e-a3ed-7678f01f66bc` | Metodologia Scrum |
| Agile | `27450541-8e31-4150-9947-dc59f998fc01` | Metodologia Agile |
| Basic | `b8a3a935-7e91-48b8-a94c-606d37c3e9f2` | Processo básico simplificado |
| CMMI | `27450541-8e31-4150-9947-dc59f998fc01` | Capability Maturity Model Integration |
| bbtsπdev_Scrum | `adcc42ab-9882-485e-a3ed-7678f01f66bc` | Processo customizado (usa Scrum) |

## Exemplo Completo - Projeto Novo

### 1. Criar Projeto "Sistema de Vendas"

**Request:**
```bash
curl -X POST 'https://dev.azure.com/minhaorg/_apis/projects?api-version=7.1' \
  -H 'Authorization: Basic <PAT_BASE64>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Sistema de Vendas",
    "description": "Projeto criado em 24/11/2025 14:30:00 pelo programa github-spark",
    "visibility": "private",
    "capabilities": {
      "versioncontrol": {
        "sourceControlType": "git"
      },
      "processTemplate": {
        "templateTypeId": "adcc42ab-9882-485e-a3ed-7678f01f66bc",
        "detectTeamProject": false
      }
    }
  }'
```

**Response:**
```json
{
  "id": "abc-123-def",
  "status": "inProgress",
  "url": "https://dev.azure.com/minhaorg/_apis/operations/abc-123-def"
}
```

### 2. Aguardar Criação (polling)

```bash
# Repetir até status = "succeeded"
curl 'https://dev.azure.com/minhaorg/_apis/operations/abc-123-def?api-version=7.1' \
  -H 'Authorization: Basic <PAT_BASE64>'
```

### 3. Renomear Time Default

```bash
# Time default: "Sistema de Vendas" → "Squad Vendas"
curl -X PATCH 'https://dev.azure.com/minhaorg/_apis/projects/Sistema%20de%20Vendas/teams/Sistema%20de%20Vendas?api-version=7.1' \
  -H 'Authorization: Basic <PAT_BASE64>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Squad Vendas",
    "description": "Time principal do projeto"
  }'
```

### 4. Listar e Eliminar Iterações Padrão

```bash
# Listar iterações
curl 'https://dev.azure.com/minhaorg/Sistema%20de%20Vendas/_apis/wit/classificationnodes/iterations?$depth=2&api-version=7.1' \
  -H 'Authorization: Basic <PAT_BASE64>'

# Deletar cada iteração (ex: "Sprint 1")
curl -X DELETE 'https://dev.azure.com/minhaorg/Sistema%20de%20Vendas/_apis/wit/classificationnodes/iterations/Sprint%201?api-version=7.1' \
  -H 'Authorization: Basic <PAT_BASE64>'
```

### 5. Criar Estrutura Personalizada

Agora o projeto está limpo e pronto para receber a estrutura personalizada:
- Iteração raiz: "Sistema de Vendas"
- Iterações quinzenais: "Sprint 01", "Sprint 02", etc.
- Áreas por tecnologia: "Backend-JAVA", "Frontend-React", etc.

## Flags de Controle no Código

### isNew (boolean)

Retornado pelo método `createOrUpdateProject()`:

```javascript
const projectResult = await this.createOrUpdateProject(projectName, workItemProcess);

if (projectResult.isNew) {
  // Projeto acabou de ser criado
  // EXECUTAR: Renomear time + Eliminar iterações
} else {
  // Projeto já existia
  // PULAR: Renomear time + Eliminar iterações
}
```

## Logs de Console

### Projeto Novo
```
[Azure DevOps API] POST https://dev.azure.com/org/_apis/projects?api-version=7.1
[Microsoft API] Criando projeto Sistema de Vendas com template Scrum
[Azure DevOps API] Sucesso: POST /_apis/projects
Projeto NOVO detectado. Renomeando time default para Squad Vendas...
[Azure DevOps API] PATCH https://dev.azure.com/org/_apis/projects/Sistema%20de%20Vendas/teams/Sistema%20de%20Vendas
Eliminando iterações padrão criadas automaticamente...
[Azure DevOps API] GET https://dev.azure.com/org/Sistema%20de%20Vendas/_apis/wit/classificationnodes/iterations
Deletando iteração: Sprint 1
Deletando iteração: Sprint 2
Iterações padrão eliminadas com sucesso
```

### Projeto Existente
```
[Azure DevOps API] GET https://dev.azure.com/org/_apis/projects/Sistema%20de%20Vendas
Projeto Sistema de Vendas já existe. Retornando projeto existente...
Obtendo time Squad Vendas...
[Azure DevOps API] GET https://dev.azure.com/org/_apis/projects/Sistema%20de%20Vendas/teams/Squad%20Vendas
```

## Referências

- [Azure DevOps REST API - Projects](https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects)
- [Azure DevOps REST API - Teams](https://learn.microsoft.com/en-us/rest/api/azure/devops/core/teams)
- [Azure DevOps REST API - Classification Nodes](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/classification-nodes)

## Sumário de Mudanças

✅ **Implementado:**
- Descrição automática com data/hora e "github-spark"
- `detectTeamProject = false`
- `sourceControlType = git`
- `visibility = private`
- Renomeação de time default (somente projetos novos)
- Eliminação de iterações padrão (somente projetos novos)
- Flag `isNew` para controle de fluxo
- Tratamento diferenciado projetos novos vs existentes
