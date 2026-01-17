#!/bin/bash

# Script para aplicar melhorias do SonarQube/SonarLint automaticamente
# Uso: ./apply-sonar-fixes.sh

set -e

echo "🔍 Aplicando melhorias do SonarQube/SonarLint..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para aplicar fixes com ESLint
apply_eslint_fixes() {
    echo -e "${YELLOW}📝 Aplicando correções automáticas com ESLint...${NC}"
    
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx não encontrado. Instale o Node.js primeiro.${NC}"
        return 1
    fi
    
    # Verificar se ESLint está instalado
    if [ ! -f "node_modules/.bin/eslint" ]; then
        echo -e "${YELLOW}⚠️  ESLint não encontrado. Instalando...${NC}"
        npm install --save-dev eslint eslint-plugin-unicorn
    fi
    
    # Aplicar fixes automáticos
    npx eslint --fix server/api.js || true
    echo -e "${GREEN}✅ ESLint fixes aplicados${NC}"
}

# Função para verificar imports com node: prefix
check_node_imports() {
    echo -e "${YELLOW}📦 Verificando imports Node.js...${NC}"
    
    # Buscar imports sem prefixo node:
    IMPORTS_WITHOUT_PREFIX=$(grep -r "from '\(fs\|path\|crypto\|util\|child_process\|os\|stream\)'" server/ 2>/dev/null || true)
    
    if [ -n "$IMPORTS_WITHOUT_PREFIX" ]; then
        echo -e "${RED}⚠️  Imports sem prefixo 'node:' encontrados:${NC}"
        echo "$IMPORTS_WITHOUT_PREFIX"
        echo ""
        echo -e "${YELLOW}Execute manualmente para corrigir:${NC}"
        echo "sed -i '' \"s/from 'fs'/from 'node:fs'/g\" server/api.js"
        echo "sed -i '' \"s/from 'path'/from 'node:path'/g\" server/api.js"
        echo "sed -i '' \"s/from 'crypto'/from 'node:crypto'/g\" server/api.js"
    else
        echo -e "${GREEN}✅ Todos os imports estão corretos${NC}"
    fi
}

# Função para verificar parseFloat/parseInt
check_number_methods() {
    echo -e "${YELLOW}🔢 Verificando uso de Number.parseFloat e Number.parseInt...${NC}"
    
    # Buscar parseFloat e parseInt não qualificados
    GLOBAL_PARSE=$(grep -n "parseFloat\|parseInt" server/api.js | grep -v "Number\." || true)
    
    if [ -n "$GLOBAL_PARSE" ]; then
        echo -e "${RED}⚠️  Uso de parseFloat/parseInt global encontrado:${NC}"
        echo "$GLOBAL_PARSE"
        echo ""
        echo -e "${YELLOW}Use Number.parseFloat() e Number.parseInt() ao invés.${NC}"
    else
        echo -e "${GREEN}✅ Métodos Number.* estão sendo usados corretamente${NC}"
    fi
}

# Função para executar SonarQube scan
run_sonar_scan() {
    echo -e "${YELLOW}🔍 Executando análise SonarQube...${NC}"
    
    if [ ! -f "sonar-project.properties" ]; then
        echo -e "${RED}❌ sonar-project.properties não encontrado${NC}"
        return 1
    fi
    
    # Verificar se sonar-scanner está instalado
    if ! command -v sonar-scanner &> /dev/null; then
        echo -e "${RED}❌ sonar-scanner não encontrado. Instale com:${NC}"
        echo "brew install sonar-scanner  # macOS"
        echo "# ou baixe de: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/"
        return 1
    fi
    
    # Executar scan
    bash sonar-scan.sh || sonar-scanner
    echo -e "${GREEN}✅ Análise SonarQube concluída${NC}"
}

# Função para validar mkdocs.yml
validate_mkdocs() {
    echo -e "${YELLOW}📚 Validando mkdocs.yml...${NC}"
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 não encontrado${NC}"
        return 1
    fi
    
    # Tentar construir documentação
    python3 -m mkdocs build --strict 2>&1 | head -20
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ mkdocs.yml está válido${NC}"
    else
        echo -e "${RED}⚠️  mkdocs.yml tem avisos (verifique acima)${NC}"
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "==================================="
    echo "  Melhorias SonarQube/SonarLint"
    echo "==================================="
    echo "1. Aplicar correções automáticas (ESLint)"
    echo "2. Verificar imports Node.js"
    echo "3. Verificar métodos Number.*"
    echo "4. Executar análise SonarQube"
    echo "5. Validar mkdocs.yml"
    echo "6. Executar todas as verificações"
    echo "0. Sair"
    echo ""
    read -p "Escolha uma opção: " choice
    
    case $choice in
        1) apply_eslint_fixes ;;
        2) check_node_imports ;;
        3) check_number_methods ;;
        4) run_sonar_scan ;;
        5) validate_mkdocs ;;
        6) 
            check_node_imports
            echo ""
            check_number_methods
            echo ""
            validate_mkdocs
            echo ""
            apply_eslint_fixes
            ;;
        0) 
            echo -e "${GREEN}👋 Até logo!${NC}"
            exit 0
            ;;
        *) 
            echo -e "${RED}❌ Opção inválida${NC}"
            show_menu
            ;;
    esac
    
    # Mostrar menu novamente
    show_menu
}

# Iniciar
clear
echo "🚀 CodeWiki - SonarQube/SonarLint Improvements"
echo ""
show_menu
