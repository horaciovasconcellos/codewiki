# Dashboard DORA - Métricas de Performance DevOps

## 📊 Visão Geral

O Dashboard DORA implementa as métricas do framework **DevOps Research and Assessment (DORA)**, desenvolvido pelo Google Cloud para medir a performance de equipes de desenvolvimento de software.

## 🎯 Métricas Implementadas

### 1. **Deployment Frequency (Frequência de Deploy)**
- **O que mede:** Com que frequência a equipe realiza deploys em produção
- **Como calculamos:** Número de builds bem-sucedidos / Período analisado (em dias)
- **Nível Elite:** Múltiplos deploys por dia
- **Nível Alto:** Entre 1x por dia e 1x por semana
- **API utilizada:** Azure Build API - `/build/builds`

### 2. **Lead Time for Changes (Tempo de Entrega)**
- **O que mede:** Tempo desde o commit até o deploy em produção
- **Como calculamos:** Tempo médio entre criação e merge de Pull Requests
- **Nível Elite:** Menos de 1 hora
- **Nível Alto:** Entre 1 dia e 1 semana
- **API utilizada:** Azure Git API - `/git/repositories/{repositoryId}/pullrequests`

### 3. **Métricas Adicionais de Commits**

#### Total de Commits na Branch Main
- **O que mede:** Atividade de desenvolvimento na branch principal
- **Como calculamos:** Contagem de commits na branch main no período
- **API utilizada:** Azure Git API - `/git/repositories/{repositoryId}/commits`

#### Classificação de Commits
- **Features:** Commits com palavras-chave `feature` ou `feat`
- **Bugs:** Commits com palavras-chave `bug`, `fix` ou `hotfix`
- **Outros:** Demais commits não classificados

#### Aging de Commits (Análise por Idade)
- **0-7 dias:** Commits recentes (última semana)
- **8-14 dias:** Commits da penúltima semana
- **15-30 dias:** Commits do último mês
- **+30 dias:** Commits antigos (mais de 30 dias)

## 📈 Visualizações

### Dashboard Individual (Por Projeto)
1. **Cards de Métricas Principais:**
   - Deployment Frequency
   - Lead Time for Changes
   - Total de Commits
   - Total de Pull Requests

2. **Gráfico de Pizza - Commits por Tipo:**
   - Features (verde)
   - Bugs (vermelho)
   - Outros (azul)

3. **Gráfico de Barras - Aging de Commits:**
   - Distribuição temporal dos commits

4. **Tabela de Repositórios:**
   - Métricas detalhadas por repositório do projeto

### Dashboard Unificado (Todos os Projetos)
1. **Métricas Consolidadas:**
   - Soma de todos os projetos
   - Médias ponderadas

2. **Gráfico de Pizza - Commits Totais por Tipo:**
   - Visão geral de todos os projetos

3. **Tabela de Projetos:**
   - Comparação de métricas entre projetos

## 🔧 Requisitos

### Backend
- Configuração do Azure DevOps (`azure_devops_config`)
- Projetos com URL configurada (`estruturas_projeto.url_projeto`)

### Permissões Necessárias (PAT do Azure DevOps)
- **Git API:** Read access to repositories and commits
- **Build API:** Read access to builds
- **Release API:** Read access to releases (opcional)

## 📊 Endpoints Criados

### GET `/api/dora-metrics/:projetoId`
Busca métricas DORA de um projeto específico.

**Query Parameters:**
- `startDate` (opcional): Data inicial no formato ISO (default: 30 dias atrás)
- `endDate` (opcional): Data final no formato ISO (default: hoje)

**Response:**
```json
{
  "success": true,
  "data": {
    "projetoId": "uuid",
    "projetoNome": "Nome do Projeto",
    "periodo": {
      "inicio": "2024-01-01T00:00:00.000Z",
      "fim": "2024-01-31T23:59:59.999Z"
    },
    "repositorios": [
      {
        "repositorioId": "repo-id",
        "repositorioNome": "repo-name",
        "commits": {
          "total": 150,
          "bugs": 30,
          "features": 80,
          "aging": {
            "0-7dias": 45,
            "8-14dias": 35,
            "15-30dias": 40,
            "mais30dias": 30
          }
        },
        "pullRequests": {
          "total": 25,
          "leadTimeAvgMinutes": 1440,
          "leadTimeAvgHours": 24
        }
      }
    ],
    "totais": {
      "deploymentsCount": 45,
      "commitsCount": 150,
      "bugCommitsCount": 30,
      "featureCommitsCount": 80,
      "pullRequestsCount": 25,
      "leadTimeAvgMinutes": 1440,
      "leadTimeAvgHours": 24,
      "deploymentFrequencyPerDay": 1.5
    }
  }
}
```

