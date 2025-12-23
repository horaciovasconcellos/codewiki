-- Limpar dados existentes
DELETE FROM normas_processo;
DELETE FROM processos_negocio;

-- Inserir processos de negócio de exemplo
INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('admn-00001', 'ADMN-00001', 'Gestão de Contratos Administrativos', 'Inicial', 'Administração', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('fina-00001', 'FINA-00001', 'Controle de Contas a Pagar', 'Inicial', 'Financeiro', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('tech-00001', 'TECH-00001', 'Desenvolvimento de Software', 'Inicial', 'Tecnologia da Informação', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('saude-00001', 'SAUDE-00001', 'Atendimento Ambulatorial', 'Inicial', 'Saúde', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('elet-00001', 'ELET-00001', 'Manutenção de Infraestrutura Elétrica', 'Inicial', 'Engenharia', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('aces-00001', 'ACES-00001', 'Adequação de Acessibilidade', 'Inicial', 'Obras e Infraestrutura', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('come-00001', 'COME-00001', 'Importação e Exportação de Produtos', 'Inicial', 'Comercial', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('banc-00001', 'BANC-00001', 'Gestão de Riscos Financeiros', 'Inicial', 'Compliance Bancário', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('cont-00001', 'CONT-00001', 'Elaboração de Demonstrações Financeiras', 'Inicial', 'Contabilidade', 'Ad-Hoc', 8, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('segu-00001', 'SEGU-00001', 'Gestão de Incidentes de Segurança', 'Inicial', 'Segurança da Informação', 'Ad-Hoc', 8, 'Média');

COMMIT;
