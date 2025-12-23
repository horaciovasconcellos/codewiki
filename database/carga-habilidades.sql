-- ========================================
-- CARGA DE HABILIDADES - Soft e Hard Skills
-- Tecnologias: SAP, Oracle, Microsoft, Azure, AWS
-- Data: 2025-12-22
-- ========================================

-- Limpar habilidades existentes (se necessário)
-- DELETE FROM habilidades;

-- ========================================
-- SOFT SKILLS (Comportamentais)
-- ========================================

-- Liderança e Gestão
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Liderança de Equipes', 'Comportamental'),
(UUID(), 'Gestão de Projetos', 'Comportamental'),
(UUID(), 'Tomada de Decisão', 'Comportamental'),
(UUID(), 'Visão Estratégica', 'Comportamental'),
(UUID(), 'Gestão de Stakeholders', 'Comportamental'),
(UUID(), 'Gestão de Mudanças', 'Comportamental');

-- Comunicação
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Comunicação Efetiva', 'Comportamental'),
(UUID(), 'Comunicação Técnica', 'Comportamental'),
(UUID(), 'Apresentações Executivas', 'Comportamental'),
(UUID(), 'Negociação', 'Comportamental'),
(UUID(), 'Comunicação Intercultural', 'Comportamental'),
(UUID(), 'Redação Técnica', 'Comportamental');

-- Trabalho em Equipe
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Trabalho em Equipe', 'Comportamental'),
(UUID(), 'Colaboração Remota', 'Comportamental'),
(UUID(), 'Resolução de Conflitos', 'Comportamental'),
(UUID(), 'Mentoria', 'Comportamental'),
(UUID(), 'Empatia', 'Comportamental');

-- Adaptabilidade
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Adaptabilidade', 'Comportamental'),
(UUID(), 'Aprendizado Contínuo', 'Comportamental'),
(UUID(), 'Resiliência', 'Comportamental'),
(UUID(), 'Flexibilidade', 'Comportamental'),
(UUID(), 'Gestão de Estresse', 'Comportamental');

-- Resolução de Problemas
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Pensamento Crítico', 'Comportamental'),
(UUID(), 'Análise de Problemas', 'Comportamental'),
(UUID(), 'Criatividade', 'Comportamental'),
(UUID(), 'Inovação', 'Comportamental'),
(UUID(), 'Troubleshooting', 'Comportamental');

-- ========================================
-- HARD SKILLS - SAP
-- ========================================

-- SAP - Módulos Funcionais
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'SAP ERP', 'Tecnica'),
(UUID(), 'SAP S/4HANA', 'Tecnica'),
(UUID(), 'SAP FI/CO (Financeiro)', 'Tecnica'),
(UUID(), 'SAP MM (Material Management)', 'Tecnica'),
(UUID(), 'SAP SD (Sales & Distribution)', 'Tecnica'),
(UUID(), 'SAP PP (Production Planning)', 'Tecnica'),
(UUID(), 'SAP HR/HCM', 'Tecnica'),
(UUID(), 'SAP PM (Plant Maintenance)', 'Tecnica'),
(UUID(), 'SAP QM (Quality Management)', 'Tecnica'),
(UUID(), 'SAP PS (Project System)', 'Tecnica');

-- SAP - Tecnologia
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'SAP ABAP', 'Tecnica'),
(UUID(), 'SAP ABAP OO', 'Tecnica'),
(UUID(), 'SAP Fiori', 'Tecnica'),
(UUID(), 'SAP UI5', 'Tecnica'),
(UUID(), 'SAP Gateway', 'Tecnica'),
(UUID(), 'SAP HANA', 'Tecnica'),
(UUID(), 'SAP BTP (Business Technology Platform)', 'Tecnica'),
(UUID(), 'SAP Integration Suite', 'Tecnica'),
(UUID(), 'SAP CAP (Cloud Application Programming)', 'Tecnica'),
(UUID(), 'SAP Workflow', 'Tecnica');

-- SAP - Analytics e BI
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'SAP BW/4HANA', 'Tecnica'),
(UUID(), 'SAP Analytics Cloud', 'Tecnica'),
(UUID(), 'SAP BusinessObjects', 'Tecnica'),
(UUID(), 'SAP Data Intelligence', 'Tecnica');

