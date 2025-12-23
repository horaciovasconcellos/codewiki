# Limpeza para Produção - Sistema de Auditoria

## 📋 Checklist de Limpeza

### ✅ Arquivos para MANTER em Produção

#### Essenciais
- ✅ `package.json` e `package-lock.json`
- ✅ `pom.xml` (Liquibase/Maven)
- ✅ `Dockerfile` e `docker-compose.yml`
- ✅ `vite.config.ts` e `tsconfig.json`
- ✅ `tailwind.config.js`
- ✅ `components.json`
- ✅ `index.html`
- ✅ `.dockerignore` e `.gitignore`

#### Código Fonte
- ✅ `src/` - Todo o código React/TypeScript
- ✅ `server/` - API Express.js
- ✅ `public/` - Assets estáticos

#### Database
- ✅ `database/01-init-schema-data.sql`
- ✅ `database/init-master.sql`
- ✅ `database/master.cnf` e `slave.cnf`
- ✅ `database/02-setup-replication.sh` (renomeado)
- ✅ `src/main/resources/db/changelog/` - Changelogs Liquibase

#### Scripts de Produção
- ✅ `liquibase-manager.sh`
- ✅ `scripts/backup-mysql.sh`
- ✅ `scripts/restore-mysql.sh`
- ✅ `scripts/load-data.sh` (carga inicial)
- ✅ `scripts/export-data.sh`
- ✅ `scripts/import-tecnologias-pom.sh`

#### Dados de Template (para carga inicial)
- ✅ `data-templates/tipos-afastamento.json`
- ✅ `data-templates/colaboradores.csv`
- ✅ `data-templates/habilidades.csv`
- ✅ `data-templates/tecnologias.csv`
- ✅ `data-templates/processos-negocio.csv`
- ✅ `data-templates/slas.csv`
- ✅ `data-templates/capacidades-negocio.json`
- ✅ `data-templates/aplicacoes.csv`

#### Documentação Essencial
- ✅ `README.md`
- ✅ `QUICKSTART.md`
- ✅ `CHANGELOG.md`
- ✅ `LICENSE`
- ✅ `SECURITY.md`
- ✅ `LIQUIBASE_QUICKSTART.md`
- ✅ `docs/MANUAL_INSTALACAO.md`
- ✅ `docs/DOCUMENTACAO_API.md`
- ✅ `docs/LIQUIBASE_DATABASE_MIGRATION.md`

#### CI/CD
- ✅ `.github/workflows/docker-deploy.yml`
- ✅ `.github/workflows/liquibase-migration.yml`

---

### 🗑️ Arquivos para REMOVER em Produção

#### Arquivos de Desenvolvimento/Debug
- ❌ `scripts/test-criar-tipo-afastamento.sh`
- ❌ `scripts/test-habilidades.sh`
- ❌ `scripts/test-single-habilidade.sh`
- ❌ `scripts/diagnose-server.sh`
- ❌ `scripts/full-diagnostic.sh`
- ❌ `scripts/check-db-structure.sh`
- ❌ `scripts/add-logging-to-apis.js` (dev tool)

#### Logs e Arquivos Temporários
- ❌ `scripts/*.log` (todos os logs de carga)
- ❌ `scripts/aplicacoes-carga-*.log`
- ❌ `scripts/load-capacidades-*.log`
- ❌ `scripts/load-tecnologias-*.log`
- ❌ `scripts/load-tipos-afastamento-*.log`

#### SQL de Desenvolvimento/Migração
- ❌ `scripts/create-tables.sql` (substituído por Liquibase)
- ❌ `scripts/create-logs-table.sql` (substituído por Liquibase)
- ❌ `scripts/create-contratos-tables.sql` (substituído por Liquibase)
- ❌ `scripts/fix-tecnologias.sql` (one-time fix)
- ❌ `scripts/update-capacidades.sql` (one-time fix)
- ❌ `scripts/migrate-habilidades.sql` (one-time migration)
- ❌ `scripts/load-data.sql` (obsoleto)
- ❌ `database/03-create-configuracoes.sql` (duplicado em Liquibase)
- ❌ `database/04-create-logs.sql` (duplicado em Liquibase)
- ❌ `database/05-create-integracoes.sql` (duplicado em Liquibase)
- ❌ `database/06-migrate-integracoes.sql` (one-time migration)
- ❌ `database/peoplesoft.sql` (exemplo/teste)

