# 🎯 Guia Rápido - Habilidades Carregadas

## 📊 Resumo Executivo

```
TOTAL GERAL          : 271 habilidades
├─ Técnicas          : 220 (81.2%)
├─ Comportamentais   : 27 (10.0%)
└─ Gestão            : 24 (8.8%)

Por Tecnologia:
├─ AWS/Amazon        : 65
├─ Azure             : 48
├─ SAP               : 28
├─ Oracle            : 27
└─ Microsoft         : 23
```

---

## 🚀 Comandos Rápidos

### Consultar Total
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "SELECT COUNT(*) FROM habilidades;"
```

### Listar por Tipo
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "
SELECT tipo, COUNT(*) as total 
FROM habilidades 
GROUP BY tipo;"
```

### Buscar Habilidade
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "
SELECT nome, tipo 
FROM habilidades 
WHERE nome LIKE '%Docker%';"
```

### Listar SAP
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "
SELECT nome FROM habilidades WHERE nome LIKE '%SAP%' ORDER BY nome;"
```

### Listar AWS
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "
SELECT nome FROM habilidades WHERE nome LIKE '%AWS%' OR nome LIKE '%Amazon%' ORDER BY nome;"
```

### Listar Azure
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "
SELECT nome FROM habilidades WHERE nome LIKE '%Azure%' ORDER BY nome;"
```

### Soft Skills
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "
SELECT nome FROM habilidades WHERE tipo = 'Comportamental' ORDER BY nome;"
```

---

## 📋 Top 10 Habilidades por Categoria

### Soft Skills Essenciais
1. Liderança de Equipes
2. Comunicação Efetiva
3. Trabalho em Equipe
4. Pensamento Crítico
5. Adaptabilidade
6. Resolução de Conflitos
7. Gestão de Projetos
8. Negociação
9. Mentoria
10. Aprendizado Contínuo

### SAP - Top 10
1. SAP S/4HANA
2. SAP HANA
3. SAP Fiori
4. SAP ABAP
5. SAP BTP (Business Technology Platform)
6. SAP FI/CO (Financeiro)
7. SAP MM (Material Management)
8. SAP SD (Sales & Distribution)
9. SAP Analytics Cloud
10. SAP Integration Suite

### Oracle - Top 10
1. Oracle Database
2. Oracle Cloud Infrastructure (OCI)
3. Oracle PL/SQL
4. Oracle Autonomous Database
5. Oracle Fusion Applications
6. Oracle ERP Cloud
7. Oracle RMAN (Recovery Manager)
8. Oracle RAC (Real Application Clusters)
9. Oracle Performance Tuning
10. Oracle WebLogic Server

### Microsoft - Top 10
1. .NET Core
2. C#
3. Azure DevOps
4. SQL Server
5. Power BI
6. Power Apps
7. Power Automate
8. SharePoint Online
9. Microsoft 365
10. TypeScript

### Azure - Top 15
1. Azure Kubernetes Service (AKS)
2. Azure DevOps
3. Azure Functions
4. Azure SQL Database
5. Azure Active Directory
6. Azure App Service
7. Azure API Management
8. Azure Cosmos DB
9. Azure Monitor
10. Azure Key Vault
11. Azure Logic Apps
12. Azure Service Bus
13. Azure Machine Learning
14. Azure Synapse Analytics
15. Azure OpenAI Service

### AWS - Top 20
1. AWS Lambda
2. Amazon EC2
3. Amazon S3
4. Amazon EKS (Elastic Kubernetes Service)
5. AWS IAM
6. Amazon RDS
7. Amazon DynamoDB
8. Amazon VPC
9. AWS CloudFormation
10. Amazon API Gateway
11. AWS CodePipeline
12. Amazon CloudWatch
13. Amazon SageMaker
14. Amazon Aurora
15. AWS Step Functions
16. Amazon ECS
17. AWS Fargate
18. Amazon Kinesis
19. AWS Glue
20. Amazon Athena

---

## 🎯 Habilidades por Perfil Profissional

### Desenvolvedor Backend
- Java, Python, C#, Go
- SQL Server, PostgreSQL, Oracle Database
- REST APIs, GraphQL, Microservices
- Docker, Kubernetes

### Desenvolvedor Frontend
- JavaScript, TypeScript
- React (se tiver no sistema)
- Power Apps, SAP Fiori

### Arquiteto Cloud (AWS)
- AWS Solutions Architecture
- AWS Lambda, Amazon EKS
- AWS CloudFormation, Terraform
- Amazon VPC, AWS IAM

### Arquiteto Cloud (Azure)
- Azure Architecture
- Azure Kubernetes Service
- Azure DevOps, Azure Pipelines
- Azure Virtual Network

### Arquiteto Cloud (Multicloud)
- AWS + Azure + Oracle Cloud
- Terraform, Ansible
- Kubernetes, Docker
- API Design, Microservices

### Especialista SAP
- SAP S/4HANA
- SAP ABAP, SAP Fiori
- SAP BTP
- SAP Integration Suite

### DBA Oracle
- Oracle Database, Oracle 19c/21c
- Oracle DBA, Oracle Performance Tuning
- Oracle RMAN, Oracle Data Guard
- Oracle RAC, Oracle Exadata

### DBA SQL Server
- SQL Server, T-SQL
- SQL Server DBA
- SQL Server Performance Tuning
- SSIS, SSRS, SSAS

### DevOps Engineer
- Docker, Kubernetes, Terraform
- Jenkins, GitLab CI/CD, GitHub Actions
- AWS CodePipeline, Azure DevOps
- Ansible, CloudFormation

### Gerente de Projetos
- Agile/Scrum, Kanban
- PMI/PMP, Prince2
- Gestão de Projetos
- Gestão de Stakeholders

### Analista de Segurança
- AWS IAM, Azure Active Directory
- Security Best Practices, OWASP
- SSL/TLS, OAuth/OIDC
- Network Security

---

## 📊 Query para Matriz de Skills

```sql
-- Ver habilidades que ninguém tem ainda
SELECT h.nome, h.tipo
FROM habilidades h
LEFT JOIN colaborador_habilidades ch ON h.id = ch.habilidade_id
WHERE ch.id IS NULL
ORDER BY h.tipo, h.nome;

