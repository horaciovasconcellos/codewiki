#!/bin/bash

################################################################################
# SCRIPT DE PRÉ-VERIFICAÇÃO DE DEPLOY
# Verifica se o ambiente está pronto para deploy em produção
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PRÉ-VERIFICAÇÃO DE DEPLOY - Sistema Auditoria║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar Docker
echo -n "Verificando Docker... "
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    echo -e "${GREEN}✓${NC} (versão $DOCKER_VERSION)"
else
    echo -e "${RED}✗${NC} Docker não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Docker Compose
echo -n "Verificando Docker Compose... "
if docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo -e "${GREEN}✓${NC} (versão $COMPOSE_VERSION)"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    echo -e "${GREEN}✓${NC} (versão $COMPOSE_VERSION)"
else
    echo -e "${RED}✗${NC} Docker Compose não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Node.js
echo -n "Verificando Node.js... "
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} ($NODE_VERSION)"
else
    echo -e "${RED}✗${NC} Node.js não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Verificar npm
echo -n "Verificando npm... "
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} (v$NPM_VERSION)"
else
    echo -e "${RED}✗${NC} npm não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar arquivo .env.production
echo -n "Verificando .env.production... "
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} Encontrado"
    
    # Verificar senhas padrão
    if grep -q "rootpass123\|apppass123\|SuaSenha" ".env.production"; then
        echo -e "  ${YELLOW}⚠${NC}  Senhas padrão detectadas!"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Verificar variáveis obrigatórias
    REQUIRED_VARS=(
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "NODE_ENV"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" ".env.production"; then
            echo -e "  ${YELLOW}⚠${NC}  Variável $var não encontrada"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} Não encontrado"
    echo -e "  ${BLUE}ℹ${NC}  Execute: cp .env.example .env.production"
    ERRORS=$((ERRORS + 1))
fi

# Verificar arquivos essenciais
echo ""
FILES=(
    "docker-compose.prod.yml:Configuração Docker Compose de produção"
    "Dockerfile.production:Dockerfile de produção"
    "nginx.prod.conf:Configuração Nginx de produção"
    "package.json:Configuração npm"
)

for file_info in "${FILES[@]}"; do
    IFS=':' read -r file desc <<< "$file_info"
    echo -n "Verificando $desc... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC} $file não encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done

# Verificar espaço em disco
echo ""
echo -n "Verificando espaço em disco... "
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
AVAILABLE_SPACE_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE_SPACE_GB" -gt 5 ]; then
    echo -e "${GREEN}✓${NC} ($AVAILABLE_SPACE disponível)"
else
    echo -e "${YELLOW}⚠${NC}  Espaço limitado ($AVAILABLE_SPACE disponível)"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar portas
echo ""
echo "Verificando portas necessárias..."
PORTS=(80 443 3000 3306)

for port in "${PORTS[@]}"; do
    echo -n "  Porta $port... "
    if ! lsof -i ":$port" >/dev/null 2>&1 && ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✓${NC} Disponível"
    else
        echo -e "${YELLOW}⚠${NC}  Em uso"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# Verificar permissões
echo ""
echo -n "Verificando permissões de escrita... "
if [ -w "." ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} Sem permissão de escrita"
    ERRORS=$((ERRORS + 1))
fi

# Resumo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Sistema pronto para deploy!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Sistema pronto, mas com $WARNINGS avisos${NC}"
    echo -e "${YELLOW}Revise os avisos antes de continuar${NC}"
    exit 0
else
    echo -e "${RED}❌ Sistema NÃO está pronto para deploy${NC}"
    echo -e "${RED}Erros encontrados: $ERRORS${NC}"
    echo -e "${YELLOW}Avisos: $WARNINGS${NC}"
    exit 1
fi