-- SAP - Gestão
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'SAP Solution Manager', 'Gestao'),
(UUID(), 'SAP Basis Administration', 'Tecnica'),
(UUID(), 'SAP Security', 'Tecnica'),
(UUID(), 'SAP Transport Management', 'Tecnica');

-- ========================================
-- HARD SKILLS - ORACLE
-- ========================================

-- Oracle - Database
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Oracle Database', 'Tecnica'),
(UUID(), 'Oracle 19c/21c', 'Tecnica'),
(UUID(), 'Oracle PL/SQL', 'Tecnica'),
(UUID(), 'Oracle SQL', 'Tecnica'),
(UUID(), 'Oracle RAC (Real Application Clusters)', 'Tecnica'),
(UUID(), 'Oracle Data Guard', 'Tecnica'),
(UUID(), 'Oracle ASM (Automatic Storage Management)', 'Tecnica'),
(UUID(), 'Oracle RMAN (Recovery Manager)', 'Tecnica'),
(UUID(), 'Oracle Exadata', 'Tecnica'),
(UUID(), 'Oracle Performance Tuning', 'Tecnica');

-- Oracle - Cloud
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Oracle Cloud Infrastructure (OCI)', 'Tecnica'),
(UUID(), 'Oracle Autonomous Database', 'Tecnica'),
(UUID(), 'Oracle Cloud Applications', 'Tecnica'),
(UUID(), 'Oracle Integration Cloud', 'Tecnica');

-- Oracle - Applications
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Oracle E-Business Suite', 'Tecnica'),
(UUID(), 'Oracle Fusion Applications', 'Tecnica'),
(UUID(), 'Oracle ERP Cloud', 'Tecnica'),
(UUID(), 'Oracle HCM Cloud', 'Tecnica'),
(UUID(), 'Oracle SCM Cloud', 'Tecnica');

-- Oracle - Middleware
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Oracle WebLogic Server', 'Tecnica'),
(UUID(), 'Oracle SOA Suite', 'Tecnica'),
(UUID(), 'Oracle Service Bus', 'Tecnica'),
(UUID(), 'Oracle API Gateway', 'Tecnica');

-- Oracle - Administração
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Oracle DBA', 'Tecnica'),
(UUID(), 'Oracle Backup e Recovery', 'Tecnica'),
(UUID(), 'Oracle Security Administration', 'Tecnica'),
(UUID(), 'Oracle High Availability', 'Tecnica');

-- ========================================
-- HARD SKILLS - MICROSOFT
-- ========================================

-- Microsoft - Desenvolvimento
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), '.NET Framework', 'Tecnica'),
(UUID(), '.NET Core', 'Tecnica'),
(UUID(), 'C#', 'Tecnica'),
(UUID(), 'ASP.NET MVC', 'Tecnica'),
(UUID(), 'ASP.NET Web API', 'Tecnica'),
(UUID(), 'Entity Framework', 'Tecnica'),
(UUID(), 'Visual Studio', 'Tecnica'),
(UUID(), 'TypeScript', 'Tecnica');

-- Microsoft - Database
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'SQL Server', 'Tecnica'),
(UUID(), 'SQL Server Integration Services (SSIS)', 'Tecnica'),
(UUID(), 'SQL Server Reporting Services (SSRS)', 'Tecnica'),
(UUID(), 'SQL Server Analysis Services (SSAS)', 'Tecnica'),
(UUID(), 'T-SQL', 'Tecnica'),
(UUID(), 'SQL Server DBA', 'Tecnica'),
(UUID(), 'SQL Server Performance Tuning', 'Tecnica');

-- Microsoft - 365 e SharePoint
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Microsoft 365', 'Tecnica'),
(UUID(), 'SharePoint Online', 'Tecnica'),
(UUID(), 'SharePoint On-Premises', 'Tecnica'),
(UUID(), 'Power Platform', 'Tecnica'),
(UUID(), 'Power Apps', 'Tecnica'),
(UUID(), 'Power Automate', 'Tecnica'),
(UUID(), 'Power BI', 'Tecnica'),
(UUID(), 'Microsoft Teams Development', 'Tecnica');

