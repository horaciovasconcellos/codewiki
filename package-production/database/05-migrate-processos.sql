-- Migração da tabela processos_negocio
USE auditoria_db;

-- Limpar dados existentes
TRUNCATE TABLE processos_negocio;

-- Recriar tabela com estrutura correta
DROP TABLE IF EXISTS processos_negocio;

CREATE TABLE processos_negocio (
    id VARCHAR(36) PRIMARY KEY,
    identificacao VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel_maturidade VARCHAR(50) NOT NULL,
    area_responsavel VARCHAR(200) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    duracao_media DECIMAL(10,2),
    complexidade VARCHAR(50) NOT NULL,
    normas JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_processos_identificacao (identificacao),
    INDEX idx_processos_area (area_responsavel),
    INDEX idx_processos_complexidade (complexidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados de exemplo
INSERT INTO processos_negocio (id, identificacao, nome, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade, normas)
VALUES 
('admn-00001', 'ADMN-00001', 'Gestao de Contratos', 'Gestao de Contratos Administrativos', 'Inicial', 'Administracao', 'Ad-Hoc', 8.00, 'Media', 
'[{"id":"norma-iso9001-001","tipoNorma":"Norma Tecnica","itemNorma":"ISO 9001 - Clausula 8.4","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-lei8666-001","tipoNorma":"Norma Legal","itemNorma":"Lei no 8.666/93 - Art. 54 a 88","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('fina-00001', 'FINA-00001', 'Contas a Pagar', 'Controle de Contas a Pagar', 'Inicial', 'Financeiro', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-ifrs9-001","tipoNorma":"Regulamentacao Internacional","itemNorma":"IFRS 9 - Secao 5.5","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-bacen-001","tipoNorma":"Norma Reguladora","itemNorma":"Resolucao BACEN 4.557 - Cap. III","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('tech-00001', 'TECH-00001', 'Dev Software', 'Desenvolvimento de Software', 'Inicial', 'Tecnologia da Informacao', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-iso27001-001","tipoNorma":"Norma Tecnica","itemNorma":"ISO/IEC 27001 - Anexo A.14","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-gdpr-001","tipoNorma":"Regulamentacao Internacional","itemNorma":"GDPR - Art. 25","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('saude-00001', 'SAUDE-00001', 'Atendimento', 'Atendimento Ambulatorial', 'Inicial', 'Saude', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-nr32-001","tipoNorma":"Norma Reguladora","itemNorma":"NR-32 - Item 32.2","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-anvisa-001","tipoNorma":"Norma Reguladora","itemNorma":"ANVISA RDC 301/2019 - Cap. 5","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-iec62304-001","tipoNorma":"Norma Tecnica","itemNorma":"IEC 62304 - Secao 5.1","dataInicio":"2024-01-15","obrigatoriedade":"Recomendado","status":"Ativo"}]'),

('elet-00001', 'ELET-00001', 'Infraestrutura Eletrica', 'Manutencao de Infraestrutura Eletrica', 'Inicial', 'Engenharia', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-nr10-001","tipoNorma":"Norma Reguladora","itemNorma":"NR-10 - Item 10.2","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-nbr5410-001","tipoNorma":"Norma Tecnica","itemNorma":"ABNT NBR 5410 - Secao 5","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('aces-00001', 'ACES-00001', 'Acessibilidade', 'Adequacao de Acessibilidade', 'Inicial', 'Obras e Infraestrutura', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-nbr9050-001","tipoNorma":"Norma Tecnica","itemNorma":"ABNT NBR 9050 - Secao 4","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-lei13146-001","tipoNorma":"Norma Legal","itemNorma":"Lei 13.146/2015 - Titulo III","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('come-00001', 'COME-00001', 'Import/Export', 'Importacao e Exportacao de Produtos', 'Inicial', 'Comercial', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-omc-001","tipoNorma":"Regulamentacao Internacional","itemNorma":"OMC/WTO - GATT Art. XI","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-regaduaneiro-001","tipoNorma":"Norma Reguladora","itemNorma":"Decreto 6.759/2009 - Titulo II","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('banc-00001', 'BANC-00001', 'Riscos Financeiros', 'Gestao de Riscos Financeiros', 'Inicial', 'Compliance Bancario', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-basel3-001","tipoNorma":"Regulamentacao Internacional","itemNorma":"Basel III - Pilar 1","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-cmn-001","tipoNorma":"Norma Reguladora","itemNorma":"Resolucao CMN 4.557/2017 - Art. 3","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('cont-00001', 'CONT-00001', 'Demonstracoes Financeiras', 'Elaboracao de Demonstracoes Financeiras', 'Inicial', 'Contabilidade', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-ifrs15-001","tipoNorma":"Regulamentacao Internacional","itemNorma":"IFRS 15 - Paragrafo 31","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-cpc00-001","tipoNorma":"Norma Tecnica","itemNorma":"CPC 00 (R2) - Capitulo 4","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]'),

('segu-00001', 'SEGU-00001', 'Incidentes Seguranca', 'Gestao de Incidentes de Seguranca', 'Inicial', 'Seguranca da Informacao', 'Ad-Hoc', 8.00, 'Media',
'[{"id":"norma-iso27001-002","tipoNorma":"Norma Tecnica","itemNorma":"ISO/IEC 27001 - Anexo A.16","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-lgpd-001","tipoNorma":"Norma Legal","itemNorma":"LGPD Lei 13.709/2018 - Art. 48","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"},{"id":"norma-gdpr-002","tipoNorma":"Regulamentacao Internacional","itemNorma":"GDPR - Art. 33","dataInicio":"2024-01-15","obrigatoriedade":"Obrigatorio","status":"Ativo"}]')
ON DUPLICATE KEY UPDATE
  identificacao = VALUES(identificacao),
  nome = VALUES(nome),
  descricao = VALUES(descricao),
  nivel_maturidade = VALUES(nivel_maturidade),
  area_responsavel = VALUES(area_responsavel),
  frequencia = VALUES(frequencia),
  duracao_media = VALUES(duracao_media),
  complexidade = VALUES(complexidade),
  normas = VALUES(normas);
