-- Migração e carga de aplicações com relacionamentos
USE auditoria_db;

-- Limpar dados existentes primeiro
DELETE FROM aplicacoes;

-- Recriar tabela com todas as colunas necessárias
DROP TABLE IF EXISTS aplicacoes;

CREATE TABLE aplicacoes (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(20) NOT NULL UNIQUE,
  descricao VARCHAR(200) NOT NULL,
  url_documentacao VARCHAR(500) NOT NULL,
  fase_ciclo_vida VARCHAR(20) NOT NULL,
  criticidade_negocio VARCHAR(20) NOT NULL,
  categoria_sistema VARCHAR(50),
  fornecedor VARCHAR(200),
  tipo_hospedagem VARCHAR(50),
  custo_mensal DECIMAL(12,2),
  numero_usuarios INT,
  data_implantacao DATE,
  versao_atual VARCHAR(50),
  responsavel_tecnico VARCHAR(200),
  responsavel_negocio VARCHAR(200),
  status_operacional VARCHAR(50),
  observacoes TEXT,
  tecnologias JSON,
  ambientes JSON,
  capacidades JSON,
  processos JSON,
  integracoes JSON,
  slas JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir aplicações de exemplo
INSERT INTO aplicacoes (
  id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio,
  categoria_sistema, fornecedor, tipo_hospedagem, custo_mensal, numero_usuarios,
  data_implantacao, versao_atual, responsavel_tecnico, responsavel_negocio,
  status_operacional, observacoes
) VALUES 
('app-001', 'ERP-FIN', 'Sistema ERP Financeiro', 'https://docs.company.com/erp', 'Operacao', 'Critica',
  'ERP', 'SAP', 'Cloud', 150000.00, 500, '2020-01-15', '2.5.1', 'Carlos Silva', 'Maria Santos',
  'Ativo', 'Sistema principal de gestao financeira'),

('app-002', 'CRM-VEN', 'Sistema CRM Vendas', 'https://docs.company.com/crm', 'Operacao', 'Alta',
  'CRM', 'Salesforce', 'Cloud', 80000.00, 300, '2019-06-10', '3.2.0', 'Ana Costa', 'Pedro Oliveira',
  'Ativo', 'Gestao de relacionamento com clientes'),

('app-003', 'BI-DASH', 'Business Intelligence Dashboard', 'https://docs.company.com/bi', 'Operacao', 'Alta',
  'Analytics', 'Tableau', 'Hybrid', 120000.00, 150, '2021-03-20', '1.8.5', 'Roberto Lima', 'Juliana Ferreira',
  'Ativo', 'Dashboards e relatorios gerenciais'),

('app-004', 'HCM-RH', 'Sistema de Gestao de Pessoas', 'https://docs.company.com/hcm', 'Operacao', 'Alta',
  'HCM', 'Workday', 'Cloud', 95000.00, 800, '2020-09-01', '4.1.2', 'Fernanda Alves', 'Ricardo Souza',
  'Ativo', 'Gestao completa de RH'),

('app-005', 'WMS-LOG', 'Warehouse Management System', 'https://docs.company.com/wms', 'Operacao', 'Critica',
  'Logistica', 'Manhattan', 'On-Premise', 110000.00, 200, '2018-11-05', '5.3.0', 'Marcos Pereira', 'Lucia Martins',
  'Ativo', 'Gestao de armazem e logistica'),

('app-006', 'API-GTW', 'API Gateway', 'https://docs.company.com/gateway', 'Operacao', 'Critica',
  'Integracao', 'Kong', 'Hybrid', 45000.00, 50, '2021-08-12', '2.7.0', 'Paulo Santos', 'Adriana Costa',
  'Ativo', 'Gateway central de APIs'),

('app-007', 'MOB-APP', 'Aplicativo Mobile Corporativo', 'https://docs.company.com/mobile', 'Desenvolvimento', 'Media',
  'Mobile', 'Interno', 'Cloud', 25000.00, 1000, '2022-02-28', '1.2.0', 'Gustavo Rocha', 'Beatriz Lima',
  'Em Desenvolvimento', 'App mobile para colaboradores'),

('app-008', 'SEC-IAM', 'Identity and Access Management', 'https://docs.company.com/iam', 'Operacao', 'Critica',
  'Seguranca', 'Okta', 'Cloud', 70000.00, 1200, '2019-12-10', '3.5.4', 'Renato Silva', 'Camila Almeida',
  'Ativo', 'Gestao de identidades e acessos'),

('app-009', 'DOC-MGT', 'Sistema de Gestao Documental', 'https://docs.company.com/docs', 'Operacao', 'Media',
  'GED', 'SharePoint', 'Cloud', 55000.00, 600, '2020-04-15', '2.3.1', 'Diego Martins', 'Patricia Souza',
  'Ativo', 'Gestao e armazenamento de documentos'),

('app-010', 'CHAT-BOT', 'Chatbot Atendimento', 'https://docs.company.com/chatbot', 'Piloto', 'Baixa',
  'AI/ML', 'IBM Watson', 'Cloud', 30000.00, 100, '2023-05-20', '0.9.5', 'Thiago Costa', 'Vanessa Oliveira',
  'Em Teste', 'Atendimento automatizado via IA');

-- Atualizar aplicações com relacionamentos JSON

-- app-001: ERP-FIN
UPDATE aplicacoes SET
  tecnologias = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'tecnologiaId', 'e390cbe3-e79c-4cac-8f6d-9982ba51abd4', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', 'fb937c96-97cc-4423-a13f-94a896c32128', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', '852d86d5-e882-43a0-98bf-b6f1e527ecdb', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', '6f37050b-4ff1-41d3-a662-0a3add9c7b75', 'dataInicio', '2020-06-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', '10a047f2-205a-44e9-ade4-7fb6722e6466', 'dataInicio', '2020-03-01', 'status', 'Ativo')
  ),
  ambientes = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'tipoAmbiente', 'Desenvolvimento', 'urlAmbiente', 'https://dev-erp.company.com', 'dataCriacao', '2020-01-15', 'tempoLiberacao', 2, 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tipoAmbiente', 'Homologacao', 'urlAmbiente', 'https://qa-erp.company.com', 'dataCriacao', '2020-01-20', 'tempoLiberacao', 4, 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tipoAmbiente', 'Producao', 'urlAmbiente', 'https://erp.company.com', 'dataCriacao', '2020-02-01', 'tempoLiberacao', 24, 'status', 'Ativo')
  ),
  capacidades = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'capacidadeId', 'd34030fb-6e32-4ee1-8c75-88b60dbda23f', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', 'e545afde-fe75-4576-ad97-04318412c1d9', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', '8bc6d311-fdb3-4f63-8a29-090088e2521b', 'dataInicio', '2020-03-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', 'f6ebd638-3189-4703-9fc8-173b104fe5aa', 'dataInicio', '2020-04-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', 'c332f92f-dfce-4cb4-b303-e9e61261f610', 'dataInicio', '2020-05-01', 'status', 'Ativo')
  ),
  processos = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'processoId', 'fina-00001', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'cont-00001', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'admn-00001', 'dataInicio', '2020-02-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'come-00001', 'dataInicio', '2020-03-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'banc-00001', 'dataInicio', '2020-04-01', 'status', 'Ativo')
  ),
  integracoes = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'aplicacaoDestinoId', 'app-002', 'dataInicio', '2020-03-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'aplicacaoDestinoId', 'app-006', 'dataInicio', '2021-08-15', 'status', 'Ativo')
  ),
  slas = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'slaId', '39258d85-7958-4faa-9b5b-c60533aca0e5', 'descricao', 'Disponibilidade 99.9%', 'dataInicio', '2020-01-15', 'status', 'Ativo')
  )
