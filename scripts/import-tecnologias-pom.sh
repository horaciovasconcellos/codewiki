#!/bin/bash

##############################################################################
# Script: import-tecnologias-pom.sh
# Descrição: Extrai dependências de um arquivo pom.xml e cadastra via API
# Uso: ./import-tecnologias-pom.sh <caminho-do-pom.xml> [URL_API]
##############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DEFAULT_API_URL="http://localhost:3000/api"
API_URL="${2:-$DEFAULT_API_URL}"
POM_FILE="$1"

# Funções auxiliares
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validações
if [ -z "$POM_FILE" ]; then
    log_error "Uso: $0 <caminho-do-pom.xml> [URL_API]"
    echo ""
    echo "Exemplo:"
    echo "  $0 /path/to/pom.xml"
    echo "  $0 /path/to/pom.xml http://localhost:3000/api"
    exit 1
fi

if [ ! -f "$POM_FILE" ]; then
    log_error "Arquivo não encontrado: $POM_FILE"
    exit 1
fi

# Verificar se xmllint está disponível
if ! command -v xmllint &> /dev/null; then
    log_error "xmllint não encontrado. Instale com: brew install libxml2"
    exit 1
fi

# Verificar se jq está disponível
if ! command -v jq &> /dev/null; then
    log_error "jq não encontrado. Instale com: brew install jq"
    exit 1
fi

log_info "======================================================"
log_info "Importando tecnologias do pom.xml"
log_info "======================================================"
log_info "Arquivo: $POM_FILE"
log_info "API URL: $API_URL"
log_info ""

# Extrair informações do projeto
PROJECT_GROUP=$(xmllint --xpath "string(//*[local-name()='project']/*[local-name()='groupId'])" "$POM_FILE" 2>/dev/null || echo "")
PROJECT_ARTIFACT=$(xmllint --xpath "string(//*[local-name()='project']/*[local-name()='artifactId'])" "$POM_FILE" 2>/dev/null || echo "")
PROJECT_VERSION=$(xmllint --xpath "string(//*[local-name()='project']/*[local-name()='version'])" "$POM_FILE" 2>/dev/null || echo "")

log_info "Projeto: $PROJECT_GROUP:$PROJECT_ARTIFACT:$PROJECT_VERSION"
log_info ""

# Função para cadastrar tecnologia
cadastrar_tecnologia() {
    local nome="$1"
    local versao="$2"
    local tipo="$3"
    local categoria="$4"
    local descricao="$5"
    
    # Criar payload JSON
    local payload=$(jq -n \
        --arg nome "$nome" \
        --arg versao "$versao" \
        --arg tipo "$tipo" \
        --arg categoria "$categoria" \
        --arg descricao "$descricao" \
        '{
            nome: $nome,
            versao: $versao,
            tipo: $tipo,
            categoria: $categoria,
            descricao: $descricao,
            status: "Ativo",
            dataCadastro: (now | strftime("%Y-%m-%dT%H:%M:%S.000Z"))
        }')
    
    # Enviar para API
    local response=$(curl -s -X POST "$API_URL/tecnologias" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -w "\n%{http_code}")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
        log_success "✓ $nome $versao cadastrada"
        return 0
    else
        log_warning "⚠ $nome $versao - HTTP $http_code: $body"
        return 1
    fi
}

# Função para determinar categoria baseado no groupId
determinar_categoria() {
    local group_id="$1"
    
    case "$group_id" in
        org.springframework*) echo "Framework" ;;
        org.hibernate*) echo "ORM" ;;
        com.mysql*|org.postgresql*|com.oracle*|com.microsoft.sqlserver*) echo "Database Driver" ;;
        junit*|org.junit*|org.mockito*|org.testng*) echo "Testing" ;;
        org.apache.logging*|org.slf4j*|ch.qos.logback*) echo "Logging" ;;
        com.fasterxml*|org.json*|com.google.code.gson*) echo "JSON" ;;
        org.apache.commons*) echo "Utilities" ;;
        javax.*|jakarta.*) echo "Java EE" ;;
        io.swagger*|org.springdoc*) echo "Documentation" ;;
        org.liquibase*|org.flywaydb*) echo "Database Migration" ;;
        *) echo "Library" ;;
    esac
}

# Função para determinar tipo baseado no scope
determinar_tipo() {
    local scope="$1"
    
    case "$scope" in
        test) echo "Teste" ;;
        provided) echo "Provided" ;;
        runtime) echo "Runtime" ;;
        *) echo "Dependência" ;;
    esac
}

