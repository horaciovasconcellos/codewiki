# 🚨 ERRO 500 - Servidor Backend Não Está Rodando

## ❌ Problema Identificado

O erro `POST http://localhost:3000/api/documentacao-projetos 500` está ocorrendo porque o **servidor backend não está em execução**.

### Verificação Realizada

```bash
ps aux | grep "node.*api.js" | grep -v grep
# Resultado: nenhum processo encontrado
```

## ✅ Solução

### 1️⃣ Iniciar o Servidor Backend

```bash
cd /Users/horaciovasconcellos/repositorio/codewiki
node server/api.js
```

**OU** (se quiser rodar em background):

```bash
cd /Users/horaciovasconcellos/repositorio/codewiki
nohup node server/api.js > logs/server.log 2>&1 &
```

### 2️⃣ Verificar se Servidor Iniciou

```bash
# Verificar processo
ps aux | grep "node.*api.js"

# Testar endpoint
curl http://localhost:3000/api/documentacao-projetos
```

**Resposta esperada:**
```json
[...]  # Array de documentações (pode ser vazio)
```

### 3️⃣ Iniciar Frontend (se necessário)

```bash
cd /Users/horaciovasconcellos/repositorio/codewiki
npm run dev
```

## 🔍 Diagnóstico Detalhado

### Melhorias Aplicadas

1. **Servidor (`api.js`)**: Adicionado logs detalhados no catch:
```javascript
console.error('Erro ao criar documentação:', error);
console.error('Stack trace:', error.stack);
console.error('Dados recebidos:', req.body);
```

2. **Frontend (`DocumentacaoProjetosView.tsx`)**: Melhorado tratamento de erro:
```typescript
const errorMessage = errorData.message 
  ? `${errorData.error} - ${errorData.message}` 
  : errorData.error || 'Erro ao salvar documentação';
```

### Teste Realizado

```bash
# Teste direto no MySQL - FUNCIONOU! ✅
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e \
  "INSERT INTO documentacao_projetos (id, titulo, slug, conteudo, categoria, tags, versao, autor, status) 
   VALUES ('test-123', 'Teste', 'teste-manual', 'Conteúdo teste', 'Outros', '[]', '1.0.0', 'Sistema', 'Rascunho');"
```

**Conclusão:** A tabela existe, os campos estão corretos, o problema é apenas o servidor não estar rodando.

## 📋 Estrutura da Tabela (Verificada)

| Campo | Tipo | Null | Key | Default |
|-------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | NULL |
| titulo | varchar(255) | NO | MUL | NULL |
| slug | varchar(255) | NO | UNI | NULL |
| descricao | text | YES | | NULL |
| conteudo | longtext | NO | | NULL |
| categoria | enum(...) | NO | MUL | Outros |
| tags | json | YES | | NULL |
| versao | varchar(50) | NO | | 1.0.0 |
| autor | varchar(255) | NO | MUL | NULL |
| aplicacao_id | varchar(36) | YES | MUL | NULL |
| status | enum(...) | NO | MUL | Rascunho |
| data_publicacao | timestamp | YES | | NULL |
| data_ultima_atualizacao | timestamp | NO | | CURRENT_TIMESTAMP |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

## 🎯 Checklist de Inicialização

- [ ] **Docker MySQL** está rodando
  ```bash
  docker ps | grep mysql-master
  ```

- [ ] **Servidor Backend** está rodando
  ```bash
  ps aux | grep "node.*api.js"
  ```

- [ ] **Servidor responde** na porta 3000
  ```bash
  curl http://localhost:3000/api/health || curl http://localhost:3000/api/documentacao-projetos
  ```

- [ ] **Frontend** está rodando
  ```bash
  ps aux | grep "vite.*5173"
  # OU apenas verificar se http://localhost:5173 carrega
  ```

## 🔄 Ordem de Inicialização Correta

```bash
# 1. Docker (se não estiver rodando)
docker-compose up -d mysql-master

# 2. Backend
cd /Users/horaciovasconcellos/repositorio/codewiki
node server/api.js &

# 3. Frontend
npm run dev
```

## 📊 Logs Úteis para Debug

### Ver logs do servidor (se rodando em background)
```bash
tail -f logs/server.log
```

### Ver logs do MySQL
```bash
docker logs mysql-master --tail=50 -f
```

### Testar conexão do Node com MySQL
```bash
node -e "const mysql = require('mysql2/promise'); mysql.createPool({host:'localhost',port:3308,user:'app_user',password:'apppass123',database:'auditoria_db'}).query('SELECT 1').then(()=>console.log('✅ OK')).catch(e=>console.error('❌',e));"
```

## ⚡ Script de Início Rápido

Crie um arquivo `start-all.sh`:

```bash
#!/bin/bash

echo "🐳 Iniciando MySQL..."
docker-compose up -d mysql-master
sleep 5

echo "🚀 Iniciando Backend..."
cd /Users/horaciovasconcellos/repositorio/codewiki
nohup node server/api.js > logs/server.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

echo "🎨 Iniciando Frontend..."
npm run dev

echo "✅ Tudo pronto!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
```

```bash
chmod +x start-all.sh
./start-all.sh
```

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
cd /Users/horaciovasconcellos/repositorio/codewiki
npm install
```

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo usando porta 3000
lsof -ti:3000 | xargs kill -9
```

### Erro: "MySQL connection refused"
```bash
# Verificar se MySQL está rodando
docker ps | grep mysql-master

# Se não estiver, iniciar
docker-compose up -d mysql-master

# Aguardar alguns segundos
sleep 5
```

---

**Status:** 🔧 Aguardando usuário iniciar servidor

**Próximo passo:** Executar `node server/api.js` e testar novamente
