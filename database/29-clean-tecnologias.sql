-- Migration: Limpar tabela de tecnologias
-- Data: 2025-12-17
-- Descrição: Remover todos os registros da tabela tecnologias para permitir nova carga

USE auditoria_db;

-- Remover todos os registros
DELETE FROM tecnologias;

-- Verificar que a tabela está vazia
SELECT COUNT(*) as total_registros FROM tecnologias;

-- NOTA: Este comando mantém a estrutura da tabela intacta,
-- incluindo indexes e constraints. Apenas os dados são removidos.
-- A tabela está pronta para receber novos registros.
