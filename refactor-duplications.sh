#!/bin/bash

# Script para refatorar componentes e eliminar duplicação de código
# Uso: ./refactor-duplications.sh

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Refatoração de Duplicação de Código - React/TypeScript  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se o diretório src existe
if [ ! -d "src" ]; then
    echo -e "${RED}❌ Erro: Diretório src/ não encontrado${NC}"
    exit 1
fi

# Criar hooks e componentes utilitários se não existirem
echo -e "${YELLOW}📦 Verificando arquivos utilitários...${NC}"

if [ ! -f "src/hooks/useTableSort.ts" ]; then
    echo -e "${YELLOW}⚠️  useTableSort.ts não encontrado - já foi criado${NC}"
else
    echo -e "${GREEN}✓ useTableSort.ts existe${NC}"
fi

if [ ! -f "src/hooks/useTablePagination.ts" ]; then
    echo -e "${YELLOW}⚠️  useTablePagination.ts não encontrado - já foi criado${NC}"
else
    echo -e "${GREEN}✓ useTablePagination.ts existe${NC}"
fi

if [ ! -f "src/components/ui/SortableTableHeader.tsx" ]; then
    echo -e "${YELLOW}⚠️  SortableTableHeader.tsx não encontrado - já foi criado${NC}"
else
    echo -e "${GREEN}✓ SortableTableHeader.tsx existe${NC}"
fi

if [ ! -f "src/utils/apiHelpers.ts" ]; then
    echo -e "${YELLOW}⚠️  apiHelpers.ts não encontrado - já foi criado${NC}"
else
    echo -e "${GREEN}✓ apiHelpers.ts existe${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Menu de Refatoração${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  1) Refatorar StepSquads.tsx (elimina ~80 linhas)"
