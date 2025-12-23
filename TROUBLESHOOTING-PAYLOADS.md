# Troubleshooting - Tela de Payloads

## Erro: "Unexpected token '<', '<!DOCTYPE '... is not valid JSON"

### Causa
Este erro ocorre quando o frontend tenta fazer uma requisição à API mas recebe HTML em vez de JSON. Isso acontece quando:
1. A rota da API não existe
2. O servidor da API não está rodando
3. A tabela do banco de dados não foi criada

### Solução

#### 1. Verificar se a tabela existe no banco
```bash
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "SHOW TABLES LIKE 'payloads';"
```

Se a tabela não existir, execute a migration:
```bash
docker exec -i mysql-master mysql -u root -prootpass123 auditoria_db < database/32-create-payloads.sql
```

#### 2. Verificar se a API está rodando
```bash
docker logs auditoria-app --tail 30
```

Procure por:
```
🚀 API Server rodando em http://localhost:3000
```

#### 3. Testar a rota da API
```bash
curl http://localhost:3000/api/payloads
```

Se retornar HTML com "Cannot GET /api/payloads", significa que a rota não foi carregada.

#### 4. Reiniciar os containers
```bash
# Reiniciar todos os containers
docker compose down
docker compose up -d

# Aguardar inicialização (15-20 segundos)
sleep 15

# Testar novamente
curl http://localhost:3000/api/payloads
```

#### 5. Verificar se o código está no container
```bash
docker exec auditoria-app grep "ROTAS DE PAYLOADS" server/api.js
```

Se não aparecer nada, o arquivo não está sendo montado corretamente no container.

### Verificação Completa

Execute este script para verificar tudo:

```bash
#!/bin/bash

echo "=== Verificando Tabela ==="
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "SHOW TABLES LIKE 'payloads';"

echo -e "\n=== Verificando Containers ==="
docker ps | grep -E "mysql-master|auditoria-app"

echo -e "\n=== Testando API ==="
curl -s http://localhost:3000/api/payloads | jq '.' 2>/dev/null || echo "Erro ao acessar API"

echo -e "\n=== Verificando Logs ==="
docker logs auditoria-app --tail 10
```

## Outros Problemas Comuns

### Erro 404 ao criar payload
**Causa**: Aplicação não cadastrada
**Solução**: Cadastrar pelo menos uma aplicação antes de criar payloads

### Erro "Duplicate entry"
**Causa**: Sigla já existe
**Solução**: Usar uma sigla única para cada payload

### Validação falha mesmo com JSON válido
**Causa**: JSON válido mas sem estrutura OpenAPI
**Solução**: Garantir que o JSON contenha:
- Propriedade `openapi` ou `swagger`
- Seção `info`
- Seção `paths` ou `components`

### Exemplo mínimo de OpenAPI válido:
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Minha API",
    "version": "1.0.0"
  },
  "paths": {}
}
```

## Comandos Úteis

### Ver todos os payloads
```bash
curl http://localhost:3000/api/payloads | jq
```

### Ver payload específico
```bash
curl http://localhost:3000/api/payloads/ID_DO_PAYLOAD | jq
```

### Logs em tempo real
```bash
docker logs -f auditoria-app
```

### Reiniciar apenas a aplicação
```bash
docker restart auditoria-app
```

### Status dos containers
```bash
docker compose ps
```

### Reconstruir tudo do zero
```bash
docker compose down -v
docker compose up -d --build
```

## Contatos de Suporte

Para problemas persistentes, verificar:
1. Logs do container: `docker logs auditoria-app`
2. Logs do MySQL: `docker logs mysql-master`
3. Console do browser (F12) para erros no frontend
