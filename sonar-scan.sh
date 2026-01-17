#!/bin/bash

# Script para executar análise do SonarQube no projeto CodeWiki
# Autor: Sistema de Auditoria
# Data: $(date +%Y-%m-%d)

echo "=================================="
echo "SonarQube - Análise Estática"
echo "Projeto: CodeWiki"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se o SonarQube está rodando
echo -e "${YELLOW}[1/5] Verificando conexão com SonarQube...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:9010/api/system/status | grep -q "200"; then
    echo -e "${RED}✗ SonarQube não está acessível em http://localhost:9010${NC}"
    echo -e "${YELLOW}Certifique-se de que o SonarQube está rodando na porta 9010${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SonarQube está acessível${NC}"
echo ""

# Verificar se o sonar-scanner está instalado
echo -e "${YELLOW}[2/5] Verificando se sonar-scanner está instalado...${NC}"
if ! command -v sonar-scanner &> /dev/null; then
    echo -e "${RED}✗ sonar-scanner não encontrado${NC}"
    echo -e "${YELLOW}Instalando sonar-scanner...${NC}"
    
    # Detectar sistema operacional
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install sonar-scanner
        else
            echo -e "${RED}Homebrew não encontrado. Instale manualmente: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo -e "${YELLOW}Baixando SonarScanner...${NC}"
        cd /tmp
        wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
        unzip -q sonar-scanner-cli-4.8.0.2856-linux.zip
        sudo mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner
        sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner
        cd -
    else
        echo -e "${RED}Sistema operacional não suportado${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ sonar-scanner disponível${NC}"
echo ""

# Gerar cobertura de testes (opcional)
echo -e "${YELLOW}[3/5] Gerando cobertura de testes...${NC}"
if [ -f "package.json" ]; then
    npm run test:coverage 2>/dev/null || echo -e "${YELLOW}⚠ Cobertura de testes não gerada (opcional)${NC}"
    echo -e "${GREEN}✓ Testes executados${NC}"
else
    echo -e "${YELLOW}⚠ package.json não encontrado, pulando testes${NC}"
fi
echo ""

# Limpar análises anteriores (opcional)
echo -e "${YELLOW}[4/5] Preparando ambiente...${NC}"
rm -rf .scannerwork 2>/dev/null
echo -e "${GREEN}✓ Ambiente preparado${NC}"
echo ""

# Executar análise do SonarQube
echo -e "${YELLOW}[5/5] Executando análise do SonarQube...${NC}"
echo ""
echo "Parâmetros de análise:"
echo "  - Host: http://localhost:9010"
echo "  - Projeto: codewiki"
echo "  - Fontes: src/, server/"
echo ""

sonar-scanner \
  -Dsonar.projectKey=codewiki \
  -Dsonar.host.url=http://localhost:9010 \
  -Dsonar.token=${SONAR_TOKEN:-admin}

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=================================="
    echo "✓ Análise concluída com sucesso!"
    echo "=================================="
    echo ""
    echo "Acesse o dashboard em:"
    echo "http://localhost:9010/dashboard?id=codewiki"
    echo ""
else
    echo ""
    echo -e "${RED}=================================="
    echo "✗ Erro na análise do SonarQube"
    echo "=================================="
    echo ""
    exit 1
fi
