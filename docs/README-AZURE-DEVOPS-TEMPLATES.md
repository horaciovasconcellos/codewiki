# Templates YAML/Markdown do Azure DevOps

## 📋 Visão Geral

O sistema permite o gerenciamento de templates YAML ou Markdown para pipelines do Azure DevOps através da tela de **Configuração de Integrações**. Estes templates servem como base para criação de pipelines de diferentes tipos.

## 🎯 Tipos de Templates

O sistema suporta 4 tipos de templates:

### 1. **Pull Request** (`pullRequest`)
- **Propósito**: Pipelines executados em Pull Requests
- **Triggers**: Executado quando PRs são criados ou atualizados
- **Uso comum**: Build, testes e validações de código

### 2. **Hotfix** (`hotfix`)
- **Propósito**: Pipelines para correções urgentes
- **Triggers**: Executado em branches hotfix/*
- **Uso comum**: Build rápido e deploy direto em produção

### 3. **Main** (`main`)
- **Propósito**: Pipelines da branch principal
- **Triggers**: Executado em commits na branch main
- **Uso comum**: Build completo, testes e deploy em produção

### 4. **Develop** (`develop`)
- **Propósito**: Pipelines da branch de desenvolvimento
- **Triggers**: Executado em commits na branch develop
- **Uso comum**: Build, testes e deploy em ambiente de desenvolvimento

## 🚀 Como Usar

### Upload de Templates

1. Acesse **Configuração → Integrações**
2. Localize o bloco **Azure DevOps**
3. Na seção **Templates de Pipeline YAML**, selecione o tipo desejado
4. Clique em "Escolher arquivo" e selecione um arquivo `.yaml` ou `.yml`
5. O template será automaticamente enviado e salvo no banco de dados

### Restrições

- **Formato**: Apenas arquivos `.yaml`, `.yml` ou `.md`
- **Tamanho máximo**: 500KB
- **Validação**: O arquivo não pode estar vazio

### Visualização

Após o upload bem-sucedido:
- O nome do arquivo é exibido com um ícone de confirmação (✓)
- A cor verde indica que o template foi carregado com sucesso

## 📊 Estrutura do Banco de Dados

Os templates são armazenados na tabela `azure_devops_templates`:

```sql
CREATE TABLE azure_devops_templates (
    id CHAR(36) NOT NULL PRIMARY KEY,
    template_type VARCHAR(50) NOT NULL UNIQUE,
    template_content MEDIUMTEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔌 Endpoints da API

### POST /api/azure-devops/templates
Upload de um novo template ou atualização de existente.

**Body (multipart/form-data)**:
- `file`: Arquivo YAML
- `templateType`: Tipo do template (pullRequest, hotfix, main, develop)

**Resposta**:
```json
{
  "success": true,
  "message": "Template salvo com sucesso",
  "data": {
    "templateType": "pullRequest",
    "fileName": "template-pr.yml",
    "size": 1024
  }
}
```

### GET /api/azure-devops/templates
Lista todos os templates cadastrados.

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "template_type": "pullRequest",
      "file_name": "template-pr.yml",
      "content_size": 1024,
      "created_at": "2025-12-29T10:00:00Z",
      "updated_at": "2025-12-29T10:00:00Z"
    }
  ]
}
```

### GET /api/azure-devops/templates/:templateType
Busca um template específico por tipo.

**Parâmetros**:
- `templateType`: pullRequest, hotfix, main ou develop

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "template_type": "pullRequest",
    "template_content": "trigger: none\npr:\n  branches:...",
    "file_name": "template-pr.yml",
    "created_at": "2025-12-29T10:00:00Z",
    "updated_at": "2025-12-29T10:00:00Z"
  }
}
```

### DELETE /api/azure-devops/templates/:templateType
Remove um template específico.

**Parâmetros**:
- `templateType`: pullRequest, hotfix, main ou develop

**Resposta**:
```json
{
  "success": true,
  "message": "Template deletado com sucesso"
}
```

## 📝 Exemplo de Template YAML

```yaml
# Template de Pipeline para Pull Request
trigger: none

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildJob
        displayName: 'Build Job'
        steps:
          - script: echo "Building pull request..."
            displayName: 'Build'
          
          - script: npm install
            displayName: 'Install Dependencies'
          
          - script: npm test
            displayName: 'Run Tests'

  - stage: Validation
    displayName: 'Validation Stage'
    dependsOn: Build
    jobs:
      - job: ValidationJob
        displayName: 'Validation Job'
        steps:
          - script: npm run lint
            displayName: 'Lint Code'
          
          - script: npm run security-check
            displayName: 'Security Check'
```

## 📝 Exemplo de Template Markdown

```markdown
# Template de Pipeline - Pull Request

## Descrição
Este template é usado para validar Pull Requests antes do merge.

## Etapas do Pipeline

### 1. Build
- Instalar dependências
- Compilar o código
- Executar testes unitários

### 2. Validação
- Análise de qualidade (ESLint)
- Verificação de segurança
- Validação de cobertura de testes

## Variáveis Necessárias
- `NODE_VERSION`: Versão do Node.js
- `BUILD_CONFIGURATION`: Tipo de build (Debug/Release)

## Triggers
- Pull Requests para `main` e `develop`
- Exclui alterações em `docs/` e `README.md`
```

## 🔄 Atualização de Templates

Para atualizar um template existente:
1. Faça upload de um novo arquivo do mesmo tipo
2. O sistema automaticamente substitui o template anterior
3. A data de `updated_at` é atualizada

## 📝 Uso de Templates Markdown

Templates Markdown são úteis para:

### Documentação
- Documentar o propósito e comportamento de pipelines
- Especificar variáveis e configurações necessárias
- Listar pré-requisitos e dependências

### Configurações Legadas
- Manter templates de configurações antigas
- Documentar migrações de pipelines
- Arquivar versões anteriores

### Guias de Referência
- Criar guias de uso para desenvolvedores
- Documentar melhores práticas
- Exemplos e casos de uso

## ⚠️ Validações

O sistema realiza as seguintes validações:

### No Frontend
- Tipo de arquivo (apenas .yaml ou .yml)
- Tamanho máximo (500KB)
- Arquivo não vazio

### No Backend
- Validação do tipo de template
- Validação do conteúdo YAML
- Verificação de duplicatas

### Mensagens de Erro

| Erro | Descrição |
|------|-----------|
| `NO_FILE` | Nenhum arquivo foi fornecido |
| `NO_TEMPLATE_TYPE` | Tipo de template não especificado |
| `INVALID_TEMPLATE_TYPE` | Tipo de template inválido |
| `EMPTY_FILE` | Arquivo YAML está vazio |
| `TEMPLATE_NOT_FOUND` | Template não encontrado |

## 🔐 Segurança

- Validação de tipos de arquivo no upload
- Limite de tamanho para prevenir ataques
- Sanitização de conteúdo YAML
- Armazenamento seguro no banco de dados

## 📊 Logs

O sistema registra as seguintes ações:
- Upload de templates
- Atualização de templates
- Deleção de templates
- Erros de validação

## 🎨 Interface do Usuário

A interface foi desenvolvida com:
- **React** + **TypeScript**
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **Phosphor Icons** para ícones
- **Sonner** para notificações toast

## 📚 Referências

- [Azure DevOps YAML Schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [Pipeline Triggers](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers)
- [YAML Best Practices](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)

## 🤝 Contribuindo

Para adicionar novos tipos de templates:

1. Atualize o array `validTypes` nos endpoints da API
2. Adicione o novo tipo na interface do usuário
3. Crie os estados necessários no componente
4. Adicione documentação para o novo tipo

## 📄 Licença

Este recurso faz parte do Sistema de Auditoria e segue a mesma licença do projeto principal.
