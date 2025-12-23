# Debug - Azure DevOps Integration

## Comandos para Verificar Logs

### 1. Verificar logs de erro no banco de dados

```sql
-- Últimos 50 erros relacionados ao Azure DevOps
SELECT 
  id,
  timestamp,
  user_id,
  screen_name,
  event_name,
  severity,
  error_message,
  stack_trace,
  attributes
FROM logs_auditoria
WHERE event_name LIKE '%azure%'
ORDER BY timestamp DESC
LIMIT 50;
```

```sql
-- Erros de criação de projeto
SELECT 
  id,
  timestamp,
  event_name,
  error_message,
  JSON_EXTRACT(attributes, '$.projeto_nome') as projeto,
  JSON_EXTRACT(attributes, '$.error_details') as detalhes
FROM logs_auditoria
WHERE event_name IN (
  'azure_project_creation_failed',
  'azure_project_creation_exception',
  'form_azure_creation_failed',
  'form_azure_creation_exception'
)
ORDER BY timestamp DESC;
```

### 2. Verificar status dos projetos

```sql
-- Projetos com erro
SELECT 
  id,
  produto,
  projeto,
  status,
  azure_project_id,
  azure_project_url,
  erro_mensagem,
  data_criacao,
  data_atualizacao
FROM integrador_projetos
WHERE status = 'erro'
ORDER BY data_atualizacao DESC;
```

### 3. Logs no Console do Navegador

Quando você clica no botão "Criar no Azure DevOps" ou "Salvar e Criar no Azure", o sistema imprime informações detalhadas no console:

```
═══════════════════════════════════════════════════
🚀 CRIAÇÃO DE PROJETO NO AZURE DEVOPS
═══════════════════════════════════════════════════
Endpoint: /api/azure-devops/setup-project
Organização: sua-organizacao
Projeto: Nome do Projeto
Process Template: Scrum
Time: Nome do Time
Data Inicial: 2024-01-15
Criar Time Sustentação: true
Áreas/Repositórios: ['backend-Java', 'frontend-Angular', 'mobile-Flutter']
───────────────────────────────────────────────────
Payload Completo: {
  "organization": "sua-organizacao",
  "pat": "***",
  "projectName": "Nome do Projeto",
  "workItemProcess": "Scrum",
  "teamName": "Nome do Time",
  "startDate": "2024-01-15",
  "criarTimeSustentacao": true,
  "areas": [
    { "name": "backend-Java", "path": null },
    { "name": "frontend-Angular", "path": null },
    { "name": "mobile-Flutter", "path": null }
  ]
}
═══════════════════════════════════════════════════
```

**Em caso de sucesso:**
```
✅ PROJETO CRIADO COM SUCESSO
Resultado: {
  "data": {
    "project": { "id": "...", "name": "...", "url": "..." },
    "teams": [...],
    "iterations": [...],
    "areas": [...]
  }
}
═══════════════════════════════════════════════════
```

**Em caso de erro:**
```
❌ ERRO NA CRIAÇÃO DO PROJETO
Status: 400
Erro: {
  "message": "Erro detalhado aqui",
  "details": "..."
}
═══════════════════════════════════════════════════
```

## Comandos de Teste

### 1. Testar configuração do Azure DevOps

```bash
# Verificar se as configurações estão no banco
mysql -u root -p auditoria_db -e "SELECT chave, valor FROM configuracoes WHERE chave = 'integration-config';"
```

### 2. Testar endpoint da API manualmente

```bash
# Criar um projeto de teste
curl -X POST http://localhost:3000/api/azure-devops/setup-project \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "sua-organizacao",
    "pat": "seu-token-aqui",
    "projectName": "Projeto-Teste",
    "workItemProcess": "Scrum",
    "teamName": "Time Teste",
    "startDate": "2024-01-15",
    "criarTimeSustentacao": true,
    "areas": [
      { "name": "backend-Java", "path": null },
      { "name": "frontend-Angular", "path": null }
    ]
  }'
```

### 3. Verificar logs do servidor

```bash
# Ver logs do container Docker
docker logs -f auditoria-app

# Ou se estiver rodando localmente
# Os logs aparecem no terminal onde o servidor está executando
```

## Problemas Comuns

### 1. Erro 401 - Unauthorized

**Causa:** Personal Access Token inválido ou expirado

**Solução:**
1. Vá em Configurações → Azure DevOps
2. Verifique se o Personal Access Token está correto
3. Gere um novo token no Azure DevOps se necessário
4. Certifique-se de que o token tem as permissões:
   - Project (Read, Write, Manage)
   - Team (Read, Write)
   - Work Items (Read, Write)

### 2. Erro 400 - Bad Request

**Causa:** Dados inválidos no payload

**Verifique:**
- Nome do projeto não pode conter caracteres especiais
- Process Template deve ser: Scrum, Agile, CMMI ou Basic
- Data inicial deve estar no formato YYYY-MM-DD
- Organização deve ser apenas o nome (não a URL completa)

### 3. Erro "Organization not found"

**Causa:** URL da organização incorreta

**Solução:**
1. A URL deve estar no formato: `https://dev.azure.com/sua-organizacao`
2. Apenas o nome da organização é extraído (última parte da URL)

### 4. Erros não aparecem nos logs

**Causa:** Logging não estava implementado (CORRIGIDO)

**Agora:** Todos os erros são gravados na tabela `logs_auditoria` com:
- Mensagem de erro completa
- Stack trace
- Detalhes do projeto
- Payload enviado

## Verificação de Saúde do Sistema

```sql
-- Resumo geral
SELECT 
  status,
  COUNT(*) as total,
  GROUP_CONCAT(projeto SEPARATOR ', ') as projetos
FROM integrador_projetos
GROUP BY status;

-- Últimas atividades
SELECT 
  timestamp,
  event_name,
  screen_name,
  severity,
  SUBSTRING(error_message, 1, 100) as erro
FROM logs_auditoria
WHERE screen_name IN ('Integrador', 'IntegradorForm')
ORDER BY timestamp DESC
LIMIT 20;
```

## Comandos de Limpeza

```sql
-- Resetar projeto para tentar novamente
UPDATE integrador_projetos 
SET 
  status = 'pendente',
  erro_mensagem = NULL,
  azure_project_id = NULL,
  azure_project_url = NULL,
  azure_team_id = NULL
WHERE id = 'id-do-projeto';

-- Limpar logs antigos (mais de 30 dias)
DELETE FROM logs_auditoria 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Monitoramento em Tempo Real

Abra o console do navegador (F12) e vá para a aba "Console". Todos os comandos e payloads serão exibidos quando você:

1. Clicar no botão ▶️ (Play) de um projeto pendente
2. Clicar em "Salvar e Criar no Azure" no formulário

As informações mostradas incluem:
- Endpoint chamado
- Organização
- Nome do projeto
- Configurações
- Payload JSON completo
- Resultado (sucesso ou erro)

Essas informações podem ser copiadas e usadas para:
- Reproduzir erros
- Testar manualmente via curl
- Debugar problemas de configuração
- Validar dados antes de enviar
