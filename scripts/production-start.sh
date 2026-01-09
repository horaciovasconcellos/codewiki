#!/bin/bash

##############################################################################
# Production Start Script
# Inicializa o CodeWiki em ambiente de produção com validações e health checks
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=30
RETRY_INTERVAL=2
HEALTH_CHECK_URL="http://localhost:3000/api"
DB_HEALTH_CHECK_RETRIES=10

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}CodeWiki Production Startup${NC}"
echo -e "${BLUE}================================${NC}\n"

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

##############################################################################
# Pre-flight Checks
##############################################################################

log_info "Executando verificações pré-voo..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_error "Arquivo .env não encontrado!"
    log_info "Copiando .env.example para .env..."
    cp .env.example .env
    log_warn "Configure as variáveis de ambiente em .env antes de continuar"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado!"
    exit 1
fi

NODE_VERSION=$(node -v)
log_info "Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado!"
    exit 1
fi

NPM_VERSION=$(npm -v)
log_info "npm version: $NPM_VERSION"

# Check if required directories exist
log_info "Verificando estrutura de diretórios..."
required_dirs=("server" "server/src" "database" "uploads")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        log_error "Diretório obrigatório não encontrado: $dir"
        exit 1
    fi
done

# Check if package.json exists
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado!"
    exit 1
fi

##############################################################################
# Environment Variables Validation
##############################################################################

log_info "Validando variáveis de ambiente..."

# Load environment variables
source .env

required_vars=(
    "MYSQL_HOST"
    "MYSQL_PORT"
    "MYSQL_USER"
    "MYSQL_PASSWORD"
    "MYSQL_DATABASE"
    "JWT_SECRET"
    "NODE_ENV"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Variáveis de ambiente obrigatórias não configuradas:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Validate NODE_ENV
if [ "$NODE_ENV" != "production" ] && [ "$NODE_ENV" != "development" ]; then
    log_warn "NODE_ENV não é 'production' ou 'development': $NODE_ENV"
fi

# Warn if using default JWT secret
if [ "$JWT_SECRET" == "your-super-secret-key-change-in-production" ]; then
    log_warn "Usando JWT_SECRET padrão - ALTERE EM PRODUÇÃO!"
fi

##############################################################################
# Database Connection Check
##############################################################################

log_info "Verificando conexão com o banco de dados..."

check_database() {
    if command -v mysql &> /dev/null; then
        mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" "$MYSQL_DATABASE" &> /dev/null
        return $?
    else
        # If mysql client is not available, try with node
        node -e "
        const mysql = require('mysql2/promise');
        (async () => {
            try {
                const connection = await mysql.createConnection({
                    host: process.env.MYSQL_HOST,
                    port: process.env.MYSQL_PORT,
                    user: process.env.MYSQL_USER,
                    password: process.env.MYSQL_PASSWORD,
                    database: process.env.MYSQL_DATABASE
                });
                await connection.end();
                process.exit(0);
            } catch (err) {
                console.error(err.message);
                process.exit(1);
            }
        })();
        " 2>/dev/null
        return $?
    fi
}

retry_count=0
while [ $retry_count -lt $DB_HEALTH_CHECK_RETRIES ]; do
    if check_database; then
        log_info "Conexão com banco de dados estabelecida"
        break
    else
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $DB_HEALTH_CHECK_RETRIES ]; then
            log_warn "Aguardando banco de dados... (tentativa $retry_count/$DB_HEALTH_CHECK_RETRIES)"
            sleep $RETRY_INTERVAL
        else
            log_error "Não foi possível conectar ao banco de dados após $DB_HEALTH_CHECK_RETRIES tentativas"
            exit 1
        fi
    fi
done

##############################################################################
# Dependencies Check
##############################################################################

log_info "Verificando dependências..."

if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    log_info "Instalando/atualizando dependências..."
    npm ci --production
else
    log_info "Dependências já instaladas"
fi

##############################################################################
# Database Migrations
##############################################################################

log_info "Verificando migrações do banco de dados..."

if [ -d "database/migrations" ]; then
    migration_count=$(find database/migrations -name "*.sql" 2>/dev/null | wc -l)
    if [ "$migration_count" -gt 0 ]; then
        log_info "Encontradas $migration_count migrations"
        log_warn "Certifique-se de que as migrations foram aplicadas manualmente"
    fi
fi

##############################################################################
# Build Frontend (if needed)
##############################################################################

if [ -f "vite.config.ts" ] && [ ! -d "dist" ]; then
    log_info "Compilando frontend..."
    npm run build
fi

##############################################################################
# Start Application
##############################################################################

log_info "Iniciando aplicação..."

# Kill any existing process on the port
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warn "Porta $PORT já está em uso. Tentando encerrar processo..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start the application in background
if [ "$NODE_ENV" == "production" ]; then
    log_info "Iniciando em modo PRODUÇÃO..."
    nohup node server/src/app.js > logs/app.log 2>&1 &
    APP_PID=$!
else
    log_info "Iniciando em modo DESENVOLVIMENTO..."
    nohup node server/src/app.js > logs/app.log 2>&1 &
    APP_PID=$!
fi

# Save PID
echo $APP_PID > .app.pid
log_info "Aplicação iniciada com PID: $APP_PID"

##############################################################################
# Health Check
##############################################################################

log_info "Aguardando aplicação ficar pronta..."

retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    sleep $RETRY_INTERVAL
    
    # Check if process is still running
    if ! ps -p $APP_PID > /dev/null 2>&1; then
        log_error "Aplicação encerrou inesperadamente"
        log_error "Últimas linhas do log:"
        tail -n 20 logs/app.log
        exit 1
    fi
    
    # Check health endpoint
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        log_info "✅ Aplicação está respondendo!"
        break
    else
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            echo -n "."
        else
            log_error "Aplicação não respondeu após $MAX_RETRIES tentativas"
            log_error "Últimas linhas do log:"
            tail -n 20 logs/app.log
            kill $APP_PID 2>/dev/null || true
            exit 1
        fi
    fi
done

##############################################################################
# Final Status
##############################################################################

echo ""
log_info "================================"
log_info "✅ CodeWiki iniciado com sucesso!"
log_info "================================"
log_info "PID: $APP_PID"
log_info "Environment: $NODE_ENV"
log_info "API URL: $HEALTH_CHECK_URL"
log_info "Database: $MYSQL_HOST:$MYSQL_PORT/$MYSQL_DATABASE"
log_info "Logs: logs/app.log"
log_info ""
log_info "Para parar a aplicação:"
log_info "  kill $APP_PID"
log_info "  ou: kill \$(cat .app.pid)"
log_info ""
log_info "Para ver logs em tempo real:"
log_info "  tail -f logs/app.log"
log_info "================================"

exit 0
