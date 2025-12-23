# Configurações de Board - Azure DevOps

## Visão Geral

Este documento detalha todas as configurações automatizadas aplicadas aos boards do Azure DevOps durante a criação de projetos.

## Fluxo de Configuração

```
1. Criar Projeto
   ↓
2. Renomear Time Default
   ↓
3. Eliminar Iterações Padrão
   ↓
4. Criar Iteração Filha
   ↓
5. Criar N Sprints
   ↓
6. Criar Área Filha
   ↓
7. Configurar Iteração Default
   ↓
8. Configurar Backlogs ← Configurações de Board começam aqui
   ↓
9. Configurar Cards
   ↓
10. Configurar Styles
    ↓
11. Configurar Colunas
    ↓
12. Configurar Swimlanes
    ↓
✅ Setup Completo
```

---

## 8. Configurar Backlogs

### Endpoint
```
PATCH /{project}/{teamId}/_apis/work/teamsettings?api-version=7.1
```

### Payload
```json
{
  "backlogVisibilities": {
    "Microsoft.EpicCategory": true,
    "Microsoft.FeatureCategory": true,
    "Microsoft.RequirementCategory": true
  }
}
```

### Resultado
- ✅ Epics visíveis e habilitados
- ✅ Features visíveis e habilitados
- ✅ Product Backlog Items / User Stories habilitados

### Verificação
Acesse: `Boards > Backlogs` → Você verá os níveis: Epics, Features, Stories

---

## 9. Configurar Cards

### Endpoint
```
GET  /{project}/{teamId}/_apis/work/boards/{boardName}/cardsettings?api-version=7.1
PUT  /{project}/{teamId}/_apis/work/boards/{boardName}/cardsettings?api-version=7.1
```

### Estratégia
1. GET - Buscar configuração atual
2. Mesclar com novos campos
3. PUT - Aplicar configuração completa

### Payload
```json
{
  "cards": {
    "Microsoft.VSTS.WorkItemTypes.UserStory": [
      { "displayType": "core", "fieldIdentifier": "System.AreaPath" },
      { "displayType": "core", "fieldIdentifier": "System.IterationPath" },
      { "displayType": "additional", "fieldIdentifier": "System.CreatedBy" },
      { "displayType": "additional", "fieldIdentifier": "System.AssignedTo" },
      { "displayType": "additional", "fieldIdentifier": "System.State" },
      { "displayType": "additional", "fieldIdentifier": "System.Tags" }
    ],
    "Microsoft.VSTS.WorkItemTypes.Bug": [
      { "displayType": "core", "fieldIdentifier": "System.AreaPath" },
      { "displayType": "core", "fieldIdentifier": "System.IterationPath" },
      { "displayType": "additional", "fieldIdentifier": "System.CreatedBy" },
      { "displayType": "additional", "fieldIdentifier": "System.AssignedTo" },
      { "displayType": "additional", "fieldIdentifier": "System.State" },
      { "displayType": "additional", "fieldIdentifier": "System.Tags" }
    ]
  }
}
```

### Campos Configurados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **System.AreaPath** | core | Caminho da área (ex: Projeto\Time\Area) |
| **System.IterationPath** | core | Caminho da iteração (ex: Projeto\Iteration\Sprint-01) |
| **System.CreatedBy** | additional | Quem criou o work item |
| **System.AssignedTo** | additional | Quem está responsável |
| **System.State** | additional | Estado atual (New, Active, Done) |
| **System.Tags** | additional | Tags associadas |

### Resultado Visual

**Antes:**
```
┌─────────────────────┐
│ #123 User Story     │
│ Título da história  │
└─────────────────────┘
```

**Depois:**
```
┌─────────────────────────────────┐
│ #123 User Story                 │
│ Título da história              │
├─────────────────────────────────┤
│ 📁 Area: Frontend/React         │
│ 📅 Sprint: SPRINT-01            │
│ 👤 Created: João Silva          │
│ 👤 Assigned: Maria Santos       │
│ 🏷️  State: Active               │
│ 🏷️  Tags: Angular, C++          │
└─────────────────────────────────┘
```