WHERE id = 'app-001';

-- app-002: CRM-VEN
UPDATE aplicacoes SET
  tecnologias = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'tecnologiaId', '1121f3cc-3225-4f56-9e8c-c75edf4586f5', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', 'fb937c96-97cc-4423-a13f-94a896c32128', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', '852d86d5-e882-43a0-98bf-b6f1e527ecdb', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', '4254117e-9c87-497a-a8cf-3c72f86c7fdf', 'dataInicio', '2019-07-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tecnologiaId', 'dbb23e40-bdfd-400b-be3a-b18b4e3b50a3', 'dataInicio', '2019-08-01', 'status', 'Ativo')
  ),
  ambientes = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'tipoAmbiente', 'Desenvolvimento', 'urlAmbiente', 'https://dev-crm.company.com', 'dataCriacao', '2019-06-10', 'tempoLiberacao', 1, 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tipoAmbiente', 'Homologacao', 'urlAmbiente', 'https://qa-crm.company.com', 'dataCriacao', '2019-06-15', 'tempoLiberacao', 3, 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'tipoAmbiente', 'Producao', 'urlAmbiente', 'https://crm.company.com', 'dataCriacao', '2019-07-01', 'tempoLiberacao', 12, 'status', 'Ativo')
  ),
  capacidades = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'capacidadeId', '8bc6d311-fdb3-4f63-8a29-090088e2521b', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', '92641ae9-9c28-497d-8030-d35bdfa2f09d', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', '934f461d-359c-46cf-b94f-0adc093846c0', 'dataInicio', '2019-07-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', 'd34030fb-6e32-4ee1-8c75-88b60dbda23f', 'dataInicio', '2019-08-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'capacidadeId', 'f6ebd638-3189-4703-9fc8-173b104fe5aa', 'dataInicio', '2019-09-01', 'status', 'Ativo')
  ),
  processos = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'processoId', 'come-00001', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'admn-00001', 'dataInicio', '2019-06-10', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'fina-00001', 'dataInicio', '2019-07-01', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'processoId', 'tech-00001', 'dataInicio', '2019-08-01', 'status', 'Ativo')
  ),
  integracoes = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'aplicacaoDestinoId', 'app-001', 'dataInicio', '2020-01-15', 'status', 'Ativo'),
    JSON_OBJECT('id', UUID(), 'aplicacaoDestinoId', 'app-003', 'dataInicio', '2021-03-25', 'status', 'Ativo')
  ),
  slas = JSON_ARRAY(
    JSON_OBJECT('id', UUID(), 'slaId', '7a9a2670-9e32-4bbd-a841-40dc209b369b', 'descricao', 'Tempo resposta 2s', 'dataInicio', '2019-06-10', 'status', 'Ativo')
  )
WHERE id = 'app-002';

-- Continuar para demais aplicações...

