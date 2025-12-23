# Migração da Tabela Habilidades

## Problema Identificado

A tabela `habilidades` no banco de dados tinha campos diferentes dos usados pela aplicação:

**Estrutura Antiga (MySQL):**
- `id` VARCHAR(36)
- `nome` VARCHAR(100) 
- `tipo` ENUM('Técnica', 'Comportamental')

**Estrutura Esperada pela Aplicação:**
- `id` VARCHAR(36)
- `sigla` VARCHAR(50)
- `descricao` VARCHAR(500)
- `dominio` VARCHAR(50)
- `subcategoria` VARCHAR(100)

## Solução Implementada

### 1. Atualizado Schema do Banco

**Arquivo:** `database/init-master.sql`

Nova estrutura da tabela com todos os campos necessários:
```sql
CREATE TABLE IF NOT EXISTS habilidades (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    dominio VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_habilidades_sigla (sigla),
    INDEX idx_dominio (dominio),
    INDEX idx_subcategoria (subcategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Atualizado Mapeamento da API

**Arquivo:** `server/api.js`

**Função `mapHabilidade`:**
```javascript
function mapHabilidade(row) {
  if (!row) return null;
  return {
    id: row.id,
    sigla: row.sigla,              // Agora lê diretamente do banco
    descricao: row.descricao,       // Ao invés de row.nome
    dominio: row.dominio,           // Ao invés de converter tipo
    subcategoria: row.subcategoria, // Ao invés de usar tipo
    certificacoes: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
```

**Endpoint POST `/api/habilidades`:**
```javascript
app.post('/api/habilidades', async (req, res) => {
  const { sigla, descricao, dominio, subcategoria } = req.body;
  
  // Validação de todos os campos obrigatórios
  if (!sigla || !descricao || !dominio || !subcategoria) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [
        !sigla && 'sigla',
        !descricao && 'descricao',
        !dominio && 'dominio',
        !subcategoria && 'subcategoria'
      ].filter(Boolean)
    });
  }
  
  const id = uuidv4();
  await pool.query(
    'INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria) VALUES (?, ?, ?, ?, ?)',
    [id, sigla.toUpperCase(), descricao, dominio, subcategoria]
  );
  // ...
});
```

**Endpoint PUT `/api/habilidades/:id`:**
```javascript
app.put('/api/habilidades/:id', async (req, res) => {
  const { sigla, descricao, dominio, subcategoria } = req.body;
  
  await pool.query(
    'UPDATE habilidades SET sigla = ?, descricao = ?, dominio = ?, subcategoria = ? WHERE id = ?',
    [
      sigla ? sigla.toUpperCase() : existing[0].sigla,
      descricao || existing[0].descricao,
      dominio || existing[0].dominio,
      subcategoria || existing[0].subcategoria,
      req.params.id
    ]
  );
  // ...
});
```

### 3. Scripts de Migração

#### Script SQL: `scripts/migrate-habilidades.sql`
- Cria tabela com nova estrutura
- Migra dados existentes (converte `nome` → `descricao`, `tipo` → `dominio/subcategoria`)
- Faz backup da tabela antiga
- Substitui tabela

#### Script Bash: `scripts/migrate-habilidades.sh`
- Executa migração com confirmação
- Mostra progresso e resultado
- Instruções para remover backup após testes

## Como Aplicar a Migração

### Opção 1: Banco Novo (Recomendado para Desenvolvimento)

Se você pode recriar o banco de dados:

```bash
# Parar containers
docker-compose down

# Remover volumes (ATENÇÃO: apaga todos os dados)
docker volume rm sistema-de-auditoria_mysql-master-data

# Subir novamente
docker-compose up -d

# Aguardar MySQL inicializar
sleep 10

# Verificar
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "DESCRIBE habilidades;"
```

### Opção 2: Migração com Dados Existentes

Se você precisa preservar dados:

```bash
# Dar permissão de execução
chmod +x scripts/migrate-habilidades.sh

