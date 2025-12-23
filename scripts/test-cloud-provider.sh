#!/bin/bash

echo "=== Testando inserção com Cloud Provider ==="

curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "TEST-CP",
    "descricao": "Teste Cloud Provider",
    "urlDocumentacao": "http://test.com",
    "tipoAplicacao": "INTERNO",
    "cloudProvider": "AWS",
    "faseCicloVida": "Planejamento",
    "criticidadeNegocio": "Média",
    "tecnologias": [],
    "ambientes": [],
    "capacidades": [],
    "processos": [],
    "integracoes": [],
    "slas": []
  }' | jq

echo ""
echo "=== Verificando no banco de dados ==="
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "SELECT sigla, tipo_aplicacao, cloud_provider FROM aplicacoes WHERE sigla = 'TEST-CP'" 2>/dev/null

echo ""
echo "=== Limpando registro de teste ==="
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "DELETE FROM aplicacoes WHERE sigla = 'TEST-CP'" 2>/dev/null
echo "Teste concluído!"
