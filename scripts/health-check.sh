#!/bin/bash

################################################################################
# HEALTH CHECK - Sistema de Auditoria
# Verifica saúde completa da aplicação em produção
################################################################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     HEALTH CHECK - Sistema de Auditoria          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# ==================== Containers ====================
echo -e "${BOLD}[1] Verificando Containers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONTAINERS=(
    "auditoria-app-prod:Aplicação"
    "mysql-master-prod:MySQL Master"
    "nginx-prod:Nginx"
)

for container_info in "${CONTAINERS[@]}"; do
    IFS=':' read -r container name <<< "$container_info"
    echo -n "  $name... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        # Verificar health status
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
        
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "${GREEN}✓ Healthy${NC}"
        elif [ "$HEALTH" = "unknown" ]; then
            echo -e "${GREEN}✓ Running${NC}"
        else
            echo -e "${YELLOW}⚠ $HEALTH${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}✗ Não está rodando${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ==================== Endpoints ====================
echo -e "${BOLD}[2] Verificando Endpoints${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint() {
    local url="$1"
    local name="$2"
    local expected_code="${3:-200}"
    
    echo -n "  $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ ($response)${NC}"
    elif [ -z "$response" ]; then
        echo -e "${RED}✗ Sem resposta${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${YELLOW}⚠ Código $response (esperado $expected_code)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

test_endpoint "http://localhost/health" "Health Check"
test_endpoint "http://localhost/api/aplicacoes" "API"
test_endpoint "http://localhost/" "Frontend"

echo ""

# ==================== Banco de Dados ====================
echo -e "${BOLD}[3] Verificando Banco de Dados${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q mysql-master-prod; then
    echo -n "  Conexão... "
    
    # Carregar env
    source .env.production 2>/dev/null || source .env 2>/dev/null || true
    DB_PASS="${MYSQL_ROOT_PASSWORD:-rootpass123}"
    
    if docker exec mysql-master-prod mysqladmin -u root -p"${DB_PASS}" ping 2>/dev/null | grep -q "mysqld is alive"; then
        echo -e "${GREEN}✓ OK${NC}"
        
        # Contar tabelas
        echo -n "  Tabelas... "
        TABLE_COUNT=$(docker exec mysql-master-prod mysql -u root -p"${DB_PASS}" -N -e \
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='auditoria_db';" 2>/dev/null || echo "0")
        echo -e "${GREEN}✓ ($TABLE_COUNT tabelas)${NC}"
        
        # Verificar dados
        echo -n "  Dados... "
        APP_COUNT=$(docker exec mysql-master-prod mysql -u root -p"${DB_PASS}" -N -e \
            "SELECT COUNT(*) FROM auditoria_db.aplicacoes;" 2>/dev/null || echo "0")
        echo -e "${GREEN}✓ ($APP_COUNT aplicações)${NC}"
    else
        echo -e "${RED}✗ Falha na conexão${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Container MySQL não está rodando${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ==================== Recursos ====================
echo -e "${BOLD}[4] Verificando Recursos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Memória
echo -n "  Memória... "
MEM_USED=$(docker stats --no-stream --format "{{.MemUsage}}" auditoria-app-prod 2>/dev/null | cut -d'/' -f1 || echo "N/A")
echo -e "${GREEN}✓ $MEM_USED em uso${NC}"

# CPU
echo -n "  CPU... "
CPU_USED=$(docker stats --no-stream --format "{{.CPUPerc}}" auditoria-app-prod 2>/dev/null || echo "N/A")
echo -e "${GREEN}✓ $CPU_USED${NC}"

# Disco
echo -n "  Disco... "
DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${GREEN}✓ $DISK_AVAIL disponível${NC}"

echo ""

# ==================== Logs ====================
echo -e "${BOLD}[5] Verificando Logs Recentes${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  Erros recentes... "
ERROR_COUNT=$(docker logs auditoria-app-prod --since 1h 2>&1 | grep -i "error" | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Nenhum erro${NC}"
elif [ "$ERROR_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}⚠ $ERROR_COUNT erros${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}✗ $ERROR_COUNT erros!${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ==================== Backups ====================
echo -e "${BOLD}[6] Verificando Backups${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  Backups disponíveis... "
if [ -d "backups" ]; then
    BACKUP_COUNT=$(ls backups/db-backup-*.sql.gz 2>/dev/null | wc -l)
    
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        LATEST_BACKUP=$(ls -t backups/db-backup-*.sql.gz 2>/dev/null | head -1)
        BACKUP_AGE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$LATEST_BACKUP" 2>/dev/null || stat -c "%y" "$LATEST_BACKUP" 2>/dev/null | cut -d'.' -f1)
        echo -e "${GREEN}✓ $BACKUP_COUNT backups (último: $BACKUP_AGE)${NC}"
    else
        echo -e "${YELLOW}⚠ Nenhum backup encontrado${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Diretório de backups não existe${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ==================== Resumo ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ Sistema 100% Saudável!${NC}"
    echo ""
    echo -e "Todos os componentes estão funcionando perfeitamente."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  Sistema Operacional com Avisos${NC}"
    echo ""
    echo -e "Avisos encontrados: ${YELLOW}$WARNINGS${NC}"
    echo "Revise os avisos acima."
    exit 0
else
    echo -e "${RED}${BOLD}❌ Problemas Detectados!${NC}"
    echo ""
    echo -e "Erros: ${RED}$ERRORS${NC}"
    echo -e "Avisos: ${YELLOW}$WARNINGS${NC}"
    echo ""
    echo "Ações recomendadas:"
    echo "  1. Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  2. Reiniciar: docker-compose -f docker-compose.prod.yml restart"
    echo "  3. Rollback: ./scripts/rollback.sh"
    exit 1
fi
