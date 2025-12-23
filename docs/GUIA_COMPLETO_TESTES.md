# 🧪 Guia Completo de Testes - Sistema de Auditoria

**Versão:** 1.0.0  
**Data:** 14 de Dezembro de 2025  
**Objetivo:** Testar todas as funcionalidades da aplicação com dados completos

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Inicialização do Ambiente](#inicialização-do-ambiente)
3. [Ordem de Carga de Dados](#ordem-de-carga-de-dados)
4. [Dependências entre Tabelas](#dependências-entre-tabelas)
5. [Carga de Dados - Passo a Passo](#carga-de-dados---passo-a-passo)
6. [Testes por Funcionalidade](#testes-por-funcionalidade)
7. [Validação dos Dados](#validação-dos-dados)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário
- ✅ Docker e Docker Compose rodando
- ✅ Sistema inicializado (`./docker-manager.sh start`)
- ✅ Banco de dados criado e vazio
- ✅ Acesso ao terminal/bash

### Verificação Inicial

```bash
# 1. Verificar se containers estão rodando
docker ps

# Deve mostrar:
# - auditoria-app (UP)
# - mysql-master (healthy)

# 2. Verificar conectividade do banco
docker exec -it mysql-master mysql -u app_user -papppass123 -e "SELECT 1;"

# 3. Verificar API
curl http://localhost:3000/health
# Resposta: {"status":"ok"}
```

---

## 🚀 Inicialização do Ambiente

### Passo 1: Limpar Dados Existentes (Opcional)

⚠️ **ATENÇÃO:** Isso apagará todos os dados!

```bash
# Backup antes de limpar
docker exec mysql-master mysqldump -u root -prootpass auditoria_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Limpar todas as tabelas
docker exec -it mysql-master mysql -u root -prootpass auditoria_db << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar dados de todas as tabelas
TRUNCATE TABLE logs_auditoria;
TRUNCATE TABLE aplicacao_integracoes;
TRUNCATE TABLE aplicacao_ambientes;
TRUNCATE TABLE aplicacao_tecnologias;
TRUNCATE TABLE aplicacao_capacidades;
TRUNCATE TABLE aplicacao_processos;
TRUNCATE TABLE aplicacoes;
TRUNCATE TABLE integracoes;
TRUNCATE TABLE comunicacoes;
TRUNCATE TABLE tipos_comunicacao;
TRUNCATE TABLE slas;
TRUNCATE TABLE processos_negocio;
TRUNCATE TABLE capacidades_negocio;
TRUNCATE TABLE tecnologias;
TRUNCATE TABLE habilidades;
TRUNCATE TABLE colaboradores;
TRUNCATE TABLE tipos_afastamento;
TRUNCATE TABLE configuracoes;

SET FOREIGN_KEY_CHECKS = 1;
EOF

echo "✅ Banco de dados limpo!"
```

### Passo 2: Reinicializar Schema (Se necessário)

```bash
# Executar scripts de inicialização na ordem
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria

docker exec -i mysql-master mysql -u root -prootpass auditoria_db < database/01-init-schema-data.sql
docker exec -i mysql-master mysql -u root -prootpass auditoria_db < database/03-create-configuracoes.sql
docker exec -i mysql-master mysql -u root -prootpass auditoria_db < database/04-create-logs.sql
docker exec -i mysql-master mysql -u root -prootpass auditoria_db < database/10-create-integracoes.sql
docker exec -i mysql-master mysql -u root -prootpass auditoria_db < database/13-create-aplicacao-relationships.sql

echo "✅ Schema reinicializado!"
```

---

## 📊 Dependências entre Tabelas

### Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDEM DE CARGA (Sem Dependências)            │
│  1. configuracoes                                                │
│  2. tipos_afastamento                                            │
│  3. tipos_comunicacao                                            │
│  4. colaboradores                                                │
│  5. habilidades                                                  │
│  6. tecnologias                                                  │
│  7. capacidades_negocio                                          │
│  8. processos_negocio                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              ORDEM DE CARGA (Com Dependências Nível 1)          │
│  9. aplicacoes (depende: nenhuma)                                │
│ 10. integracoes (depende: nenhuma)                               │
│ 11. comunicacoes (depende: tipos_comunicacao)                    │
│ 12. slas (depende: aplicacoes)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          ORDEM DE CARGA (Relacionamentos Nível 2)               │
│ 13. aplicacao_tecnologias (depende: aplicacoes, tecnologias)     │
│ 14. aplicacao_capacidades (depende: aplicacoes, capacidades)     │
│ 15. aplicacao_processos (depende: aplicacoes, processos)         │
│ 16. aplicacao_ambientes (depende: aplicacoes)                    │
│ 17. aplicacao_integracoes (depende: aplicacoes, integracoes)     │
└─────────────────────────────────────────────────────────────────┘
```

### Tabela de Dependências

| Tabela | Depende De | Método de Carga |
|--------|-----------|-----------------|
| `configuracoes` | - | SQL Script |
| `tipos_afastamento` | - | Script Shell |
| `tipos_comunicacao` | - | SQL Script |
| `colaboradores` | - | JSON API |
| `habilidades` | - | JSON API |
| `tecnologias` | - | Script Shell ou API |
| `capacidades_negocio` | - | JSON API |
| `processos_negocio` | - | JSON API |
| `aplicacoes` | - | JSON API |
| `integracoes` | - | Interface Web (Wizard) |
| `comunicacoes` | `tipos_comunicacao` | JSON API |
| `slas` | `aplicacoes` | Interface Web |
| `aplicacao_tecnologias` | `aplicacoes`, `tecnologias` | API (PUT /aplicacoes/:id) |
| `aplicacao_capacidades` | `aplicacoes`, `capacidades` | API (PUT /aplicacoes/:id) |
| `aplicacao_processos` | `aplicacoes`, `processos` | API (PUT /aplicacoes/:id) |
| `aplicacao_ambientes` | `aplicacoes` | API (PUT /aplicacoes/:id) |
| `aplicacao_integracoes` | `aplicacoes`, `integracoes` | API (PUT /aplicacoes/:id) |

---

## 📥 Carga de Dados - Passo a Passo

### Fase 1: Dados Básicos (Tabelas Independentes)

#### 1.1. Tipos de Afastamento

**Método:** Script Shell

```bash
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria

# Executar script de carga
./scripts/load-tipos-afastamento.sh

# Verificar
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
  -e "SELECT COUNT(*) as total FROM tipos_afastamento;"

# Resultado esperado: 10-15 registros
```

#### 1.2. Tecnologias

**Método:** Script Shell ou API

**Opção A: Via Script (Importar do pom.xml)**
```bash
./scripts/import-tecnologias-pom.sh

# Verificar
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
  -e "SELECT sigla, nome FROM tecnologias LIMIT 5;"
```

**Opção B: Via API (JSON)**
```bash
curl -X POST http://localhost:3000/api/tecnologias \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "JAVA",
    "nome": "Java",
    "versao": "17",
    "tipo": "Linguagem",
    "categoria": "Backend"
  }'

# Carregar múltiplas
cat data-templates/tecnologias.json | jq -c '.[]' | while read item; do
  curl -X POST http://localhost:3000/api/tecnologias \
    -H "Content-Type: application/json" \
    -d "$item"
  sleep 0.5
done
```

#### 1.3. Habilidades

**Método:** JSON API

```bash
# Carregar do arquivo JSON
curl -X POST http://localhost:3000/api/habilidades/bulk \
  -H "Content-Type: application/json" \
  -d @data-templates/habilidades.json

# Ou via script
./scripts/load-habilidades.sh

# Verificar
curl http://localhost:3000/api/habilidades | jq 'length'
# Resultado esperado: 20+ registros
```

#### 1.4. Colaboradores

**Método:** JSON API

```bash
# Carregar colaboradores
./scripts/load-colaboradores.sh

# Ou manual
curl -X POST http://localhost:3000/api/colaboradores \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao.silva@empresa.com",
    "cargo": "Desenvolvedor Sênior",
    "departamento": "TI"
  }'

# Verificar
curl http://localhost:3000/api/colaboradores | jq 'length'
```

#### 1.5. Capacidades de Negócio

**Método:** JSON API

```bash
# Carregar capacidades
./scripts/load-capacidades-negocio.sh

# Ou do arquivo JSON
cat data-templates/capacidades-negocio-carga.json | \
  curl -X POST http://localhost:3000/api/capacidades-negocio/bulk \
    -H "Content-Type: application/json" \
    -d @-

# Verificar
curl http://localhost:3000/api/capacidades-negocio | jq 'length'
# Resultado esperado: 15+ registros
```

#### 1.6. Processos de Negócio

**Método:** JSON API

```bash
# Carregar processos
./scripts/load-processos.sh

# Ou manual
curl -X POST http://localhost:3000/api/processos-negocio \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "PROC-001",
    "nome": "Gestão de Pedidos",
    "descricao": "Processo de gestão de pedidos de clientes",
    "area": "Vendas"
  }'

# Verificar
curl http://localhost:3000/api/processos-negocio | jq 'length'
```

#### 1.7. Tipos de Comunicação

**Método:** SQL Script (já executado na inicialização)

```bash
# Verificar se existem
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
  -e "SELECT * FROM tipos_comunicacao;"

# Se vazio, inserir manualmente
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db << 'EOF'
INSERT INTO tipos_comunicacao (tipo, descricao) VALUES
('Email', 'Comunicação por email'),
('SMS', 'Comunicação por SMS'),
('Webhook', 'Comunicação por webhook'),
('API', 'Comunicação via API REST'),
('FTP', 'Transferência de arquivos');
EOF
```

---

### Fase 2: Entidades Principais

#### 2.1. Aplicações

**Método:** JSON API (Interface Web ou cURL)

**Via Interface Web:**
1. Acesse: http://localhost:3000
2. Clique em "Aplicações"
3. Clique em "Nova Aplicação"
4. Preencha o formulário no Wizard:
   - Passo 1: Dados Básicos (sigla, nome, descrição)
   - Passo 2: Tecnologias (selecione as tecnologias)
   - Passo 3: Capacidades de Negócio
   - Passo 4: Processos de Negócio
   - Passo 5: Ambientes Tecnológicos
5. Clique em "Salvar"

**Via cURL (Bulk Load):**
```bash
# Carregar aplicações do arquivo JSON
./scripts/load-aplicacoes.sh

# Ou manual
curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "APP-001",
    "nome": "Sistema de Vendas",
    "descricao": "Sistema principal de vendas",
    "status": "ativo",
    "data_criacao": "2024-01-15",
    "tecnologias": ["JAVA", "REACT"],
    "capacidades": ["cap-001"],
    "processos": ["PROC-001"]
  }'

# Carregar múltiplas aplicações
cat data-templates/aplicacoes-carga.json | jq -c '.[]' | while read app; do
  curl -X POST http://localhost:3000/api/aplicacoes \
    -H "Content-Type: application/json" \
    -d "$app"
  echo ""
  sleep 1
done

# Verificar
curl http://localhost:3000/api/aplicacoes | jq 'length'
# Resultado esperado: 10+ aplicações
```

#### 2.2. Integrações

**Método:** Interface Web (Wizard de Integrações)

**Criar via Interface:**
1. Acesse: http://localhost:3000
2. Clique em "Integrações"
3. Escolha o tipo:
   - User-to-Cloud
   - User-to-OnPremise
   - Cloud-to-Cloud
   - OnPremise-to-Cloud
   - OnPremise-to-OnPremise
4. Preencha o Wizard:
   - Passo 1: Dados Básicos (sigla, nome, estilo, padrão, tecnologia)
   - Passo 2: Aplicações Origem
   - Passo 3: Aplicações Destino
   - Passo 4: Configuração (protocolo, autenticação)
   - Passo 5: Documentação (especificação, upload de arquivo)
5. Clique em "Salvar"

**Criar via API:**
```bash
# Criar integração User-to-Cloud
curl -X POST http://localhost:3000/api/integracoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "INT-001",
    "nome": "Integração Vendas-Cloud",
    "estiloIntegracao": "Integração de processos",
    "padraoCasoUso": "IA2A – Application-to-Application",
    "integracaoTecnologica": "APIs (Application Programming Interfaces)",
    "aplicacoes_origem": ["APP-001"],
    "aplicacoes_destino": ["APP-002"]
  }'

# Verificar
curl http://localhost:3000/api/user-to-cloud | jq 'length'
```

**Exemplo de cada tipo:**

```bash
# User-to-Cloud
curl -X POST http://localhost:3000/api/user-to-cloud \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "UTC-001",
    "nome": "Portal Web para Salesforce",
    "usuario_fonte": "Usuario Final",
    "aplicacao_destino": "Salesforce"
  }'

