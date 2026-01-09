#!/bin/bash

# Script de teste para extrair requisitos do PRD
# Primeiro vamos criar um projeto com PRD e depois extrair

PROJECT_ID="233e8fe3-0034-4353-b258-5c2fc4dbdeb1"

# PRD de exemplo simplificado
PRD_CONTENT='# Requisitos Sistema

## 1. REQUISITOS FUNCIONAIS

### RF001 - Login de Usuários

#### RF001.1 - Autenticação
**Descrição:** O sistema deve autenticar usuários.

**Critérios de Aceitação:**
- Validar credenciais
- Criar sessão

**Prioridade:** Alta

#### RF001.2 - Logout
**Descrição:** O sistema deve permitir logout.

**Prioridade:** Média'

echo "=== Atualizando projeto com PRD ==="
curl -X PUT http://localhost:3000/api/sdd/projetos/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -d "{
    \"nome_projeto\": \"Sistema de Viagem\",
    \"ia_selecionada\": \"claude\",
    \"prd_content\": $(echo "$PRD_CONTENT" | jq -Rs .)
  }"

echo -e "\n\n=== Extraindo requisitos do PRD ==="
curl -X POST http://localhost:3000/api/sdd/projetos/$PROJECT_ID/extrair-requisitos-prd \
  -H "Content-Type: application/json"

echo -e "\n\n=== Verificando requisitos criados ==="
curl -X GET http://localhost:3000/api/sdd/requisitos/$PROJECT_ID

echo -e "\n\n=== Done! ==="
