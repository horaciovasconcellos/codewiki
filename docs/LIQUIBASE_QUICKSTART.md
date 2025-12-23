# 🗄️ Database Migration com Maven + Liquibase

## Início Rápido

### 1️⃣ Aplicar Migrations no Banco Local
```bash
# Usando Maven diretamente
mvn liquibase:update

# Ou usando o script helper
./liquibase-manager.sh update
```

### 2️⃣ Ver Status das Migrations
```bash
mvn liquibase:status
# ou
./liquibase-manager.sh status
```

### 3️⃣ Validar Changelogs
```bash
mvn liquibase:validate
# ou
./liquibase-manager.sh validate
```

## 📂 Estrutura

```
.
├── pom.xml                                    # Configuração Maven + Liquibase
├── liquibase.properties                       # Config local (opcional)
├── liquibase-manager.sh                       # Script helper
├── src/main/resources/db/changelog/
│   ├── db.changelog-master.xml               # Changelog principal
│   └── changes/
│       ├── 001-initial-schema.xml            # Schema inicial
│       ├── 002-configuracoes.xml             # Configurações
│       ├── 003-logs-auditoria.xml            # Logs
│       └── 004-integracoes.xml               # Integrações
└── .github/workflows/
    └── liquibase-migration.yml                # CI/CD automático
```

## 🚀 Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `mvn liquibase:update` | Aplica todas migrations pendentes |
| `mvn liquibase:status` | Mostra status das migrations |
| `mvn liquibase:validate` | Valida os changelogs |
| `mvn liquibase:rollback -Dliquibase.rollbackCount=1` | Desfaz 1 changeset |
| `mvn liquibase:clearCheckSums` | Limpa checksums (após editar changelog) |
| `mvn liquibase:dbDoc` | Gera documentação HTML |

## 🎯 Profiles Maven

- **dev** (padrão): `localhost:3306` - Desenvolvimento local
- **ci**: `mysql-master:3306` - CI/CD e Docker
- **prod**: Variáveis de ambiente `$DB_URL`, `$DB_USERNAME`, `$DB_PASSWORD`

```bash
# Usar profile específico
mvn liquibase:update -Pci
mvn liquibase:update -Pprod
```

## 🤖 GitHub Actions

O workflow executa automaticamente quando:
- ✅ Push para `main` ou `develop` (se changelogs mudaram)
- ✅ Pull Request para `main`
- ✅ Execução manual via "Actions" → "Run workflow"

### Execução Manual
1. Acesse **Actions** no GitHub
2. Selecione **Database Migration with Liquibase**
3. Clique em **Run workflow**
4. Escolha:
   - **environment**: dev, ci ou prod
   - **command**: update, validate, status, etc.

## 📝 Criar Nova Migration

### 1. Criar arquivo changelog
```xml
<!-- src/main/resources/db/changelog/changes/005-minha-feature.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="005-01-add-minha-tabela" author="seu-nome">
        <comment>Adiciona tabela X para feature Y</comment>
        <sql>
            CREATE TABLE IF NOT EXISTS minha_tabela (
                id VARCHAR(36) PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        </sql>
        <rollback>
            DROP TABLE IF EXISTS minha_tabela;
        </rollback>
    </changeSet>
</databaseChangeLog>
```

### 2. Incluir no master changelog
```xml
<!-- src/main/resources/db/changelog/db.changelog-master.xml -->
<include file="db/changelog/changes/005-minha-feature.xml" relativeToChangelogFile="false"/>
```

### 3. Aplicar
```bash
mvn liquibase:update
```

## ⏮️ Rollback

```bash
# Desfazer último changeset
mvn liquibase:rollback -Dliquibase.rollbackCount=1

# Desfazer até uma data
mvn liquibase:rollback -Dliquibase.rollbackDate="2025-12-01"

# Criar tag e depois fazer rollback até ela
mvn liquibase:tag -Dliquibase.tag=v1.0
mvn liquibase:rollback -Dliquibase.rollbackTag=v1.0
```

## 🔍 Troubleshooting

### Erro de checksum
```bash
mvn liquibase:clearCheckSums
mvn liquibase:update
```

### Ver histórico de execuções
```sql
SELECT * FROM DATABASECHANGELOG ORDER BY DATEEXECUTED DESC;
```

### Liberar lock travado
```bash
mvn liquibase:releaseLocks
```

## 📚 Documentação Completa

Ver documentação detalhada em: [`docs/LIQUIBASE_DATABASE_MIGRATION.md`](docs/LIQUIBASE_DATABASE_MIGRATION.md)

## 🆘 Suporte

- Documentação oficial: https://docs.liquibase.com/
- Maven Plugin: https://docs.liquibase.com/tools-integrations/maven/home.html
- Logs detalhados: `mvn liquibase:update -X` (debug mode)
