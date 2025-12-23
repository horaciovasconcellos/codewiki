#!/bin/bash

echo "=========================================="
echo "Verificando estrutura da tabela habilidades"
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "DESCRIBE habilidades;"

echo ""
echo "=========================================="
echo "Verificando se a tabela existe"
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SHOW TABLES LIKE 'habilidades';"

echo ""
echo "=========================================="
echo "Listando todas as tabelas do banco"
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SHOW TABLES;"
