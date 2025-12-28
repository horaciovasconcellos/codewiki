# Pipeline Database - Reestruturação

## 📋 Resumo das Alterações

Esta reestruturação moderniza o sistema de Pipeline Database para seguir as melhores práticas de CI/CD e alinhamento com padrões de mercado como Azure DevOps, GitHub Actions e GitLab CI.

## 🔄 Mudanças Implementadas

### 1. **Tabela `pipelines` - Novo Bloco de Definições**

A tabela principal foi completamente reestruturada para incluir um **Bloco de Definições** com os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | ID único (gerado automaticamente) |
| `nome` | VARCHAR(100) | Nome da pipeline (máx. 100 caracteres) |
| `extends` | TEXT | Configurações de extensão/herança de templates |
| `jobs` | TEXT | Definição de jobs da pipeline |
| `parameters` | TEXT | Parâmetros configuráveis |
| `pool` | TEXT | Configuração de pool de agentes |
| `pr` | TEXT | Regras de Pull Request |
| `resources` | TEXT | Recursos necessários |
| `schedules` | TEXT | Agendamentos e triggers temporais |
| `stages` | TEXT | Definição de stages |
| `steps` | TEXT | Passos de execução |
| `target` | TEXT | Alvos de deploy |
| `trigger` | TEXT | Gatilhos de execução |
| `variables` | TEXT | Variáveis de ambiente |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

### 2. **Tabelas Associativas para Grupos de Stages**

Foram criadas 6 tabelas associativas para organizar os stages por categoria:

#### **Policy & Governance Stage**
- Tabela: `pipeline_policy_governance_stages`
- Propósito: Estágios de governança, compliance e políticas

#### **Build Stage**
- Tabela: `pipeline_build_stages`
- Propósito: Compilação, build e preparação de artefatos

#### **Security Stage**
- Tabela: `pipeline_security_stages`
- Propósito: Análise de segurança (SAST, DAST, SCA)

#### **Test Stage**
- Tabela: `pipeline_test_stages`
- Propósito: Testes unitários, integração e E2E

#### **Deploy Stage**
- Tabela: `pipeline_deploy_stages`
- Propósito: Deploy para ambientes

#### **Monitor Stage**
- Tabela: `pipeline_monitor_stages`
- Propósito: Monitoramento e observabilidade

Cada tabela associativa possui:
- `id`: Identificador único
- `pipeline_id`: Referência à pipeline
- `stage_id`: Referência ao stage
- `ordem_execucao`: Ordem de execução do stage
- `created_at`: Data de criação

## 🎨 Componentes Atualizados

### **PipelineWizard.tsx**
- Formulário completamente redesenhado
- Campos organizados em grid responsivo
- Todos os campos do Bloco de Definições como `Textarea` para texto livre
- Validação apenas no campo `nome` (obrigatório)
- Interface limpa e intuitiva

### **PipelinesDataTable.tsx**
- Colunas atualizadas para refletir nova estrutura
- Exibição de: Nome, Extends, Jobs, Stages, Trigger, Variables, Data de criação
- Busca por nome, extends e trigger
- Ordenação por nome e data de criação
- Células com truncamento para textos longos

### **types.ts**
- Interface `Pipeline` completamente reestruturada
- Nova interface `PipelineStageAssociation` para associações
- Suporte a arrays de associações por grupo de stage

## 📁 Arquivos Modificados

```
database/
  └── 30-create-pipeline-database.sql          # Schema atualizado
  └── migrations/
      └── migrate-pipeline-database.sql        # Script de migração

src/
  └── lib/
      └── types.ts                              # Tipos atualizados
  └── components/
      └── pipelines/
          ├── PipelineWizard.tsx               # Formulário redesenhado
          └── PipelinesDataTable.tsx           # Tabela atualizada
```

## 🚀 Como Aplicar a Migração

### Opção 1: Via Docker Compose

```bash
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
docker-compose exec db mysql -u root -p audit < database/migrations/migrate-pipeline-database.sql
```

### Opção 2: Recriar o banco completo

```bash
# Parar os containers
docker-compose down

# Remover volumes (ATENÇÃO: apaga os dados)
docker volume prune -f

# Recriar com novo schema
docker-compose up -d
```

### Opção 3: Aplicar manualmente

```bash
# Conectar ao MySQL
docker-compose exec db mysql -u root -p audit

# Executar o script 30-create-pipeline-database.sql atualizado
source /database/30-create-pipeline-database.sql
```

## 📊 Backup

O script de migração cria automaticamente um backup da tabela antiga:
- Tabela de backup: `pipelines_backup_20251227`

## ✅ Verificação

Após a migração, verifique:

```sql
-- Ver estrutura da nova tabela
DESCRIBE pipelines;

-- Contar registros
SELECT COUNT(*) FROM pipelines;

-- Ver tabelas associativas criadas
SHOW TABLES LIKE 'pipeline_%_stages';

-- Verificar backup
SELECT COUNT(*) FROM pipelines_backup_20251227;
```

## 🎯 Próximos Passos

1. **Backend API**: Atualizar endpoints para suportar nova estrutura
2. **Testes**: Criar testes para as novas associações de stages
3. **Documentação**: Documentar uso dos grupos de stages
4. **Validação**: Implementar validação de YAML/JSON nos campos de texto livre

## 📝 Notas Importantes

- ⚠️ A estrutura antiga é **incompatível** com a nova
- ✅ Backup automático é criado durante migração
- 🔄 Componentes frontend já estão atualizados
- 🎨 Interface mais limpa e alinhada com padrões de CI/CD

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verificar logs do Docker: `docker-compose logs app db`
2. Verificar erros no console do navegador
3. Revisar backup antes de aplicar em produção
