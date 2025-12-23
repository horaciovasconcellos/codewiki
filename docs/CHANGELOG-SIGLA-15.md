# Alteração do Campo SIGLA de Aplicações - 10 para 15 Caracteres

## Data: 15/12/2025

## Resumo da Alteração

O campo SIGLA da tabela de Aplicações foi alterado de **VARCHAR(10)** para **VARCHAR(15)** para permitir identificadores mais descritivos.

---

## Arquivos Alterados

### 1. Banco de Dados (SQL)

#### Scripts de Criação/Migração
- ✅ `/database/01-init-schema-data.sql` - NÃO NECESSÁRIO (não contém tabela aplicacoes)
- ✅ `/database/06-migrate-aplicacoes.sql` - ALTERADO: VARCHAR(15)
- ✅ `/database/init-master.sql` - ALTERADO: VARCHAR(15)
- ✅ `/package-production/database/06-migrate-aplicacoes.sql` - ALTERADO: VARCHAR(15)
- ✅ `/package-production/database/init-master.sql` - ALTERADO: VARCHAR(15)
- ✅ `/scripts/create-tables.sql` - ALTERADO: VARCHAR2(15) para Oracle

#### Script de Alteração (Para Bancos Existentes)
- ✅ **NOVO**: `/database/17-alter-aplicacoes-sigla-15.sql` 
  - Script para executar `ALTER TABLE` em bancos já existentes

### 2. Componentes React (Frontend)

- ✅ `/src/components/aplicacoes/wizard-steps/StepBasicInfo.tsx`
  - Label: "até 10 caracteres" → "até 15 caracteres"
  - Input maxLength: 10 → 15
  - onChange slice: slice(0, 10) → slice(0, 15)
  - Contador: "/10 caracteres" → "/15 caracteres"

- ✅ `/src/components/carga/CargaLockfilesView.tsx`
  - Gerador automático de sigla:
    - substring(0, 6) → substring(0, 9)
    - substring(0, 12) → substring(0, 15)
    - Agora gera siglas até 15 caracteres

### 3. Backend (Servidor Node.js)

- ✅ `/server/api.js` (2 localizações)
  - POST `/api/aplicacoes`: validação length > 10 → length > 15
  - POST `/api/integracoes`: validação length > 10 → length > 15

- ✅ `/package-production/server/api.js` (2 localizações)
  - POST `/api/aplicacoes`: validação length > 10 → length > 15
  - POST `/api/integracoes`: validação length > 10 → length > 15

### 4. Documentação

- ✅ `/data-templates/README-APLICACOES.md` (2 localizações)
  - Linha 22: "max 10 chars" → "max 15 chars"
  - Linha 246: "máximo 10 caracteres" → "máximo 15 caracteres"

- ✅ `/docs/INSTRUCOES-CARGA.md`
  - Linha 223: "max 10 chars" → "max 15 chars"

- ✅ `/docs/ESTRUTURA_APLICACOES.md`
  - Linha 8: VARCHAR(10) → VARCHAR(15)

---

## Validações NÃO Alteradas (Correto)

### Outros Campos Sigla que Permanecem com 10 Caracteres

❌ **Tipos de Afastamento** - sigla VARCHAR(10)
  - Regex: `/^[A-Za-z0-9-]{2,10}$/`
  - Motivo: Usa padrão curto (ex: "FER", "LIC-MED")

❌ **Tipos de Comunicação** - sigla VARCHAR(10)
  - Permanece com 10 caracteres

❌ **Integrações** - sigla VARCHAR(10)
  - Validação no servidor atualizada para 15

❌ **Habilidades** - formato fixo `XXXX-9999`
  - Regex: `/^[A-Z]{4}-\d{4}$/` (9 caracteres fixos)
  - Motivo: Padrão específico de 4 letras + hífen + 4 números

---

## Como Aplicar em Banco de Dados Existente

### Opção 1: Docker (Desenvolvimento)
```bash
# Parar containers
docker-compose down

# Remover volumes (ATENÇÃO: apaga dados)
docker volume rm sistema-de-auditoria_mysql-master-data

# Recriar com nova estrutura
docker-compose up -d
```

### Opção 2: Alteração Sem Perder Dados (Produção)
```bash
# Conectar ao MySQL
mysql -h localhost -u root -p auditoria_db

# Executar script de alteração
source database/17-alter-aplicacoes-sigla-15.sql

# Verificar
DESCRIBE aplicacoes;
```

### Opção 3: Script Direto
```sql
USE auditoria_db;
ALTER TABLE aplicacoes 
MODIFY COLUMN sigla VARCHAR(15) NOT NULL UNIQUE;
```

---

## Validação Pós-Alteração

### 1. Verificar Tabela
```sql
DESCRIBE aplicacoes;
-- Campo sigla deve mostrar: varchar(15)
```

### 2. Testar Interface
1. Acesse: **Aplicações → Nova Aplicação**
2. No campo Sigla:
   - Digite 15 caracteres
   - Verificar que aceita todos
   - Verificar contador: "15/15 caracteres"

### 3. Testar API
```bash
curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "LONGA-SIGLA-123",
    "descricao": "Teste",
    "urlDocumentacao": "https://example.com",
    "faseCicloVida": "Produção",
    "criticidadeNegocio": "Média"
  }'
```

### 4. Testar Carga de Lockfiles
1. Acesse: **Ferramentas → Carga de Lockfiles**
2. Faça upload de um `package.json`
3. Verificar que siglas geradas automaticamente podem ter até 15 caracteres

---

## Impacto

### ✅ Compatibilidade Retroativa
- Siglas existentes com 10 ou menos caracteres continuam funcionando
- Nenhuma migração de dados necessária

### ⚠️ Atenção
- Aplicações com siglas de 11-15 caracteres só podem ser criadas após a alteração
- Recomenda-se aplicar em ambiente de desenvolvimento primeiro

### 📊 Benefícios
- Identificadores mais descritivos (ex: "PORTAL-WEB-MAIN" ao invés de "PORTAL-WB")
- Melhor compatibilidade com nomes de projetos modernos
- Maior flexibilidade para padrões de nomenclatura

---

## Rollback (Se Necessário)

```sql
-- Verificar se há siglas com mais de 10 caracteres
SELECT id, sigla, LENGTH(sigla) as tamanho 
FROM aplicacoes 
WHERE LENGTH(sigla) > 10;

-- Se não houver nenhuma, pode voltar para VARCHAR(10)
ALTER TABLE aplicacoes 
MODIFY COLUMN sigla VARCHAR(10) NOT NULL UNIQUE;
```

---

## Checklist de Deploy

- [ ] Backup do banco de dados
- [ ] Aplicar script SQL de alteração
- [ ] Verificar estrutura da tabela
- [ ] Testar criação de aplicação via interface
- [ ] Testar API REST
- [ ] Testar carga de lockfiles
- [ ] Atualizar documentação de usuário (se houver)
- [ ] Comunicar equipe sobre novo limite

---

**Responsável**: Sistema de Auditoria - Horácio Vasconcellos  
**Status**: ✅ Concluído  
**Versão**: 1.0
