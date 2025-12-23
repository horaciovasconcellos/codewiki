# Gerenciamento de Banco de Dados com Liquibase

Este projeto utiliza **Liquibase** integrado ao **Maven** para gerenciar migrations de banco de dados de forma versionada e controlada.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Comandos Maven](#comandos-maven)
- [Profiles](#profiles)
- [GitHub Actions](#github-actions)
- [Criando Novos Changelogs](#criando-novos-changelogs)
- [Rollback](#rollback)

## 🔧 Pré-requisitos

- **Java 11** ou superior
- **Maven 3.6+**
- **MySQL 8.0+**
- Banco de dados `auditoria_db` criado

## 📁 Estrutura do Projeto

```
sistema-de-auditoria/
├── pom.xml                                          # Configuração Maven + Liquibase
├── src/main/resources/db/changelog/
│   ├── db.changelog-master.xml                      # Changelog master (ponto de entrada)
│   ├── changes/
│   │   ├── 001-initial-schema.xml                   # Schema inicial
│   │   ├── 002-configuracoes.xml                    # Tabela de configurações
│   │   ├── 003-logs-auditoria.xml                   # Logs e auditoria
│   │   └── 004-integracoes.xml                      # Integrações
│   └── sql/
│       └── *.sql                                     # Scripts SQL separados (se necessário)
└── .github/workflows/
    └── liquibase-migration.yml                       # CI/CD com GitHub Actions
```

## 🚀 Comandos Maven

### Validar changelogs
```bash
mvn liquibase:validate
```

### Aplicar migrations (update)
```bash
mvn liquibase:update
```

### Ver status das migrations
```bash
mvn liquibase:status
```

### Gerar SQL de preview (sem aplicar)
```bash
mvn liquibase:updateSQL
```

### Limpar checksums
```bash
mvn liquibase:clearCheckSums
```

### Fazer rollback de 1 changeset
```bash
mvn liquibase:rollback -Dliquibase.rollbackCount=1
```

### Fazer rollback até uma data
```bash
mvn liquibase:rollback -Dliquibase.rollbackDate=2025-01-01
```

### Fazer rollback até uma tag
```bash
mvn liquibase:rollback -Dliquibase.rollbackTag=v1.0
```

### Gerar documentação do banco
```bash
mvn liquibase:dbDoc -Dliquibase.outputDirectory=target/dbdocs
```

### Gerar diff entre dois bancos
```bash
mvn liquibase:diff
```

## 🎯 Profiles

O projeto possui 3 profiles Maven configurados:

### 1. Profile DEV (padrão)
```bash
mvn liquibase:update -Pdev
```
- **URL**: `jdbc:mysql://localhost:3306/auditoria_db`
- **Usuário**: `root`
- **Senha**: `rootpass123`

### 2. Profile CI (Continuous Integration)
```bash
mvn liquibase:update -Pci
```
- **URL**: `jdbc:mysql://mysql-master:3306/auditoria_db`
- Usado no GitHub Actions e Docker Compose

### 3. Profile PROD (Produção)
```bash
mvn liquibase:update -Pprod
```
- **URL**: Definida via variável de ambiente `DB_URL`
- **Usuário**: Definido via `DB_USERNAME`
- **Senha**: Definida via `DB_PASSWORD`

### Sobrescrever configurações via linha de comando
```bash
mvn liquibase:update \
  -Ddb.url=jdbc:mysql://meu-servidor:3306/meu_banco \
  -Ddb.username=usuario \
  -Ddb.password=senha
```

## 🤖 GitHub Actions

O workflow `.github/workflows/liquibase-migration.yml` executa automaticamente:

### Triggers
- **Push** para `main` ou `develop` (quando arquivos de changelog mudam)
- **Pull Request** para `main`
- **Manual** via workflow_dispatch

### Jobs

#### 1. **liquibase-validation**
- Valida sintaxe dos changelogs
- Verifica estrutura XML

#### 2. **liquibase-update**
- Cria container MySQL temporário
- Executa migrations
- Verifica tabelas criadas
- Gera relatório de status

#### 3. **liquibase-rollback** (manual)
- Permite fazer rollback de changesets
- Apenas via dispatch manual

#### 4. **liquibase-documentation**
- Gera documentação HTML do banco
- Salva como artifact (30 dias)

### Execução Manual

No GitHub:
1. Vá em **Actions** → **Database Migration with Liquibase**
2. Clique em **Run workflow**
3. Escolha:
   - **environment**: `dev`, `ci` ou `prod`
   - **command**: `update`, `status`, `validate`, `rollback-count`, etc.

## 📝 Criando Novos Changelogs

### Estrutura de um Changeset

```xml
<changeSet id="005-01-create-minha-tabela" author="seu-nome">
    <comment>Descrição do que este changeset faz</comment>
    <sql>
        CREATE TABLE IF NOT EXISTS minha_tabela (
            id VARCHAR(36) PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    </sql>
    <rollback>
        DROP TABLE IF EXISTS minha_tabela;
    </rollback>
</changeSet>
```

### Boas Práticas

1. **ID único**: Use formato `NNN-NN-descricao` (ex: `005-01-add-column-email`)
2. **Author**: Identifique quem criou o changeset
3. **Comment**: Descreva o propósito da mudança
4. **Rollback**: Sempre defina como reverter a mudança
5. **Idempotência**: Use `IF NOT EXISTS`, `IF EXISTS`, etc.
6. **Uma mudança por changeset**: Facilita rollback granular

### Adicionar ao Master Changelog

Edite `db.changelog-master.xml`:

```xml
<include file="db/changelog/changes/005-minha-feature.xml" relativeToChangelogFile="false"/>
```

## ⏮️ Rollback

### Rollback de 1 changeset
```bash
mvn liquibase:rollback -Dliquibase.rollbackCount=1
```

### Rollback até uma data específica
```bash
mvn liquibase:rollback -Dliquibase.rollbackDate="2025-12-01 10:00:00"
```

### Rollback até uma tag
```bash
# 1. Criar tag no changeset
mvn liquibase:tag -Dliquibase.tag=v1.0.0

# 2. Fazer rollback até a tag
mvn liquibase:rollback -Dliquibase.rollbackTag=v1.0.0
```

### Ver SQL de rollback (sem aplicar)
```bash
mvn liquibase:rollbackSQL -Dliquibase.rollbackCount=1
```

## 🔍 Troubleshooting

### Erro de checksum
```bash
# Limpar checksums e tentar novamente
mvn liquibase:clearCheckSums
mvn liquibase:update
```

### Ver migrations pendentes
```bash
mvn liquibase:status
```

### Marcar changeset como executado (sem aplicar)
```bash
mvn liquibase:changelogSync
```

### Ver histórico de execuções
```sql
SELECT * FROM DATABASECHANGELOG ORDER BY DATEEXECUTED DESC;
```

### Ver locks ativos
```sql
SELECT * FROM DATABASECHANGELOGLOCK;
```

### Liberar lock manualmente
```bash
mvn liquibase:releaseLocks
```

## 📊 Tabelas de Controle Liquibase

Liquibase cria 2 tabelas automaticamente:

### DATABASECHANGELOG
Registra todos os changesets executados:
- `ID`, `AUTHOR`, `FILENAME`
- `DATEEXECUTED`, `ORDEREXECUTED`
- `MD5SUM` (para detectar alterações)
- `EXECTYPE` (EXECUTED, RERAN, etc.)

### DATABASECHANGELOGLOCK
Controla locks durante execução:
- Previne execuções simultâneas
- Liberado automaticamente após execução

## 🔗 Referências

- [Liquibase Documentation](https://docs.liquibase.com/)
- [Liquibase Maven Plugin](https://docs.liquibase.com/tools-integrations/maven/home.html)
- [Changelog Formats](https://docs.liquibase.com/concepts/changelogs/home.html)
- [Best Practices](https://docs.liquibase.com/concepts/bestpractices.html)

## 📞 Suporte

Em caso de dúvidas:
1. Consulte logs: `mvn liquibase:update -X` (modo debug)
2. Verifique `DATABASECHANGELOG` para histórico
3. Use `liquibase:status` para diagnóstico
