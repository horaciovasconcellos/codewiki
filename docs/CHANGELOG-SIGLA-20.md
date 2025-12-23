# Alteração do Campo SIGLA de Aplicações - 15 para 20 Caracteres

**Data**: 16 de dezembro de 2025  
**Tipo**: Schema Change + Frontend Update  
**Impacto**: Baixo - Expansão de limite (backward compatible)

## 📋 Resumo

O campo SIGLA da tabela de Aplicações foi alterado de **VARCHAR(15)** para **VARCHAR(20)** para permitir identificadores mais longos e descritivos.

## 🎯 Motivação

Aumentar a capacidade de nomenclatura de aplicações, permitindo siglas mais descritivas sem necessidade de abreviações excessivas.

## 📦 Arquivos Alterados

### Banco de Dados (SQL)
- ✅ `/database/init-master.sql` - Schema master atualizado
- ✅ `/database/06-migrate-aplicacoes.sql` - Schema de migração atualizado
- ✅ `/package-production/database/init-master.sql` - Schema produção atualizado
- ✅ `/package-production/database/06-migrate-aplicacoes.sql` - Schema produção atualizado
- ✅ **NOVO**: `/database/26-alter-aplicacoes-sigla-20.sql` - Script de migração

### Frontend (React/TypeScript)
- ✅ `/src/components/aplicacoes/wizard-steps/StepBasicInfo.tsx`
  - Label: "Sigla (até 20 caracteres) *"
  - maxLength: 20
  - slice(0, 20)
  - Contador: {sigla.length}/20

- ✅ `/src/components/aplicacoes/AplicacaoWizard.tsx`
  - Validação: sigla.length > 20
  - Mensagem de erro atualizada

- ✅ `/src/components/aplicacoes/AplicacoesList.tsx`
  - Largura da coluna Sigla: w-[150px] → w-[180px]

- ✅ `/src/components/carga/CargaLockfilesView.tsx`
  - Geração automática de sigla: substring(0, 20)
  - Padrão: 14 chars + '-' + 5 chars timestamp = 20 total

## 🔄 Migração do Banco de Dados

### Script de Migração

```sql
-- database/26-alter-aplicacoes-sigla-20.sql
ALTER TABLE aplicacoes
MODIFY COLUMN sigla VARCHAR(20) NOT NULL UNIQUE;
```

### Execução

```bash
# Docker MySQL Master
docker exec -i mysql-master mysql -uroot -prootpass123 auditoria_db < database/26-alter-aplicacoes-sigla-20.sql

# Ou via MySQL client local
mysql -h localhost -P 3306 -u root -p auditoria_db
source database/26-alter-aplicacoes-sigla-20.sql
```

### Verificação

```sql
-- Verificar estrutura da coluna
SHOW COLUMNS FROM aplicacoes LIKE 'sigla';

-- Deve retornar:
-- Field: sigla
-- Type: varchar(20)
-- Null: NO
-- Key: UNI
```

## ✅ Validações

### Regras de Negócio (mantidas)
1. ✅ Sigla: máximo 20 caracteres alfanuméricos
2. ✅ Única no sistema
3. ✅ Obrigatória
4. ✅ Sem espaços
5. ✅ Aceita hífens

### Formatos Válidos
```
✅ CRM
✅ ERP-FINANCEIRO-2025
✅ BBTS-INT-CAREF
✅ ORA-EBS-AP-MODULE
✅ SAAS-KLASSFOR-V123
```

### Formatos Inválidos
```
❌ ABC DEF (contém espaço)
❌ SISTEMA_GESTAO_COMPLETO_DE_VENDAS (mais de 20 caracteres)
```

## 🔍 Testes Realizados

### 1. Migração do Banco
- ✅ Script executado com sucesso
- ✅ Coluna alterada para VARCHAR(20)
- ✅ Dados existentes preservados
- ✅ Constraint UNIQUE mantida

### 2. Interface Web
- ✅ Formulário aceita até 20 caracteres
- ✅ Contador exibe corretamente
- ✅ Validação funciona
- ✅ Mensagens de erro atualizadas

### 3. Geração Automática (Carga Lockfiles)
- ✅ Siglas geradas com 20 caracteres
- ✅ Formato: {14-nome}-{5-timestamp}

## 📊 Impacto

### Dados Existentes
- ✅ **Nenhuma alteração necessária** - todas as siglas existentes têm ≤15 caracteres
- ✅ **100% backward compatible**

### Performance
- ✅ Impacto mínimo - índice UNIQUE mantido
- ✅ Queries não afetadas

### Aplicações Integradas
- ⚠️ APIs externas devem ser atualizadas se validam tamanho de sigla

## 🚀 Próximos Passos

1. ✅ Migração do banco de dados executada
2. ✅ Frontend atualizado
3. ⏳ Atualizar documentação (README, API docs)
4. ⏳ Comunicar mudança para equipes que integram via API

## 📝 Notas Técnicas

- **Retrocompatibilidade**: Total - siglas antigas continuam funcionando
- **Rollback**: Possível via `ALTER TABLE aplicacoes MODIFY COLUMN sigla VARCHAR(15)`
- **Replicação**: Migração aplicada no master, replica automaticamente para slave

## 🔗 Referências

- Alteração anterior: CHANGELOG-SIGLA-15.md (10 → 15 caracteres)
- Issue relacionada: Solicitação de aumento de limite de sigla
- Script de migração: database/26-alter-aplicacoes-sigla-20.sql