# Contador
total=0
sucesso=0
falha=0

# Extrair e processar dependências
log_info "Extraindo dependências..."
log_info ""

# Processar cada dependência
while IFS= read -r dependency; do
    # Extrair informações da dependência
    group_id=$(echo "$dependency" | xmllint --xpath "string(//*[local-name()='groupId'])" - 2>/dev/null || echo "")
    artifact_id=$(echo "$dependency" | xmllint --xpath "string(//*[local-name()='artifactId'])" - 2>/dev/null || echo "")
    version=$(echo "$dependency" | xmllint --xpath "string(//*[local-name()='version'])" - 2>/dev/null || echo "")
    scope=$(echo "$dependency" | xmllint --xpath "string(//*[local-name()='scope'])" - 2>/dev/null || echo "compile")
    
    # Pular se não tiver informações essenciais
    if [ -z "$group_id" ] || [ -z "$artifact_id" ]; then
        continue
    fi
    
    # Resolver versão de propriedade se necessário (ex: ${spring.version})
    if [[ "$version" =~ ^\$\{.*\}$ ]]; then
        property_name=$(echo "$version" | sed 's/[${}]//g')
        version=$(xmllint --xpath "string(//*[local-name()='properties']/*[local-name()='$property_name'])" "$POM_FILE" 2>/dev/null || echo "SNAPSHOT")
    fi
    
    # Se versão ainda está vazia, usar SNAPSHOT
    [ -z "$version" ] && version="SNAPSHOT"
    
    # Determinar categoria e tipo
    categoria=$(determinar_categoria "$group_id")
    tipo=$(determinar_tipo "$scope")
    
    # Nome completo
    nome="$group_id:$artifact_id"
    descricao="Dependência Maven - Scope: $scope"
    
    total=$((total + 1))
    
    # Cadastrar
    if cadastrar_tecnologia "$nome" "$version" "$tipo" "$categoria" "$descricao"; then
        sucesso=$((sucesso + 1))
    else
        falha=$((falha + 1))
    fi
    
done < <(xmllint --xpath "//*[local-name()='dependencies']/*[local-name()='dependency']" "$POM_FILE" 2>/dev/null | \
         sed 's/<dependency>/<dependency>\n/g' | \
         awk '/<dependency>/,/<\/dependency>/')

# Extrair plugins
log_info ""
log_info "Extraindo plugins..."
log_info ""

while IFS= read -r plugin; do
    group_id=$(echo "$plugin" | xmllint --xpath "string(//*[local-name()='groupId'])" - 2>/dev/null || echo "org.apache.maven.plugins")
    artifact_id=$(echo "$plugin" | xmllint --xpath "string(//*[local-name()='artifactId'])" - 2>/dev/null || echo "")
    version=$(echo "$plugin" | xmllint --xpath "string(//*[local-name()='version'])" - 2>/dev/null || echo "LATEST")
    
    if [ -z "$artifact_id" ]; then
        continue
    fi
    
    # Resolver versão de propriedade
    if [[ "$version" =~ ^\$\{.*\}$ ]]; then
        property_name=$(echo "$version" | sed 's/[${}]//g')
        version=$(xmllint --xpath "string(//*[local-name()='properties']/*[local-name()='$property_name'])" "$POM_FILE" 2>/dev/null || echo "LATEST")
    fi
    
    nome="$group_id:$artifact_id"
    total=$((total + 1))
    
    if cadastrar_tecnologia "$nome" "$version" "Plugin" "Maven Plugin" "Plugin Maven para build"; then
        sucesso=$((sucesso + 1))
    else
        falha=$((falha + 1))
    fi
    
done < <(xmllint --xpath "//*[local-name()='build']/*[local-name()='plugins']/*[local-name()='plugin']" "$POM_FILE" 2>/dev/null | \
         sed 's/<plugin>/<plugin>\n/g' | \
         awk '/<plugin>/,/<\/plugin>/')

# Resumo
log_info ""
log_info "======================================================"
log_info "Resumo da Importação"
log_info "======================================================"
log_info "Total de tecnologias: $total"
log_success "Cadastradas com sucesso: $sucesso"
if [ $falha -gt 0 ]; then
    log_warning "Falhas/Duplicadas: $falha"
fi
log_info "======================================================"

exit 0
