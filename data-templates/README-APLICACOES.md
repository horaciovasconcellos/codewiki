# Guia de Carga de Aplicações

## 📋 Visão Geral

Este guia descreve o processo completo de carga de aplicações no sistema, incluindo todos os seus relacionamentos (tecnologias, ambientes, capacidades, processos, integrações e SLAs).

## 🎯 Estrutura de Dados

### Aplicação (Entidade Principal)

```json
{
  "sigla": "CRM",
  "descricao": "Salesforce CRM",
  "urlDocumentacao": "https://docs.empresa.com/salesforce",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta"
}
```

#### Campos Obrigatórios
- **sigla** (string, max 15 chars): Identificador único alfanumérico
- **descricao** (string, max 50 chars): Descrição breve da aplicação
- **urlDocumentacao** (string): URL da documentação técnica

#### Campos Opcionais
- **faseCicloVida**: `Planejamento`, `Desenvolvimento`, `Testes`, `Homologação`, `Produção`, `Manutenção`, `Descontinuado`
- **criticidadeNegocio**: `Muito Baixa`, `Baixa`, `Média`, `Alta`, `Muito Alta`

### Dados Relacionados

#### 1. Tecnologias
Tecnologias utilizadas pela aplicação:
```json
"tecnologias": [
  {
    "tecnologiaId": "uuid-da-tecnologia",
    "dataInicio": "2024-01-15",
    "dataTermino": "2024-12-31",
    "status": "Ativo"
  }
]
```

#### 2. Ambientes
Ambientes tecnológicos da aplicação:
```json
"ambientes": [
  {
    "tipoAmbiente": "Prod",
    "urlAmbiente": "https://app.prod.empresa.com",
    "dataCriacao": "2024-01-01",
    "tempoLiberacao": 30,
    "status": "Ativo"
  }
]
```

**Tipos de Ambiente**: `Dev`, `QA`, `Prod`, `Cloud`, `On-Premise`

#### 3. Capacidades de Negócio
Capacidades de negócio suportadas:
```json
"capacidades": [
  {
    "capacidadeId": "uuid-da-capacidade",
    "grauCobertura": 85,
    "dataInicio": "2024-01-15",
    "dataTermino": null,
    "status": "Ativo"
  }
]
```

#### 4. Processos de Negócio
Processos de negócio suportados:
```json
"processos": [
  {
    "processoId": "uuid-do-processo",
    "tipoSuporte": "Operacional",
    "criticidade": "Alta",
    "dataInicio": "2024-01-15",
    "dataTermino": null,
    "status": "Ativo"
  }
]
```

**Tipos de Suporte**: `Operacional`, `Tático`, `Estratégico`
**Criticidade**: `Muito Baixa`, `Baixa`, `Média`, `Alta`, `Muito Alta`

#### 5. Integrações
Integrações com outras aplicações:
```json
"integracoes": [
  {
    "aplicacaoDestinoId": "uuid-aplicacao-destino",
    "tipoIntegracao": "API REST",
    "protocolo": "HTTPS",
    "frequencia": "Real-time",
    "descricao": "Sincronização de clientes",
    "status": "Ativo"
  }
]
```

#### 6. SLAs (Service Level Agreements)
Acordos de nível de serviço:
```json
"slas": [
  {
    "slaId": "uuid-do-sla",
    "descricao": "Disponibilidade 99.9%",
    "dataInicio": "2024-01-01",
    "dataTermino": "2024-12-31",
    "status": "Ativo"
  }
]
```

## 🚀 Métodos de Carga

### 1. Via Interface Web (Recomendado)

#### Wizard de Aplicações
1. Acesse: **Aplicações → Nova Aplicação**
2. Preencha os 8 passos do wizard:
   - **Passo 1**: Informações Básicas
   - **Passo 2**: Tecnologias
   - **Passo 3**: Ambientes
   - **Passo 4**: Capacidades de Negócio
   - **Passo 5**: Processos de Negócio
   - **Passo 6**: Integrações
   - **Passo 7**: SLAs
   - **Passo 8**: Revisão
