-- Alterando sigla da tabela integracoes para 30 caracteres
USE auditoria_db;

-- Alterar a coluna sigla para VARCHAR(30)
ALTER TABLE integracoes 
MODIFY COLUMN sigla VARCHAR(30) NOT NULL UNIQUE;

-- Verificar alteração
SELECT 'Coluna sigla da tabela integracoes alterada para VARCHAR(30)' AS status;
