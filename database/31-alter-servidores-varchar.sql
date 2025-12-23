-- Migration: Converter campos ENUM para VARCHAR na tabela servidores
-- Data: 2025-12-17
-- Descrição: Evitar problemas de codificação com caracteres especiais nos ENUMs

USE auditoria_db;

-- Converter ENUM para VARCHAR para maior flexibilidade
ALTER TABLE servidores MODIFY COLUMN tipo VARCHAR(20) NOT NULL;
ALTER TABLE servidores MODIFY COLUMN ambiente VARCHAR(30) NOT NULL;
ALTER TABLE servidores MODIFY COLUMN finalidade VARCHAR(30) NOT NULL;
ALTER TABLE servidores MODIFY COLUMN status VARCHAR(20) DEFAULT 'Ativo';
ALTER TABLE servidores MODIFY COLUMN provedor VARCHAR(20) NOT NULL;
ALTER TABLE servidores MODIFY COLUMN virtualizador VARCHAR(20);
ALTER TABLE servidores MODIFY COLUMN sistema_operacional VARCHAR(30) NOT NULL;
ALTER TABLE servidores MODIFY COLUMN ferramenta_monitoramento VARCHAR(20);

-- Verificar as alterações
DESCRIBE servidores;