---

## 10. Configurar Styles

### Endpoint
```
PATCH /{project}/{teamId}/_apis/work/boards/{boardName}/cardrulesettings?api-version=7.1
```

### Payload
```json
{
  "rules": {
    "fill": [
      {
        "name": "Prioridade 1",
        "isEnabled": "true",
        "filter": "[Microsoft.VSTS.Common.Priority] = '1'",
        "settings": {
          "background-color": "#CC293D",
          "title-color": "#FFFFFF"
        }
      },
      {
        "name": "Prioridade 2",
        "isEnabled": "true",
        "filter": "[Microsoft.VSTS.Common.Priority] = '2'",
        "settings": {
          "background-color": "#FF6600",
          "title-color": "#FFFFFF"
        }
      },
      {
        "name": "Prioridade 3",
        "isEnabled": "true",
        "filter": "[Microsoft.VSTS.Common.Priority] = '3'",
        "settings": {
          "background-color": "#FFCC00",
          "title-color": "#000000"
        }
      }
    ],
    "tagStyle": [
      { "name": "Bloqueado", "isEnabled": "true", "settings": { "background-color": "#808080", "color": "#FFFFFF" } },
      { "name": "Angular", "isEnabled": "true", "settings": { "background-color": "#CC293D", "color": "#FFFFFF" } },
      { "name": "C++", "isEnabled": "true", "settings": { "background-color": "#FFCC00", "color": "#000000" } },
      { "name": "Kotlin", "isEnabled": "true", "settings": { "background-color": "#006600", "color": "#FFFFFF" } },
      { "name": "RPA", "isEnabled": "true", "settings": { "background-color": "#90EE90", "color": "#000000" } },
      { "name": "REPORTS", "isEnabled": "true", "settings": { "background-color": "#003366", "color": "#FFFFFF" } },
      { "name": "FORMS", "isEnabled": "true", "settings": { "background-color": "#87CEEB", "color": "#000000" } },
      { "name": "QUARKUS", "isEnabled": "true", "settings": { "background-color": "#800080", "color": "#FFFFFF" } },
      { "name": "JAVA", "isEnabled": "true", "settings": { "background-color": "#FF6B6B", "color": "#FFFFFF" } },
      { "name": "PL_SQL", "isEnabled": "true", "settings": { "background-color": "#404040", "color": "#FFFFFF" } },
      { "name": "PHP", "isEnabled": "true", "settings": { "background-color": "#D3D3D3", "color": "#000000" } }
    ]
  }
}
```

### Prioridades (Fill Rules)

| Prioridade | Cor Fundo | Cor Texto | Hex |
|------------|-----------|-----------|-----|
| 1 | 🔴 Vermelho | Branco | #CC293D |
| 2 | 🟠 Laranja | Branco | #FF6600 |
| 3 | 🟡 Amarelo | Preto | #FFCC00 |

### Tag Colors

| Tag | Cor | Hex | Uso |
|-----|-----|-----|-----|
| Bloqueado | Cinza | #808080 | Work items bloqueados |
| Angular | Vermelho | #CC293D | Tecnologia Angular |
| C++ | Amarelo | #FFCC00 | Tecnologia C++ |
| Kotlin | Verde Escuro | #006600 | Tecnologia Kotlin |
| RPA | Verde Claro | #90EE90 | Automação RPA |
| REPORTS | Azul Escuro | #003366 | Relatórios |
| FORMS | Azul Claro | #87CEEB | Formulários |
| QUARKUS | Roxo | #800080 | Framework Quarkus |
| JAVA | Vermelho Claro | #FF6B6B | Tecnologia Java |
| PL_SQL | Cinza Escuro | #404040 | PL/SQL Oracle |
| PHP | Cinza Claro | #D3D3D3 | Tecnologia PHP |

