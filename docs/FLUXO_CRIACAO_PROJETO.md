# Fluxo de Criação de Projeto - Simplificado

## Resumo

Este documento descreve o fluxo **SIMPLIFICADO** de criação de projetos no Azure DevOps, focado apenas nos passos essenciais para evitar erros.

## Passos Implementados

### ✅ Passo 1: Criar Projeto com Configurações Corretas

**Endpoint:** `POST /_apis/projects?api-version=7.1`

**Payload:**
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

**Parâmetros:**
- ✅ `name` = Nome do Projeto
- ✅ `description` = Auto-gerado com data/hora + "github-spark"
- ✅ `visibility` = `"private"`
- ✅ `sourceControlType` = `"git"` (lowercase)
- ✅ `detectTeamProject` = `false`
- ✅ `templateTypeId` = ID do Work Item Process

**Aguardar:** Polling do operation status até `"succeeded"` (máx 30 tentativas, 2s cada)

### ✅ Passo 2: Aguardar Inicialização Completa (NOVO)

**Tempo de espera:** 5 segundos

**Motivo:** O Azure DevOps precisa de tempo para:
- Finalizar a criação do time default
- Criar iterações padrão
- Inicializar estrutura do projeto

```javascript
await new Promise(resolve => setTimeout(resolve, 5000));
```

### ✅ Passo 3: Renomear Time Default

**Endpoint:** `PATCH /_apis/projects/{project}/teams/{project}?api-version=7.1`

**Payload:**
```json
{
  "name": "Nome do Time Configurado",
  "description": "Time principal do projeto"
}
```

**Lógica:**
1. Verificar se time default existe (`GET /_apis/projects/{project}/teams/{project}`)
2. Se existir, renomear para o nome configurado
3. Se não existir, logar aviso e continuar

**Tratamento de Erros:**
- ❌ **ANTES:** Lançava exceção e parava processo
- ✅ **AGORA:** Loga erro e continua (não bloqueia criação)

**Exemplo:**
```
Time Default: "Projeto XYZ"
Nome Config:  "Squad Desenvolvimento"
Resultado:    "Squad Desenvolvimento" ✅
```

### ✅ Passo 4: Eliminar Iterações Padrão

**Endpoint (Listar):** `GET /{project}/_apis/wit/classificationnodes/iterations?$depth=2&api-version=7.1`

**Endpoint (Deletar):** `DELETE /{project}/_apis/wit/classificationnodes/iterations/{name}?api-version=7.1`

**Lógica:**
1. Listar todas as iterações do projeto
2. Para cada iteração encontrada:
   - Tentar deletar
   - Se falhar, logar aviso e continuar
3. Não bloquear processo se houver erros

**Tratamento de Erros:**
- ❌ **ANTES:** Podia falhar se iteração não existisse
- ✅ **AGORA:** Logs detalhados, continua mesmo com erros

**Iterações Deletadas:**
- "Sprint 1"
- "Sprint 2"
- "Sprint 3"
- Qualquer outra iteração padrão criada pelo Azure

## Fluxograma

```
┌─────────────────────────────────────┐
│ 1. Verificar se Projeto Existe     │
└──────────┬──────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
   SIM          NÃO
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────────────────────┐
│ Retornar│  │ 2. Criar Projeto             │
│ Existente│  │    - name                    │
│ isNew=   │  │    - description (auto)      │
│ false    │  │    - visibility=private      │
└─────────┘  │    - sourceControlType=git   │
             │    - detectTeamProject=false │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 3. Aguardar Operação         │
             │    Polling até "succeeded"   │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 4. Retornar Projeto          │
             │    isNew=true                │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 5. Aguardar 5 segundos       │
             │    (Inicialização completa)  │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 6. Renomear Time Default     │
             │    "Projeto" → "Time Config" │
             │    (não bloqueia se falhar)  │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 7. Listar Iterações Padrão   │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 8. Deletar Cada Iteração     │
             │    (não bloqueia se falhar)  │
             └──────────┬───────────────────┘
                        │
                        ▼
             ┌──────────────────────────────┐
             │ 9. Continuar com Estrutura   │
             │    Personalizada             │
             └──────────────────────────────┘
```