# User-to-OnPremise  
curl -X POST http://localhost:3000/api/user-to-onpremise \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "UTO-001",
    "nome": "Portal para SAP",
    "usuario_fonte": "Colaborador",
    "aplicacao_destino": "SAP ERP"
  }'

# Cloud-to-Cloud
curl -X POST http://localhost:3000/api/cloud-to-cloud \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "CTC-001",
    "nome": "Salesforce para AWS S3",
    "aplicacao_origem": "Salesforce",
    "aplicacao_destino": "AWS S3"
  }'

# OnPremise-to-Cloud
curl -X POST http://localhost:3000/api/onpremise-to-cloud \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "OTC-001",
    "nome": "SAP para Azure",
    "aplicacao_origem": "SAP ERP",
    "aplicacao_destino": "Azure SQL"
  }'

# OnPremise-to-OnPremise
curl -X POST http://localhost:3000/api/onpremise-to-onpremise \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "OTO-001",
    "nome": "SAP para Oracle",
    "aplicacao_origem": "SAP ERP",
    "aplicacao_destino": "Oracle DB"
  }'
```

#### 2.3. Comunicações

**Método:** JSON API

```bash
# Carregar comunicações
./scripts/carga-comunicacoes.sh

# Ou manual
curl -X POST http://localhost:3000/api/comunicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Manutenção Programada",
    "mensagem": "Sistema ficará indisponível dia 20/12",
    "tipo_comunicacao": "Email",
    "data_envio": "2024-12-15",
    "destinatarios": ["time@empresa.com"]
  }'

