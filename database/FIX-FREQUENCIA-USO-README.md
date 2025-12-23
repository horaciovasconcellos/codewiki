# 🔧 Correção: Campo "Frequência de Uso" - Processos de Negócio

## 📋 Problema Identificado

O campo **"Frequência"** nos **Processos de Negócio** não estava sendo gravado no banco de dados nem apresentado corretamente na interface devido a uma **inconsistência na estrutura da tabela** `processos_negocio`.

### Sintomas

- ✗ Ao cadastrar um processo de negócio, o campo "Frequência" não era salvo
- ✗ Ao visualizar a lista de processos, o campo aparecia vazio ou com valor padrão
- ✗ Os dados do formulário eram perdidos após salvar

## 🔍 Causa Raiz

Vários arquivos de schema SQL estavam com a **estrutura incompleta** da tabela `processos_negocio`:

**Estrutura INCORRETA** (antes da correção):
```sql
CREATE TABLE IF NOT EXISTS processos_negocio (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Campos Faltantes

- ❌ `identificacao` - Sigla/código do processo
- ❌ `nivel_maturidade` - Nível de maturidade (Inicial, Repetível, Definido, etc.)
- ❌ `area_responsavel` - Área responsável pelo processo
- ❌ **`frequencia`** - **Frequência de execução (campo principal do problema)**
- ❌ `duracao_media` - Duração média em horas
- ❌ `complexidade` - Nível de complexidade
- ❌ `normas` - Normas aplicáveis (JSON)

## ✅ Solução Implementada

### 1. Arquivos de Schema Corrigidos

Os seguintes arquivos foram atualizados com a estrutura completa:

- ✅ `database/01-init-schema-data.sql`
- ✅ `database/init-master.sql`
- ✅ `package-production/database/01-init-schema-data.sql`
- ✅ `package-production/database/init-master.sql`

**Estrutura CORRETA** (após a correção):
```sql
CREATE TABLE IF NOT EXISTS processos_negocio (
    id VARCHAR(36) PRIMARY KEY,
    identificacao VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel_maturidade VARCHAR(50) NOT NULL,
    area_responsavel VARCHAR(200) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,              -- ✓ CAMPO CORRIGIDO
    duracao_media DECIMAL(10,2),
    complexidade VARCHAR(50) NOT NULL,
    normas JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_processos_identificacao (identificacao),
    INDEX idx_processos_area (area_responsavel),
    INDEX idx_processos_complexidade (complexidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Script de Migração Criado

Foi criado o script **`25-fix-processos-negocio-structure.sql`** para atualizar bancos de dados já existentes.

## 🚀 Como Aplicar a Correção

### Para Novos Bancos de Dados

Se você está criando um novo banco de dados, os arquivos de schema já estão corrigidos. Basta executar:

```bash
# Usando Docker Compose
docker-compose down -v
docker-compose up -d

# Ou executando manualmente
mysql -u root -p auditoria_db < database/init-master.sql
```

### Para Bancos de Dados Existentes

Execute o script de migração para adicionar os campos faltantes:

```bash
# Opção 1: Usando MySQL CLI
mysql -u root -p auditoria_db < database/25-fix-processos-negocio-structure.sql

# Opção 2: Usando Docker
docker exec -i mysql-master mysql -uroot -proot auditoria_db < database/25-fix-processos-negocio-structure.sql

# Opção 3: Usando o script helper
./liquibase-manager.sh apply-migration 25-fix-processos-negocio-structure
```

### Verificar se a Correção Foi Aplicada

```sql
-- Verificar estrutura da tabela
USE auditoria_db;
DESCRIBE processos_negocio;

-- Deve mostrar todas as colunas incluindo 'frequencia'
```

## 📊 Impacto da Correção

### Frontend/UI
- ✅ **Nenhuma alteração necessária** - O formulário já estava implementado corretamente
- ✅ A tabela de listagem já exibia o campo (linha 120 do ProcessosList.tsx)

### Backend/API
- ✅ **Nenhuma alteração necessária** - A API já estava preparada para receber e retornar o campo
- ✅ Rotas POST/PUT já incluem o campo `frequencia`

### Banco de Dados
- ✅ **Estrutura corrigida** - Todos os campos necessários agora estão presentes
- ✅ **Migração criada** - Bancos existentes podem ser atualizados

## 🧪 Testes Recomendados

Após aplicar a correção, execute os seguintes testes:

### 1. Teste de Cadastro
```
1. Acesse a tela de Processos de Negócio
2. Clique em "Novo Processo"
3. Preencha todos os campos incluindo "Frequência"
4. Salve o processo
5. Verifique se o valor de Frequência foi salvo corretamente
```

### 2. Teste de Edição
```
1. Edite um processo existente
2. Altere o campo "Frequência"
3. Salve as alterações
4. Verifique se a nova frequência foi atualizada
```

### 3. Teste de Visualização
```
1. Acesse a lista de processos
2. Verifique se a coluna "Frequência" está exibindo os valores
3. Verifique se os valores são: Diário, Semanal, Mensal, etc.
```

### 4. Teste SQL Direto
```sql
-- Inserir um processo de teste
INSERT INTO processos_negocio (
    id, identificacao, nome, descricao, nivel_maturidade, 
    area_responsavel, frequencia, duracao_media, complexidade, normas
) VALUES (
    UUID(), 'TEST-00001', 'Processo Teste', 'Teste de frequência',
    'Inicial', 'TI', 'Semanal', 8.00, 'Média', '[]'
);

-- Verificar se foi salvo
SELECT identificacao, nome, frequencia FROM processos_negocio WHERE identificacao = 'TEST-00001';
```

## 📝 Valores Válidos para Frequência

De acordo com o formulário ([ProcessoNegocioForm.tsx](../src/components/ProcessoNegocioForm.tsx#L195-L203)):

- `Diário`
- `Semanal`
- `Quinzenal`
- `Mensal`
- `Trimestral`
- `Ad-Hoc`
- `Anual`
- `Bi-Anual`

## 🔗 Arquivos Relacionados

### Schema/Banco de Dados
- `database/01-init-schema-data.sql` - Schema inicial (corrigido)
- `database/05-migrate-processos.sql` - Migração de processos (já estava correto)
- `database/init-master.sql` - Schema master (corrigido)
- `database/25-fix-processos-negocio-structure.sql` - **Script de correção (novo)**

### Frontend
- `src/components/ProcessoNegocioForm.tsx` - Formulário (já estava correto)
- `src/components/processos/ProcessosList.tsx` - Listagem (já estava correto)

### Backend
- `server/api.js` - API endpoints (já estava correto)
  - Linha 2967: `function mapProcessoNegocio` - Mapeamento
  - Linha 3006: `POST /api/processos-negocio` - Criação
  - Linha 3038: `PUT /api/processos-negocio/:id` - Atualização

### Types
- `src/lib/types.ts` - Interface ProcessoNegocio (já estava correto)

## ⚠️ Notas Importantes

1. **Backup**: Sempre faça backup do banco de dados antes de executar scripts de migração
2. **Ambiente de Produção**: Teste a migração em ambiente de desenvolvimento primeiro
3. **Dados Existentes**: Os registros existentes receberão valores padrão:
   - `nivel_maturidade`: 'Inicial'
   - `area_responsavel`: '' (vazio)
   - `frequencia`: 'Mensal'
   - `complexidade`: 'Média'
4. **Validação**: Após a migração, valide os dados existentes e atualize conforme necessário

## 📅 Histórico

- **Data**: 15/12/2024
- **Problema**: Campo "Frequência" não sendo gravado/exibido
- **Causa**: Estrutura incompleta da tabela processos_negocio
- **Solução**: Correção de 4 arquivos de schema + criação de script de migração
- **Status**: ✅ Resolvido

## 🆘 Suporte

Se você encontrar problemas após aplicar esta correção:

1. Verifique os logs do MySQL: `docker logs mysql-master`
2. Verifique a estrutura da tabela: `DESCRIBE processos_negocio;`
3. Verifique os dados: `SELECT * FROM processos_negocio LIMIT 5;`
4. Consulte os logs da aplicação para erros de API

---

**Autor**: GitHub Copilot  
**Versão**: 1.0  
**Data**: 15/12/2024