-- Top 10 habilidades mais comuns na equipe
SELECT h.nome, h.tipo, COUNT(ch.id) as total
FROM habilidades h
INNER JOIN colaborador_habilidades ch ON h.id = ch.habilidade_id
GROUP BY h.id, h.nome, h.tipo
ORDER BY total DESC
LIMIT 10;

-- Habilidades por colaborador
SELECT 
    c.nome as colaborador,
    h.nome as habilidade,
    ch.nivel_avaliado,
    h.tipo
FROM colaboradores c
JOIN colaborador_habilidades ch ON c.id = ch.colaborador_id
JOIN habilidades h ON ch.habilidade_id = h.id
WHERE c.id = 'ID_DO_COLABORADOR'
ORDER BY h.tipo, h.nome;
```

---

## 🔍 Busca Rápida por Palavra-Chave

### Cloud
```sql
SELECT nome, tipo FROM habilidades 
WHERE nome LIKE '%Cloud%' 
ORDER BY nome;
```

### DevOps
```sql
SELECT nome, tipo FROM habilidades 
WHERE nome LIKE '%DevOps%' 
   OR nome LIKE '%CI/CD%' 
   OR nome IN ('Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins')
ORDER BY nome;
```

### Database
```sql
SELECT nome, tipo FROM habilidades 
WHERE nome LIKE '%Database%' 
   OR nome LIKE '%SQL%' 
   OR nome LIKE '%DBA%'
   OR nome IN ('MySQL', 'PostgreSQL', 'MongoDB', 'Redis')
ORDER BY nome;
```

### Machine Learning / AI
```sql
SELECT nome, tipo FROM habilidades 
WHERE nome LIKE '%Machine Learning%' 
   OR nome LIKE '%AI%' 
   OR nome LIKE '%SageMaker%'
   OR nome LIKE '%Cognitive%'
   OR nome LIKE '%OpenAI%'
ORDER BY nome;
```

### Segurança
```sql
SELECT nome, tipo FROM habilidades 
WHERE nome LIKE '%Security%' 
   OR nome LIKE '%IAM%' 
   OR nome LIKE '%WAF%'
   OR nome LIKE '%Sentinel%'
   OR nome LIKE '%GuardDuty%'
ORDER BY nome;
```

---

## 📁 Arquivos Relacionados

- **Script SQL**: `/database/carga-habilidades.sql`
- **JSON Backup**: `/data-templates/habilidades-completo.json`
- **Documentação**: `/data-templates/README-HABILIDADES.md`
- **Relatório Completo**: `/docs/RELATORIO-CARGA-HABILIDADES.md`

---

## ✅ Checklist Pós-Carga

- [x] Tabela habilidades criada
- [x] 271 habilidades inseridas
- [x] Verificação de totais OK
- [x] Backup JSON criado
- [x] Documentação gerada
- [ ] Associar colaboradores às habilidades
- [ ] Definir níveis de proficiência
- [ ] Criar planos de desenvolvimento
- [ ] Gerar relatórios de gaps

---

**Última Atualização:** 22 de dezembro de 2025  
**Status:** ✅ Pronto para uso