# Verificar
curl http://localhost:3000/api/comunicacoes | jq 'length'
```

---

### Fase 3: Relacionamentos

#### 3.1. Associar Tecnologias às Aplicações

**Método:** API PUT (atualização de aplicação)

```bash
# Atualizar aplicação com tecnologias
curl -X PUT http://localhost:3000/api/aplicacoes/APP-001 \
  -H "Content-Type: application/json" \
  -d '{
    "tecnologias": [
      {
        "tecnologia_id": "JAVA",
        "data_inicio": "2024-01-01",
        "status": "ativo"
      },
      {
        "tecnologia_id": "REACT",
        "data_inicio": "2024-01-01",
        "status": "ativo"
      }
    ]
  }'

# Verificar
curl http://localhost:3000/api/aplicacoes/APP-001 | jq '.tecnologias'
```

#### 3.2. Associar Capacidades às Aplicações

```bash
curl -X PUT http://localhost:3000/api/aplicacoes/APP-001 \
  -H "Content-Type: application/json" \
  -d '{
    "capacidades": ["cap-001", "cap-002"]
  }'
```

#### 3.3. Associar Processos às Aplicações

```bash
curl -X PUT http://localhost:3000/api/aplicacoes/APP-001 \
  -H "Content-Type: application/json" \
  -d '{
    "processos": ["PROC-001", "PROC-002"]
  }'
