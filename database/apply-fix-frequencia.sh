#!/bin/bash

# ======================================================================
# Script de Aplicação: Correção do Campo Frequência - Processos Negócio
# ======================================================================
# Este script aplica automaticamente a correção para o problema do
# campo 'frequencia' na tabela processos_negocio
# ======================================================================

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Banner
echo ""
echo "========================================================================"
echo "  Correção: Campo 'Frequência' - Processos de Negócio"
echo "========================================================================"
echo ""

# Verificar se o script está sendo executado do diretório correto
if [ ! -f "database/25-fix-processos-negocio-structure.sql" ]; then
    log_error "Arquivo de migração não encontrado!"
    log_info "Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Perguntar método de aplicação
echo "Como você deseja aplicar a correção?"
echo ""
echo "1) Docker (mysql-master container)"
echo "2) MySQL Local"
echo "3) Apenas visualizar o script"
echo "4) Cancelar"
echo ""
read -p "Escolha uma opção [1-4]: " choice

case $choice in
    1)
        log_info "Aplicando via Docker..."
        
        # Verificar se o container está rodando
        if ! docker ps | grep -q mysql-master; then
            log_error "Container 'mysql-master' não está rodando!"
            log_info "Execute: docker-compose up -d"
            exit 1
        fi
        
        # Backup automático
        log_info "Criando backup da tabela processos_negocio..."
        BACKUP_FILE="backup_processos_negocio_$(date +%Y%m%d_%H%M%S).sql"
        docker exec mysql-master mysqldump -uroot -proot auditoria_db processos_negocio > "database/backups/${BACKUP_FILE}" 2>/dev/null || {
            log_warning "Não foi possível criar backup (talvez a tabela ainda não exista)"
        }
        
        if [ -f "database/backups/${BACKUP_FILE}" ]; then
            log_success "Backup criado: database/backups/${BACKUP_FILE}"
        fi
        
        # Aplicar migração
        log_info "Aplicando migração..."
        docker exec -i mysql-master mysql -uroot -proot auditoria_db < database/25-fix-processos-negocio-structure.sql
        
        if [ $? -eq 0 ]; then
            log_success "Migração aplicada com sucesso!"
            echo ""
            log_info "Verificando estrutura da tabela..."
            docker exec mysql-master mysql -uroot -proot auditoria_db -e "DESCRIBE processos_negocio;"
        else
            log_error "Erro ao aplicar migração!"
            exit 1
        fi
        ;;
        
    2)
        log_info "Aplicando via MySQL Local..."
        
        # Perguntar credenciais
        read -p "Usuário MySQL [root]: " mysql_user
        mysql_user=${mysql_user:-root}
        
        read -sp "Senha MySQL: " mysql_pass
        echo ""
        
        read -p "Database [auditoria_db]: " mysql_db
        mysql_db=${mysql_db:-auditoria_db}
        
        # Backup automático
        log_info "Criando backup da tabela processos_negocio..."
        BACKUP_FILE="backup_processos_negocio_$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p database/backups
        mysqldump -u"$mysql_user" -p"$mysql_pass" "$mysql_db" processos_negocio > "database/backups/${BACKUP_FILE}" 2>/dev/null || {
            log_warning "Não foi possível criar backup (talvez a tabela ainda não exista)"
        }
        
        if [ -f "database/backups/${BACKUP_FILE}" ]; then
            log_success "Backup criado: database/backups/${BACKUP_FILE}"
        fi
        
        # Aplicar migração
        log_info "Aplicando migração..."
        mysql -u"$mysql_user" -p"$mysql_pass" "$mysql_db" < database/25-fix-processos-negocio-structure.sql
        
        if [ $? -eq 0 ]; then
            log_success "Migração aplicada com sucesso!"
            echo ""
            log_info "Verificando estrutura da tabela..."
            mysql -u"$mysql_user" -p"$mysql_pass" "$mysql_db" -e "DESCRIBE processos_negocio;"
        else
            log_error "Erro ao aplicar migração!"
            exit 1
        fi
        ;;
        
    3)
        log_info "Visualizando script de migração..."
        echo ""
        cat database/25-fix-processos-negocio-structure.sql
        echo ""
        ;;
        
    4)
        log_info "Operação cancelada pelo usuário"
        exit 0
        ;;
        
    *)
        log_error "Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "========================================================================"
echo "  Próximos Passos"
echo "========================================================================"
echo ""
echo "1. Verifique se todos os campos foram adicionados corretamente"
echo "2. Teste o cadastro de um novo processo de negócio"
echo "3. Verifique se o campo 'Frequência' está sendo salvo"
echo "4. Atualize os processos existentes com os valores corretos"
echo ""
log_info "Consulte: database/FIX-FREQUENCIA-USO-README.md para mais detalhes"
echo ""
log_success "Correção concluída!"
echo ""
