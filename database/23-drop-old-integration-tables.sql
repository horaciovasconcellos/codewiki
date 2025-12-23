-- Migration: Remove tabelas de integração antigas (não mais necessárias após unificação)
-- Data: 2025-12-15
-- Descrição: Remove as tabelas específicas de integração que foram unificadas na tabela integracoes

-- Remove tabelas antigas de integrações
DROP TABLE IF EXISTS user_to_cloud;
DROP TABLE IF EXISTS user_to_onpremise;
DROP TABLE IF EXISTS cloud_to_cloud;
DROP TABLE IF EXISTS onpremise_to_cloud;
DROP TABLE IF EXISTS onpremise_to_onpremise;

-- Verificar tabelas restantes
SHOW TABLES;
