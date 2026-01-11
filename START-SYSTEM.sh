#!/bin/bash

echo "========================================="
echo "  CodeWiki - Sistema de Inicialização"
echo "========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Docker
echo -e "${YELLOW}[1/5] Verificando Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker não está rodando${NC}"
    echo "  Iniciando Docker Desktop..."
    open -a Docker
    echo "  Aguardando Docker inicializar (45 segundos)..."
    sleep 45
    
    # Verificar novamente
    if ! docker ps > /dev/null 2>&1; then
        echo -e "${RED}✗ Docker falhou ao iniciar${NC}"
        echo "  Por favor, inicie o Docker Desktop manualmente e execute este script novamente"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Docker está rodando${NC}"
echo ""

# 2. Iniciar containers MySQL
echo -e "${YELLOW}[2/5] Iniciando containers MySQL...${NC}"
docker-compose up -d mysql-master mysql-slave
sleep 10

# Verificar se os containers estão rodando
if docker ps | grep -q "mysql-master" && docker ps | grep -q "mysql-slave"; then
    echo -e "${GREEN}✓ MySQL Master e Slave iniciados${NC}"
    docker ps | grep mysql
else
    echo -e "${RED}✗ Falha ao iniciar containers MySQL${NC}"
    exit 1
fi
echo ""

# 3. Aguardar MySQL ficar pronto
echo -e "${YELLOW}[3/5] Aguardando MySQL ficar pronto...${NC}"
for i in {1..30}; do
    if docker exec mysql-master mysqladmin ping -h localhost -uroot -prootpass123 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MySQL pronto para conexões${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""
echo ""

# 4. Verificar credenciais e banco
echo -e "${YELLOW}[4/5] Verificando usuário e banco de dados...${NC}"
USER_EXISTS=$(docker exec mysql-master mysql -uroot -prootpass123 -e "SELECT COUNT(*) FROM mysql.user WHERE User='app_user'" -sN 2>/dev/null)
DB_EXISTS=$(docker exec mysql-master mysql -uroot -prootpass123 -e "SHOW DATABASES LIKE 'auditoria_db'" -sN 2>/dev/null)

if [ "$USER_EXISTS" = "0" ]; then
    echo "  Criando usuário app_user..."
    docker exec mysql-master mysql -uroot -prootpass123 -e "CREATE USER 'app_user'@'%' IDENTIFIED BY 'apppass123';"
    docker exec mysql-master mysql -uroot -prootpass123 -e "GRANT ALL PRIVILEGES ON auditoria_db.* TO 'app_user'@'%';"
    docker exec mysql-master mysql -uroot -prootpass123 -e "FLUSH PRIVILEGES;"
    echo -e "${GREEN}✓ Usuário criado${NC}"
else
    echo -e "${GREEN}✓ Usuário app_user já existe${NC}"
fi

if [ -z "$DB_EXISTS" ]; then
    echo "  Criando banco auditoria_db..."
    docker exec mysql-master mysql -uroot -prootpass123 -e "CREATE DATABASE auditoria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo -e "${GREEN}✓ Banco criado${NC}"
else
    echo -e "${GREEN}✓ Banco auditoria_db já existe${NC}"
fi
echo ""

# 5. Iniciar servidores
echo -e "${YELLOW}[5/5] Iniciando servidores Node.js...${NC}"

# Liberar portas se estiverem em uso
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 2

# Iniciar servidores
npm run dev:all &
SERVERS_PID=$!

echo "  Aguardando servidores iniciarem..."
sleep 8

# Verificar se os servidores estão rodando
if lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend (Vite) rodando em http://localhost:5173${NC}"
else
    echo -e "${RED}✗ Frontend não iniciou${NC}"
fi

if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend (API) rodando em http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠ Backend iniciando (pode levar alguns segundos para conectar ao MySQL)${NC}"
fi
echo ""

echo "========================================="
echo -e "${GREEN}  Sistema Iniciado!${NC}"
echo "========================================="
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  MySQL Master: localhost:3308"
echo "  MySQL Slave: localhost:3307"
echo ""
echo "Para parar os servidores, pressione Ctrl+C neste terminal"
echo ""

# Manter o script rodando e mostrar logs
wait $SERVERS_PID