```

#### 3.4. Adicionar Ambientes Tecnológicos

```bash
curl -X PUT http://localhost:3000/api/aplicacoes/APP-001 \
  -H "Content-Type: application/json" \
  -d '{
    "ambientes": [
      {
        "nome": "Produção",
        "url": "https://prod.empresa.com",
        "tipo": "producao"
      },
      {
        "nome": "Homologação",
        "url": "https://hml.empresa.com",
        "tipo": "homologacao"
      }
    ]
  }'
```

#### 3.5. Associar Integrações às Aplicações

```bash
curl -X PUT http://localhost:3000/api/aplicacoes/APP-001 \
  -H "Content-Type: application/json" \
  -d '{
    "integracoes": ["INT-001", "INT-002"]
  }'
```

---

## 🧪 Testes por Funcionalidade

### Teste 1: Dashboard

**Objetivo:** Verificar métricas e visualizações

```bash
# Acessar dashboard
URL: http://localhost:3000

# Verificar se exibe:
✅ Total de Aplicações
✅ Total de Integrações  
✅ Total de Tecnologias
✅ Total de Processos
✅ Gráficos de distribuição
✅ Status dos sistemas
```

**Validação via API:**
```bash
# Verificar totais
curl http://localhost:3000/api/aplicacoes | jq 'length'
curl http://localhost:3000/api/integracoes | jq 'length'
curl http://localhost:3000/api/tecnologias | jq 'length'
```

---

### Teste 2: Gestão de Aplicações

**2.1. Criar Nova Aplicação (Via Interface)**

1. Clicar em "Aplicações" no menu
2. Clicar em "+ Nova Aplicação"
3. Preencher Wizard:
   - Sigla: TEST-001
   - Nome: Sistema de Testes
   - Descrição: Sistema para testes automatizados
   - Status: ativo
4. Selecionar tecnologias: Java, React
5. Selecionar capacidades: 2 capacidades
6. Selecionar processos: 1 processo
7. Adicionar ambiente: Produção
8. Salvar

**Validação:**
```bash
curl http://localhost:3000/api/aplicacoes/TEST-001 | jq '.'

