# 📦 Carga de Habilidades - Guia de Uso

Este diretório contém scripts e arquivos para carga de habilidades (soft skills e hard skills) no sistema.

---

## 📁 Arquivos Disponíveis

### 1. `carga-habilidades.sql`
Script SQL completo para inserir 271 habilidades no banco de dados.

**Conteúdo:**
- 27 Soft Skills (Comportamentais)
- 220 Hard Skills (Técnicas)
- 24 Habilidades de Gestão

**Tecnologias cobertas:**
- SAP (28 habilidades)
- Oracle (27 habilidades)
- Microsoft (23 habilidades)
- Azure (48 habilidades)
- AWS (65 habilidades)
- Tecnologias Gerais (27 habilidades)
- Gestão (15 habilidades gerais)

### 2. `habilidades-completo.json`
Exportação em JSON de todas as habilidades carregadas. Útil para:
- Backup
- Importação em outros sistemas
- Integração via API
- Análise de dados

---

## 🚀 Como Usar

### Opção 1: Carregar via Docker (Recomendado)

```bash
# Verificar nome do container MySQL
docker ps | grep mysql

# Executar carga
docker exec -i mysql-master mysql -uroot -prootpass123 auditoria_db < database/carga-habilidades.sql
```

### Opção 2: Carregar via MySQL Client

```bash
mysql -h localhost -P 3306 -u root -p auditoria_db < database/carga-habilidades.sql
```

### Opção 3: Copiar e Colar no MySQL Workbench

1. Abra o arquivo `carga-habilidades.sql`
2. Copie todo o conteúdo
3. Cole no MySQL Workbench
4. Execute

---

## ✅ Verificação

Após a carga, execute estas queries para verificar:

```sql
-- Total de habilidades
SELECT COUNT(*) FROM habilidades;
-- Esperado: 271

-- Por tipo
SELECT tipo, COUNT(*) as total 
FROM habilidades 
GROUP BY tipo;
-- Esperado:
-- Tecnica: 220
-- Comportamental: 27
-- Gestao: 24

-- Por tecnologia
SELECT 
  'SAP' as Tecnologia, 
  COUNT(*) as Total 
FROM habilidades 
WHERE nome LIKE '%SAP%'
UNION ALL
SELECT 'Oracle', COUNT(*) FROM habilidades WHERE nome LIKE '%Oracle%'
UNION ALL
SELECT 'Azure', COUNT(*) FROM habilidades WHERE nome LIKE '%Azure%'
UNION ALL
SELECT 'AWS', COUNT(*) FROM habilidades WHERE nome LIKE '%AWS%' OR nome LIKE '%Amazon%';
```

---

## 📊 Estrutura da Tabela

```sql
CREATE TABLE IF NOT EXISTS habilidades (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    tipo ENUM('Tecnica', 'Comportamental', 'Gestao') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo)
);
```

---

## 🔍 Exemplos de Queries Úteis

### Listar Soft Skills
```sql
SELECT nome 
FROM habilidades 
WHERE tipo = 'Comportamental' 
ORDER BY nome;
```

### Listar Habilidades SAP
```sql
SELECT nome, tipo 
FROM habilidades 
WHERE nome LIKE '%SAP%' 
ORDER BY nome;
```

### Listar Habilidades Cloud
```sql
SELECT nome, tipo 
FROM habilidades 
WHERE nome LIKE '%AWS%' 
   OR nome LIKE '%Azure%' 
   OR nome LIKE '%Cloud%'
ORDER BY nome;
```

### Buscar Habilidade Específica
```sql
SELECT * 
FROM habilidades 
WHERE nome LIKE '%Docker%' 
   OR nome LIKE '%Kubernetes%';
```

---

## 🔗 Relacionamento com Colaboradores

Para associar habilidades aos colaboradores:

```sql
-- Inserir habilidade de um colaborador
INSERT INTO colaborador_habilidades (
    id, 
    colaborador_id, 
    habilidade_id, 
    nivel_declarado, 
    nivel_avaliado, 
    data_inicio
) VALUES (
    UUID(),
    'id-do-colaborador',
    (SELECT id FROM habilidades WHERE nome = 'Docker'),
    'Avancado',
    'Intermediario',
    CURDATE()
);
```

### Níveis Disponíveis
- `Basico`
- `Intermediario`
- `Avancado`
- `Expert`

---

## 📝 Categorias de Habilidades