## Logs Detalhados

### Console - Projeto Novo

```bash
[Azure DevOps API] POST https://dev.azure.com/org/_apis/projects?api-version=7.1
[Microsoft API] Criando projeto Sistema Vendas com template Scrum
[Azure DevOps API] Sucesso: POST /_apis/projects
[Azure DevOps API] GET https://dev.azure.com/org/_apis/operations/abc-123-def?api-version=7.1
# ... polling até succeeded ...

Projeto NOVO detectado. Aguardando inicialização completa...
# ... aguarda 5 segundos ...

[Rename Team] Tentando renomear time default de "Sistema Vendas" para "Squad Dev"...
[Azure DevOps API] GET https://dev.azure.com/org/_apis/projects/Sistema Vendas/teams/Sistema Vendas
[Azure DevOps API] PATCH https://dev.azure.com/org/_apis/projects/Sistema Vendas/teams/Sistema Vendas
[Rename Team] ✅ Time renomeado com sucesso: "Sistema Vendas" → "Squad Dev"

[Delete Iterations] Listando iterações padrão do projeto "Sistema Vendas"...
[Azure DevOps API] GET https://dev.azure.com/org/Sistema Vendas/_apis/wit/classificationnodes/iterations
[Delete Iterations] Encontradas 3 iterações padrão. Eliminando...
[Delete Iterations] Deletando iteração: "Sprint 1"...
[Azure DevOps API] DELETE https://dev.azure.com/org/Sistema Vendas/_apis/wit/classificationnodes/iterations/Sprint%201
[Delete Iterations] ✅ Iteração "Sprint 1" deletada.
[Delete Iterations] Deletando iteração: "Sprint 2"...
[Azure DevOps API] DELETE https://dev.azure.com/org/Sistema Vendas/_apis/wit/classificationnodes/iterations/Sprint%202
[Delete Iterations] ✅ Iteração "Sprint 2" deletada.
[Delete Iterations] Deletando iteração: "Sprint 3"...
[Azure DevOps API] DELETE https://dev.azure.com/org/Sistema Vendas/_apis/wit/classificationnodes/iterations/Sprint%203
[Delete Iterations] ✅ Iteração "Sprint 3" deletada.
[Delete Iterations] ✅ Processo de eliminação de iterações concluído.
```

### Console - Projeto Existente

```bash
[Azure DevOps API] GET https://dev.azure.com/org/_apis/projects/Sistema Vendas
Projeto Sistema Vendas já existe. Retornando projeto existente...

Obtendo time Squad Dev...
[Azure DevOps API] GET https://dev.azure.com/org/_apis/projects/Sistema Vendas/teams/Squad Dev
```

## Tratamento de Erros - Melhorias

### Renomear Time

**ANTES:**
```javascript
async renameDefaultTeam(projectName, newTeamName) {
  const teamData = { name: newTeamName };
  return await this.request('PATCH', ...); // ❌ Falha se time não existir
}
```

**DEPOIS:**
```javascript
async renameDefaultTeam(projectName, newTeamName) {
  try {
    // Verificar se time existe
    const defaultTeam = await this.getTeam(projectName, projectName);
    if (!defaultTeam) {
      console.warn('Time não encontrado. Pulando renomeação.');
      return null; // ✅ Não bloqueia
    }
    
    const teamData = { name: newTeamName };
    return await this.request('PATCH', ...);
  } catch (error) {
    console.error('Erro ao renomear:', error.message);
    return null; // ✅ Não bloqueia
  }
}
```

### Deletar Iterações

**ANTES:**
```javascript
async deleteDefaultIterations(projectName) {
  const iterations = await this.request('GET', ...);
  
  for (const iteration of iterations.children) {
    await this.request('DELETE', ...); // ❌ Falha para o processo todo
  }
}
```