-- Microsoft - Windows Server
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Windows Server', 'Tecnica'),
(UUID(), 'Active Directory', 'Tecnica'),
(UUID(), 'Windows PowerShell', 'Tecnica'),
(UUID(), 'IIS (Internet Information Services)', 'Tecnica'),
(UUID(), 'Group Policy', 'Tecnica'),
(UUID(), 'SCCM (System Center Configuration Manager)', 'Tecnica');

-- Microsoft - Dynamics
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Dynamics 365', 'Tecnica'),
(UUID(), 'Dynamics CRM', 'Tecnica'),
(UUID(), 'Dynamics ERP', 'Tecnica');

-- ========================================
-- HARD SKILLS - AZURE
-- ========================================

-- Azure - Compute
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Virtual Machines', 'Tecnica'),
(UUID(), 'Azure App Service', 'Tecnica'),
(UUID(), 'Azure Functions', 'Tecnica'),
(UUID(), 'Azure Container Instances', 'Tecnica'),
(UUID(), 'Azure Kubernetes Service (AKS)', 'Tecnica'),
(UUID(), 'Azure Service Fabric', 'Tecnica');

-- Azure - Storage
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Blob Storage', 'Tecnica'),
(UUID(), 'Azure File Storage', 'Tecnica'),
(UUID(), 'Azure Queue Storage', 'Tecnica'),
(UUID(), 'Azure Table Storage', 'Tecnica'),
(UUID(), 'Azure Disk Storage', 'Tecnica');

-- Azure - Database
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure SQL Database', 'Tecnica'),
(UUID(), 'Azure Cosmos DB', 'Tecnica'),
(UUID(), 'Azure Database for MySQL', 'Tecnica'),
(UUID(), 'Azure Database for PostgreSQL', 'Tecnica'),
(UUID(), 'Azure Synapse Analytics', 'Tecnica'),
(UUID(), 'Azure Cache for Redis', 'Tecnica');

-- Azure - Networking
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Virtual Network', 'Tecnica'),
(UUID(), 'Azure Load Balancer', 'Tecnica'),
(UUID(), 'Azure Application Gateway', 'Tecnica'),
(UUID(), 'Azure VPN Gateway', 'Tecnica'),
(UUID(), 'Azure ExpressRoute', 'Tecnica'),
(UUID(), 'Azure DNS', 'Tecnica'),
(UUID(), 'Azure Front Door', 'Tecnica');

-- Azure - Integration
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Logic Apps', 'Tecnica'),
(UUID(), 'Azure Service Bus', 'Tecnica'),
(UUID(), 'Azure Event Grid', 'Tecnica'),
(UUID(), 'Azure Event Hubs', 'Tecnica'),
(UUID(), 'Azure API Management', 'Tecnica');

-- Azure - Security
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Active Directory', 'Tecnica'),
(UUID(), 'Azure Key Vault', 'Tecnica'),
(UUID(), 'Azure Security Center', 'Tecnica'),
(UUID(), 'Azure Sentinel', 'Tecnica'),
(UUID(), 'Azure Information Protection', 'Tecnica');

-- Azure - DevOps
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure DevOps', 'Tecnica'),
(UUID(), 'Azure Pipelines', 'Tecnica'),
(UUID(), 'Azure Repos', 'Tecnica'),
(UUID(), 'Azure Artifacts', 'Tecnica'),
(UUID(), 'Azure Monitor', 'Tecnica'),
(UUID(), 'Azure Application Insights', 'Tecnica');

-- Azure - AI/ML
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Machine Learning', 'Tecnica'),
(UUID(), 'Azure Cognitive Services', 'Tecnica'),
(UUID(), 'Azure Bot Service', 'Tecnica'),
(UUID(), 'Azure OpenAI Service', 'Tecnica');

-- Azure - Gestão
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Azure Architecture', 'Gestao'),
(UUID(), 'Azure Cost Management', 'Gestao'),
(UUID(), 'Azure Governance', 'Gestao'),
(UUID(), 'Azure Resource Manager (ARM)', 'Tecnica');

-- ========================================
-- HARD SKILLS - AWS
-- ========================================