# Verificar:
# - Dados básicos corretos
# - Tecnologias associadas
# - Capacidades associadas
# - Processos associados
# - Ambientes criados
```

**2.2. Editar Aplicação**

1. Clicar na aplicação TEST-001
2. Clicar em "Editar"
3. Alterar descrição
4. Adicionar nova tecnologia
5. Salvar

**Validação:**
```bash
curl http://localhost:3000/api/aplicacoes/TEST-001 | jq '.descricao'
curl http://localhost:3000/api/aplicacoes/TEST-001 | jq '.tecnologias | length'
```

**2.3. Excluir Aplicação**

1. Clicar na aplicação TEST-001
2. Clicar em "Excluir"
3. Confirmar exclusão

**Validação:**
```bash
curl http://localhost:3000/api/aplicacoes/TEST-001
# Deve retornar 404
```

---

### Teste 3: Gestão de Integrações

**3.1. Criar Integração User-to-Cloud**

1. Ir para "Integrações"
2. Clicar em "User-to-Cloud"
3. Clicar em "+ Nova"
4. Preencher Wizard:
   - Sigla: TEST-UTC-001
   - Nome: Teste User to Cloud
   - Estilo: Integração de processos
   - Padrão: IA2A
   - Tecnologia: APIs
5. Selecionar aplicações
6. Salvar

**Validação:**
```bash
curl http://localhost:3000/api/user-to-cloud | jq '.[] | select(.sigla=="TEST-UTC-001")'
```

**3.2. Testar Cada Tipo de Integração**

Repetir o teste acima para:
- ✅ User-to-OnPremise
- ✅ Cloud-to-Cloud
- ✅ OnPremise-to-Cloud
- ✅ OnPremise-to-OnPremise

---

### Teste 4: Sistema de Logging

**4.1. Acessar Logs**

1. Ir para "Logs & Traces"
2. Verificar:
   - ✅ Logs do Frontend (LocalStorage)
   - ✅ Logs de Auditoria (Backend)
   - ✅ Traces distribuídos
   - ✅ Estatísticas

**4.2. Filtrar Logs**

1. Filtrar por data
2. Filtrar por tipo de operação
3. Filtrar por entidade
4. Filtrar por usuário

**Validação via API:**
```bash
# Ver logs de auditoria
curl http://localhost:3000/api/logs-auditoria?limit=10 | jq '.logs | length'

