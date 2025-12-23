# Troubleshooting - Problema de Gravação no Runbook

## Problema Relatado

Tela de RUNBOOK com problema na gravação.

## Verificações Realizadas

### 1. Código do Backend (server/api.js)

✅ **POST /api/runbooks** (linha 2332-2381)
- Está correto e recebe todos os campos
- Usa `INSERT INTO runbooks` com 27 campos
- Mapeia corretamente os objetos aninhados (preRequisitos, procedimentoOperacional, etc.)

✅ **PUT /api/runbooks/:id** (linha 2387-2440)
- Está correto e atualiza todos os campos
- Usa `UPDATE runbooks SET` com 26 campos + WHERE id = ?
- Mesma lógica de mapeamento do POST

### 2. Código do Frontend

✅ **RunbookWizard.tsx**
- FormData inicializado corretamente com todos os objetos aninhados
- Função `updateFormData` está funcionando
- Console.log mostra os dados antes de salvar
- Validação do Step 1 implementada

✅ **RunbooksView.tsx**
- handleSave chama `apiPost` ou `apiPut` corretamente
- Console.log mostra os dados recebidos
- Toast de sucesso/erro funcionando

✅ **StepRiscos.tsx**
- Campo `riscosMitigacoes` sendo atualizado corretamente
- Console.log mostra as atualizações
- Todos os 3 campos (principaisRiscos, acoesPreventivas, acoesCorretivasRapidas) mapeados

### 3. Schema do Banco de Dados

✅ **Tabela runbooks** (database/init-master.sql linha 394-434)
- 29 campos + timestamps
- Todos os campos TEXT ou VARCHAR
- Permite NULL em campos opcionais

## Possíveis Causas do Problema

### 1. Servidor não está rodando

**Sintoma:** Requisição não chega ao backend

**Como verificar:**
```bash
# Verificar se há processo na porta 3000
lsof -ti:3000

# Tentar acessar a API
curl http://localhost:3000/api/runbooks

# Ver logs do servidor
tail -f /tmp/api-server.log
```

**Solução:**
```bash
# Iniciar o Docker
open -a Docker
# Aguardar 30 segundos

# Verificar containers
docker ps | grep mysql

# Iniciar servidor (escolha uma opção):

# Opção 1: Via Docker Compose
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
docker-compose up -d

# Opção 2: Manualmente com variáveis de ambiente
pkill -f "node server/api.js"
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
MYSQL_HOST=mysql-master \
MYSQL_USER=app_user \
MYSQL_PASSWORD=apppass123 \
node server/api.js > /tmp/api-server.log 2>&1 &

# Se estiver rodando FORA do Docker:
MYSQL_HOST=127.0.0.1 \
MYSQL_USER=root \
MYSQL_PASSWORD=rootpass123 \
node server/api.js > /tmp/api-server.log 2>&1 &
```

### 2. Problema de conexão com MySQL

**Sintoma:** Erro "Access denied" ou "ECONNREFUSED"

**Como verificar:**
```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Testar conexão direta
docker exec mysql-master mysql -u root -prootpass123 -e "SELECT COUNT(*) FROM auditoria_db.runbooks;"
```

**Solução:**
```bash
# Reiniciar containers MySQL
docker restart mysql-master mysql-slave

# Aguardar 30 segundos e verificar health
docker ps | grep mysql
# Deve mostrar "healthy"
```

### 3. Campos vazios ou dados inválidos

**Sintoma:** Erro 400 ou validação falha

**Como verificar:**

Abra o DevTools (F12) → Console e procure por:
```
[RunbookWizard] Salvando runbook: {...}
[RunbooksView] Salvando runbook: {...}
```

Verifique se:
- `sigla` não está vazia
- `descricaoResumida` não está vazia
- `finalidade` não está vazia
- `tipoRunbook` é um valor válido

**Solução:**

Se faltar campos obrigatórios, o wizard mostra um toast de erro. Preencha todos os campos obrigatórios no Step 1.

### 4. Erro de CORS ou Network

**Sintoma:** Erro de rede no console do navegador

**Como verificar:**

No DevTools → Network, procure pela requisição para `/api/runbooks` e veja:
- Status Code
- Response
- Request Payload

**Solução:**

Se for erro de CORS, verifique se o servidor está com `app.use(cors())` habilitado (linha 70 do api.js - já está correto).

### 5. Tamanho de payload muito grande

**Sintoma:** Erro 413 (Payload Too Large)

**Solução:**

No `server/api.js`, adicione após a linha 69:
```javascript
app.use(express.json({ limit: '10mb' }));
```

## Debug Passo a Passo

### 1. Abrir DevTools

Pressione F12 e vá para a aba Console

### 2. Criar um novo Runbook

Clique em "Novo Runbook" e preencha os campos

### 3. Verificar logs no console

Você deve ver algo como:
```
[RunbookWizard] Atualizando formData: {...}
[RunbookWizard] FormData atualizado: {...}
[StepRiscos] Atualizando campo: principaisRiscos valor: ...
[RunbookWizard] Salvando runbook: {...}
[RunbooksView] Salvando runbook: {...}
```

