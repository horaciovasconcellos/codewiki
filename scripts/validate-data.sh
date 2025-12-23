#!/bin/bash

# Script de Validação de Dados
# Sistema de Auditoria

echo "🔍 Validando Dados do Sistema de Auditoria..."
echo "================================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de sucessos/falhas
SUCCESS=0
FAIL=0

# Função auxiliar para verificar contagem
check_count() {
  TABLE=$1
  MIN_EXPECTED=$2
  DESCRIPTION=$3
  
  echo -n "Verificando $DESCRIPTION... "
  
  COUNT=$(docker exec mysql-master mysql -u app_user -papppass123 auditoria_db \
    -sN -e "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERRO${NC} (não foi possível conectar)"
    ((FAIL++))
    return
  fi
  
  if [ "$COUNT" -ge "$MIN_EXPECTED" ]; then
    echo -e "${GREEN}✅ OK${NC} ($COUNT registros, mínimo: $MIN_EXPECTED)"
    ((SUCCESS++))
  else
    echo -e "${RED}❌ FALHA${NC} ($COUNT registros, esperado mínimo: $MIN_EXPECTED)"
    ((FAIL++))
  fi
}

# Verificar se Docker está rodando
if ! docker ps > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker não está rodando!${NC}"
  exit 1
fi

# Verificar se container MySQL está rodando
if ! docker ps | grep -q mysql-master; then
  echo -e "${RED}❌ Container MySQL não está rodando!${NC}"
  echo "Execute: ./docker-manager.sh start"
  exit 1
fi

echo "📋 Validando Tabelas Básicas"
echo "─────────────────────────────"
check_count "tipos_afastamento" 5 "Tipos de Afastamento"
check_count "tipos_comunicacao" 3 "Tipos de Comunicação"
check_count "configuracoes" 1 "Configurações"

echo ""
echo "👥 Validando Dados de Pessoas e Recursos"
echo "─────────────────────────────────────────"
check_count "colaboradores" 3 "Colaboradores"
check_count "habilidades" 10 "Habilidades"

echo ""
echo "💻 Validando Dados Técnicos"
echo "───────────────────────────"
check_count "tecnologias" 10 "Tecnologias"
check_count "capacidades_negocio" 10 "Capacidades de Negócio"
check_count "processos_negocio" 5 "Processos de Negócio"

echo ""
echo "🏢 Validando Entidades Principais"
echo "──────────────────────────────────"
check_count "aplicacoes" 5 "Aplicações"
check_count "integracoes" 3 "Integrações"
check_count "comunicacoes" 2 "Comunicações"

echo ""
echo "🔗 Validando Relacionamentos"
echo "────────────────────────────"
check_count "aplicacao_tecnologias" 5 "Aplicação x Tecnologias"
check_count "aplicacao_capacidades" 5 "Aplicação x Capacidades"
check_count "aplicacao_processos" 3 "Aplicação x Processos"
check_count "aplicacao_ambientes" 3 "Ambientes Tecnológicos"
check_count "aplicacao_integracoes" 2 "Aplicação x Integrações"

echo ""
echo "📊 Verificando APIs"
echo "───────────────────"

# Verificar health check
echo -n "Health Check API... "
if curl -s http://localhost:3000/health | grep -q "ok"; then
  echo -e "${GREEN}✅ OK${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ FALHA${NC}"
  ((FAIL++))
fi

# Verificar API de aplicações
echo -n "API de Aplicações... "
APP_COUNT=$(curl -s http://localhost:3000/api/aplicacoes 2>/dev/null | jq length 2>/dev/null)
if [ "$APP_COUNT" -ge 5 ]; then
  echo -e "${GREEN}✅ OK${NC} ($APP_COUNT aplicações)"
  ((SUCCESS++))
else
  echo -e "${RED}❌ FALHA${NC} ($APP_COUNT aplicações)"
  ((FAIL++))
fi

# Verificar API de integrações
echo -n "API de Integrações... "
INT_COUNT=$(curl -s http://localhost:3000/api/integracoes 2>/dev/null | jq length 2>/dev/null)
if [ "$INT_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✅ OK${NC} ($INT_COUNT integrações)"
  ((SUCCESS++))
else
  echo -e "${RED}❌ FALHA${NC} ($INT_COUNT integrações)"
  ((FAIL++))
fi

# Verificar API de logs
echo -n "API de Logs de Auditoria... "
LOGS_RESPONSE=$(curl -s http://localhost:3000/api/logs-auditoria?limit=1 2>/dev/null)
if echo "$LOGS_RESPONSE" | jq -e '.logs' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ OK${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ FALHA${NC}"
  ((FAIL++))
fi

echo ""
echo "================================================"
echo "📊 Resultado Final"
echo "================================================"
TOTAL=$((SUCCESS + FAIL))
PERCENTAGE=$((SUCCESS * 100 / TOTAL))

echo ""
echo "Total de verificações: $TOTAL"
echo -e "Sucessos: ${GREEN}$SUCCESS${NC}"
echo -e "Falhas: ${RED}$FAIL${NC}"
echo "Percentual de sucesso: $PERCENTAGE%"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 Todos os dados foram carregados corretamente!${NC}"
  echo ""
  echo "✅ Sistema pronto para testes!"
  exit 0
elif [ $PERCENTAGE -ge 80 ]; then
  echo -e "${YELLOW}⚠️  Sistema funcional mas há alguns dados faltando.${NC}"
  echo ""
  echo "Recomendação: Execute os scripts de carga pendentes:"
  echo "  - ./scripts/load-*.sh"
  exit 0
else
  echo -e "${RED}❌ Há muitos dados faltando. Execute a carga inicial.${NC}"
  echo ""
  echo "Execute na ordem:"
  echo "  1. ./scripts/load-tipos-afastamento.sh"
  echo "  2. ./scripts/import-tecnologias-pom.sh"
  echo "  3. ./scripts/load-habilidades.sh"
  echo "  4. ./scripts/load-colaboradores.sh"
  echo "  5. ./scripts/load-capacidades-negocio.sh"
  echo "  6. ./scripts/load-processos.sh"
  echo "  7. ./scripts/load-aplicacoes.sh"
  exit 1
fi