# Ver estatísticas
curl http://localhost:3000/api/logs-auditoria/stats | jq '.operationTypes'
```

**4.3. Inspecionar Trace**

1. Clicar em um log
2. Ver detalhes do trace
3. Ver span relacionados
4. Ver correlação entre frontend e backend

---

### Teste 5: Gestão de Tecnologias

**5.1. Adicionar Tecnologia**

```bash
curl -X POST http://localhost:3000/api/tecnologias \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "TEST-TECH",
    "nome": "Tecnologia de Teste",
    "versao": "1.0",
    "tipo": "Framework",
    "categoria": "Frontend"
  }'
```

**5.2. Listar Tecnologias**

```bash
curl http://localhost:3000/api/tecnologias | jq '.[] | {sigla, nome}'
```

**5.3. Atualizar Tecnologia**

```bash
curl -X PUT http://localhost:3000/api/tecnologias/TEST-TECH \
  -H "Content-Type: application/json" \
  -d '{
    "versao": "2.0"
  }'
```

---

### Teste 6: Capacidades e Processos

**6.1. Listar Capacidades**

```bash
curl http://localhost:3000/api/capacidades-negocio | jq '.[] | {id, nome}'
```

**6.2. Listar Processos**

```bash
curl http://localhost:3000/api/processos-negocio | jq '.[] | {sigla, nome}'
```

**6.3. Associar Aplicação a Processo**

Via interface web ou API (já testado anteriormente)

---

### Teste 7: Comunicações

**7.1. Criar Comunicação**

```bash
curl -X POST http://localhost:3000/api/comunicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste de Comunicação",
    "mensagem": "Esta é uma mensagem de teste",
    "tipo_comunicacao": "Email",
    "data_envio": "2024-12-20"
  }'
```

**7.2. Listar Comunicações**

```bash
curl http://localhost:3000/api/comunicacoes | jq '.[] | {titulo, data_envio}'
```

---

### Teste 8: SLAs

**8.1. Criar SLA (Via Interface)**

1. Ir para "SLAs"
2. Clicar em "+ Novo SLA"
3. Preencher:
   - Aplicação: APP-001
   - Tipo: Disponibilidade
   - Meta: 99.9%
   - Período: Mensal
4. Salvar

**Validação:**
```bash
curl http://localhost:3000/api/slas | jq '.[] | {aplicacao_id, tipo, meta}'
```

---

## ✅ Validação dos Dados

### Script de Validação Completa

```bash
#!/bin/bash
echo "🔍 Validando Dados do Sistema..."
echo ""

# Contador de sucessos/falhas
SUCCESS=0
FAIL=0

# Função auxiliar
check_count() {
  TABLE=$1
  MIN_EXPECTED=$2
  
  COUNT=$(docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
    -e "SELECT COUNT(*) FROM $TABLE;" | tail -1 | tr -d '\r')
  
  if [ "$COUNT" -ge "$MIN_EXPECTED" ]; then
    echo "✅ $TABLE: $COUNT registros (mínimo: $MIN_EXPECTED)"
    ((SUCCESS++))
  else
    echo "❌ $TABLE: $COUNT registros (esperado mínimo: $MIN_EXPECTED)"
    ((FAIL++))
  fi
}

