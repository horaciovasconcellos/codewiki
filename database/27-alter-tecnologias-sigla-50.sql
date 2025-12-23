-- Aumentar tamanho da coluna sigla em tecnologias de VARCHAR(20) para VARCHAR(50)
-- Data: 2025-12-18
-- Motivo: Permitir siglas mais longas para melhor identificação de tecnologias

ALTER TABLE tecnologias 
MODIFY COLUMN sigla VARCHAR(50) UNIQUE NOT NULL;