**DEPOIS:**
```javascript
async deleteDefaultIterations(projectName) {
  try {
    const iterations = await this.request('GET', ...);
    
    if (!iterations?.hasChildren || !iterations.children) {
      console.log('Nenhuma iteração encontrada.');
      return; // ✅ Retorno seguro
    }
    
    for (const iteration of iterations.children) {
      try {
        await this.request('DELETE', encodeURIComponent(iteration.name)); // ✅ Encode
      } catch (error) {
        console.warn('Erro ao deletar:', error.message); // ✅ Continua
      }
    }
  } catch (error) {
    console.warn('Aviso geral:', error.message); // ✅ Não bloqueia
  }
}
```

## Melhorias de Código

| Item | Antes | Depois | Benefício |
|------|-------|--------|-----------|
| **Aguardar inicialização** | ❌ Não tinha | ✅ 5 segundos | Azure finaliza criação do time |
| **Verificar time existe** | ❌ Não verificava | ✅ GET antes de PATCH | Evita erro 404 |
| **Encode URL** | ❌ Nome direto | ✅ `encodeURIComponent()` | Suporta espaços/especiais |
| **Try-catch granular** | ❌ Geral | ✅ Por iteração | Não para todo processo |
| **Logs detalhados** | ⚠️  Básicos | ✅ Com emojis e contexto | Debug mais fácil |
| **Retorno em erro** | ❌ throw | ✅ return null | Processo continua |

## Comandos cURL - Teste Manual

### 1. Criar Projeto
```bash
curl -X POST 'https://dev.azure.com/{org}/_apis/projects?api-version=7.1' \
  -H 'Authorization: Basic {PAT_BASE64}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Teste Manual",
    "description": "Projeto criado em 24/11/2025 15:00:00 pelo programa github-spark",
    "visibility": "private",
    "capabilities": {
      "versioncontrol": {"sourceControlType": "git"},
      "processTemplate": {
        "templateTypeId": "adcc42ab-9882-485e-a3ed-7678f01f66bc",
        "detectTeamProject": false
      }
    }
  }'
```

### 2. Verificar Time Default
```bash
curl 'https://dev.azure.com/{org}/_apis/projects/Teste%20Manual/teams/Teste%20Manual?api-version=7.1' \
  -H 'Authorization: Basic {PAT_BASE64}'
```

### 3. Renomear Time
```bash
curl -X PATCH 'https://dev.azure.com/{org}/_apis/projects/Teste%20Manual/teams/Teste%20Manual?api-version=7.1' \
  -H 'Authorization: Basic {PAT_BASE64}' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Squad Teste", "description": "Time principal do projeto"}'
```

### 4. Listar Iterações
```bash
curl 'https://dev.azure.com/{org}/Teste%20Manual/_apis/wit/classificationnodes/iterations?$depth=2&api-version=7.1' \
  -H 'Authorization: Basic {PAT_BASE64}'
```

### 5. Deletar Iteração
```bash
curl -X DELETE 'https://dev.azure.com/{org}/Teste%20Manual/_apis/wit/classificationnodes/iterations/Sprint%201?api-version=7.1' \
  -H 'Authorization: Basic {PAT_BASE64}'
```

## Verificação de Sucesso

Após a execução, verificar:

1. ✅ Projeto criado com nome correto
2. ✅ Descrição contém data/hora e "github-spark"
3. ✅ Visibilidade = Private
4. ✅ Source Control = Git
5. ✅ Time único com nome configurado (não duplicado)
6. ✅ Sem iterações padrão (Sprint 1, 2, 3, etc.)

## Próximos Passos (Após Este Fluxo)

Após o projeto ser criado, renomeado e limpo:

7. Obter time principal (já renomeado)
8. Criar time SUSTENTACAO (se configurado)
9. Criar iterações personalizadas (quinzenais ou mensais)
10. Criar áreas por categoria/tecnologia
11. Configurar backlog
12. Configurar board

## Resumo Final

**Foco:** Criar projeto limpo e renomeado antes de adicionar estrutura personalizada

**Passos Críticos:**
1. ✅ Criar com `detectTeamProject=false`
2. ✅ Aguardar 5 segundos
3. ✅ Renomear time default (sem bloquear)
4. ✅ Deletar iterações padrão (sem bloquear)

**Diferencial:** Tratamento de erros não-bloqueante - processo continua mesmo com falhas parciais
