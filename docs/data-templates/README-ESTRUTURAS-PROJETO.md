# Carga de Estruturas de Projeto

Este documento descreve como realizar a carga em lote de estruturas de projeto no Azure DevOps.

## Formatos Suportados

A carga de estruturas de projeto suporta dois formatos:
- **JSON**: Arquivo com array de objetos
- **CSV**: Arquivo com campos separados por vírgula

## Estrutura dos Dados

### Campos Obrigatórios

- `produto` (string): Nome do produto/plataforma (ex: "Azure DevOps")
- `workItemProcess` (string): Tipo de processo do work item (Scrum, Agile, Basic, CMMI)
- `projeto` (string): Nome do projeto a ser criado
- `dataInicial` (date): Data de início do projeto (formato: YYYY-MM-DD)
- `iteracao` (number): Número da iteração inicial
- `nomeTime` (string): Nome do time responsável

### Campos Opcionais (Booleanos)

- `incluirQuery` (boolean): Incluir queries padrão no projeto (default: false)
- `incluirMaven` (boolean): Incluir configuração Maven (default: false)
- `incluirLiquibase` (boolean): Incluir Liquibase para migrations (default: false)
- `criarTimeSustentacao` (boolean): Criar time de sustentação separado (default: false)
- `iteracaoMensal` (boolean): Iterações mensais ao invés de semanais (default: false)

### Campos Opcionais (Outros)

- `numeroSemanas` (number): Número de semanas por iteração (default: 2)
- `status` (enum): Status do projeto ("Pendente" ou "Processado", default: "Pendente")
- `repositorios` (array): Lista de repositórios Git a serem criados
- `patToken` (string): Personal Access Token do Azure DevOps (sensível)
- `urlProjeto` (string): URL do projeto após criação
- `aplicacaoBaseId` (string): ID de aplicação base para referência

### Estrutura de Repositórios

Cada repositório no array deve conter:
```json
{
  "nome": "nome-do-repositorio",
  "tipo": "Git",
  "url": "https://dev.azure.com/organizacao/projeto/_git/repositorio"
}
```

## Formato JSON

### Exemplo Simples

```json
[
  {
    "produto": "Azure DevOps",
    "workItemProcess": "Scrum",
    "projeto": "Meu Projeto",
    "dataInicial": "2025-01-15",
    "iteracao": 1,
    "nomeTime": "Time Desenvolvimento",
    "numeroSemanas": 2
  }
]
```

### Exemplo Completo

```json
[
  {
    "produto": "Azure DevOps",
    "workItemProcess": "Scrum",
    "projeto": "Portal Colaboradores",
    "dataInicial": "2025-01-15",
    "iteracao": 1,
    "incluirQuery": true,
    "incluirMaven": true,
    "incluirLiquibase": true,
    "criarTimeSustentacao": true,
    "repositorios": [
      {
        "nome": "portal-frontend",
        "tipo": "Git",
        "url": "https://dev.azure.com/empresa/projeto/_git/portal-frontend"
      },
      {
        "nome": "portal-backend",
        "tipo": "Git",
        "url": "https://dev.azure.com/empresa/projeto/_git/portal-backend"
      }
    ],
    "nomeTime": "Time Portal",
    "numeroSemanas": 2,
    "iteracaoMensal": false,
    "status": "Pendente"
  }
]
```

## Formato CSV

### Campos

```csv
produto,workItemProcess,projeto,dataInicial,iteracao,incluirQuery,incluirMaven,incluirLiquibase,criarTimeSustentacao,nomeTime,numeroSemanas,iteracaoMensal,status,repositorios
```

### Exemplo

```csv
produto,workItemProcess,projeto,dataInicial,iteracao,incluirQuery,incluirMaven,incluirLiquibase,criarTimeSustentacao,nomeTime,numeroSemanas,iteracaoMensal,status,repositorios
Azure DevOps,Scrum,Portal Colaboradores,2025-01-15,1,true,true,true,true,Time Portal,2,false,Pendente,"[{""nome"":""portal-frontend"",""tipo"":""Git""},{""nome"":""portal-backend"",""tipo"":""Git""}]"
```

**Nota**: No CSV, os repositórios devem ser passados como string JSON escapada.

## Tipos de Work Item Process

Os valores aceitos para `workItemProcess` são:
- **Scrum**: Metodologia Scrum com Sprints, User Stories, Tasks
- **Agile**: Metodologia Ágil com User Stories, Tasks, Features
- **Basic**: Processo básico com Issues e Tasks
- **CMMI**: Capability Maturity Model Integration

## Validações

O sistema valida:
1. Campos obrigatórios presentes
2. Formato de data válido (YYYY-MM-DD)
3. WorkItemProcess válido (Scrum, Agile, Basic, CMMI)
4. Iteração maior que zero
5. Número de semanas entre 1 e 52
6. Status válido (Pendente ou Processado)

## Exemplos de Uso

### 1. Projeto Simples (sem repositórios)

```json
{
  "produto": "Azure DevOps",
  "workItemProcess": "Basic",
  "projeto": "Projeto Teste",
  "dataInicial": "2025-01-20",
  "iteracao": 1,
  "nomeTime": "Time Alpha",
  "numeroSemanas": 1
}
```

### 2. Projeto com Maven e Liquibase

```json
{
  "produto": "Azure DevOps",
  "workItemProcess": "Scrum",
  "projeto": "API Backend",
  "dataInicial": "2025-02-01",
  "iteracao": 1,
  "incluirMaven": true,
  "incluirLiquibase": true,
  "nomeTime": "Time Backend",
  "numeroSemanas": 2,
  "repositorios": [
    {
      "nome": "backend-api",
      "tipo": "Git",
      "url": "https://dev.azure.com/org/projeto/_git/backend-api"
    }
  ]
}
```

### 3. Projeto com Time de Sustentação

```json
{
  "produto": "Azure DevOps",
  "workItemProcess": "Agile",
  "projeto": "Sistema Legado",
  "dataInicial": "2025-01-10",
  "iteracao": 1,
  "criarTimeSustentacao": true,
  "nomeTime": "Time Manutenção",
  "numeroSemanas": 3
}
```

## Arquivos de Exemplo

- `estruturas-projeto-carga.json`: Arquivo JSON com 4 exemplos completos
- `estruturas-projeto.csv`: Arquivo CSV com 6 exemplos

## Processo de Carga

1. Acesse a tela "Carga de Dados"
2. Selecione "Estruturas de Projeto" no dropdown
3. Escolha o arquivo JSON ou CSV
4. Clique em "Processar Carga"
5. O sistema validará e importará os registros
6. Verifique o log de resultados

## Observações

- Os campos booleanos no CSV devem ser `true` ou `false` (minúsculas)
- Datas devem estar no formato ISO: YYYY-MM-DD
- O campo `repositorios` no CSV deve ser uma string JSON válida
- Campos sensíveis como `patToken` não devem ser incluídos em arquivos de carga
- Após a carga, os projetos ficarão com status "Pendente" até serem processados

## Solução de Problemas

### Erro: "Campo obrigatório faltando"
- Verifique se todos os campos obrigatórios estão presentes

### Erro: "Data inválida"
- Certifique-se de usar o formato YYYY-MM-DD

### Erro: "WorkItemProcess inválido"
- Use apenas: Scrum, Agile, Basic ou CMMI

### Erro: "Repositórios mal formatados"
- No CSV, verifique se o JSON está corretamente escapado
- No JSON, verifique a sintaxe do array de objetos
