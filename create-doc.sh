#!/bin/bash
# Script para criar novos documentos seguindo as convenções do projeto
# Uso: ./create-doc.sh <categoria> <nome-do-arquivo>

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função de ajuda
show_help() {
    echo "📝 Criar Novo Documento - CodeWiki"
    echo ""
    echo "Uso: ./create-doc.sh <categoria> <nome-do-arquivo>"
    echo ""
    echo "Categorias disponíveis:"
    echo "  deployment    - 🚀 Deploy, produção, Docker"
    echo "  guides        - 📖 Guias e tutoriais"
    echo "  issues        - 🐛 Problemas e soluções"
    echo "  setup         - ⚙️ Setup e configuração"
    echo "  api           - 🔌 APIs e integrações"
    echo "  runbooks      - 📚 Runbooks operacionais"
    echo "  general       - 📄 Documentação geral (docs/)"
    echo ""
    echo "Exemplos:"
    echo "  ./create-doc.sh deployment DEPLOY-AWS"
    echo "  ./create-doc.sh guides GUIDE-API-USAGE"
    echo "  ./create-doc.sh setup SETUP-DATABASE"
    echo ""
}

# Verificar argumentos
if [ $# -lt 2 ]; then
    show_help
    exit 1
fi

CATEGORY=$1
FILENAME=$2

# Garantir extensão .md
if [[ ! "$FILENAME" =~ \.md$ ]]; then
    FILENAME="${FILENAME}.md"
fi

# Converter para UPPER-KEBAB-CASE se necessário
FILENAME=$(echo "$FILENAME" | tr '[:lower:]' '[:upper:]')

# Determinar pasta de destino
case $CATEGORY in
    deployment)
        DEST_DIR="docs/deployment"
        EMOJI="🚀"
        ;;
    guides)
        DEST_DIR="docs/guides"
        EMOJI="📖"
        ;;
    issues)
        DEST_DIR="docs/issues"
        EMOJI="🐛"
        ;;
    setup)
        DEST_DIR="docs/setup"
        EMOJI="⚙️"
        ;;
    api)
        DEST_DIR="docs/api-catalog"
        EMOJI="🔌"
        ;;
    runbooks)
        DEST_DIR="docs/runbooks"
        EMOJI="📚"
        ;;
    general)
        DEST_DIR="docs"
        EMOJI="📄"
        ;;
    *)
        echo -e "${RED}❌ Categoria inválida: $CATEGORY${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

# Criar diretório se não existir
mkdir -p "$DEST_DIR"

# Caminho completo do arquivo
FILEPATH="$DEST_DIR/$FILENAME"

# Verificar se arquivo já existe
if [ -f "$FILEPATH" ]; then
    echo -e "${RED}❌ Arquivo já existe: $FILEPATH${NC}"
    exit 1
fi

# Obter data atual
DATE=$(date +"%d de %B de %Y")

# Extrair título do nome do arquivo (remover .md e converter hífens)
TITLE=$(echo "$FILENAME" | sed 's/.md$//' | sed 's/-/ /g')

# Criar template do arquivo
cat > "$FILEPATH" << EOF
---
title: $TITLE
description: Breve descrição do documento
date: $DATE
tags:
  - $CATEGORY
  - documentação
---

# $EMOJI $TITLE

> Breve descrição do que este documento cobre

---

## 📋 Visão Geral

Descreva o propósito e contexto deste documento.

## 🎯 Objetivos

- Objetivo 1
- Objetivo 2
- Objetivo 3

## 📝 Conteúdo

### Seção 1

Conteúdo da seção 1.

### Seção 2

Conteúdo da seção 2.

## 🔗 Referências

- [Link 1](URL)
- [Link 2](URL)

## ✅ Checklist

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

---

**Última atualização**: $DATE  
**Status**: 🚧 Em construção
EOF

echo -e "${GREEN}✅ Documento criado: $FILEPATH${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "1. Edite o arquivo: $FILEPATH"
echo "2. Adicione ao mkdocs.yml na seção nav:"
echo ""
echo "   - \"$EMOJI Categoria\":"
echo "       - \"$TITLE\": \"${FILEPATH#docs/}\""
echo ""
echo "3. Teste localmente:"
echo "   docker-compose up mkdocs"
echo ""
echo "4. Commit:"
echo "   git add $FILEPATH mkdocs.yml"
echo "   git commit -m \"docs: adicionar $FILENAME\""
echo ""

# Abrir arquivo no editor padrão (se disponível)
if command -v code &> /dev/null; then
    code "$FILEPATH"
elif command -v nano &> /dev/null; then
    nano "$FILEPATH"
fi
