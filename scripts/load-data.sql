-- Script de carga inicial de dados para o Sistema de Auditoria

-- Carga de Tipos de Afastamento
INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo)
VALUES ('tipo-1', 'FERIAS', 'Férias regulamentares', 'Art. 130 da CLT', 30, 'C');

INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo)
VALUES ('tipo-2', 'LICMED', 'Licença médica', 'Art. 60 da Lei 8.112/90', 15, 'C');

INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo)
VALUES ('tipo-3', 'LUTO', 'Licença por luto', 'Art. 97 da Lei 8.112/90', 8, 'C');

INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo)
VALUES ('tipo-4', 'MATERN', 'Licença maternidade', 'Art. 207 da Lei 8.112/90', 120, 'C');

INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo)
VALUES ('tipo-5', 'PATERN', 'Licença paternidade', 'Art. 208 da Lei 8.112/90', 5, 'C');

-- Carga de Habilidades
INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-1', 'JAVA', 'Programação Java', 'Técnica', 'Backend');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-2', 'PYTHON', 'Programação Python', 'Técnica', 'Backend');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-3', 'REACT', 'Desenvolvimento React', 'Técnica', 'Frontend');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-4', 'ANGULAR', 'Desenvolvimento Angular', 'Técnica', 'Frontend');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-5', 'ORACLE', 'Administração Oracle Database', 'Técnica', 'Banco de Dados');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-6', 'POSTGRESQL', 'Administração PostgreSQL', 'Técnica', 'Banco de Dados');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-7', 'DOCKER', 'Containerização com Docker', 'Técnica', 'Devops');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-8', 'KUBERNETES', 'Orquestração Kubernetes', 'Técnica', 'Devops');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria)
VALUES ('hab-9', 'SCRUM', 'Metodologia Ágil Scrum', 'Gestão', 'Outras');

INSERT INTO habilidades (id, sigla, descricao, dominio, subcategaria)
VALUES ('hab-10', 'LIDER', 'Liderança de Equipes', 'Comportamental', 'Outras');

-- Carga de Capacidades de Negócio
INSERT INTO capacidades_negocio (id, sigla, nome, descricao, nivel, categoria, alinhamento_objetivos, beneficios_esperados, estado_futuro_desejado, gap_estado_atual_futuro)
VALUES ('cap-1', 'GFI', 'Gestão Financeira', 'Capacidade de gerenciar recursos financeiros', 'Nível 2', 'Financeiro', 
'Otimizar controle orçamentário', 'Redução de custos operacionais', 'Automação completa do processo financeiro', 'Falta de integração entre sistemas');

INSERT INTO capacidades_negocio (id, sigla, nome, descricao, nivel, categoria, alinhamento_objetivos, beneficios_esperados, estado_futuro_desejado, gap_estado_atual_futuro)
VALUES ('cap-2', 'GRH', 'Gestão de Recursos Humanos', 'Capacidade de gerenciar colaboradores', 'Nível 2', 'RH', 
'Melhorar engajamento dos colaboradores', 'Redução de turnover', 'Sistema integrado de gestão de pessoas', 'Processos manuais e fragmentados');

INSERT INTO capacidades_negocio (id, sigla, nome, descricao, nivel, categoria, alinhamento_objetivos, beneficios_esperados, estado_futuro_desejado, gap_estado_atual_futuro)
VALUES ('cap-3', 'GLST', 'Gestão Logística', 'Capacidade de gerenciar logística e suprimentos', 'Nível 3', 'Logística', 
'Otimizar cadeia de suprimentos', 'Redução de tempo de entrega', 'Rastreamento em tempo real', 'Sistema legado sem integração');

-- Carga de Aplicações
INSERT INTO aplicacoes (id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio)
VALUES ('app-1', 'SISAUD', 'Sistema de Auditoria e Conformidade', 'https://docs.empresa.com/sisaud', 'Produção', 'Muito Alta');

