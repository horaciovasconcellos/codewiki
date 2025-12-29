# Templates de Exemplo - Azure DevOps Pipelines

Este diretório contém templates de exemplo para pipelines do Azure DevOps, prontos para serem carregados através da tela de **Configuração → Integrações**.

## 📁 Arquivos Disponíveis

### Templates YAML (Executáveis)
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `template-pull-request.yml` | Pull Request | Pipeline executável para validação de PRs |
| `template-hotfix.yml` | Hotfix | Pipeline executável para correções urgentes |
| `template-main.yml` | Main | Pipeline executável para branch principal |
| `template-develop.yml` | Develop | Pipeline executável para branch de desenvolvimento |

### Templates Markdown (Documentação)
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `template-pull-request.md` | Pull Request | Documentação do pipeline de PR |

> **Nota**: Os templates Markdown servem como documentação e referência. Para pipelines executáveis, use os templates YAML.

## 🎯 Como Usar

### 1. Personalizar os Templates

Antes de fazer upload, personalize os templates conforme suas necessidades:

- **Variáveis**: Ajuste as variáveis de ambiente
- **Versões**: Configure as versões do Node.js, Docker, etc.
- **Comandos**: Adapte os comandos npm para seu projeto
- **Ambientes**: Configure os environments no Azure DevOps
- **Notificações**: Configure emails/webhooks para notificações

### 2. Carregar na Plataforma

1. Acesse **Menu → Configuração → Integrações**
2. Localize o card **Azure DevOps**
3. Na seção **Templates de Pipeline YAML**
4. Selecione o arquivo correspondente ao tipo
5. Confirme o upload

### 3. Usar no Azure DevOps

Após carregar, você pode:
- Usar como base para novos pipelines
- Referenciar nos seus repositórios
- Adaptar para casos específicos

## 📋 Detalhes dos Templates

### Pull Request Template

**Propósito**: Validar código antes do merge

**Stages**:
1. **Build** - Compila o código
2. **Code Quality** - Análise de qualidade (ESLint, Prettier, TypeScript)
3. **Security** - Scan de segurança
4. **Validation** - Validações finais

**Triggers**:
- PRs para `main`, `develop`, `release/*`
- Não executa em mudanças de docs

### Hotfix Template

**Propósito**: Deploy rápido de correções críticas

**Stages**:
1. **Fast Build** - Build otimizado
2. **Critical Tests** - Apenas testes essenciais
3. **Quick Security** - Validação de segurança crítica
4. **Deploy Staging** - Deploy em staging
5. **Manual Approval** - Aprovação manual obrigatória
6. **Deploy Production** - Deploy em produção
7. **Notification** - Notificações

**Triggers**:
- Branches `hotfix/*`

**Características**:
- Build mais rápido (shallow clone)
- Apenas testes críticos
- Aprovação manual obrigatória
- Backup antes do deploy
- Retenção permanente do build

### Main Template

**Propósito**: Deploy completo em produção

**Stages**:
1. **Build** - Build completo com versionamento
2. **Test** - Testes unitários, integração e E2E
3. **Quality** - Análise completa de qualidade
4. **Security** - Scan completo de segurança
5. **Docker** - Build e push de imagem Docker
6. **Deploy Production** - Deploy com rolling update
7. **Create Release** - Cria tag de release no Git
8. **Notification** - Notificações

**Triggers**:
- Commits na branch `main`

**Características**:
- Build completo
- Suíte completa de testes
- Build de imagem Docker
- Rolling deployment
- Criação automática de tags
- Retenção permanente

### Develop Template

**Propósito**: Deploy contínuo em ambiente de desenvolvimento

**Stages**:
1. **Build** - Build de desenvolvimento
2. **Test** - Testes unitários e integração
3. **Quality** - Análise de qualidade
4. **Security** - Scan de segurança
5. **Docker** - Build de imagem dev
6. **Deploy Dev** - Deploy no ambiente dev
7. **E2E Tests** - Testes E2E no ambiente
8. **Performance** - Testes de performance
9. **Database Migrations** - Migrações de BD
10. **Documentation** - Atualização de docs
11. **Notification** - Notificações

**Triggers**:
- Commits na branch `develop`
- Build agendado (2 AM diariamente)

**Características**:
- Build de desenvolvimento
- Deploy automático
- Testes E2E em ambiente
- Testes de performance
- Migrações automáticas
- Builds noturnos agendados

## 🔧 Personalização Comum

### Variáveis que você deve alterar:

```yaml
variables:
  nodeVersion: '18.x'              # Versão do Node.js
  dockerRegistry: 'myregistry.azurecr.io'  # Seu registry
  imageName: 'seu-app'             # Nome da sua imagem
```

### Comandos npm que você pode precisar ajustar:

```yaml
# Build
npm run build
npm run build:dev
npm run build:prod

# Testes
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run test:smoke
npm run test:critical

# Qualidade
npm run lint
npm run prettier:check
npm run type-check
npm run sonar

# Segurança
npm audit
npm run security:scan
npm run security:check

# Database
npm run migrate:dev
npm run seed:dev

# Docs
npm run docs:generate
npm run docs:build
```

### Environments que você deve criar no Azure DevOps:

1. **development** - Ambiente de desenvolvimento
2. **staging** ou **staging-hotfix** - Ambiente de staging
3. **production** - Ambiente de produção

## 📝 Notas Importantes

### 1. Aprovações Manuais

O template de **Hotfix** inclui aprovação manual. Configure os aprovadores em:
- Azure DevOps → Environments → Production → Approvals

### 2. Service Connections

Configure as conexões de serviço necessárias:
- **AzureContainerRegistry** - Para Docker push
- **AzureServiceConnection** - Para deploy

### 3. Notificações

Os templates incluem placeholders para notificações. Integre com:
- Slack
- Microsoft Teams
- Email
- Webhooks customizados

### 4. Secrets e Variáveis

Configure variáveis secretas no Azure DevOps:
- `Pipeline → Edit → Variables`
- Use grupos de variáveis para compartilhar entre pipelines

### 5. Paths e Filtros

Ajuste os paths de trigger conforme sua estrutura:

```yaml
trigger:
  paths:
    include:
      - src/*
      - package.json
    exclude:
      - docs/*
      - README.md
```

## 🚀 Próximos Passos

1. **Revisar** cada template
2. **Personalizar** variáveis e comandos
3. **Testar** em branch de feature primeiro
4. **Ajustar** conforme feedback
5. **Documentar** customizações específicas

## 📚 Recursos Adicionais

- [Azure DevOps YAML Schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [Pipeline Jobs](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/phases)
- [Deployment Jobs](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/deployment-jobs)
- [Expressions](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/expressions)

## ⚠️ Avisos

- ⚠️ **NÃO** comite credenciais nos templates
- ⚠️ **SEMPRE** use variáveis secretas para dados sensíveis
- ⚠️ **TESTE** em ambiente de dev antes de produção
- ⚠️ **REVISE** os custos de build agents

## 🤝 Contribuindo

Para melhorar estes templates:
1. Teste suas modificações
2. Documente as mudanças
3. Compartilhe com a equipe
4. Mantenha a consistência entre templates

---

**Última atualização**: 29 de dezembro de 2025