3. Clique em **Salvar**

#### Carga de Lockfiles/Manifests
1. Acesse: **Ferramentas → Carga de Lockfiles**
2. Selecione uma aplicação existente
3. Faça upload de arquivos:
   - `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - `pom.xml`, `build.gradle`, `requirements.txt`
   - E mais 29 formatos suportados
4. O sistema automaticamente:
   - Extrai todas as dependências
   - Cria tecnologias não existentes
   - Associa tecnologias à aplicação

### 2. Via Script Shell

#### Carga Básica (Apenas Aplicação)
```bash
cd scripts
./load-aplicacoes.sh ../data-templates/aplicacoes-carga.json
```

#### Carga Completa (Aplicação + Relacionamentos)
```bash
# 1. Carregar aplicação
./load-aplicacoes.sh ../data-templates/aplicacoes-carga.json

# 2. Carregar relacionamentos (manual via API)
# Ver seção "API REST" abaixo
```

### 3. Via API REST

#### Criar Aplicação com Todos os Relacionamentos
```bash
curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "CRM",
    "descricao": "Salesforce CRM",
    "urlDocumentacao": "https://docs.empresa.com/salesforce",
    "faseCicloVida": "Produção",
    "criticidadeNegocio": "Muito Alta",
    "tecnologias": [
      {
        "tecnologiaId": "uuid-tecnologia",
        "dataInicio": "2024-01-15",
        "status": "Ativo"
      }
    ],
    "ambientes": [
      {
        "tipoAmbiente": "Prod",
        "urlAmbiente": "https://app.prod.empresa.com",
        "dataCriacao": "2024-01-01",
        "tempoLiberacao": 30,
        "status": "Ativo"
      }
    ],
    "capacidades": [...],
    "processos": [...],
    "integracoes": [...],
    "slas": [...]
  }'
```

#### Atualizar Aplicação
```bash
curl -X PUT http://localhost:3000/api/aplicacoes/{id} \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### Obter Aplicação com Relacionamentos
```bash
curl http://localhost:3000/api/aplicacoes/{id}
```

**Resposta**:
```json
{
  "id": "uuid",
  "sigla": "CRM",
  "descricao": "Salesforce CRM",
  "tecnologias": [...],
  "ambientes": [...],
  "capacidades": [...],
  "processos": [...],
  "integracoes": [...],
  "slas": [...]
}
```

## 📁 Arquivos de Exemplo

### Aplicações Simples
- **Arquivo**: `data-templates/aplicacoes-carga.json`
- **Conteúdo**: Aplicações básicas sem relacionamentos
- **Uso**: Carga inicial rápida

### Aplicações Completas
- **Arquivo**: `data-templates/exemplo-aplicacoes.csv`
- **Conteúdo**: Formato CSV simplificado
- **Limitação**: Não suporta relacionamentos (apenas dados básicos)

## ⚠️ Validações

### Antes da Carga
1. ✅ Sigla deve ser única no sistema
2. ✅ Sigla: máximo 15 caracteres alfanuméricos
3. ✅ Descrição: máximo 50 caracteres
4. ✅ URL de documentação deve ser válida
5. ✅ faseCicloVida deve ser um dos valores permitidos
6. ✅ criticidadeNegocio deve ser um dos valores permitidos

### Relacionamentos
1. ✅ IDs de tecnologias devem existir em `tecnologias`
2. ✅ IDs de capacidades devem existir em `capacidades_negocio`
3. ✅ IDs de processos devem existir em `processos_negocio`
4. ✅ IDs de SLAs devem existir em `slas`
5. ✅ aplicacaoDestinoId deve ser outra aplicação válida
6. ✅ Datas devem estar no formato ISO 8601 (YYYY-MM-DD)

