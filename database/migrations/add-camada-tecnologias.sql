-- Migration: Adicionar campo camada e atualizar categoria em tecnologias
-- Data: 2026-01-15

-- 1. Adicionar a coluna camada (inicialmente NULL)
ALTER TABLE tecnologias 
ADD COLUMN camada ENUM('Front-End', 'UI', 'Design', 'Back-end', 'Linguagem') 
AFTER versao_release;

-- 2. Adicionar índice para melhor performance
CREATE INDEX idx_tecnologias_camada ON tecnologias(camada);

-- 3. Migrar dados existentes de categoria para camada
UPDATE tecnologias SET camada = 'Front-End' WHERE categoria = 'Frontend';
UPDATE tecnologias SET camada = 'Back-end' WHERE categoria = 'Backend';
UPDATE tecnologias SET camada = 'Back-end' WHERE camada IS NULL; -- Default para registros sem camada

-- 4. Tornar camada obrigatório (NOT NULL)
ALTER TABLE tecnologias MODIFY COLUMN camada ENUM('Front-End', 'UI', 'Design', 'Back-end', 'Linguagem') NOT NULL;

-- 5. Atualizar valores de categoria removendo Frontend e Backend
-- Criar nova constraint temporária
ALTER TABLE tecnologias MODIFY COLUMN categoria VARCHAR(100);

-- Atualizar registros Frontend/Backend para uma categoria padrão
UPDATE tecnologias SET categoria = 'Framework' WHERE categoria IN ('Frontend', 'Backend');

-- NOTA: A constraint ENUM para categoria deve ser gerenciada pela aplicação
-- pois MySQL não permite modificar ENUM facilmente sem recriar a tabela
-- Os novos valores aceitos para categoria incluem: 'Framework', 'Gerenciador', 'Banco de Dados', 
-- 'Infraestrutura', 'Biblioteca', etc.

-- 6. Adicionar comentário na tabela documentando as mudanças
ALTER TABLE tecnologias COMMENT = 'Tecnologias do sistema - Campo camada obrigatório desde 2026-01-15';
