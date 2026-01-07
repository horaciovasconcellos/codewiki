#!/bin/bash

################################################################################
# QUICK START - Deploy em Produção
# Sistema de Auditoria
# 
# Script interativo para primeiro deploy
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║      SISTEMA DE AUDITORIA - QUICK START DEPLOY          ║
║                                                          ║
║      Assistente Interativo de Deploy em Produção        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BOLD}Bem-vindo ao assistente de deploy!${NC}"
echo ""
echo "Este script irá guiá-lo pelo processo de deploy em produção."
echo ""

# ==================== STEP 1: Verificar pré-requisitos ====================

echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}PASSO 1/6: Verificação de Pré-requisitos${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

read -p "Pressione ENTER para verificar pré-requisitos..."
echo ""

if [ -f "$SCRIPT_DIR/pre-deploy-check.sh" ]; then
    "$SCRIPT_DIR/pre-deploy-check.sh"
    CHECK_RESULT=$?
    
    if [ $CHECK_RESULT -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ Pré-verificação falhou!${NC}"
        echo ""
        echo "Corrija os problemas acima antes de continuar."
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Script de pré-verificação não encontrado${NC}"
fi

echo ""
read -p "Pressione ENTER para continuar..."

# ==================== STEP 2: Configurar .env ====================

clear
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}PASSO 2/6: Configuração de Variáveis de Ambiente${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
    echo -e "${YELLOW}Arquivo .env.production não encontrado.${NC}"
    echo ""
    
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        echo "Criando .env.production a partir de .env.example..."
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env.production"
        echo -e "${GREEN}✓ Arquivo criado${NC}"
    else
        echo -e "${RED}Erro: .env.example não encontrado!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BOLD}⚠️  IMPORTANTE: Configure suas senhas!${NC}"
echo ""
echo "Você precisa editar o arquivo .env.production e alterar:"
echo "  - MYSQL_ROOT_PASSWORD"
echo "  - MYSQL_PASSWORD"
echo "  - APP_URL (seu domínio)"
echo ""
echo -e "${YELLOW}NUNCA use senhas padrão em produção!${NC}"
echo ""

read -p "Deseja editar .env.production agora? (S/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    ${EDITOR:-nano} "$PROJECT_ROOT/.env.production"
fi

echo ""
read -p "Pressione ENTER para continuar..."

# ==================== STEP 3: Configurar domínio ====================

clear
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}PASSO 3/6: Configuração de Domínio (Opcional)${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

echo "Você tem um domínio configurado para esta aplicação?"
echo ""
read -p "Usar domínio? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    read -p "Digite seu domínio (ex: app.example.com): " DOMAIN
    
    if [ -n "$DOMAIN" ]; then
        echo ""
        echo "Configurando domínio: $DOMAIN"
        
        # Atualizar nginx.prod.conf se existir
        if [ -f "$PROJECT_ROOT/nginx.prod.conf" ]; then
            if command -v sed >/dev/null 2>&1; then
                # Backup do arquivo original
                cp "$PROJECT_ROOT/nginx.prod.conf" "$PROJECT_ROOT/nginx.prod.conf.bak"
                
                # Substituir server_name
                sed -i.tmp "s/server_name _;/server_name $DOMAIN;/" "$PROJECT_ROOT/nginx.prod.conf" 2>/dev/null || true
                rm -f "$PROJECT_ROOT/nginx.prod.conf.tmp"
                
                echo -e "${GREEN}✓ nginx.prod.conf atualizado${NC}"
            fi
        fi
        
        echo ""
        echo -e "${BLUE}Lembre-se de configurar SSL depois:${NC}"
        echo "  sudo certbot --nginx -d $DOMAIN"
    fi
else
    echo ""
    echo "Ok, usando localhost"
fi

echo ""
read -p "Pressione ENTER para continuar..."

# ==================== STEP 4: Build ====================

clear
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}PASSO 4/6: Build da Aplicação${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

echo "Iniciando build da aplicação..."
echo ""

cd "$PROJECT_ROOT"

if command -v npm >/dev/null 2>&1; then
    echo "Instalando dependências..."
    npm ci --production=false
    
    echo ""
    echo "Compilando frontend..."
    npm run build
    
    echo ""
    echo -e "${GREEN}✓ Build concluído${NC}"
else
    echo -e "${YELLOW}⚠️  npm não encontrado, pulando build local${NC}"
    echo "Build será feito dentro do container Docker"
fi

echo ""
read -p "Pressione ENTER para continuar..."

# ==================== STEP 5: Deploy ====================

clear
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}PASSO 5/6: Deploy${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BOLD}Pronto para fazer deploy!${NC}"
echo ""
echo "O script irá:"
echo "  1. Fazer backup do banco de dados"
echo "  2. Construir imagens Docker"
echo "  3. Iniciar containers"
echo "  4. Executar migrações"
echo "  5. Verificar saúde"
echo ""

read -p "Iniciar deploy agora? (S/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${CYAN}Iniciando deploy...${NC}"
    echo ""
    
    if [ -f "$SCRIPT_DIR/deploy-to-server.sh" ]; then
        "$SCRIPT_DIR/deploy-to-server.sh"
        DEPLOY_RESULT=$?
        
        if [ $DEPLOY_RESULT -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Deploy falhou!${NC}"
            echo "Verifique os logs acima para mais detalhes."
            exit 1
        fi
    else
        echo -e "${RED}Erro: Script deploy-to-server.sh não encontrado!${NC}"
        exit 1
    fi
else
    echo ""
    echo "Deploy cancelado."
    echo "Execute manualmente quando estiver pronto:"
    echo "  ./scripts/deploy-to-server.sh"
    exit 0
fi

# ==================== STEP 6: Verificação Final ====================

clear
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}PASSO 6/6: Verificação Final${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

echo "Verificando containers..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Testando endpoints..."
echo ""

# Test health
echo -n "Health Check... "
if curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
fi

# Test API
echo -n "API... "
if curl -f -s http://localhost:3000/api/aplicacoes >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
fi

# Test frontend
echo -n "Frontend... "
if curl -f -s http://localhost/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
echo ""

# ==================== FINALIZAÇÃO ====================

clear
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              ✅  DEPLOY CONCLUÍDO COM SUCESSO!           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BOLD}🎉 Sua aplicação está no ar!${NC}"
echo ""
echo -e "${CYAN}URLs de Acesso:${NC}"
echo "  • Frontend: ${BOLD}http://localhost${NC}"
echo "  • API: ${BOLD}http://localhost/api${NC}"
echo "  • Health: ${BOLD}http://localhost/health${NC}"
echo ""

echo -e "${CYAN}Comandos Úteis:${NC}"
echo "  • Ver logs:"
echo "    ${BOLD}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo ""
echo "  • Status:"
echo "    ${BOLD}docker-compose -f docker-compose.prod.yml ps${NC}"
echo ""
echo "  • Reiniciar:"
echo "    ${BOLD}docker-compose -f docker-compose.prod.yml restart${NC}"
echo ""
echo "  • Parar:"
echo "    ${BOLD}docker-compose -f docker-compose.prod.yml down${NC}"
echo ""
echo "  • Rollback (se necessário):"
echo "    ${BOLD}./scripts/rollback.sh${NC}"
echo ""

echo -e "${CYAN}Próximos Passos:${NC}"
echo "  1. Configure SSL/HTTPS se tiver domínio:"
echo "     ${BOLD}sudo certbot --nginx -d seu-dominio.com${NC}"
echo ""
echo "  2. Configure backups automáticos"
echo "  3. Configure monitoramento"
echo "  4. Revise logs regularmente"
echo ""

echo -e "${CYAN}Documentação:${NC}"
echo "  • Guia completo: ${BOLD}DEPLOY-GUIDE.md${NC}"
echo "  • README: ${BOLD}README.md${NC}"
echo ""

echo -e "${GREEN}Obrigado por usar o Sistema de Auditoria!${NC}"
echo ""
