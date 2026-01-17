#!/bin/bash

# Script para renomear arquivos .md de maiúsculas para minúsculas
# Uso: ./rename_md_lowercase.sh [diretório]

# Define o diretório (usa o diretório atual se não for especificado)
DIR="${1:-.}"

# Verifica se o diretório existe
if [ ! -d "$DIR" ]; then
    echo "Erro: O diretório '$DIR' não existe."
    exit 1
fi

# Contador de arquivos renomeados
count=0

# Encontra e renomeia arquivos .md (case insensitive)
find "$DIR" -maxdepth 1 -type f -iname "*.md" | while read -r file; do
    # Obtém apenas o nome do arquivo (sem o caminho)
    filename=$(basename "$file")
    
    # Converte para minúsculas
    newname=$(echo "$filename" | tr '[:upper:]' '[:lower:]')
    
    # Verifica se o nome precisa ser alterado
    if [ "$filename" != "$newname" ]; then
        # Obtém o diretório do arquivo
        filepath=$(dirname "$file")
        
        # Verifica se o arquivo de destino já existe
        if [ -e "$filepath/$newname" ]; then
            echo "Aviso: '$newname' já existe. Pulando '$filename'."
        else
            # Renomeia o arquivo
            mv "$filepath/$filename" "$filepath/$newname"
            echo "Renomeado: $filename -> $newname"
            ((count++))
        fi
    fi
done

echo ""
echo "Total de arquivos renomeados: $count"
