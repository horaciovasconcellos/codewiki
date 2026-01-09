#!/bin/bash

# Script para sincronizar documentações do data-templates para docs/
# Usado antes de subir o container MkDocs

echo "🔄 Sincronizando documentações..."

# Criar diretório se não existir
mkdir -p docs/data-templates

# Copiar arquivos de documentação
echo "📄 Copiando arquivos README..."
cp data-templates/README-*.md docs/data-templates/ 2>/dev/null || echo "⚠️  Alguns READMEs podem não existir"

# Copiar guias específicos
echo "📋 Copiando guias..."
cp data-templates/GUIA-CARGA-CSV.md docs/data-templates/ 2>/dev/null || echo "⚠️  GUIA-CARGA-CSV.md não encontrado"
cp data-templates/HABILIDADES-QUICK-REF.md docs/data-templates/ 2>/dev/null || echo "⚠️  HABILIDADES-QUICK-REF.md não encontrado"

# Contar arquivos sincronizados
count=$(ls docs/data-templates/*.md 2>/dev/null | wc -l)
echo "✅ $count arquivos sincronizados!"

echo ""
echo "Para subir a documentação, execute:"
echo "  docker-compose up -d mkdocs"
echo "  ou"
echo "  docker-compose restart mkdocs"
echo ""
echo "Acesse: http://localhost:8000"