### GET `/api/dora-metrics/unified`
Busca métricas DORA consolidadas de todos os projetos.

**Query Parameters:**
- `startDate` (opcional): Data inicial no formato ISO
- `endDate` (opcional): Data final no formato ISO

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProjetos": 5,
    "periodo": {
      "inicio": "2024-01-01T00:00:00.000Z",
      "fim": "2024-01-31T23:59:59.999Z"
    },
    "totais": {
      "deploymentsCount": 225,
      "commitsCount": 750,
      "bugCommitsCount": 150,
      "featureCommitsCount": 400,
      "pullRequestsCount": 125,
      "leadTimeAvgMinutes": 1200,
      "leadTimeAvgHours": 20,
      "deploymentFrequencyPerDay": 1.8
    },
    "projetos": [
      // Array com métricas individuais de cada projeto
    ]
  }
}
```

## 🚀 Como Usar

1. **Acesse o Dashboard DORA:**
   - Menu lateral: `Dashboard DORA`

2. **Selecione o Escopo:**
   - **"Todos os Projetos (Unificado)"** para visão consolidada
   - **Projeto específico** para análise detalhada

3. **Escolha o Período:**
   - 7, 15, 30, 60 ou 90 dias

4. **Clique em "Atualizar Métricas":**
   - O sistema buscará dados em tempo real do Azure DevOps

5. **Analise os Resultados:**
   - Cards com métricas principais
   - Gráficos visuais
   - Tabelas detalhadas

## 📝 Interpretação das Métricas

### Deployment Frequency
- **> 2 deploys/dia:** Elite
- **1-2 deploys/dia:** Alto
- **< 1 deploy/dia:** Médio/Baixo

### Lead Time
- **< 1 hora:** Elite
- **< 1 dia:** Alto
- **1-7 dias:** Médio
- **> 1 semana:** Baixo

### Commits por Tipo
- **Alta proporção de features:** Desenvolvimento ativo de novas funcionalidades
- **Alta proporção de bugs:** Possível indicativo de dívida técnica ou problemas de qualidade
- **Balanceamento saudável:** Mix equilibrado entre features, correções e manutenção

### Aging de Commits
- **Maioria em 0-7 dias:** Desenvolvimento ativo e recente
- **Acúmulo em +30 dias:** Possível estagnação ou branches antigas

## 🔍 Troubleshooting

### Erro: "Projeto não possui URL configurada"
**Solução:** Configure a URL do projeto Azure DevOps em "Gerador de Projetos"

### Erro: "Configuração do Azure DevOps não encontrada"
**Solução:** Configure a organização e PAT em "Configurações" → "Azure DevOps"

### Métricas retornam zero
**Possíveis causas:**
1. Período selecionado muito curto ou sem atividade
2. Repositórios vazios ou sem commits na branch main
3. PAT do Azure DevOps sem permissões adequadas

### Performance lenta
**Otimizações:**
- Use períodos menores (7-30 dias)
- Analise projetos individualmente em vez de "Unificado"
- Cache das métricas será implementado em versão futura

## 🔮 Roadmap

### Próximas Implementações
- [ ] **Change Failure Rate:** Taxa de falha em mudanças (% de deploys que causam incidentes)
- [ ] **Time to Restore Service:** Tempo para restaurar o serviço após falha
- [ ] **Cache de métricas:** Armazenar resultados para melhor performance
- [ ] **Histórico temporal:** Gráficos de evolução das métricas ao longo do tempo
- [ ] **Alertas e notificações:** Avisos quando métricas degradarem
- [ ] **Exportação de relatórios:** Download em PDF/Excel
- [ ] **Integração com Pipelines:** Análise de stages e duração de pipelines

## 📚 Referências

- [DORA Metrics - Google Cloud](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)
- [Azure DevOps REST API Documentation](https://learn.microsoft.com/en-us/rest/api/azure/devops)
- [State of DevOps Report](https://cloud.google.com/devops/state-of-devops/)

---

**Desenvolvido para o Sistema de Auditoria - Gestão de Colaboradores**  
Versão: 1.0.0 | Data: Dezembro 2024