INSERT INTO aplicacoes (id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio)
VALUES ('app-2', 'PORTAL', 'Portal Corporativo', 'https://docs.empresa.com/portal', 'Produção', 'Alta');

INSERT INTO aplicacoes (id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio)
VALUES ('app-3', 'FINANCE', 'Sistema Financeiro', 'https://docs.empresa.com/finance', 'Produção', 'Muito Alta');

INSERT INTO aplicacoes (id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio)
VALUES ('app-4', 'RHUMANO', 'Recursos Humanos', 'https://docs.empresa.com/rh', 'Produção', 'Alta');

INSERT INTO aplicacoes (id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio)
VALUES ('app-5', 'ANALITICA', 'Plataforma de Analytics', 'https://docs.empresa.com/analytics', 'Desenvolvimento', 'Média');

-- Carga de Tecnologias
INSERT INTO tecnologias (id, sigla, nome, versao_release, categoria, status, fornecedor_fabricante, tipo_licenciamento, 
maturidade_interna, nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod, ambiente_cloud, ambiente_on_premise)
VALUES ('tec-1', 'JAVA17', 'Java Development Kit', '17.0.8', 'Backend', 'Ativa', 'Oracle Corporation', 'Open Source', 
'Padronizada', 'Suporte Completo / Especializado', '1', '1', '1', '1', '1');

INSERT INTO tecnologias (id, sigla, nome, versao_release, categoria, status, fornecedor_fabricante, tipo_licenciamento, 
maturidade_interna, nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod, ambiente_cloud, ambiente_on_premise)
VALUES ('tec-2', 'REACT18', 'React Framework', '18.2.0', 'Frontend', 'Ativa', 'Meta (Facebook)', 'Open Source', 
'Padronizada', 'Suporte Avançado', '1', '1', '1', '1', '0');

INSERT INTO tecnologias (id, sigla, nome, versao_release, categoria, status, fornecedor_fabricante, tipo_licenciamento, 
maturidade_interna, nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod, ambiente_cloud, ambiente_on_premise)
VALUES ('tec-3', 'ORACLE19', 'Oracle Database', '19c', 'Banco de Dados', 'Ativa', 'Oracle Corporation', 'Proprietária', 
'Padronizada', 'AMS', '1', '1', '1', '0', '1');

INSERT INTO tecnologias (id, sigla, nome, versao_release, categoria, status, fornecedor_fabricante, tipo_licenciamento, 
maturidade_interna, nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod, ambiente_cloud, ambiente_on_premise)
VALUES ('tec-4', 'PYTHON311', 'Python', '3.11.5', 'Backend', 'Ativa', 'Python Software Foundation', 'Open Source', 
'Adotada', 'Suporte Intermediário', '1', '1', '1', '1', '1');

INSERT INTO tecnologias (id, sigla, nome, versao_release, categoria, status, fornecedor_fabricante, tipo_licenciamento, 
maturidade_interna, nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod, ambiente_cloud, ambiente_on_premise)
VALUES ('tec-5', 'ANGULAR16', 'Angular Framework', '16.2.0', 'Frontend', 'Ativa', 'Google', 'Open Source', 
'Adotada', 'Suporte Básico', '1', '1', '1', '1', '0');

-- Carga de Processos de Negócio
INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('proc-1', 'PROC-FIN-001', 'Processo de fechamento contábil mensal', 'Gerenciado', 'Financeiro', 'Mensal', 120.5, 'Alta');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('proc-2', 'PROC-RH-001', 'Processo de folha de pagamento', 'Definido', 'Recursos Humanos', 'Mensal', 80.0, 'Média');

INSERT INTO processos_negocio (id, identificacao, descricao, nivel_maturidade, area_responsavel, frequencia, duracao_media, complexidade)
VALUES ('proc-3', 'PROC-TI-001', 'Processo de deploy de aplicações', 'Gerenciado', 'TI', 'Semanal', 45.0, 'Média');

