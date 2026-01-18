# Sincronização Legada - Azure DevOps

## Visão Geral

A funcionalidade de **Sincronização Legada** permite associar aplicações já existentes no sistema com repositórios do Azure DevOps, criando automaticamente registros na tabela `estruturas_projeto` para integração completa com os projetos Azure.

## Objetivo

Permitir que aplicações criadas anteriormente (sem integração com Azure DevOps) sejam sincronizadas com repositórios existentes, possibilitando:

- Rastreabilidade de código
- Gestão de work items
- Integração com pipelines CI/CD
- Métricas DORA e SPACE
- Governança de código

## Acesso

Menu: **Azure → Sincronização Legada**

## Funcionalidades

### 1. Listagem de Sincronizações

Exibe todas as sincronizações realizadas com:
- Aplicação associada (sigla e nome)
- Projeto e Repositório do Azure
- URL do repositório
- Status da sincronização (Pendente, Sincronizado, Erro)
- Mensagens de erro (quando houver)

### 2. Filtros

- **Busca textual**: Filtra por nome da aplicação, projeto ou repositório
- **Filtro de status**: Pendente, Sincronizado, Erro ou Todos
- **Paginação**: 10, 25, 50 ou 100 itens por página

### 3. Nova Sincronização

Permite criar uma nova associação informando:

#### Campos Obrigatórios

- **Aplicação**: Selecione uma aplicação existente no sistema
- **URL do Repositório**: URL completa do repositório no Azure DevOps

#### Formato da URL

```
https://dev.azure.com/{organization}/{project}/_git/{repository}
```

**Exemplo válido:**
```
https://dev.azure.com/horaciovasconcellos/Projeto-Exemplo/_git/backend-api
```

### 4. Processo de Sincronização

Ao confirmar a sincronização, o sistema:

1. **Valida** o formato da URL
2. **Extrai** informações: organização, projeto e repositório
3. **Consulta** o Azure DevOps API para obter detalhes do projeto
4. **Cria registro** na tabela `estruturas_projeto` com:
   - `produto`: Sigla da aplicação
   - `projeto`: Nome do projeto Azure
   - `project_id`: GUID único gerado
   - `work_item_process`: Template do processo (Agile, Scrum, etc.)
   - `data_inicial`: Data/hora da sincronização
   - `iteracao`: 1
   - `incluir_query`: 1
   - `incluir_maven`: 0
   - `incluir_liquibase`: 0
   - `criar_time_sustentacao`: 0
   - `repositorios`: Array vazio `[]`
   - `url_projeto`: URL informada
   - `status`: 'Processado'
   - `aplicacao_base_id`: ID da aplicação
   - `status_repositorio`: 'N'

5. **Registra** sincronização na tabela `sincronizacao_legada`

### 5. Status da Sincronização

#### ✅ Sincronizado (verde)
- Processo concluído com sucesso
- Registro criado em `estruturas_projeto`
- Aplicação pronta para métricas e governança

#### ⚠️ Pendente (amarelo)
- Aguardando processamento
- Pode ocorrer em casos de falhas parciais

#### ❌ Erro (vermelho)
- Falha no processo de sincronização
- Mensagem de erro exibida na listagem
- Causas comuns:
  - URL inválida ou malformada
  - Projeto não encontrado no Azure DevOps
  - Falha de autenticação na API
  - Erro de conexão com o banco de dados

### 6. Exclusão

Permite remover registros de sincronização que:
- Foram criados por engano
- Falharam e precisam ser refeitos
- Não são mais necessários

**⚠️ Atenção**: A exclusão remove apenas o registro de sincronização. O registro em `estruturas_projeto` permanece intacto.

## Estrutura de Dados

### Tabela: `sincronizacao_legada`

```sql
CREATE TABLE sincronizacao_legada (
  id VARCHAR(26) PRIMARY KEY,              -- ULID
  aplicacao_id VARCHAR(36) NOT NULL,       -- FK para aplicacoes
  url_projeto VARCHAR(500) NOT NULL,       -- URL completa do repositório
  projeto_nome VARCHAR(255),               -- Nome do projeto Azure
  repositorio_nome VARCHAR(255),           -- Nome do repositório
  status ENUM('Pendente', 'Sincronizado', 'Erro'),
  mensagem_erro TEXT,                      -- Detalhes em caso de erro
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE
);
```

### Relação com `estruturas_projeto`

Cada sincronização bem-sucedida cria um registro em `estruturas_projeto`:

```sql
INSERT INTO estruturas_projeto (
  projeto,                    -- Nome do projeto Azure
  product,                    -- Sigla da aplicação
  project_id,                 -- GUID único
  work_item_process,          -- Processo (Agile/Scrum)
  url_projeto,                -- URL do repositório
  aplicacao_base_id,          -- ID da aplicação
  status,                     -- 'Processado'
  status_repositorio          -- 'N'
);
```

## API Endpoints

### GET /api/azure/sincronizacao-legada

Lista todas as sincronizações com dados da aplicação associada.

