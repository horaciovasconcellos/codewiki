#!/bin/bash

# Script para migrar ícones Phosphor Icons deprecados
# Uso: ./migrate-phosphor-icons.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Migrando Phosphor Icons para a nova API...${NC}"
echo ""

# Contador de arquivos modificados
MODIFIED_COUNT=0

# Função para processar um arquivo
process_file() {
    local file="$1"
    local basename=$(basename "$file")
    
    # Verificar se o arquivo tem imports do Phosphor
    if ! grep -q "@phosphor-icons/react" "$file"; then
        return 0
    fi
    
    echo -e "${YELLOW}📝 Processando: $basename${NC}"
    
    # Criar backup
    cp "$file" "$file.bak"
    
    # Substituições de imports deprecados
    # Adicionar sufixo Icon para evitar conflitos
    sed -i '' \
        -e 's/import { \(.*\)ArrowLeft\(.*\) } from/import { \1ArrowLeft as ArrowLeftIcon\2 } from/' \
        -e 's/import { \(.*\)ArrowRight\(.*\) } from/import { \1ArrowRight as ArrowRightIcon\2 } from/' \
        -e 's/import { \(.*\)Check\(.*\) } from/import { \1Check as CheckIcon\2 } from/' \
        -e 's/import { \(.*\)X\(.*\) } from/import { \1X as XIcon\2 } from/' \
        -e 's/import { \(.*\)Plus\(.*\) } from/import { \1Plus as PlusIcon\2 } from/' \
        -e 's/import { \(.*\)Trash\(.*\) } from/import { \1Trash as TrashIcon\2 } from/' \
        -e 's/import { \(.*\)Pencil\(.*\) } from/import { \1Pencil as PencilIcon\2 } from/' \
        -e 's/import { \(.*\)PencilSimple\(.*\) } from/import { \1PencilSimple as PencilSimpleIcon\2 } from/' \
        -e 's/import { \(.*\)MagnifyingGlass\(.*\) } from/import { \1MagnifyingGlass as MagnifyingGlassIcon\2 } from/' \
        -e 's/import { \(.*\)Eye\(.*\) } from/import { \1Eye as EyeIcon\2 } from/' \
        -e 's/import { \(.*\)FilePdf\(.*\) } from/import { \1FilePdf as FilePdfIcon\2 } from/' \
        -e 's/import { \(.*\)Download\(.*\) } from/import { \1Download as DownloadIcon\2 } from/' \
        -e 's/import { \(.*\)Printer\(.*\) } from/import { \1Printer as PrinterIcon\2 } from/' \
        -e 's/import { \(.*\)CaretUp\(.*\) } from/import { \1CaretUp as CaretUpIcon\2 } from/' \
        -e 's/import { \(.*\)CaretDown\(.*\) } from/import { \1CaretDown as CaretDownIcon\2 } from/' \
        -e 's/import { \(.*\)CaretUpDown\(.*\) } from/import { \1CaretUpDown as CaretUpDownIcon\2 } from/' \
        "$file"
    
    # Substituir usos no JSX
    sed -i '' \
        -e 's/<ArrowLeft /<ArrowLeftIcon /g' \
        -e 's/<ArrowRight /<ArrowRightIcon /g' \
        -e 's/<Check /<CheckIcon /g' \
        -e 's/<X /<XIcon /g' \
        -e 's/<Plus /<PlusIcon /g' \
        -e 's/<Trash /<TrashIcon /g' \
        -e 's/<Pencil /<PencilIcon /g' \
        -e 's/<PencilSimple /<PencilSimpleIcon /g' \
        -e 's/<MagnifyingGlass /<MagnifyingGlassIcon /g' \
        -e 's/<Eye /<EyeIcon /g' \
        -e 's/<FilePdf /<FilePdfIcon /g' \
        -e 's/<Download /<DownloadIcon /g' \
        -e 's/<Printer /<PrinterIcon /g' \
        -e 's/<CaretUp /<CaretUpIcon /g' \
        -e 's/<CaretDown /<CaretDownIcon /g' \
        -e 's/<CaretUpDown /<CaretUpDownIcon /g' \
        "$file"
    
    # Verificar se houve mudanças
    if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Arquivo modificado${NC}"
        MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
        rm "$file.bak"
    else
        echo -e "  ℹ️  Sem alterações necessárias"
        mv "$file.bak" "$file"
    fi
}

# Processar componentes específicos
echo -e "${BLUE}📁 Processando componentes React/TypeScript...${NC}"
echo ""

COMPONENTS=(
    "src/components/tecnologias/TecnologiaWizard.tsx"
    "src/components/adr/ADRDataTable.tsx"
    "src/components/execucoes-teste/ExecucoesTesteDataTable.tsx"
    "src/components/aplicacoes/wizard-steps/StepSquads.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        process_file "$component"
    else
        echo -e "${RED}⚠️  Arquivo não encontrado: $component${NC}"
    fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Migração concluída!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📊 Arquivos modificados: ${GREEN}$MODIFIED_COUNT${NC}"
echo ""

if [ $MODIFIED_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Próximos passos:${NC}"
    echo "  1. Revisar as mudanças: git diff"
    echo "  2. Executar testes: npm test"
    echo "  3. Verificar build: npm run build"
    echo "  4. Commit: git commit -am 'fix: migrar ícones Phosphor para nova API'"
    echo ""
fi

# Verificar se ESLint está disponível
if command -v npx &> /dev/null; then
    echo -e "${YELLOW}🔍 Deseja executar ESLint para remover imports não utilizados? (s/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}🔧 Executando ESLint...${NC}"
        npx eslint --fix src/components/**/*.tsx || echo -e "${YELLOW}⚠️  ESLint encontrou alguns problemas${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Processo completo!${NC}"