### Campo Correto de Prioridade

⚠️ **IMPORTANTE**: Use `Microsoft.VSTS.Common.Priority` (não `System.Priority`)

**Errado:**
```json
"filter": "[System.Priority] = '1'"
```

**Correto:**
```json
"filter": "[Microsoft.VSTS.Common.Priority] = '1'"
```

### Resultado Visual

**Cards coloridos por prioridade:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🔴 Prioridade 1 │  │ 🟠 Prioridade 2 │  │ 🟡 Prioridade 3 │
│ User Story #123 │  │ User Story #124 │  │ User Story #125 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Tags coloridas:**
```
┌──────────────────────────────┐
│ User Story #126              │
│ Implementar login            │
├──────────────────────────────┤
│ Tags:                        │
│ [Angular] [JAVA] [REPORTS]   │
│  🔴        🟥      🔵        │
└──────────────────────────────┘
```

---

## 11. Configurar Colunas

### Endpoint
```
GET /{project}/{teamId}/_apis/work/boards/{boardName}/columns?api-version=7.1
PUT /{project}/{teamId}/_apis/work/boards/{boardName}/columns?api-version=7.1
```

### Estratégia
1. GET - Buscar colunas atuais
2. Preservar coluna `incoming` existente
3. Preservar coluna `outgoing` existente
4. Adicionar colunas intermediárias
5. PUT - Aplicar nova configuração

### Payload
```json
[
  {
    "id": "existing-incoming-id",
    "name": "New",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "New",
      "Bug": "New"
    },
    "isSplit": false,
    "description": "",
    "columnType": "incoming"
  },
  {
    "name": "Ready2Dev",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "Approved",
      "Bug": "Approved"
    },
    "isSplit": false,
    "description": "",
    "columnType": "inProgress"
  },
  {
    "name": "Desenvolvimento",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "Committed",
      "Bug": "Committed"
    },
    "isSplit": false,
    "description": "",
    "columnType": "inProgress"
  },
  {
    "name": "Developer",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "Committed",
      "Bug": "Committed"
    },
    "isSplit": false,
    "description": "",
    "columnType": "inProgress"
  },
  {
    "name": "QA",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "Committed",
      "Bug": "Committed"
    },
    "isSplit": false,
    "description": "",
    "columnType": "inProgress"
  },
  {
    "name": "Validated",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "Done",
      "Bug": "Done"
    },
    "isSplit": false,
    "description": "",
    "columnType": "inProgress"
  },
  {
    "id": "existing-outgoing-id",
    "name": "Done",
    "itemLimit": 0,
    "stateMappings": {
      "Product Backlog Item": "Done",
      "Bug": "Done"
    },
    "isSplit": false,
    "description": "",
    "columnType": "outgoing"
  }
]
```

### Colunas Configuradas

| # | Nome | Tipo | State Mapping | WIP Limit |
|---|------|------|---------------|-----------|
| 1 | New/Backlog | incoming | New | 0 (ilimitado) |
| 2 | Ready2Dev | inProgress | Approved | 0 |
| 3 | Desenvolvimento | inProgress | Committed | 0 |
| 4 | Developer | inProgress | Committed | 0 |
| 5 | QA | inProgress | Committed | 0 |
| 6 | Validated | inProgress | Done | 0 |
| 7 | Done | outgoing | Done | 0 |

### Restrições do Azure DevOps

⚠️ **IMPORTANTE:**
- Deve haver **exatamente 1** coluna `incoming`
- Deve haver **exatamente 1** coluna `outgoing`
- **NÃO** pode deletar e recriar a coluna incoming
- **NÃO** pode deletar e recriar a coluna outgoing
- Solução: Preservar IDs das colunas existentes

### Resultado Visual

