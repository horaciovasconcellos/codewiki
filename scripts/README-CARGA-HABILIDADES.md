  # Carga em Lote de Habilidades

Este diretório contém scripts para realizar carga em lote de habilidades a partir de arquivos JSON.

## Arquivo de Dados

O arquivo `data-templates/habilidades-exemplo.json` contém exemplos de habilidades no formato:

```json
[
  {
    "sigla": "JAVA",
    "descricao": "Java - Linguagem de programação orientada a objetos",
    "dominio": "Técnica",
    "subcategoria": "Backend"
  }
]
```

## Opções de Carga

### 1. Script Bash (load-habilidades.sh)

**Requisitos:**
- `curl` instalado
- `jq` instalado (`brew install jq`)
- Servidor rodando em http://localhost:3000

**Uso:**

```bash
# Usar arquivo padrão (habilidades-exemplo.json)
chmod +x scripts/load-habilidades.sh
./scripts/load-habilidades.sh

# Usar arquivo específico
./scripts/load-habilidades.sh meu-arquivo.json
```

**Saída:**
```
==========================================
CARGA EM LOTE DE HABILIDADES
==========================================

📄 Arquivo: ../data-templates/habilidades-exemplo.json

✓ Servidor disponível

Total de registros a processar: 15

Criando: JAVA... ✓ Criada
Criando: PYTHON... ✓ Criada
...
```

### 2. Script Node.js (load-habilidades.js)

**Requisitos:**
- Node.js 18+
- Servidor rodando em http://localhost:3000

**Uso:**

```bash
# Usar arquivo padrão
node scripts/load-habilidades.js

# Usar arquivo específico
node scripts/load-habilidades.js data-templates/minhas-habilidades.json

# Com variável de ambiente para API
API_URL=http://production.example.com:3000 node scripts/load-habilidades.js
```

**Saída:**
```
==========================================
CARGA EM LOTE DE HABILIDADES
==========================================

ℹ Arquivo carregado: ../data-templates/habilidades-exemplo.json
ℹ Total de registros: 15

✓ Servidor disponível

Criando: JAVA... ✓ Criada
Criando: PYTHON... ✓ Criada
...

==========================================
RESUMO
==========================================
Total processados: 15
✓ Sucesso: 15
⚠ Já existiam: 0
✗ Falhas: 0
```

### 3. cURL Direto (para testes rápidos)

```bash
# Carregar arquivo JSON diretamente
cat data-templates/habilidades-exemplo.json | jq -c '.[]' | while read -r hab; do
  curl -X POST http://localhost:3000/api/habilidades \
    -H "Content-Type: application/json" \
    -d "$hab"
done
```

### 4. Via Frontend (Interface Web)

Acesse http://localhost:5173 → Habilidades → "Importar JSON"

(Esta funcionalidade pode ser implementada no componente HabilidadesView)

## Formato do Arquivo JSON

### Campos Obrigatórios

- **sigla** (string, 1-50 caracteres): Identificador único da habilidade
- **descricao** (string, até 500 caracteres): Descrição detalhada
- **dominio** (string): Categoria principal (ex: Técnica, Negócio, Design)
- **subcategoria** (string): Subcategoria específica (ex: Backend, Frontend, Cloud)

### Exemplo Completo

```json
[
  {
    "sigla": "REACT",
    "descricao": "React 18 - Biblioteca para interfaces de usuário",
    "dominio": "Técnica",
    "subcategoria": "Frontend"
  },
  {
    "sigla": "NODEJS",
    "descricao": "Node.js - Runtime JavaScript server-side",
    "dominio": "Técnica",
    "subcategoria": "Backend"
  },
  {
    "sigla": "SCRUM",
    "descricao": "Scrum - Framework ágil para gestão de projetos",
    "dominio": "Negócio",
    "subcategoria": "Gestão"
  }
]
```

## Códigos de Resposta da API

- **201 Created**: Habilidade criada com sucesso
- **400 Bad Request**: Campos obrigatórios faltando
- **409 Conflict**: Habilidade com mesma sigla já existe
- **500 Internal Server Error**: Erro no servidor/banco de dados

## Tratamento de Duplicatas

Se uma habilidade com a mesma **sigla** já existir, a API retorna erro 409. Os scripts tratam isso como "já existe" e continuam processando as demais.

Para atualizar uma habilidade existente, use PUT:

```bash
curl -X PUT http://localhost:3000/api/habilidades/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "REACT",
    "descricao": "React 19 - Nova versão",
    "dominio": "Técnica",
    "subcategoria": "Frontend"
  }'
```

## Validação de Dados

Antes de carregar um arquivo grande, valide o JSON:

```bash
# Validar sintaxe JSON
jq '.' habilidades.json > /dev/null && echo "JSON válido" || echo "JSON inválido"

# Validar estrutura (campos obrigatórios)
jq -e '.[].sigla and .[].descricao and .[].dominio and .[].subcategoria' habilidades.json > /dev/null \
  && echo "Estrutura válida" \
  || echo "Campos obrigatórios faltando"
```

## Logs e Auditoria

Todas as criações são registradas na tabela `logs_auditoria`:

```sql
SELECT * FROM logs_auditoria 
WHERE entity_type = 'HABILIDADE' 
  AND operation_type = 'CREATE'
ORDER BY timestamp DESC;
```

## Troubleshooting

### Servidor não responde

```bash
# Verificar se containers estão rodando
docker ps

# Reiniciar containers
docker-compose restart

# Ver logs
docker logs auditoria-app
```

### Erro de permissão no script bash

```bash
chmod +x scripts/load-habilidades.sh
```

### jq não instalado

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Erro de conexão com banco

```bash
# Verificar logs do MySQL
docker logs mysql-master

# Testar conexão
docker exec mysql-master mysql -uapp_user -papppass123 -e "SELECT 1"
```

## Performance

- **Pequenas cargas** (<50 registros): Use qualquer método
- **Cargas médias** (50-500): Prefira o script Node.js
- **Cargas grandes** (>500): Considere inserção direta no banco via SQL

Para cargas muito grandes, use SQL direto:

```bash
# Gerar SQL a partir do JSON
jq -r '.[] | "INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria) VALUES (UUID(), '\''\(.sigla)'\'', '\''\(.descricao)'\'', '\''\(.dominio)'\'', '\''\(.subcategoria)'\'');"' habilidades.json > insert.sql

# Executar SQL
docker exec -i mysql-master mysql -uapp_user -papppass123 auditoria_db < insert.sql
```