#### JSON de Teste/Desenvolvimento
- ❌ `database/afastamento.json` (teste)
- ❌ `database/capabilities_300_revised.json` (versão antiga)
- ❌ `database/habilidades.json` (duplicado)
- ❌ `database/habilidades02.json` (duplicado)
- ❌ `database/habilidades03.json` (duplicado)
- ❌ `database/tipo_afastamento.json` (duplicado)
- ❌ `database/tecnologia01.json` (duplicado)
- ❌ `database/tecnologia02.json` (duplicado)
- ❌ `database/tecnologiaORDS.json` (específico)
- ❌ `database/tecnologiaVenki.json` (específico)
- ❌ `database/tecnologiaebs.json` (específico)
- ❌ `database/tecnologiapeople.json` (específico)

#### Scripts de Migração (já executados)
- ❌ `scripts/migrate-habilidades.sh`
- ❌ `scripts/load-habilidades.js` (substituído por .sh)

#### Documentação de Desenvolvimento
- ❌ `scripts/README-CARGA-HABILIDADES.md` (específico)
- ❌ `scripts/README_MIGRACAO_HABILIDADES.md` (histórico)
- ❌ `docs/DEBUG_AZURE_DEVOPS.md` (dev only)
- ❌ `docs/ATUALIZACOES_DOCUMENTACAO.md` (histórico)

#### Configurações Spark (template GitHub)
- ❌ `.spark-initial-sha`
- ❌ `spark.meta.json`
- ❌ `runtime.config.json`
- ❌ `theme.json`
- ❌ `theme/` (todo o diretório)

#### Configurações de Documentação MkDocs (opcional)
- ⚠️ `mkdocs.yml` (manter se usar MkDocs)
- ⚠️ `docs/_typeset.scss`
- ⚠️ `docs/javascripts/`
- ⚠️ `docs/styles/`

#### Arquivos Gerados/Cache
- ❌ `.cache/`
- ❌ `dist/` (será recriado no build)
- ❌ `node_modules/` (será recriado)
- ❌ `target/` (Maven)

#### Exemplos
- ❌ `scripts/exemplo-pom.xml`

---

## 🔧 Comandos de Limpeza

### 1. Remover Logs
```bash
find scripts/ -name "*.log" -type f -delete
```

### 2. Remover JSONs de Teste no database/
```bash
cd database/
rm -f afastamento.json capabilities_300_revised.json
rm -f habilidades*.json tipo_afastamento.json
rm -f tecnologia*.json
```

### 3. Remover Scripts de Teste
```bash
cd scripts/
rm -f test-*.sh diagnose-server.sh full-diagnostic.sh check-db-structure.sh
rm -f add-logging-to-apis.js exemplo-pom.xml
```

### 4. Remover SQLs Obsoletos
```bash
cd scripts/
rm -f create-tables.sql create-logs-table.sql create-contratos-tables.sql
rm -f fix-tecnologias.sql update-capacidades.sql migrate-habilidades.sql load-data.sql

cd ../database/
rm -f 03-create-configuracoes.sql 04-create-logs.sql 05-create-integracoes.sql
rm -f 06-migrate-integracoes.sql peoplesoft.sql
```

### 5. Remover Scripts de Migração
```bash
cd scripts/
rm -f migrate-habilidades.sh load-habilidades.js
rm -f README-CARGA-HABILIDADES.md README_MIGRACAO_HABILIDADES.md
```

### 6. Remover Configurações Spark
```bash
rm -f .spark-initial-sha spark.meta.json runtime.config.json theme.json
rm -rf theme/
```