```
┌──────┬───────────┬────────────────┬───────────┬─────┬───────────┬──────┐
│ New  │ Ready2Dev │ Desenvolvimento│ Developer │ QA  │ Validated │ Done │
├──────┼───────────┼────────────────┼───────────┼─────┼───────────┼──────┤
│ #123 │           │      #125      │   #127    │#128 │           │ #130 │
│ #124 │   #126    │                │           │     │   #129    │ #131 │
└──────┴───────────┴────────────────┴───────────┴─────┴───────────┴──────┘
```

---

## 12. Configurar Swimlanes

### Endpoint
```
GET /{project}/{teamId}/_apis/work/boards/{boardName}/rows?api-version=7.1
PUT /{project}/{teamId}/_apis/work/boards/{boardName}/rows?api-version=7.1
```

### Estratégia
1. GET - Buscar rows atuais
2. Preservar default row (ID vazio ou 00000000-0000-0000-0000-000000000000)
3. Adicionar swimlanes customizadas
4. PUT - Aplicar nova configuração

### Payload
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "name": null,
    "color": null
  },
  {
    "name": "Bug",
    "color": "cc293d"
  },
  {
    "name": "Demanda Expressa",
    "color": "339933"
  },
  {
    "name": "Projeto",
    "color": "87ceeb"
  }
]
```

### Swimlanes Configuradas

| Nome | Cor | Hex | Uso |
|------|-----|-----|-----|
| (default) | - | - | Swimlane padrão obrigatória |
| Bug | 🔴 Vermelho | #cc293d | Correções de bugs |
| Demanda Expressa | 🟢 Verde | #339933 | Demandas urgentes |
| Projeto | 🔵 Azul Claro | #87ceeb | Projetos planejados |

### Restrições do Azure DevOps

⚠️ **IMPORTANTE:**
- Deve haver **exatamente 1** row default (ID vazio)
- Row default **NÃO** pode ter nome ou cor
- Row default deve ser a primeira na lista
- Cores devem ser hexadecimais **sem** o `#`

### Formato de Cor

**Errado:**
```json
"color": "#cc293d"
```

**Correto:**
```json
"color": "cc293d"
```

### Resultado Visual

```
              ┌──────┬───────────┬────────────────┬──────┐
(default)     │      │           │                │      │
              ├──────┼───────────┼────────────────┼──────┤
🔴 Bug        │ #201 │   #202    │                │      │
              ├──────┼───────────┼────────────────┼──────┤
🟢 Demanda    │      │           │      #203      │      │
   Expressa   │      │           │                │      │
              ├──────┼───────────┼────────────────┼──────┤
🔵 Projeto    │ #204 │           │      #205      │ #206 │
              └──────┴───────────┴────────────────┴──────┘
```

---

## Error Handling

### Estratégia de Resiliência

Todas as configurações de Board usam try-catch para **NÃO bloquear** o processo:

```javascript
async configureBoardCards(projectName, teamId, boardName) {
  try {
    // ... código de configuração ...
    console.log('✅ Cards configurados');
    return updatedSettings;
  } catch (error) {
    console.warn(`⚠️  Aviso ao configurar cards: ${error.message}`);
    return null; // ← Não quebra o processo!
  }
}
```

### Comportamento

| Erro em | Resultado |
|---------|-----------|
| Backlogs | ⚠️  Log de aviso, continua |
| Cards | ⚠️  Log de aviso, continua |
| Styles | ⚠️  Log de aviso, continua |
| Colunas | ⚠️  Log de aviso, continua |
| Swimlanes | ⚠️  Log de aviso, continua |

**Benefício:** Projeto é criado com sucesso mesmo se alguma configuração específica de Board falhar.

---

## Métodos HTTP Corretos

| Configuração | Método | Endpoint |
|--------------|--------|----------|
| Backlogs | PATCH | `/teamsettings` |
| Cards | PUT | `/cardsettings` |
| Styles | PATCH | `/cardrulesettings` |
| Colunas | PUT | `/columns` |
| Swimlanes | PUT | `/rows` |

