#!/bin/bash

# Script rápido para reiniciar containers e aplicar mudanças

echo "========================================"
echo "Reiniciando Containers"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}1. Parando containers...${NC}"
docker-compose down

echo ""
echo -e "${BLUE}2. Removendo containers antigos...${NC}"
docker-compose rm -f

echo ""
echo -e "${BLUE}3. Reconstruindo containers (sem cache)...${NC}"
docker-compose build --no-cache app

echo ""
echo -e "${BLUE}4. Iniciando containers...${NC}"
docker-compose up -d

echo ""
echo -e "${BLUE}5. Aguardando inicialização...${NC}"
sleep 5

echo ""
echo -e "${BLUE}6. Status dos containers:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✓ Containers reiniciados!${NC}"
echo ""
echo "Serviços disponíveis:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  MySQL:    localhost:3306"
echo ""
echo "Para ver os logs:"
echo "  docker-compose logs -f app"
echo ""