### 4. Verificar requisição de rede

Na aba Network, procure:
- `POST /api/runbooks` (para novo)
- `PUT /api/runbooks/:id` (para edição)

Clique na requisição e veja:
- **Headers:** Status Code, Content-Type
- **Payload:** Dados enviados
- **Response:** Resposta do servidor

### 5. Verificar banco de dados

```bash
# Conectar ao MySQL
docker exec -it mysql-master mysql -u root -prootpass123 auditoria_db

# Ver runbooks criados
SELECT id, sigla, descricao_resumida, tipo_runbook, created_at 
FROM runbooks 
ORDER BY created_at DESC 
LIMIT 5;

# Ver um runbook específico (copie o ID do console)
SELECT * FROM runbooks WHERE id = 'seu-id-aqui'\G

# Sair
exit;
```

## Comandos Úteis

### Ver logs do servidor em tempo real

```bash
tail -f /tmp/api-server.log | grep -i runbook
```

### Verificar processos Node rodando

```bash
ps aux | grep node
```

### Matar todos os processos Node (cuidado!)

```bash
pkill -f "node server/api.js"
```

### Testar API manualmente

```bash
# Criar runbook
curl -X POST http://localhost:3000/api/runbooks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "sigla": "TEST",
    "descricaoResumida": "Teste",
    "finalidade": "Testar API",
    "tipoRunbook": "Procedimento de Rotina",
    "preRequisitos": {
      "acessosNecessarios": "Nenhum",
      "validacoesAntesIniciar": "",
      "ferramentasNecessarias": ""
    },
    "procedimentoOperacional": {
      "comandos": "echo test",
      "pontosAtencao": "",
      "checksIntermediarios": "",
      "criteriosSucesso": "",
      "criteriosFalha": ""
    },
    "posExecucao": {
      "validacoesObrigatorias": "",
      "verificacaoLogs": "",
      "statusEsperadoAplicacao": "",
      "notificacoesNecessarias": ""
    },
    "execucaoAutomatizada": {
      "scriptsRelacionados": "",
      "jobsAssociados": "",
      "urlLocalizacaoScripts": "",
      "condicoesAutomacao": ""
    },
    "evidencias": {
      "printsLogsNecessarios": "",
      "arquivosGerados": "",
      "tempoMedioExecucao": ""
    },
    "riscosMitigacoes": {
      "principaisRiscos": "Teste de risco",
      "acoesPreventivas": "Teste de preventivas",
      "acoesCorretivasRapidas": "Teste de corretivas"
    }
  }'
```

### Listar runbooks

```bash
curl http://localhost:3000/api/runbooks
```

## Checklist de Verificação

- [ ] Docker está rodando (`docker ps`)
- [ ] Containers MySQL estão "healthy"
- [ ] Servidor Node está rodando na porta 3000 (`lsof -ti:3000`)
- [ ] Frontend pode acessar a API (`curl http://localhost:3000/api/runbooks`)
- [ ] Não há erros no console do navegador (F12)
- [ ] Campos obrigatórios estão preenchidos (sigla, descricaoResumida, finalidade, tipoRunbook)
- [ ] Requisição aparece na aba Network do DevTools
- [ ] Status da requisição é 201 (Created) ou 200 (OK)

## Logs Importantes

### No Console do Navegador (F12):

```
[RunbookWizard] Salvando runbook: { id: "...", sigla: "...", ... }
[RunbooksView] Salvando runbook: { ... }
[RunbooksView] Adicionando novo runbook: ...
```

ou

```
[RunbooksView] Atualizando runbook existente: ...
```

### No Servidor (/tmp/api-server.log):

```
[API] POST /api/runbooks - Criando runbook: TEST
```

ou

```
[API] PUT /api/runbooks/:id - Atualizando runbook: abc-123
```

## Se nada funcionar...

1. **Reinicie tudo:**
```bash
# Parar tudo
docker-compose down
pkill -f "node server/api.js"

# Aguardar 5 segundos

# Iniciar tudo
docker-compose up -d

# Aguardar 30 segundos

# Verificar saúde
docker ps | grep healthy

# Iniciar servidor
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
node server/api.js > /tmp/api-server.log 2>&1 &
```

2. **Verificar se a tabela existe:**
```bash
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "SHOW CREATE TABLE runbooks\G"
```

3. **Recriar tabela (CUIDADO - apaga dados!):**
```bash
docker exec -i mysql-master mysql -u root -prootpass123 auditoria_db < database/init-master.sql
```

## Próximos Passos

Se o problema persistir, envie as seguintes informações:

1. **Output do console do navegador** (F12 → Console)
2. **Network request** (F12 → Network → clique na requisição POST/PUT)
3. **Logs do servidor:** `cat /tmp/api-server.log | grep -A 10 -B 10 runbook`
4. **Status dos containers:** `docker ps`
5. **Dados que está tentando salvar** (JSON do payload)

Isso ajudará a identificar exatamente onde está o problema.
