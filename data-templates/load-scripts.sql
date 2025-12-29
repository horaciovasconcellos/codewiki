-- Script de Carga de Scripts
-- Data: 2024-12-29
-- Descrição: Importa scripts de exemplo no sistema

-- Limpar dados existentes (opcional - comentar se não quiser limpar)
-- DELETE FROM scripts;

-- Inserir scripts de exemplo
INSERT INTO scripts (id, sigla, descricao, data_inicio, data_termino, tipo_script, arquivo, arquivo_url, arquivo_tamanho, arquivo_tipo) VALUES
('aa0e8400-e29b-41d4-a716-446655440101', 'SCR-AUTO-001', 'Script de backup automático diário dos bancos de dados MySQL com compressão e rotação de arquivos antigos', '2024-01-15', NULL, 'Automação', 'backup-diario.sh', 'uploads/scripts/backup-diario.sh', 2048, 'application/x-sh'),
('aa0e8400-e29b-41d4-a716-446655440102', 'SCR-ADM-001', 'Script de limpeza de logs antigos do sistema, removendo arquivos com mais de 30 dias', '2024-02-01', NULL, 'Administração', 'cleanup-logs.sh', 'uploads/scripts/cleanup-logs.sh', 1536, 'application/x-sh'),
('aa0e8400-e29b-41d4-a716-446655440103', 'SCR-DB-001', 'Script de otimização de índices do MySQL para melhorar performance das consultas', '2024-01-10', NULL, 'Banco de Dados', 'optimize-indexes.sql', 'uploads/scripts/optimize-indexes.sql', 4096, 'text/x-sql'),
('aa0e8400-e29b-41d4-a716-446655440104', 'SCR-INT-001', 'Script de sincronização com Azure DevOps para importação de work items e sprints', '2024-03-01', NULL, 'Integração', 'sync-azure.py', 'uploads/scripts/sync-azure.py', 8192, 'text/x-python'),
('aa0e8400-e29b-41d4-a716-446655440105', 'SCR-TEST-001', 'Script de testes de integração automatizados com cobertura de APIs REST', '2024-02-15', NULL, 'Testes', 'integration-tests.js', 'uploads/scripts/integration-tests.js', 12288, 'application/javascript'),
('aa0e8400-e29b-41d4-a716-446655440106', 'SCR-BUILD-001', 'Script de build e deploy para produção com validações e rollback automático', '2024-01-05', NULL, 'Build & Deploy', 'deploy-prod.sh', 'uploads/scripts/deploy-prod.sh', 3072, 'application/x-sh'),
('aa0e8400-e29b-41d4-a716-446655440107', 'SCR-CICD-001', 'Pipeline CI/CD completo com validações de qualidade, testes e deploy automatizado', '2024-02-20', NULL, 'CI/CD', 'pipeline-config.yaml', 'uploads/scripts/pipeline-config.yaml', 6144, 'text/yaml'),
('aa0e8400-e29b-41d4-a716-446655440108', 'SCR-IAC-001', 'Terraform para provisionamento de infraestrutura AWS com VPC, EC2, RDS e S3', '2024-03-10', NULL, 'Infraestrutura (IaC)', 'infrastructure.tf', 'uploads/scripts/infrastructure.tf', 10240, 'text/plain'),
('aa0e8400-e29b-41d4-a716-446655440109', 'SCR-MON-001', 'Script de monitoramento de saúde dos serviços com alertas via email e Slack', '2024-01-20', NULL, 'Monitoramento', 'health-check.py', 'uploads/scripts/health-check.py', 5120, 'text/x-python'),
('aa0e8400-e29b-41d4-a716-446655440110', 'SCR-SEC-001', 'Script de auditoria de segurança e vulnerabilidades com scan de dependências', '2024-02-05', NULL, 'Segurança', 'security-audit.ps1', 'uploads/scripts/security-audit.ps1', 7168, 'application/x-powershell'),
('aa0e8400-e29b-41d4-a716-446655440111', 'SCR-GOV-001', 'Script de compliance e governança de dados conforme LGPD e ISO 27001', '2024-03-15', NULL, 'Governança', 'compliance-check.py', 'uploads/scripts/compliance-check.py', 9216, 'text/x-python'),
('aa0e8400-e29b-41d4-a716-446655440112', 'SCR-DATA-001', 'Script ETL de extração, transformação e carga de dados entre sistemas', '2024-01-25', NULL, 'Dados', 'etl-pipeline.py', 'uploads/scripts/etl-pipeline.py', 15360, 'text/x-python'),
('aa0e8400-e29b-41d4-a716-446655440113', 'SCR-ERP-001', 'Script de integração com sistema ERP SAP para sincronização de pedidos e estoque', '2024-02-28', NULL, 'ERP', 'sap-integration.js', 'uploads/scripts/sap-integration.js', 11264, 'application/javascript'),
('aa0e8400-e29b-41d4-a716-446655440114', 'SCR-DOC-001', 'Script de geração automática de documentação API em formato OpenAPI/Swagger', '2024-03-05', NULL, 'Documentação', 'generate-api-docs.js', 'uploads/scripts/generate-api-docs.js', 4608, 'application/javascript');

-- Verificar dados inseridos
SELECT 
    sigla,
    tipo_script,
    DATE_FORMAT(data_inicio, '%d/%m/%Y') as data_inicio,
    arquivo
FROM scripts
ORDER BY tipo_script, sigla;

-- Estatísticas de scripts por tipo
SELECT 
    tipo_script,
    COUNT(*) as total,
    COUNT(arquivo) as com_arquivo
FROM scripts
GROUP BY tipo_script
ORDER BY tipo_script;

COMMIT;
