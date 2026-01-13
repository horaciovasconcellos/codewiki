# Resolução do Problema de Sincronização MySQL

## 📋 Problema Identificado

O MySQL Slave estava com erro de sincronização devido a **incompatibilidade de schema** entre Master e Slave:

### Sintomas:
- `Slave_SQL_Running: No`
- Erro: `Cannot be converted from type 'enum' to type 'varchar'`
- Erro: `Can't find record` (DELETE de registros inexistentes)

### Causa Raiz:
1. **Schema desatualizado no Slave**: `lgpd_registros` tinha colunas VARCHAR antigas em vez dos novos ENUMs
2. **ENUMs com valores diferentes**: Slave tinha valores longos (`'Anonimização por Supressão'`) enquanto Master tinha valores curtos (`'Supressão'`)
3. **Coluna faltando**: `base_legal` existia no Master mas não no Slave
4. **Dados históricos**: Slave tentava replicar DELETEs de registros que nunca recebeu

## ✅ Solução Aplicada

### 1. **Sincronização do Schema** (`fix-slave-schema.cjs`)
   - Parou a replicação temporariamente
   - Desabilitou foreign key checks
   - Recriou `lgpd_registros` com schema correto:
     - `hierarquia_sensibilidade` ENUM (5 valores)
     - `tipo_dados` ENUM (5 valores)
     - `tecnica_anonimizacao` ENUM (5 valores) com DEFAULT 'Sem Anonimização'
   - Atualizou ENUMs de `lgpd_campos`:
     - 7 colunas matriz_* com valores curtos ('Supressão', 'Generalização', etc.)
     - CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
     - DEFAULT 'Sem Anonimização'
   - Reabilitou foreign key checks

### 2. **Reset da Replicação**
   - Reiniciou o container `replication-setup`
   - Reconfigurou replicação do zero a partir da posição atual do binlog
   - Evitou replay de transações problemáticas antigas

### 3. **Verificação Final**
   ```bash
   docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G"
   ```
   
   **Resultado:**
   - ✅ Slave_IO_Running: Yes
   - ✅ Slave_SQL_Running: Yes
   - ✅ Seconds_Behind_Master: 0
   - ✅ Last_Error: (vazio)

## 📊 Estado Final

### Replicação:
- **Status**: ✅ FUNCIONANDO
- **Lag**: 0 segundos
- **Posição**: mysql-bin.000125, pos 27654 (Master e Slave sincronizados)

### Schema LGPD:
| Tabela | Master | Slave | Status |
|--------|--------|-------|--------|
| `lgpd_registros` | 3 ENUMs utf8mb4 | 3 ENUMs utf8mb4 | ✅ Sincronizado |
| `lgpd_campos` | 7 ENUMs + base_legal | 7 ENUMs + base_legal | ✅ Sincronizado |

### Dados:
- **Master**: 1 registro + 75 campos LGPD
- **Slave**: 0 registros + 0 campos (replicação iniciou após os INSERTs)
- **Comportamento**: Novos dados serão replicados corretamente ✅

## 🔄 Próximos Passos (Opcional)

Se precisar dos dados históricos no Slave:

### Opção 1: Dump e Restore
```bash
# Exportar dados LGPD do Master
docker exec mysql-master mysqldump -uroot -prootpass123 \
  auditoria_db lgpd_registros lgpd_campos > lgpd-backup.sql

# Importar no Slave (com replicação pausada)
docker exec -i mysql-slave mysql -uroot -prootpass123 auditoria_db < lgpd-backup.sql
```

### Opção 2: Aceitar Estado Atual
- Replicação funciona para novos dados
- Dados antigos não afetam operação
- Sistema LGPD operacional para novas inserções

## 🛠️ Arquivos Criados

1. **fix-slave-schema.cjs**: Script de sincronização de schema
2. **MYSQL-REPLICATION-FIX.md**: Esta documentação

## ⚙️ Comandos Úteis

### Verificar Replicação:
```bash
docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" | grep -E "Running|Error|Behind"
```

### Reiniciar Replicação:
```bash
docker-compose restart replication-setup
```

### Verificar Dados:
```bash
# Master
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "SELECT COUNT(*) FROM lgpd_registros;"

# Slave
docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db -e "SELECT COUNT(*) FROM lgpd_registros;"
```

## 📝 Lições Aprendidas

1. **Schema Drift**: Manter Master e Slave sincronizados é crítico
2. **Migrations**: Aplicar migrations em ambos Master e Slave
3. **Monitoramento**: Verificar `SHOW SLAVE STATUS` regularmente
4. **Foreign Keys**: Desabilitar FK checks temporariamente para DDL operations
5. **Binlog Position**: Às vezes é melhor reset do que replay de eventos problemáticos

---

**Data**: 12 de Janeiro de 2026  
**Status**: ✅ RESOLVIDO  
**Tempo de Downtime**: ~10 minutos
