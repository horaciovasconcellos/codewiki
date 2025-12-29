# 📜 Scripts - Templates de Carga de Dados

## Visão Geral

Este diretório contém templates e exemplos para carga de dados de **Scripts** no sistema de auditoria.

## Arquivos Disponíveis

### 1. `scripts.csv`
Arquivo CSV completo com todos os campos, incluindo IDs e metadados de arquivos.

**Uso**: Carga completa com relacionamento de arquivos já existentes no sistema.

**Campos**:
- `id` - UUID do script (gerado automaticamente se omitido)
- `sigla` - Código identificador (ex: SCR-AUTO-001)
- `descricao` - Descrição detalhada do script
- `dataInicio` - Data de início (formato: YYYY-MM-DD)
- `dataTermino` - Data de término (opcional)
- `tipoScript` - Tipo do script (ver lista abaixo)
- `arquivo` - Nome do arquivo
- `arquivoUrl` - Caminho relativo do arquivo
- `arquivoTamanho` - Tamanho em bytes
- `arquivoTipo` - MIME type do arquivo

### 2. `scripts-carga.json`
Arquivo JSON para carga de scripts sem arquivos físicos anexados.

**Uso**: Carga inicial de scripts, arquivos podem ser anexados posteriormente via interface.

**Campos**:
- `sigla` - Código identificador (obrigatório)
- `descricao` - Descrição detalhada (obrigatório)
- `dataInicio` - Data de início (obrigatório)
- `dataTermino` - Data de término (opcional)
- `tipoScript` - Tipo do script (obrigatório)
- `arquivo` - Nome do arquivo (opcional)

### 3. `exemplo-scripts.csv`
Arquivo CSV simplificado apenas com campos essenciais.

**Uso**: Exemplo rápido para criar scripts sem metadados complexos.

## Tipos de Script Disponíveis

1. **Automação** - Scripts de automação de tarefas
2. **Administração** - Scripts administrativos do sistema
3. **Banco de Dados** - Scripts SQL e de manutenção
4. **Integração** - Scripts de integração entre sistemas
5. **Testes** - Scripts de testes automatizados
6. **Build & Deploy** - Scripts de compilação e deploy
7. **CI/CD** - Scripts de CI/CD
8. **Infraestrutura (IaC)** - Scripts de infraestrutura como código
9. **Monitoramento** - Scripts de monitoramento
10. **Segurança** - Scripts de segurança
11. **Governança** - Scripts de governança
12. **Dados** - Scripts de ETL e processamento
13. **ERP** - Scripts relacionados a ERP
14. **Documentação** - Scripts de documentação

## Formatos de Arquivo Aceitos

- `.sh` - Shell scripts
- `.ps1` - PowerShell scripts
- `.py` - Python scripts
- `.js` - JavaScript
- `.ts` - TypeScript
- `.sql` - SQL scripts
- `.yaml`, `.yml` - YAML files
- `.json` - JSON files
- `.xml` - XML files
- `.txt` - Text files

**Limite**: 50 MB por arquivo

## Nomenclatura de Arquivos

### Sigla do Script
Formato: `SCR-[TIPO]-[NÚMERO]`

Exemplos:
- `SCR-AUTO-001` - Script de Automação #001
- `SCR-DB-003` - Script de Banco de Dados #003
- `SCR-CICD-005` - Script de CI/CD #005

### Abreviações de Tipo
- `AUTO` - Automação
- `ADM` - Administração
- `DB` - Banco de Dados
- `INT` - Integração
- `TEST` - Testes
- `BUILD` - Build & Deploy
- `CICD` - CI/CD
- `IAC` - Infraestrutura (IaC)
- `MON` - Monitoramento
- `SEC` - Segurança
- `GOV` - Governança
- `DATA` - Dados
- `ERP` - ERP
- `DOC` - Documentação

## Como Usar

### Carga via CSV Completo

```bash
# Importar scripts com metadados completos
mysql -u app_user -p auditoria_db < load-scripts-csv.sql
```

### Carga via JSON

```bash
# API endpoint para carga em lote
curl -X POST http://localhost:3000/api/scripts/bulk \
  -H "Content-Type: application/json" \
  -d @scripts-carga.json
```

### Carga via Interface

1. Acesse **Scripts** no menu lateral
2. Clique em **Novo Script**
3. Preencha os campos obrigatórios
4. Faça upload do arquivo (opcional)
5. Clique em **Cadastrar Script**

## Script SQL de Carga

```sql
-- Carga de scripts a partir do CSV
LOAD DATA LOCAL INFILE 'scripts.csv'
INTO TABLE scripts
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, sigla, descricao, data_inicio, @data_termino, tipo_script, 
 @arquivo, @arquivo_url, @arquivo_tamanho, @arquivo_tipo)
SET 
  data_termino = NULLIF(@data_termino, ''),
  arquivo = NULLIF(@arquivo, ''),
  arquivo_url = NULLIF(@arquivo_url, ''),
  arquivo_tamanho = NULLIF(@arquivo_tamanho, ''),
  arquivo_tipo = NULLIF(@arquivo_tipo, '');
```

## Exemplos de Scripts Incluídos

### Automação
- **SCR-AUTO-001**: Backup automático diário de bancos de dados

### Banco de Dados
- **SCR-DB-001**: Otimização de índices do MySQL

### CI/CD
- **SCR-CICD-001**: Pipeline CI/CD completo

### Infraestrutura
- **SCR-IAC-001**: Terraform para provisionamento AWS

### Monitoramento
- **SCR-MON-001**: Health check de serviços

### Segurança
- **SCR-SEC-001**: Auditoria de segurança e vulnerabilidades

## Validações

### Campos Obrigatórios
- `sigla` (máx 20 caracteres)
- `descricao` (máx 500 caracteres)
- `dataInicio` (formato: YYYY-MM-DD)
- `tipoScript` (deve estar na lista de tipos válidos)

### Campos Opcionais
- `dataTermino` (deve ser posterior a dataInicio)
- `arquivo` (nome do arquivo)
- Metadados do arquivo (url, tamanho, tipo)

## Estrutura de Diretórios

```
uploads/
└── scripts/
    ├── backup-diario.sh
    ├── cleanup-logs.sh
    ├── optimize-indexes.sql
    ├── sync-azure.py
    ├── integration-tests.js
    ├── deploy-prod.sh
    ├── pipeline-config.yaml
    ├── infrastructure.tf
    ├── health-check.py
    ├── security-audit.ps1
    ├── compliance-check.py
    ├── etl-pipeline.py
    ├── sap-integration.js
    └── generate-api-docs.js
```

## Troubleshooting

### Erro: "Tipo de script inválido"
**Solução**: Verifique se o valor de `tipoScript` está exatamente como um dos 14 tipos listados acima.

### Erro: "Data de término anterior à data de início"
**Solução**: Corrija o campo `dataTermino` ou deixe-o vazio.

### Erro: "Arquivo não encontrado"
**Solução**: Certifique-se de que o arquivo existe no diretório `uploads/scripts/`.

### Erro: "Tipo de arquivo não permitido"
**Solução**: Verifique se a extensão do arquivo está na lista de formatos aceitos.

## Referências

- [API Endpoints de Scripts](/docs/SCRIPTS-README.md#api-endpoints)
- [Guia de Upload de Arquivos](/docs/SCRIPTS-README.md#upload-de-arquivos)
- [Estrutura do Banco de Dados](/docs/SCRIPTS-README.md#estrutura-do-banco-de-dados)

---

**Última atualização**: 29/12/2024
**Versão**: 1.0.0