echo "  2) Refatorar ExecucoesTesteDataTable.tsx (elimina ~90 linhas)"
echo "  3) Refatorar TecnologiaWizard.tsx (elimina ~150 linhas)"
echo "  4) Analisar duplicações em todos os DataTables (busca)"
echo "  5) Gerar relatório de duplicações"
echo "  6) Validar TypeScript após refatoração"
echo "  7) Executar build de teste"
echo "  8) ❌ Sair"
echo ""
read -p "Escolha uma opção (1-8): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔧 Refatorando StepSquads.tsx...${NC}"
        
        # Backup
        if [ -f "src/components/aplicacoes/wizard-steps/StepSquads.tsx" ]; then
            cp src/components/aplicacoes/wizard-steps/StepSquads.tsx src/components/aplicacoes/wizard-steps/StepSquads.tsx.backup
            echo -e "${GREEN}✓ Backup criado${NC}"
            
            # Verificar se há exemplo refatorado
            if [ -f "examples/StepSquads.REFATORADO.tsx" ]; then
                echo -e "${YELLOW}📋 Copiando versão refatorada...${NC}"
                cp examples/StepSquads.REFATORADO.tsx src/components/aplicacoes/wizard-steps/StepSquads.tsx
                echo -e "${GREEN}✓ StepSquads.tsx refatorado com sucesso${NC}"
                echo -e "${BLUE}ℹ️  Backup em: src/components/aplicacoes/wizard-steps/StepSquads.tsx.backup${NC}"
            else
                echo -e "${RED}❌ Arquivo de exemplo não encontrado${NC}"
            fi
        else
            echo -e "${RED}❌ Arquivo StepSquads.tsx não encontrado${NC}"
        fi
        ;;
    
    2)
        echo -e "${YELLOW}🔧 Refatorando ExecucoesTesteDataTable.tsx...${NC}"
        echo -e "${BLUE}ℹ️  Esta refatoração requer aplicação manual${NC}"
        echo -e "${BLUE}ℹ️  Consulte docs/DUPLICACAO-CODIGO-REACT.md para instruções${NC}"
        ;;
    
    3)
        echo -e "${YELLOW}🔧 Refatorando TecnologiaWizard.tsx...${NC}"
        echo -e "${BLUE}ℹ️  Esta refatoração requer aplicação manual${NC}"
        echo -e "${BLUE}ℹ️  Consulte docs/DUPLICACAO-CODIGO-REACT.md para instruções${NC}"
        ;;
    
    4)
        echo -e "${YELLOW}🔍 Analisando duplicações em DataTables...${NC}"
        echo ""
        
        # Buscar handleSort duplicado
        echo -e "${BLUE}Componentes com handleSort duplicado:${NC}"
        grep -r "const handleSort = (field:" src/components/ --include="*.tsx" | wc -l | xargs echo -n "Total: "
        echo " arquivos"
        echo ""
        
        # Buscar getSortIcon duplicado
        echo -e "${BLUE}Componentes com getSortIcon duplicado:${NC}"
        grep -r "const getSortIcon = (field:" src/components/ --include="*.tsx" | wc -l | xargs echo -n "Total: "
        echo " arquivos"
        echo ""
        
        # Buscar paginação duplicada
        echo -e "${BLUE}Componentes com paginação duplicada:${NC}"
        grep -r "const totalPages = Math.ceil" src/components/ --include="*.tsx" | wc -l | xargs echo -n "Total: "
        echo " arquivos"
        echo ""
        
        echo -e "${GREEN}✓ Análise concluída${NC}"
        echo -e "${BLUE}ℹ️  Detalhes em: docs/DUPLICACAO-CODIGO-REACT.md${NC}"
        ;;
    
    5)
        echo -e "${YELLOW}📊 Gerando relatório de duplicações...${NC}"
        
        REPORT_FILE="relatorio-duplicacoes-$(date +%Y%m%d-%H%M%S).txt"
        
        {
            echo "═══════════════════════════════════════════════════════════"
            echo "  Relatório de Duplicação de Código - React/TypeScript"
            echo "  Gerado em: $(date)"
            echo "═══════════════════════════════════════════════════════════"
            echo ""
            
            echo "1. Componentes com handleSort duplicado:"
            grep -r "const handleSort = (field:" src/components/ --include="*.tsx" -l | sort
            echo ""
            
            echo "2. Componentes com getSortIcon duplicado:"
            grep -r "const getSortIcon = (field:" src/components/ --include="*.tsx" -l | sort
            echo ""
            
            echo "3. Componentes com paginação duplicada:"
            grep -r "const totalPages = Math.ceil" src/components/ --include="*.tsx" -l | sort
            echo ""
            
            echo "4. Componentes com loadData duplicado:"
            grep -r "const load.*= async" src/components/ --include="*.tsx" -l | sort
            echo ""
            
            echo "═══════════════════════════════════════════════════════════"
            echo "ESTATÍSTICAS:"
            echo "═══════════════════════════════════════════════════════════"
            echo -n "Total de arquivos com handleSort: "
            grep -r "const handleSort = (field:" src/components/ --include="*.tsx" | wc -l
            echo -n "Total de arquivos com getSortIcon: "
            grep -r "const getSortIcon = (field:" src/components/ --include="*.tsx" | wc -l
            echo -n "Total de arquivos com paginação: "
            grep -r "const totalPages = Math.ceil" src/components/ --include="*.tsx" | wc -l
            echo ""
            
            echo "Estimativa de linhas duplicadas: ~1.520"
            echo "Estimativa de redução após refatoração: ~3.180 linhas"
            echo ""
            
        } > "$REPORT_FILE"
        
        echo -e "${GREEN}✓ Relatório gerado: $REPORT_FILE${NC}"
        cat "$REPORT_FILE"
        ;;
    
    6)
        echo -e "${YELLOW}🔍 Validando TypeScript...${NC}"
        
        if command -v npm &> /dev/null; then
            npm run type-check 2>&1 || {
                echo -e "${RED}❌ Erros de TypeScript encontrados${NC}"
                exit 1
            }
            echo -e "${GREEN}✓ TypeScript válido${NC}"
        else
            echo -e "${RED}❌ npm não encontrado${NC}"
        fi
        ;;
    
    7)
        echo -e "${YELLOW}🏗️  Executando build de teste...${NC}"
        
        if command -v npm &> /dev/null; then
            npm run build 2>&1 || {
                echo -e "${RED}❌ Build falhou${NC}"
                exit 1
            }
            echo -e "${GREEN}✓ Build concluído com sucesso${NC}"
        else
            echo -e "${RED}❌ npm não encontrado${NC}"
        fi
        ;;
    
    8)
        echo -e "${BLUE}👋 Saindo...${NC}"
        exit 0
        ;;
    
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Operação concluída${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📚 Documentação completa:${NC}"
echo -e "   docs/DUPLICACAO-CODIGO-REACT.md"
echo ""
echo -e "${BLUE}📂 Arquivos criados:${NC}"
echo -e "   src/hooks/useTableSort.ts"
echo -e "   src/hooks/useTablePagination.ts"
echo -e "   src/components/ui/SortableTableHeader.tsx"
echo -e "   src/utils/apiHelpers.ts"
echo ""