### 7. Remover Documentação de Dev
```bash
cd docs/
rm -f DEBUG_AZURE_DEVOPS.md ATUALIZACOES_DOCUMENTACAO.md
```

### 8. Limpar Cache e Build
```bash
rm -rf .cache/ dist/ node_modules/ target/
```

### 9. Comando Completo (CUIDADO!)
```bash
# Execute na raiz do projeto
# Revise antes de executar!

# Logs
find scripts/ -name "*.log" -type f -delete

# Database - arquivos de teste
cd database/
rm -f afastamento.json capabilities_300_revised.json
rm -f habilidades*.json tipo_afastamento.json tecnologia*.json
rm -f 03-create-configuracoes.sql 04-create-logs.sql 05-create-integracoes.sql
rm -f 06-migrate-integracoes.sql peoplesoft.sql
cd ..

# Scripts - testes e obsoletos
cd scripts/
rm -f test-*.sh diagnose-server.sh full-diagnostic.sh check-db-structure.sh
rm -f add-logging-to-apis.js exemplo-pom.xml
rm -f create-tables.sql create-logs-table.sql create-contratos-tables.sql
rm -f fix-tecnologias.sql update-capacidades.sql migrate-habilidades.sql load-data.sql
rm -f migrate-habilidades.sh load-habilidades.js
rm -f README-CARGA-HABILIDADES.md README_MIGRACAO_HABILIDADES.md
cd ..

# Docs de dev
cd docs/
rm -f DEBUG_AZURE_DEVOPS.md ATUALIZACOES_DOCUMENTACAO.md
cd ..

# Spark
rm -f .spark-initial-sha spark.meta.json runtime.config.json theme.json
rm -rf theme/

# Cache
rm -rf .cache/ dist/ target/

echo "✅ Limpeza concluída!"
```

---

## 📦 Build para Produção

### 1. Instalar Dependências
```bash
npm ci --production=false
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Build Docker
```bash
docker-compose build --no-cache
```

### 4. Aplicar Migrations
```bash
mvn liquibase:update -Pprod
# ou
./liquibase-manager.sh update -p prod
```

---

## 🔒 Segurança para Produção

### Variáveis de Ambiente (.env)
Nunca commitar o `.env` de produção! Criar arquivo separado:

```bash
# .env.production (NÃO COMMITAR!)
DB_HOST=seu-servidor-mysql
DB_PORT=3306
DB_NAME=auditoria_db
DB_USER=app_user_prod
DB_PASSWORD=senha_forte_aqui
DB_ROOT_PASSWORD=senha_root_forte

AZURE_DEVOPS_ORG=sua-organizacao
AZURE_DEVOPS_PAT=seu_token_seguro

NODE_ENV=production
PORT=3000
```

### Alterar Senhas Padrão
```bash
# docker-compose.yml - substituir:
MYSQL_ROOT_PASSWORD: rootpass123  # TROCAR!
```

---

## 📊 Tamanho Estimado Após Limpeza

| Categoria | Antes | Depois | Redução |
|-----------|-------|--------|---------|
| Scripts | ~45 arquivos | ~15 arquivos | 67% |
| Database | ~22 arquivos | ~5 arquivos | 77% |
| Docs | ~35 arquivos | ~25 arquivos | 29% |
| Total | ~500 MB | ~150 MB | 70% |

---

## ✅ Checklist Final

- [ ] Executar comandos de limpeza
- [ ] Revisar `.gitignore` atualizado
- [ ] Testar build: `npm run build`
- [ ] Testar Docker: `docker-compose up -d`
- [ ] Aplicar migrations: `mvn liquibase:update`
- [ ] Testar APIs: `curl http://localhost:3000/api/health`
- [ ] Verificar frontend: http://localhost:5173
- [ ] Alterar senhas padrão
- [ ] Criar `.env.production` com credenciais reais
- [ ] Documentar alterações no CHANGELOG.md
- [ ] Fazer backup do banco antes do deploy
- [ ] Testar rollback do Liquibase

---

**IMPORTANTE**: Faça backup completo antes de executar os comandos de limpeza!