# Validar cada tabela
check_count "tipos_afastamento" 5
check_count "tipos_comunicacao" 3
check_count "colaboradores" 5
check_count "habilidades" 10
check_count "tecnologias" 10
check_count "capacidades_negocio" 10
check_count "processos_negocio" 5
check_count "aplicacoes" 5
check_count "integracoes" 3
check_count "comunicacoes" 2
check_count "aplicacao_tecnologias" 5
check_count "aplicacao_capacidades" 5
check_count "aplicacao_processos" 3

echo ""
echo "📊 Resultado: $SUCCESS sucessos, $FAIL falhas"

if [ $FAIL -eq 0 ]; then
  echo "🎉 Todos os dados foram carregados corretamente!"
  exit 0
else
  echo "⚠️  Há tabelas com dados insuficientes. Revise a carga."
  exit 1
fi
```

Salvar como `scripts/validate-data.sh` e executar:

```bash
chmod +x scripts/validate-data.sh
./scripts/validate-data.sh
```

---

## 🔧 Troubleshooting

### Problema: Erro ao carregar dados

**Sintoma:** API retorna 500

**Solução:**
```bash
# Verificar logs
docker logs auditoria-app --tail 50

# Verificar conexão com banco
docker exec -it mysql-master mysql -u app_user -papppass123 -e "SELECT 1;"

# Reiniciar aplicação
docker restart auditoria-app
```

### Problema: Relacionamento não é criado

**Sintoma:** Tecnologias/Capacidades não aparecem na aplicação

**Solução:**
```bash
# Verificar se as tabelas de relacionamento existem
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
  -e "SHOW TABLES LIKE 'aplicacao_%';"

# Verificar dados nas tabelas
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
  -e "SELECT * FROM aplicacao_tecnologias WHERE aplicacao_id='APP-001';"
```

### Problema: Integração não salva campo

**Sintoma:** Campo "Integração Tecnológica" não persiste

**Solução:**
```bash
# Verificar estrutura da tabela
docker exec -it mysql-master mysql -u app_user -papppass123 auditoria_db \
  -e "DESCRIBE integracoes;"

# Verificar logs do backend
docker logs auditoria-app | grep "PUT /api/integracoes"
```

---

## 📝 Checklist Final de Testes

- [ ] Todos os scripts de carga executados com sucesso
- [ ] Validação de dados aprovada (script validate-data.sh)
- [ ] Dashboard exibindo métricas corretas
- [ ] CRUD de Aplicações funcionando
- [ ] CRUD de Integrações funcionando (5 tipos)
- [ ] Sistema de Logging capturando eventos
- [ ] Relacionamentos entre entidades criados
- [ ] Interface responsiva e sem erros
- [ ] APIs respondendo corretamente
- [ ] Logs de auditoria sendo gravados

---

## 🎯 Resumo da Ordem de Execução

```bash
# 1. Limpar ambiente (opcional)
# Ver seção "Inicialização do Ambiente"

# 2. Dados básicos (ordem obrigatória)
./scripts/load-tipos-afastamento.sh
./scripts/import-tecnologias-pom.sh
./scripts/load-habilidades.sh
./scripts/load-colaboradores.sh
./scripts/load-capacidades-negocio.sh
./scripts/load-processos.sh

# 3. Entidades principais
./scripts/load-aplicacoes.sh
# Integrações via interface web

# 4. Relacionamentos
# Via API PUT ou interface web

# 5. Validar
./scripts/validate-data.sh

# 6. Testar interface
# Acessar http://localhost:3000 e testar cada funcionalidade
```

---

**✅ Guia completo de testes criado!**

Siga este documento passo a passo para garantir que todas as funcionalidades do sistema estão operacionais com dados completos.
