# Changelog - Correção Campo Frequência de Uso

## [Correção] - 2024-12-15

### 🐛 Bug Corrigido
**Campo "Frequência de Uso" não estava sendo gravado no banco de dados ou apresentado na tela**

#### Descrição do Problema
O campo "Frequência" nos Processos de Negócio não era persistido no banco de dados devido a uma **discrepância entre a estrutura da tabela definida nos arquivos de schema** e a estrutura esperada pela aplicação.

#### Causa Raiz
- A tabela `processos_negocio` nos arquivos de inicialização do banco (`init-master.sql` e `01-init-schema-data.sql`) estava com estrutura **incompleta**
- Faltavam 7 campos essenciais: `identificacao`, `nivel_maturidade`, `area_responsavel`, **`frequencia`**, `duracao_media`, `complexidade`, `normas`
- O arquivo `05-migrate-processos.sql` tinha a estrutura correta, mas não era executado na inicialização padrão

### 🔧 Arquivos Modificados

#### Schema do Banco de Dados (Corrigidos)
1. **`database/01-init-schema-data.sql`**
   - ✅ Adicionada estrutura completa da tabela `processos_negocio`
   - ✅ Incluídos todos os 7 campos faltantes
   - ✅ Adicionados índices apropriados

2. **`database/init-master.sql`**
   - ✅ Adicionada estrutura completa da tabela `processos_negocio`
   - ✅ Incluídos todos os 7 campos faltantes
   - ✅ Adicionados índices apropriados

3. **`package-production/database/01-init-schema-data.sql`**
   - ✅ Sincronizado com a versão de desenvolvimento

4. **`package-production/database/init-master.sql`**
   - ✅ Sincronizado com a versão de desenvolvimento

#### Novos Arquivos Criados

5. **`database/25-fix-processos-negocio-structure.sql`** ⭐ NOVO
   - Script de migração para bancos de dados existentes
   - Adiciona campos faltantes de forma segura (verifica se já existem)
   - Atualiza índices conforme necessário
   - Exibe estrutura final para validação

6. **`database/apply-fix-frequencia.sh`** ⭐ NOVO
   - Script automatizado para aplicar a correção
   - Suporta Docker e MySQL local
   - Cria backup automático antes da migração
   - Interface interativa amigável

7. **`database/FIX-FREQUENCIA-USO-README.md`** ⭐ NOVO
   - Documentação completa do problema e solução
   - Guia passo-a-passo para aplicação da correção
   - Testes recomendados
   - Troubleshooting

8. **`database/backups/.gitignore`** ⭐ NOVO
   - Previne commit de arquivos de backup
   - Mantém a estrutura de pastas

### 📊 Estrutura da Tabela

#### Antes (Incompleta)
```sql
CREATE TABLE IF NOT EXISTS processos_negocio (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Depois (Completa)
```sql
CREATE TABLE IF NOT EXISTS processos_negocio (
    id VARCHAR(36) PRIMARY KEY,
    identificacao VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel_maturidade VARCHAR(50) NOT NULL,
    area_responsavel VARCHAR(200) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,           -- ✓ CORRIGIDO
    duracao_media DECIMAL(10,2),
    complexidade VARCHAR(50) NOT NULL,
    normas JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_processos_identificacao (identificacao),
    INDEX idx_processos_area (area_responsavel),
    INDEX idx_processos_complexidade (complexidade)
);
```

### ✅ Componentes que NÃO Precisaram de Alteração

Os seguintes componentes já estavam implementados corretamente:

- ✅ **Frontend/Formulário** (`src/components/ProcessoNegocioForm.tsx`)
  - Campo "Frequência" já presente
  - Validação correta
  - Estado sincronizado

- ✅ **Frontend/Lista** (`src/components/processos/ProcessosList.tsx`)
  - Coluna "Frequência" já exibida
  - Formatação apropriada

- ✅ **Backend/API** (`server/api.js`)
  - Endpoint POST já incluía o campo
  - Endpoint PUT já incluía o campo
  - Mapeamento `mapProcessoNegocio` já retornava o campo

- ✅ **Types** (`src/lib/types.ts`)
  - Interface `ProcessoNegocio` já incluía `frequencia: Frequencia`

### 🚀 Como Aplicar

#### Para Novos Ambientes
```bash
# Reiniciar containers (irá usar schema corrigido)
docker-compose down -v
docker-compose up -d
```

#### Para Ambientes Existentes
```bash
# Método 1: Script automatizado (recomendado)
./database/apply-fix-frequencia.sh

# Método 2: Manual via Docker
docker exec -i mysql-master mysql -uroot -proot auditoria_db < database/25-fix-processos-negocio-structure.sql

# Método 3: Manual via MySQL CLI
mysql -u root -p auditoria_db < database/25-fix-processos-negocio-structure.sql
```

### 🧪 Testes de Validação

Após aplicar a correção, execute:

1. **Teste de Cadastro**
   ```
   ✓ Criar novo processo com frequência "Semanal"
   ✓ Verificar se foi salvo corretamente no banco
   ```

2. **Teste de Edição**
   ```
   ✓ Editar processo existente
   ✓ Alterar frequência para "Mensal"
   ✓ Verificar se mudança foi persistida
   ```

3. **Teste de Visualização**
   ```
   ✓ Abrir lista de processos
   ✓ Verificar se coluna Frequência exibe valores
   ```

4. **Teste SQL Direto**
   ```sql
   DESCRIBE processos_negocio;
   -- Deve mostrar o campo 'frequencia'
   
   SELECT identificacao, frequencia FROM processos_negocio;
   -- Deve retornar dados
   ```

### 📝 Valores Válidos

O campo `frequencia` aceita os seguintes valores:
- Diário
- Semanal
- Quinzenal
- Mensal
- Trimestral
- Ad-Hoc
- Anual
- Bi-Anual

### ⚠️ Notas Importantes

1. **Backup**: O script automatizado cria backup antes de aplicar
2. **Valores Padrão**: Registros existentes receberão valores padrão:
   - `nivel_maturidade`: 'Inicial'
   - `area_responsavel`: '' (vazio)
   - `frequencia`: 'Mensal'
   - `complexidade`: 'Média'
3. **Validação Pós-Migração**: Revisar e atualizar dados existentes conforme necessário

### 🔗 Links Úteis

- [README Completo](database/FIX-FREQUENCIA-USO-README.md)
- [Script de Migração](database/25-fix-processos-negocio-structure.sql)
- [Script de Aplicação](database/apply-fix-frequencia.sh)

### 👥 Impacto

- **Usuários Afetados**: Todos os que utilizam o módulo de Processos de Negócio
- **Downtime**: Nenhum (migração pode ser aplicada com sistema rodando)
- **Rollback**: Possível via backup automático

### 📅 Timeline

- **Identificação**: 2024-12-15 20:00
- **Análise**: 2024-12-15 20:05
- **Correção**: 2024-12-15 20:15
- **Documentação**: 2024-12-15 20:30
- **Status**: ✅ Concluído

---

**Versão**: 1.0.0  
**Data**: 15/12/2024  
**Tipo**: Correção de Bug (Schema)  
**Prioridade**: Alta  
**Status**: ✅ Resolvido