### Soft Skills (Comportamentais)
1. **Liderança e Gestão** - 6 habilidades
2. **Comunicação** - 6 habilidades
3. **Trabalho em Equipe** - 5 habilidades
4. **Adaptabilidade** - 5 habilidades
5. **Resolução de Problemas** - 5 habilidades

### Hard Skills por Tecnologia

#### SAP
- Módulos Funcionais (10)
- Tecnologia (10)
- Analytics e BI (4)
- Gestão (4)

#### Oracle
- Database (10)
- Cloud (4)
- Applications (5)
- Middleware (4)
- Administração (4)

#### Microsoft
- Desenvolvimento (8)
- Database (7)
- Microsoft 365 (8)
- Windows Server (6)
- Dynamics (3)

#### Azure
- Compute (6)
- Storage (5)
- Database (6)
- Networking (7)
- Integration (5)
- Security (5)
- DevOps (6)
- AI/ML (4)
- Gestão (4)

#### AWS
- Compute (7)
- Storage (5)
- Database (7)
- Networking (7)
- Integration (6)
- Security (8)
- DevOps (9)
- AI/ML (6)
- Analytics (6)
- Gestão (5)

#### Técnicas Gerais
- DevOps/CI-CD (7)
- Linguagens (6)
- Bancos de Dados (4)
- Arquitetura (6)
- Segurança (5)

### Habilidades de Gestão
- Metodologias: Agile, Scrum, Kanban, ITIL, COBIT, PMP, Prince2
- Gestão: Service, Vendor, Budget, Risk, Compliance
- Estratégia: Business Analysis, Enterprise Architecture, SRE

---

## 🔄 Atualização de Habilidades

### Adicionar Nova Habilidade
```sql
INSERT INTO habilidades (id, nome, tipo) 
VALUES (UUID(), 'Nova Habilidade', 'Tecnica');
```

### Atualizar Habilidade
```sql
UPDATE habilidades 
SET nome = 'Novo Nome', tipo = 'Gestao' 
WHERE id = 'id-da-habilidade';
```

### Remover Habilidade
```sql
-- Atenção: Isso pode afetar colaborador_habilidades
DELETE FROM habilidades WHERE id = 'id-da-habilidade';
```

---

## 🗑️ Limpeza (Use com Cuidado!)

```sql
-- Remover TODAS as habilidades
-- ATENÇÃO: Isso também remove os vínculos com colaboradores!
DELETE FROM colaborador_habilidades;
DELETE FROM habilidades;
```

---

## 📊 Relatórios

### Habilidades Mais Comuns
```sql
SELECT h.nome, h.tipo, COUNT(ch.id) as total_colaboradores
FROM habilidades h
LEFT JOIN colaborador_habilidades ch ON h.id = ch.habilidade_id
GROUP BY h.id, h.nome, h.tipo
ORDER BY total_colaboradores DESC
LIMIT 20;
```

### Gaps de Competência
```sql
-- Habilidades sem colaboradores associados
SELECT nome, tipo 
FROM habilidades h
WHERE NOT EXISTS (
    SELECT 1 
    FROM colaborador_habilidades ch 
    WHERE ch.habilidade_id = h.id
)
ORDER BY tipo, nome;
```

### Distribuição de Níveis por Habilidade
```sql
SELECT 
    h.nome,
    ch.nivel_avaliado,
    COUNT(*) as total
FROM habilidades h
JOIN colaborador_habilidades ch ON h.id = ch.habilidade_id
WHERE h.nome LIKE '%AWS%'
GROUP BY h.nome, ch.nivel_avaliado
ORDER BY h.nome, ch.nivel_avaliado;
```

---

## 🎯 Próximos Passos

1. **Associar Colaboradores**: Vincular habilidades aos colaboradores da equipe
2. **Definir Níveis**: Avaliar e registrar níveis de proficiência
3. **Planos de Desenvolvimento**: Criar trilhas de aprendizado
4. **Matriz de Skills**: Gerar matriz de competências por projeto
5. **Certificações**: Adicionar certificações relacionadas às habilidades

---

## 📞 Suporte

- **Arquivo Principal**: `database/carga-habilidades.sql`
- **Backup JSON**: `data-templates/habilidades-completo.json`
- **Relatório Completo**: `docs/RELATORIO-CARGA-HABILIDADES.md`

---

**Data da Carga:** 22 de dezembro de 2025  
**Total de Habilidades:** 271  
**Status:** ✅ Pronto para uso