**Response 200:**
```json
[
  {
    "id": "01HQWE7XN8P5G4K2M3R1T0V9Z8",
    "aplicacao_id": "uuid-da-aplicacao",
    "aplicacao_sigla": "SIG",
    "aplicacao_nome": "Sistema Integrado de Gestão",
    "url_projeto": "https://dev.azure.com/org/project/_git/repo",
    "projeto_nome": "project",
    "repositorio_nome": "repo",
    "status": "Sincronizado",
    "mensagem_erro": null,
    "created_at": "2025-01-17T21:30:00Z",
    "updated_at": "2025-01-17T21:30:00Z"
  }
]
```

### POST /api/azure/sincronizar-legado

Cria uma nova sincronização.

**Request Body:**
```json
{
  "aplicacao_id": "uuid-da-aplicacao",
  "url_projeto": "https://dev.azure.com/org/project/_git/repo"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Sincronização realizada com sucesso",
  "data": {
    "id": "01HQWE7XN8P5G4K2M3R1T0V9Z8",
    "project_id": "guid-gerado",
    "projeto": "project",
    "repositorio": "repo",
    "aplicacao": "SIG"
  }
}
```

**Response 400 - URL Inválida:**
```json
{
  "error": "URL inválida",
  "message": "Formato esperado: https://dev.azure.com/{org}/{project}/_git/{repository}"
}
```

**Response 404 - Aplicação não encontrada:**
```json
{
  "error": "Aplicação não encontrada",
  "message": "Aplicação com ID xxx não foi encontrada"
}
```

**Response 500 - Erro Azure DevOps:**
```json
{
  "error": "Erro ao sincronizar",
  "message": "Projeto não encontrado no Azure DevOps"
}
```

### DELETE /api/azure/sincronizacao-legada/:id

Exclui uma sincronização.

**Response 200:**
```json
{
  "success": true,
  "message": "Sincronização excluída com sucesso"
}
```

## Casos de Uso

### 1. Aplicação Legacy sem Repositório Registrado

**Situação**: Sistema antigo sem integração com Azure DevOps

**Solução**:
1. Acesse Sincronização Legada
2. Clique em "Nova Sincronização"
3. Selecione a aplicação
4. Informe a URL do repositório existente
5. Confirme

**Resultado**: Aplicação agora aparece em métricas DORA, pode rastrear work items e integrar com pipelines

### 2. Migração de Sistema de Controle de Versão

**Situação**: Código migrado de SVN/Git On-Premise para Azure DevOps

**Solução**:
1. Migre o código para Azure DevOps
2. Use Sincronização Legada para associar
3. Sistema mantém histórico e ganha recursos cloud

### 3. Aplicação com Múltiplos Repositórios

**Situação**: Aplicação com backend, frontend e mobile em repos separados

**Solução**:
1. Sincronize o repositório principal (backend)
2. Repositórios adicionais podem ser adicionados posteriormente no campo `repositorios` (JSON)

## Diferença: Sincronização Legada vs Gerador de Projetos

| Característica | Sincronização Legada | Gerador de Projetos |
|---|---|---|
| **Objetivo** | Associar aplicação existente | Criar novo projeto completo |
| **Cria projeto Azure** | ❌ Não (usa existente) | ✅ Sim |
| **Cria repositório** | ❌ Não (usa existente) | ✅ Sim |
| **Aplica branch policies** | ❌ Não | ✅ Sim |
| **Estrutura inicial** | ❌ Não | ✅ Sim (README, CODEOWNERS, templates) |
| **Uso** | Projetos já existentes | Novos projetos do zero |

## Requisitos

- Aplicação cadastrada no sistema
- Repositório existente no Azure DevOps
- Acesso configurado via PAT (Personal Access Token)
- Permissões no projeto Azure DevOps

## Logs e Auditoria

Todas as operações são registradas:
- Tentativas de sincronização
- Sucessos e falhas
- Usuário que executou (via logging hook)
- Timestamps de criação e atualização

## Troubleshooting

### Erro: "URL inválida"

**Causa**: Formato da URL não corresponde ao padrão Azure DevOps

**Solução**: Verifique o formato:
```
✅ Correto: https://dev.azure.com/org/project/_git/repo
❌ Errado: https://org.visualstudio.com/project/_git/repo (formato antigo)
❌ Errado: https://github.com/org/repo (plataforma diferente)
```

### Erro: "Projeto não encontrado no Azure DevOps"

**Causa**: 
- Nome do projeto incorreto
- Projeto não existe
- Sem permissão de acesso

**Solução**:
1. Acesse o Azure DevOps manualmente
2. Verifique se o projeto existe
3. Confirme permissões do PAT token

### Sincronização fica "Pendente"

**Causa**: Falha parcial no processo

**Solução**:
1. Verifique logs do backend
2. Tente excluir e refazer
3. Verifique conectividade com banco de dados

## Permissões Necessárias

### Azure DevOps PAT Scopes
- `Code` → Read
- `Project and Team` → Read
- `Work Items` → Read (opcional, para métricas)

### Banco de Dados
- INSERT em `estruturas_projeto`
- INSERT/SELECT/DELETE em `sincronizacao_legada`
- SELECT em `aplicacoes`

## Roadmap Futuro

- [ ] Sincronização em lote (múltiplas aplicações)
- [ ] Auto-detecção de repositórios por organização
- [ ] Suporte a múltiplos repositórios por aplicação
- [ ] Webhook para sincronização automática
- [ ] Validação de acesso antes de sincronizar

---

**Versão**: 1.0  
**Data**: 17/01/2025  
**Autor**: Sistema de Auditoria - CodeWiki