-- AWS - Compute
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon EC2', 'Tecnica'),
(UUID(), 'AWS Lambda', 'Tecnica'),
(UUID(), 'Amazon ECS (Elastic Container Service)', 'Tecnica'),
(UUID(), 'Amazon EKS (Elastic Kubernetes Service)', 'Tecnica'),
(UUID(), 'AWS Fargate', 'Tecnica'),
(UUID(), 'AWS Elastic Beanstalk', 'Tecnica'),
(UUID(), 'AWS Batch', 'Tecnica');

-- AWS - Storage
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon S3', 'Tecnica'),
(UUID(), 'Amazon EBS (Elastic Block Store)', 'Tecnica'),
(UUID(), 'Amazon EFS (Elastic File System)', 'Tecnica'),
(UUID(), 'Amazon Glacier', 'Tecnica'),
(UUID(), 'AWS Storage Gateway', 'Tecnica');

-- AWS - Database
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon RDS', 'Tecnica'),
(UUID(), 'Amazon Aurora', 'Tecnica'),
(UUID(), 'Amazon DynamoDB', 'Tecnica'),
(UUID(), 'Amazon Redshift', 'Tecnica'),
(UUID(), 'Amazon ElastiCache', 'Tecnica'),
(UUID(), 'Amazon DocumentDB', 'Tecnica'),
(UUID(), 'Amazon Neptune', 'Tecnica');

-- AWS - Networking
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon VPC', 'Tecnica'),
(UUID(), 'AWS Direct Connect', 'Tecnica'),
(UUID(), 'Amazon Route 53', 'Tecnica'),
(UUID(), 'AWS CloudFront', 'Tecnica'),
(UUID(), 'Elastic Load Balancing', 'Tecnica'),
(UUID(), 'AWS Global Accelerator', 'Tecnica'),
(UUID(), 'AWS Transit Gateway', 'Tecnica');

-- AWS - Integration
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon SQS', 'Tecnica'),
(UUID(), 'Amazon SNS', 'Tecnica'),
(UUID(), 'Amazon EventBridge', 'Tecnica'),
(UUID(), 'AWS Step Functions', 'Tecnica'),
(UUID(), 'Amazon API Gateway', 'Tecnica'),
(UUID(), 'AWS AppSync', 'Tecnica');

-- AWS - Security
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'AWS IAM', 'Tecnica'),
(UUID(), 'AWS KMS (Key Management Service)', 'Tecnica'),
(UUID(), 'AWS Secrets Manager', 'Tecnica'),
(UUID(), 'AWS WAF (Web Application Firewall)', 'Tecnica'),
(UUID(), 'AWS Shield', 'Tecnica'),
(UUID(), 'AWS GuardDuty', 'Tecnica'),
(UUID(), 'AWS Security Hub', 'Tecnica'),
(UUID(), 'AWS Certificate Manager', 'Tecnica');

-- AWS - DevOps
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'AWS CodePipeline', 'Tecnica'),
(UUID(), 'AWS CodeBuild', 'Tecnica'),
(UUID(), 'AWS CodeDeploy', 'Tecnica'),
(UUID(), 'AWS CodeCommit', 'Tecnica'),
(UUID(), 'AWS CloudFormation', 'Tecnica'),
(UUID(), 'AWS CDK (Cloud Development Kit)', 'Tecnica'),
(UUID(), 'AWS Systems Manager', 'Tecnica'),
(UUID(), 'AWS CloudWatch', 'Tecnica'),
(UUID(), 'AWS X-Ray', 'Tecnica');

-- AWS - AI/ML
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon SageMaker', 'Tecnica'),
(UUID(), 'AWS Rekognition', 'Tecnica'),
(UUID(), 'Amazon Comprehend', 'Tecnica'),
(UUID(), 'Amazon Lex', 'Tecnica'),
(UUID(), 'Amazon Polly', 'Tecnica'),
(UUID(), 'AWS DeepLens', 'Tecnica');

-- AWS - Analytics
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Amazon Athena', 'Tecnica'),
(UUID(), 'AWS Glue', 'Tecnica'),
(UUID(), 'Amazon EMR', 'Tecnica'),
(UUID(), 'Amazon Kinesis', 'Tecnica'),
(UUID(), 'Amazon QuickSight', 'Tecnica'),
(UUID(), 'AWS Data Pipeline', 'Tecnica');