-- Carga de SLAs
INSERT INTO slas (id, sigla, descricao, tipo_sla, data_inicio, data_termino, status)
VALUES ('sla-1', 'SLA-APP-001', 'SLA de disponibilidade para aplicações críticas', 'SLA de Disponibilidade', 
TO_DATE('2024-01-01', 'YYYY-MM-DD'), NULL, 'Ativo');

INSERT INTO slas (id, sigla, descricao, tipo_sla, data_inicio, data_termino, status)
VALUES ('sla-2', 'SLA-SUP-001', 'SLA de suporte técnico - P1', 'SLA de Suporte / Atendimento', 
TO_DATE('2024-01-01', 'YYYY-MM-DD'), NULL, 'Ativo');

INSERT INTO slas (id, sigla, descricao, tipo_sla, data_inicio, data_termino, status)
VALUES ('sla-3', 'SLA-PERF-001', 'SLA de performance de APIs', 'SLA de Performance', 
TO_DATE('2024-01-01', 'YYYY-MM-DD'), NULL, 'Ativo');

-- Carga de Runbooks
INSERT INTO runbooks (id, sigla, descricao_resumida, finalidade, tipo_runbook)
VALUES ('run-1', 'RB-DEPLOY-001', 'Procedimento de deploy em produção', 'Garantir deploy seguro em ambiente produtivo', 'Deploy');

INSERT INTO runbooks (id, sigla, descricao_resumida, finalidade, tipo_runbook)
VALUES ('run-2', 'RB-BACKUP-001', 'Procedimento de backup de banco de dados', 'Realizar backup completo do banco de dados Oracle', 'Backup');

INSERT INTO runbooks (id, sigla, descricao_resumida, finalidade, tipo_runbook)
VALUES ('run-3', 'RB-INC-001', 'Tratamento de incidente crítico', 'Procedimento para tratamento de incidentes P1', 'Tratamento de Incidente');

-- Carga de Colaborador de exemplo (matricula 5664)
INSERT INTO colaboradores (id, matricula, nome, setor, data_admissao, data_demissao)
VALUES ('colab-5664', '5664', 'João Silva Santos', 'Tecnologia da Informação', TO_DATE('2020-03-15', 'YYYY-MM-DD'), NULL);

-- Carga de Habilidades do Colaborador 5664
INSERT INTO habilidades_colaboradores (id, colaborador_id, habilidade_id, nivel_declarado, nivel_avaliado, data_inicio, data_termino)
VALUES ('hab-colab-1', 'colab-5664', 'hab-1', 'Avançado', 'Avançado', TO_DATE('2020-03-15', 'YYYY-MM-DD'), NULL);

INSERT INTO habilidades_colaboradores (id, colaborador_id, habilidade_id, nivel_declarado, nivel_avaliado, data_inicio, data_termino)
VALUES ('hab-colab-2', 'colab-5664', 'hab-3', 'Intermediário', 'Avançado', TO_DATE('2021-06-01', 'YYYY-MM-DD'), NULL);

INSERT INTO habilidades_colaboradores (id, colaborador_id, habilidade_id, nivel_declarado, nivel_avaliado, data_inicio, data_termino)
VALUES ('hab-colab-3', 'colab-5664', 'hab-7', 'Avançado', 'Expert', TO_DATE('2020-03-15', 'YYYY-MM-DD'), NULL);

-- Carga de Repositórios de exemplo
INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-1', 'SISAUD', 'backend', 'java');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-2', 'SISAUD', 'frontend', 'react');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-3', 'SISAUD', 'api', 'java');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-4', 'PORTAL', 'frontend', 'angular');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-5', 'PORTAL', 'backend', 'node');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-6', 'FINANCE', 'api', 'java');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-7', 'FINANCE', 'etl', 'python');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-8', 'ANALITICA', 'dashboard', 'powerbi');

INSERT INTO repositorios_projetos (id, produto, categoria, tecnologia)
VALUES ('repo-9', 'ANALITICA', 'etl', 'databricks');