⚠️ **IMPORTANTE:** Usar método errado resulta em **HTTP 405 Method Not Allowed**

---

## Verificação Manual

### 1. Backlogs
```
Azure DevOps → Boards → Backlogs → Configurações (⚙️)
→ Working with bugs → Show bugs on backlogs and boards
→ Backlogs → Epics ✅, Features ✅, Stories ✅
```

### 2. Cards
```
Azure DevOps → Boards → Board → Configurações (⚙️) → Cards
→ Bug, Product Backlog Item
→ Additional fields:
  - Area Path ✅
  - Iteration Path ✅
  - Created By ✅
  - Assigned To ✅
  - State ✅
  - Tags ✅
```

### 3. Styles
```
Azure DevOps → Boards → Board → Configurações (⚙️) → Styles
→ Styling rules:
  - Prioridade 1 (vermelho) ✅
  - Prioridade 2 (laranja) ✅
  - Prioridade 3 (amarelo) ✅
→ Tag colors:
  - Angular (vermelho) ✅
  - JAVA (vermelho claro) ✅
  - etc.
```

### 4. Colunas
```
Azure DevOps → Boards → Board → Configurações (⚙️) → Columns
→ Columns:
  New → Ready2Dev → Desenvolvimento → Developer → QA → Validated → Done ✅
```

### 5. Swimlanes
```
Azure DevOps → Boards → Board → Configurações (⚙️) → Swimlanes
→ Rows:
  - (default) ✅
  - Bug (vermelho) ✅
  - Demanda Expressa (verde) ✅
  - Projeto (azul claro) ✅
```

---

## Troubleshooting

### Erro: "Field identifier System.Title required"

**Causa:** Estrutura incorreta do payload de cards

**Solução:** Usar estrutura `cards[workItemType]` com array de fields

### Erro: "'System.Priority' is not a valid field"

**Causa:** Campo de prioridade incorreto

**Solução:** Usar `Microsoft.VSTS.Common.Priority`

### Erro: "You cannot delete and recreate incoming column"

**Causa:** Tentativa de substituir coluna incoming

**Solução:** Preservar coluna incoming existente (GET primeiro, manter ID)

### Erro: "There must be only one default row"

**Causa:** Tentativa de criar swimlanes sem default row

**Solução:** Preservar default row existente (GET primeiro, incluir na lista)

### Erro: "does not support http method 'PATCH'"

**Causa:** Método HTTP incorreto para cardsettings

**Solução:** Usar PUT para cardsettings, PATCH para cardrulesettings

---

## Logs de Sucesso

```bash
🔄 Passo 8: Configurando Backlogs (Epics)...
✅ Backlogs configurados

🔄 Passo 9: Buscando boards disponíveis...
Board encontrado: "Backlog items" (ID: board-123)
Configurando cards do board "Backlog items"...
✅ Cards configurados com campos adicionais

🔄 Passo 10: Configurando Styles do Board...
✅ Styles configurados: 3 prioridades e 11 tag colors

🔄 Passo 11: Configurando Colunas do Board...
✅ Colunas configuradas: Backlog → Ready2Dev → ... → Done

🔄 Passo 12: Configurando Swimlanes do Board...
✅ Swimlanes configuradas: Bug (Vermelho), Demanda Expressa (Verde), Projeto (Azul Claro)

✅ SETUP COMPLETO CONCLUÍDO
```

---

## Resumo

| Passo | Configuração | Status | Tempo Estimado |
|-------|--------------|--------|----------------|
| 8 | Backlogs | ✅ | ~2s |
| 9 | Cards | ✅ | ~3s |
| 10 | Styles | ✅ | ~2s |
| 11 | Colunas | ✅ | ~3s |
| 12 | Swimlanes | ✅ | ~2s |

**Total:** ~12 segundos para configurar todo o Board

🎯 **Resultado:** Board pronto para uso com todas as configurações aplicadas!