-- AWS - Gestão
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'AWS Solutions Architecture', 'Gestao'),
(UUID(), 'AWS Cost Management', 'Gestao'),
(UUID(), 'AWS Well-Architected Framework', 'Gestao'),
(UUID(), 'AWS Organizations', 'Gestao'),
(UUID(), 'AWS Control Tower', 'Gestao');

-- ========================================
-- HABILIDADES TÉCNICAS GERAIS
-- ========================================

-- DevOps e CI/CD
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Docker', 'Tecnica'),
(UUID(), 'Kubernetes', 'Tecnica'),
(UUID(), 'Terraform', 'Tecnica'),
(UUID(), 'Ansible', 'Tecnica'),
(UUID(), 'Jenkins', 'Tecnica'),
(UUID(), 'GitLab CI/CD', 'Tecnica'),
(UUID(), 'GitHub Actions', 'Tecnica');

-- Linguagens de Programação
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Python', 'Tecnica'),
(UUID(), 'Java', 'Tecnica'),
(UUID(), 'JavaScript', 'Tecnica'),
(UUID(), 'Go', 'Tecnica'),
(UUID(), 'Ruby', 'Tecnica'),
(UUID(), 'PHP', 'Tecnica');

-- Bancos de Dados Gerais
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'PostgreSQL', 'Tecnica'),
(UUID(), 'MySQL', 'Tecnica'),
(UUID(), 'MongoDB', 'Tecnica'),
(UUID(), 'Redis', 'Tecnica');

-- Arquitetura
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Microservices', 'Tecnica'),
(UUID(), 'API Design', 'Tecnica'),
(UUID(), 'REST APIs', 'Tecnica'),
(UUID(), 'GraphQL', 'Tecnica'),
(UUID(), 'Event-Driven Architecture', 'Tecnica'),
(UUID(), 'Serverless Architecture', 'Tecnica');

-- Segurança
INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Security Best Practices', 'Tecnica'),
(UUID(), 'OWASP', 'Tecnica'),
(UUID(), 'SSL/TLS', 'Tecnica'),
(UUID(), 'OAuth/OIDC', 'Tecnica'),
(UUID(), 'Network Security', 'Tecnica');

-- ========================================
-- HABILIDADES DE GESTÃO
-- ========================================

INSERT INTO habilidades (id, nome, tipo) VALUES 
(UUID(), 'Agile/Scrum', 'Gestao'),
(UUID(), 'Kanban', 'Gestao'),
(UUID(), 'ITIL', 'Gestao'),
(UUID(), 'COBIT', 'Gestao'),
(UUID(), 'PMI/PMP', 'Gestao'),
(UUID(), 'Prince2', 'Gestao'),
(UUID(), 'DevOps Culture', 'Gestao'),
(UUID(), 'SRE (Site Reliability Engineering)', 'Gestao'),
(UUID(), 'Service Management', 'Gestao'),
(UUID(), 'Vendor Management', 'Gestao'),
(UUID(), 'Budget Management', 'Gestao'),
(UUID(), 'Risk Management', 'Gestao'),
(UUID(), 'Compliance Management', 'Gestao'),
(UUID(), 'Business Analysis', 'Gestao'),
(UUID(), 'Enterprise Architecture', 'Gestao');

-- ========================================
-- FINALIZAÇÃO
-- ========================================

-- Verificar total de habilidades inseridas
SELECT 
    tipo,
    COUNT(*) as total
FROM habilidades 
GROUP BY tipo
ORDER BY tipo;

-- Verificar algumas habilidades por categoria
SELECT id, nome, tipo 
FROM habilidades 
WHERE tipo = 'Comportamental'
LIMIT 10;

SELECT id, nome, tipo 
FROM habilidades 
WHERE nome LIKE '%SAP%'
LIMIT 10;

SELECT id, nome, tipo 
FROM habilidades 
WHERE nome LIKE '%Oracle%'
LIMIT 10;

SELECT id, nome, tipo 
FROM habilidades 
WHERE nome LIKE '%Azure%'
LIMIT 10;

SELECT id, nome, tipo 
FROM habilidades 
WHERE nome LIKE '%AWS%' OR nome LIKE '%Amazon%'
LIMIT 10;

SELECT id, nome, tipo 
FROM habilidades 
WHERE nome LIKE '%Microsoft%' OR nome LIKE '%SQL Server%' OR nome LIKE '%.NET%'
LIMIT 10;