-- Carga de exemplo de Projeto Gerado
INSERT INTO projetos_gerados (id, produto, projeto, data_inicial, iteracao, incluir_query, incluir_maven, incluir_liquibase, data_criacao)
VALUES ('proj-1', 'SISAUD', 'modulo-auditoria', TO_DATE('2024-01-15', 'YYYY-MM-DD'), 1, '1', '1', '1', SYSTIMESTAMP);

-- Associação de repositórios ao projeto gerado
INSERT INTO repos_por_projeto (id, projeto_gerado_id, repositorio_id)
VALUES ('rpp-1', 'proj-1', 'repo-1');

INSERT INTO repos_por_projeto (id, projeto_gerado_id, repositorio_id)
VALUES ('rpp-2', 'proj-1', 'repo-2');

INSERT INTO repos_por_projeto (id, projeto_gerado_id, repositorio_id)
VALUES ('rpp-3', 'proj-1', 'repo-3');

-- Carga de Token de Acesso de exemplo
INSERT INTO tokens_acesso (id, token_hash, tipo_entidade, identificador_entidade, nome_entidade, ambiente, 
data_geracao, data_inicio_validade, data_expiracao, token_temporario, permitir_regeneracao, 
rate_limit_por_hora, requer_mfa, status, criado_por, data_hora_criacao, quantidade_acessos)
VALUES ('token-1', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'Sistema', 'SYS-INTEGRATION-001', 'Sistema de Integração Azure DevOps', 
'Produção', SYSTIMESTAMP, SYSTIMESTAMP, ADD_MONTHS(SYSTIMESTAMP, 12), '0', '1', 
5000, '1', 'Ativo', 'admin@empresa.com', SYSTIMESTAMP, 0);

-- Carga de Escopos do Token
INSERT INTO tokens_escopos (id, token_id, escopo)
VALUES ('esc-1', 'token-1', 'READ');

INSERT INTO tokens_escopos (id, token_id, escopo)
VALUES ('esc-2', 'token-1', 'INTEGRACAO');

-- Carga de Origens Permitidas do Token
INSERT INTO tokens_origens (id, token_id, origem)
VALUES ('orig-1', 'token-1', 'https://dev.azure.com');

INSERT INTO tokens_origens (id, token_id, origem)
VALUES ('orig-2', 'token-1', 'https://api.empresa.com');

COMMIT;

-- Exibir estatísticas de carga
SELECT 'Tipos de Afastamento' AS TABELA, COUNT(*) AS REGISTROS FROM tipos_afastamento
UNION ALL
SELECT 'Habilidades', COUNT(*) FROM habilidades
UNION ALL
SELECT 'Capacidades de Negócio', COUNT(*) FROM capacidades_negocio
UNION ALL
SELECT 'Aplicações', COUNT(*) FROM aplicacoes
UNION ALL
SELECT 'Tecnologias', COUNT(*) FROM tecnologias
UNION ALL
SELECT 'Processos de Negócio', COUNT(*) FROM processos_negocio
UNION ALL
SELECT 'SLAs', COUNT(*) FROM slas
UNION ALL
SELECT 'Runbooks', COUNT(*) FROM runbooks
UNION ALL
SELECT 'Colaboradores', COUNT(*) FROM colaboradores
UNION ALL
SELECT 'Habilidades Colaboradores', COUNT(*) FROM habilidades_colaboradores
UNION ALL
SELECT 'Repositórios de Projetos', COUNT(*) FROM repositorios_projetos
UNION ALL
SELECT 'Projetos Gerados', COUNT(*) FROM projetos_gerados
UNION ALL
SELECT 'Repositórios por Projeto', COUNT(*) FROM repos_por_projeto
UNION ALL
SELECT 'Tokens de Acesso', COUNT(*) FROM tokens_acesso
UNION ALL
SELECT 'Tokens Escopos', COUNT(*) FROM tokens_escopos
UNION ALL
SELECT 'Tokens Origens', COUNT(*) FROM tokens_origens
ORDER BY TABELA;
