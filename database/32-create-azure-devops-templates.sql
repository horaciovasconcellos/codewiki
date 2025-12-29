-- ============================================================
-- Criação da tabela para Templates YAML do Azure DevOps
-- ============================================================

USE auditoria_db;

-- Criar tabela azure_devops_templates
CREATE TABLE IF NOT EXISTS azure_devops_templates (
    id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID do template',
    template_type VARCHAR(50) NOT NULL COMMENT 'Tipo do template: pullRequest, hotfix, main, develop',
    template_content MEDIUMTEXT NOT NULL COMMENT 'Conteúdo do template YAML',
    file_name VARCHAR(255) NOT NULL COMMENT 'Nome original do arquivo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    UNIQUE KEY idx_template_type (template_type),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Templates YAML para pipelines do Azure DevOps';

-- Verificar se a tabela foi criada
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'auditoria_db' 
  AND TABLE_NAME = 'azure_devops_templates';

SHOW CREATE TABLE azure_devops_templates;

-- Inserir templates de exemplo (opcional - pode ser removido em produção)
-- Nota: Estes são exemplos básicos que devem ser substituídos por templates reais

-- Template Pull Request
INSERT INTO azure_devops_templates (id, template_type, template_content, file_name, created_at, updated_at)
VALUES (
    UUID(),
    'pullRequest',
    '# Template de Pipeline para Pull Request
# Este é um template de exemplo que deve ser personalizado

trigger: none

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: ''ubuntu-latest''

stages:
  - stage: Build
    displayName: ''Build Stage''
    jobs:
      - job: BuildJob
        displayName: ''Build Job''
        steps:
          - script: echo "Building pull request..."
            displayName: ''Build''
          
          - script: echo "Running tests..."
            displayName: ''Test''

  - stage: Validation
    displayName: ''Validation Stage''
    dependsOn: Build
    jobs:
      - job: ValidationJob
        displayName: ''Validation Job''
        steps:
          - script: echo "Validating changes..."
            displayName: ''Validate''',
    'template-pull-request.yml',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    template_content = VALUES(template_content),
    file_name = VALUES(file_name),
    updated_at = NOW();

-- Template Hotfix
INSERT INTO azure_devops_templates (id, template_type, template_content, file_name, created_at, updated_at)
VALUES (
    UUID(),
    'hotfix',
    '# Template de Pipeline para Hotfix
# Este é um template de exemplo que deve ser personalizado

trigger:
  branches:
    include:
      - hotfix/*

pool:
  vmImage: ''ubuntu-latest''

stages:
  - stage: Build
    displayName: ''Build Stage''
    jobs:
      - job: BuildJob
        displayName: ''Build Job''
        steps:
          - script: echo "Building hotfix..."
            displayName: ''Build''
          
          - script: echo "Running tests..."
            displayName: ''Test''

  - stage: Deploy
    displayName: ''Deploy Stage''
    dependsOn: Build
    jobs:
      - deployment: DeployJob
        displayName: ''Deploy Job''
        environment: ''production''
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying hotfix to production..."
                  displayName: ''Deploy''',
    'template-hotfix.yml',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    template_content = VALUES(template_content),
    file_name = VALUES(file_name),
    updated_at = NOW();

-- Template Main
INSERT INTO azure_devops_templates (id, template_type, template_content, file_name, created_at, updated_at)
VALUES (
    UUID(),
    'main',
    '# Template de Pipeline para Main Branch
# Este é um template de exemplo que deve ser personalizado

trigger:
  branches:
    include:
      - main

pool:
  vmImage: ''ubuntu-latest''

stages:
  - stage: Build
    displayName: ''Build Stage''
    jobs:
      - job: BuildJob
        displayName: ''Build Job''
        steps:
          - script: echo "Building from main..."
            displayName: ''Build''
          
          - script: echo "Running tests..."
            displayName: ''Test''

  - stage: DeployProd
    displayName: ''Deploy to Production''
    dependsOn: Build
    jobs:
      - deployment: DeployProdJob
        displayName: ''Deploy Production''
        environment: ''production''
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to production..."
                  displayName: ''Deploy''',
    'template-main.yml',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    template_content = VALUES(template_content),
    file_name = VALUES(file_name),
    updated_at = NOW();

-- Template Develop
INSERT INTO azure_devops_templates (id, template_type, template_content, file_name, created_at, updated_at)
VALUES (
    UUID(),
    'develop',
    '# Template de Pipeline para Develop Branch
# Este é um template de exemplo que deve ser personalizado

trigger:
  branches:
    include:
      - develop

pool:
  vmImage: ''ubuntu-latest''

stages:
  - stage: Build
    displayName: ''Build Stage''
    jobs:
      - job: BuildJob
        displayName: ''Build Job''
        steps:
          - script: echo "Building from develop..."
            displayName: ''Build''
          
          - script: echo "Running tests..."
            displayName: ''Test''

  - stage: DeployDev
    displayName: ''Deploy to Development''
    dependsOn: Build
    jobs:
      - deployment: DeployDevJob
        displayName: ''Deploy Development''
        environment: ''development''
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to development..."
                  displayName: ''Deploy''',
    'template-develop.yml',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    template_content = VALUES(template_content),
    file_name = VALUES(file_name),
    updated_at = NOW();

-- Verificar templates inseridos
SELECT 
    id,
    template_type,
    file_name,
    CHAR_LENGTH(template_content) as content_size,
    created_at,
    updated_at
FROM azure_devops_templates
ORDER BY template_type;

COMMIT;

-- ============================================================
-- Fim da migração
-- ============================================================
