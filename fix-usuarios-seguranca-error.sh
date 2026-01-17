#!/bin/bash

# Script para corrigir erro 500 no endpoint /api/usuarios-seguranca
# Este script verifica e corrige problemas comuns

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Diagnóstico e Correção - /api/usuarios-seguranca          ║${NC}"
echo -e "${BLUE}╚═════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Verificar se MySQL está rodando
echo -e "${YELLOW}1. Verificando MySQL...${NC}"
if pgrep -x mysqld > /dev/null 2>&1 || pgrep -x "mariadbd" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MySQL está rodando${NC}"
else
    echo -e "${RED}✗ MySQL NÃO está rodando${NC}"
    echo -e "${YELLOW}Tentando iniciar MySQL...${NC}"
    
    if command -v brew > /dev/null 2>&1; then
        brew services start mysql || brew services start mariadb
    else
        echo -e "${RED}Execute: sudo systemctl start mysql${NC}"
        exit 1
    fi
fi

# 2. Verificar conexão com banco
echo -e "\n${YELLOW}2. Verificando conexão com banco...${NC}"
if mysql -u root -proot -e "SELECT 1" codewiki > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexão com banco OK${NC}"
else
    echo -e "${RED}✗ Não foi possível conectar ao banco${NC}"
    echo -e "${YELLOW}Verifique usuário/senha em server/api.js${NC}"
    exit 1
fi

# 3. Verificar se a tabela existe
echo -e "\n${YELLOW}3. Verificando tabela usuarios_seguranca...${NC}"
TABLE_EXISTS=$(mysql -u root -proot codewiki -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='codewiki' AND table_name='usuarios_seguranca'")

if [ "$TABLE_EXISTS" -eq "1" ]; then
    echo -e "${GREEN}✓ Tabela usuarios_seguranca existe${NC}"
    
    # Mostrar estrutura
    echo -e "\n${BLUE}Estrutura da tabela:${NC}"
    mysql -u root -proot codewiki -e "DESCRIBE usuarios_seguranca"
    
    # Contar registros
    COUNT=$(mysql -u root -proot codewiki -sse "SELECT COUNT(*) FROM usuarios_seguranca")
    echo -e "\n${BLUE}Total de registros: ${COUNT}${NC}"
else
    echo -e "${RED}✗ Tabela usuarios_seguranca NÃO existe${NC}"
    echo -e "${YELLOW}Criando tabela...${NC}"
    
    mysql -u root -proot codewiki < database/migrations/fix-usuarios-seguranca.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Tabela criada com sucesso!${NC}"
    else
        echo -e "${RED}✗ Erro ao criar tabela${NC}"
        exit 1
    fi
fi

# 4. Verificar se há usuários
echo -e "\n${YELLOW}4. Verificando usuários...${NC}"
USER_COUNT=$(mysql -u root -proot codewiki -sse "SELECT COUNT(*) FROM usuarios_seguranca" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  Nenhum usuário encontrado. Criando usuário admin...${NC}"
    
    mysql -u root -proot codewiki <<EOF
INSERT INTO usuarios_seguranca (
  login, 
  password_hash, 
  data_vigencia_inicial, 
  status, 
  salt_usado,
  created_by
) VALUES (
  'admin',
  '\$2b\$10\$N9qo8uLOickgx2ZMRZoMye.IxrXwJdGXFKvVZVbKzGbXOXNJ0/V6i',
  NOW(),
  'ATIVO',
  'default_salt_12345678901234',
  'SYSTEM'
) ON DUPLICATE KEY UPDATE id=id;
EOF
    
    echo -e "${GREEN}✓ Usuário admin criado (senha: admin123)${NC}"
else
    echo -e "${GREEN}✓ $USER_COUNT usuário(s) encontrado(s)${NC}"
fi

# 5. Verificar se o servidor está rodando
echo -e "\n${YELLOW}5. Verificando servidor Node.js...${NC}"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Servidor está respondendo${NC}"
else
    echo -e "${RED}✗ Servidor NÃO está respondendo${NC}"
    echo -e "${YELLOW}Inicie o servidor com: npm run dev${NC}"
fi

# 6. Testar endpoint
echo -e "\n${YELLOW}6. Testando endpoint /api/usuarios-seguranca...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/usuarios-seguranca 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint funcionando! Status: $HTTP_CODE${NC}"
    echo -e "${BLUE}Resposta:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Erro no endpoint! Status: $HTTP_CODE${NC}"
    echo -e "${BLUE}Resposta:${NC}"
    echo "$BODY"
fi

echo -e "\n${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Diagnóstico concluído!${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Se o problema persistir:${NC}"
echo "  1. Verifique os logs: tail -f logs/app.log"
echo "  2. Reinicie o servidor: npm run dev"
echo "  3. Verifique a conexão com MySQL no server/api.js"
echo ""
