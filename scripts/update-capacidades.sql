-- Atualização da tabela capacidades_negocio

ALTER TABLE capacidades_negocio 
ADD COLUMN nivel VARCHAR(20),
ADD COLUMN categoria VARCHAR(50),
ADD COLUMN alinhamento_objetivos TEXT,
ADD COLUMN beneficios_esperados TEXT,
ADD COLUMN estado_futuro_desejado TEXT,
ADD COLUMN gap_estado_atual_futuro TEXT;