## 🔄 Fluxo Recomendado

### Para Novos Sistemas

1. **Preparar Dependências**
   ```bash
   # Carregar tecnologias
   ./scripts/carga-dados-exemplos.sh
   
   # Carregar capacidades
   ./scripts/load-capacidades-negocio.sh data-templates/capacidades-negocio-carga.json
   
   # Carregar processos
   # (via interface web - Processos de Negócio)
   
   # Carregar SLAs
   # (via interface web - SLAs)
   ```

2. **Criar Aplicações**
   - Via wizard web (recomendado para primeira aplicação)
   - Via script para carga em lote

3. **Associar Tecnologias via Lockfiles**
   - Upload de `package.json`, `pom.xml`, etc.
   - Sistema detecta e associa automaticamente

### Para Aplicações Existentes

1. **Editar Aplicação**
   - Acesse: **Aplicações → Editar**
   - Sistema carrega todos os relacionamentos existentes
   - Modifique conforme necessário

2. **Atualizar Tecnologias**
   - Use **Carga de Lockfiles** para atualizar dependências
   - Sistema mantém histórico (dataInicio/dataTermino)

## 🔍 Troubleshooting

### Erro: "Sigla já cadastrada"
**Causa**: Tentativa de criar aplicação com sigla duplicada
**Solução**: Use sigla diferente ou atualize a existente (PUT)

### Erro: "tecnologiaId não encontrado"
**Causa**: ID de tecnologia inválido
**Solução**: 
1. Liste tecnologias: `curl http://localhost:3000/api/tecnologias`
2. Use ID válido ou crie a tecnologia primeiro

### Erro: "Dados relacionados não aparecem ao editar"
**Causa**: Problema corrigido na versão atual
**Solução**: 
- Garanta que está usando a versão atualizada
- GET `/api/aplicacoes/{id}` retorna todos os relacionamentos
- Frontend tem `useEffect` para carregar dados assincronamente

### Lockfile não processa corretamente
**Solução**:
1. Verifique se o formato é suportado (29 tipos)
2. Veja logs no console do navegador
3. Propriedades Maven `${version}` são resolvidas automaticamente

## 📊 Estatísticas e Monitoramento

### Verificar Aplicações Carregadas
```bash
curl http://localhost:3000/api/aplicacoes | jq 'length'
```

### Listar Aplicações com Relacionamentos
```bash
curl http://localhost:3000/api/aplicacoes | jq '.[] | {sigla, descricao, tecnologias: (.tecnologias | length)}'
```

### Verificar Aplicação Específica
```bash
curl http://localhost:3000/api/aplicacoes/{id} | jq '{
  sigla,
  descricao,
  total_tecnologias: (.tecnologias | length),
  total_ambientes: (.ambientes | length),
  total_capacidades: (.capacidades | length),
  total_processos: (.processos | length),
  total_integracoes: (.integracoes | length),
  total_slas: (.slas | length)
}'
```

## 📝 Logs e Auditoria

### Logs de Carga
- Script shell: `aplicacoes-carga-YYYYMMDD-HHMMSS.log`
- API: Logs no console do servidor
- Frontend: Console do navegador (F12)

### Auditoria
Todas as operações são registradas:
- `created_at`: Data de criação
- `updated_at`: Data da última atualização
- Relacionamentos mantêm histórico via `dataInicio`/`dataTermino`

## 🔗 Referências

- [API de Aplicações](../server/api.js#L1875-L2290)
- [AplicacaoWizard](../src/components/aplicacoes/AplicacaoWizard.tsx)
- [CargaLockfilesView](../src/components/carga/CargaLockfilesView.tsx)
- [Script de Carga](../scripts/load-aplicacoes.sh)
- [Dados de Exemplo](./aplicacoes-carga.json)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs de erro
2. Consulte esta documentação
3. Veja exemplos em `data-templates/`
4. Teste via interface web primeiro