# Executar migração
./scripts/migrate-habilidades.sh
```

O script irá:
1. ✅ Criar nova tabela `habilidades_new`
2. ✅ Migrar dados convertendo campos:
   - `nome` → `descricao`
   - Gerar `sigla` a partir do nome (primeiros 20 chars, uppercase, sem espaços)
   - `tipo` → `dominio` (Técnica, Comportamental, Gestão)
   - `tipo` → `subcategoria` (mapeamento padrão)
3. ✅ Renomear `habilidades` → `habilidades_backup`
4. ✅ Renomear `habilidades_new` → `habilidades`

### Opção 3: Manual via Docker

```bash
docker exec -it mysql-master mysql -uapp_user -papppass123 auditoria_db < scripts/migrate-habilidades.sql
```

## Validação

### 1. Verificar Estrutura da Tabela

```bash
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "DESCRIBE habilidades;"
```

**Saída esperada:**
```
+---------------+--------------+------+-----+-------------------+-------+
| Field         | Type         | Null | Key | Default           | Extra |
+---------------+--------------+------+-----+-------------------+-------+
| id            | varchar(36)  | NO   | PRI | NULL              |       |
| sigla         | varchar(50)  | NO   | UNI | NULL              |       |
| descricao     | varchar(500) | NO   |     | NULL              |       |
| dominio       | varchar(50)  | NO   | MUL | NULL              |       |
| subcategoria  | varchar(100) | NO   | MUL | NULL              |       |
| created_at    | timestamp    | YES  |     | CURRENT_TIMESTAMP |       |
| updated_at    | timestamp    | YES  |     | CURRENT_TIMESTAMP |       |
+---------------+--------------+------+-----+-------------------+-------+
```

### 2. Testar API - Listar Habilidades

```bash
curl http://localhost:3000/api/habilidades
```

### 3. Testar API - Criar Habilidade

```bash
curl -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "REACT",
    "descricao": "React 18 - Biblioteca JavaScript para construção de interfaces",
    "dominio": "Técnica",
    "subcategoria": "Frontend"
  }'
```

**Resposta esperada:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sigla": "REACT",
  "descricao": "React 18 - Biblioteca JavaScript para construção de interfaces",
  "dominio": "Técnica",
  "subcategoria": "Frontend",
  "certificacoes": [],
  "createdAt": "2025-11-23T...",
  "updatedAt": "2025-11-23T..."
}
```

### 4. Testar na Interface Web

1. Acesse http://localhost:5173/
2. Vá em **Habilidades**
3. Clique em **Nova Habilidade**
4. Preencha:
   - Sigla: `NODEJS`
   - Descrição: `Node.js - Runtime JavaScript`
   - Domínio: `Técnica`
   - Subcategoria: `Backend`
5. Clique em **Criar Habilidade**
6. ✅ Deve aparecer na lista

## Campos da Interface vs Banco

| Campo na Interface | Campo no Banco | Tipo | Descrição |
|-------------------|----------------|------|-----------|
| Sigla | `sigla` | VARCHAR(50) | Identificador curto (ex: REACT, NODEJS) |
| Descrição | `descricao` | VARCHAR(500) | Descrição completa da habilidade |
| Domínio | `dominio` | VARCHAR(50) | Técnica, Comportamental, Gestão, Negócio, Segurança, DevOps |
| Subcategoria | `subcategoria` | VARCHAR(100) | Frontend, Backend, Infraestrutura, Analytics, etc |
| Certificações | `certificacoes` | JSON (virtual) | Armazenado em tabela separada (futuro) |

## Valores Aceitos

### Domínio
- `Técnica`
- `Comportamental`
- `Gestão`
- `Negócio`
- `Segurança`
- `DevOps`

### Subcategoria
- `Aplicação Terceira`
- `Banco de Dados`
- `Frontend`
- `Backend`
- `Infraestrutura`
- `Devops`
- `Segurança`
- `Analytics`
- `Integração`
- `Inteligencia Artificial`
- `Outras`

## Rollback (se necessário)

Se algo der errado após a migração:

```bash
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db <<EOF
DROP TABLE habilidades;
RENAME TABLE habilidades_backup TO habilidades;
SELECT 'Rollback concluído' as status;
EOF
```

## Remover Backup (após validação)

Quando tiver certeza que está tudo funcionando:

```bash
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "DROP TABLE IF EXISTS habilidades_backup;"
```

## Resumo das Alterações

✅ **Banco de Dados**
- Atualizado `database/init-master.sql` com nova estrutura
- Criado script de migração `scripts/migrate-habilidades.sql`
- Criado script bash `scripts/migrate-habilidades.sh`

✅ **API Server**
- Atualizado função `mapHabilidade()`
- Atualizado `POST /api/habilidades`
- Atualizado `PUT /api/habilidades/:id`
- Atualizado `GET /api/habilidades` (ordenação por sigla)

✅ **Interface**
- Nenhuma alteração necessária (já estava correta!)

## Problemas Conhecidos Resolvidos

- ❌ **Antes:** Erro 500 ao criar habilidade (campos não existiam no banco)
- ✅ **Depois:** Criação funciona corretamente com todos os campos

- ❌ **Antes:** Mapeamento incorreto (nome → sigla/descricao)
- ✅ **Depois:** Mapeamento direto dos campos corretos

- ❌ **Antes:** ENUM rígido limitava flexibilidade
- ✅ **Depois:** VARCHAR permite qualquer valor de domínio/subcategoria
