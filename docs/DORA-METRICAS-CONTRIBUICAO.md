# Métricas de Contribuição - Dashboard DORA

## Visão Geral

O Dashboard DORA foi expandido com 5 novas visualizações focadas em análise de contribuições por autor. Estas métricas ajudam a entender o impacto individual dos desenvolvedores no projeto.

## Métricas Implementadas

### 1. 📊 Número de Commits por Autor

**Descrição:** Gráfico de barras horizontal mostrando os top 10 autores com mais commits.

**Propósito:** 
- Identificar os principais contribuidores do projeto
- Medir a frequência de contribuição
- Identificar desenvolvedores mais ativos

**Visualização:** Barra horizontal ordenada por volume de commits

---

### 2. 📈 Linhas de Código Alteradas (LOC Churn)

**Descrição:** Gráfico de barras empilhadas mostrando linhas adicionadas e removidas por autor.

**Métricas:**
- **Linhas Adicionadas** (verde): Novas linhas de código criadas
- **Linhas Removidas** (vermelho): Linhas de código deletadas ou refatoradas

**Propósito:**
- Entender o volume de mudanças no código
- Identificar refatorações massivas
- Medir a magnitude das contribuições

**Cálculo:** LOC Churn = Linhas Adicionadas + Linhas Removidas

---

### 3. 🥧 Percentual de Contribuição por Autor

**Descrição:** Gráfico de pizza mostrando a distribuição percentual de commits entre os top 8 autores.

**Propósito:**
- Visualizar a distribuição de carga de trabalho
- Identificar concentração de conhecimento
- Avaliar balanceamento da equipe

**Cálculo:** `(Commits do Autor / Total de Commits) × 100`

---

### 4. 📋 Ownership de Código (Blame-based)

**Descrição:** Tabela detalhada com todas as métricas consolidadas por autor.

**Colunas:**
- **Autor:** Nome do desenvolvedor
- **Commits:** Total de commits
- **LOC+:** Linhas adicionadas
- **LOC-:** Linhas removidas
- **Churn Total:** Soma de linhas adicionadas e removidas
- **PRs:** Pull Requests criados
- **Features:** Commits de features
- **Bugs:** Commits de correções
- **Impact Score:** Métrica composta (ver abaixo)

**Propósito:**
- Análise detalhada de todas as contribuições
- Identificar especialistas em áreas específicas
- Avaliar qualidade vs. quantidade

---

### 5. 🎯 Impact Score - Métrica Composta

**Descrição:** Score calculado combinando múltiplas dimensões de contribuição.

**Fórmula:**
```
Impact Score = (Commits × 1) + (LOC Churn × 0.01) + (PRs × 5)
```

**Componentes:**
- **Commits (peso 1):** Base da contribuição
- **LOC Churn (peso 0.01):** Volume de código alterado
- **Pull Requests (peso 5):** Qualidade e revisão de código

**Propósito:**
- Métrica holística de impacto
- Balancear quantidade e qualidade
- Identificar contribuidores de alto impacto

**Tooltip Detalhado:**
- Nome do autor
- Score total
- Commits
- Linhas de código (LOC)
- Pull Requests
- Features
- Bugs

---

## Como Usar

### Acessar o Dashboard

1. Navegue até **Dashboard DORA** no menu principal
2. Selecione um projeto específico ou **"Todos os Projetos (Unificado)"**
3. Escolha o período de análise (7, 15, 30, 60 ou 90 dias)
4. Clique em **"Atualizar Métricas"**

### Interpretando os Dados

#### Commits por Autor
- **Alto volume:** Desenvolvedor muito ativo
- **Baixo volume:** Pode indicar trabalho em features grandes ou necessidade de suporte

#### LOC Churn
- **Alto churn:** Grandes mudanças, refatorações ou features complexas
- **Adições >> Remoções:** Desenvolvimento de novas funcionalidades
- **Remoções >> Adições:** Limpeza de código, refatoração

#### Percentual de Contribuição
- **Distribuição uniforme:** Equipe bem balanceada
- **Concentração alta:** Risco de dependência de pessoa-chave
- **Muitos pequenos contribuidores:** Boa distribuição de conhecimento

#### Impact Score
- **Score alto:** Contribuidor de alto impacto
- **Score médio com muitos PRs:** Foco em qualidade
- **Score médio com muito LOC:** Foco em volume

---

## Dados Coletados da API

### Fonte: Azure DevOps

**Commits:**
```json
{
  "commitId": "abc123",
  "author": {
    "name": "João Silva",
    "email": "joao@example.com",
    "date": "2026-01-13T10:00:00Z"
  },
  "comment": "feat: nova funcionalidade",
  "changeCounts": {
    "Add": 150,
    "Edit": 50,
    "Delete": 25
  }
}
```

**Pull Requests:**
```json
{
  "pullRequestId": 123,
  "createdBy": {
    "displayName": "João Silva",
    "uniqueName": "joao@example.com"
  },
  "creationDate": "2026-01-10T10:00:00Z",
  "closedDate": "2026-01-12T15:30:00Z",
  "status": "completed"
}
```

---

## Estrutura de Dados da API

### Endpoint Individual
`GET /api/dora-metrics/:projetoId`

```json
{
  "success": true,
  "data": {
    "projetoId": "123",
    "projetoNome": "Meu Projeto",
    "periodo": {
      "inicio": "2025-12-14T00:00:00Z",
      "fim": "2026-01-13T00:00:00Z"
    },
    "autores": {
      "João Silva <joao@example.com>": {
        "name": "João Silva",
        "email": "joao@example.com",
        "commits": 45,
        "linesAdded": 3420,
        "linesDeleted": 890,
        "prs": 12,
        "bugCommits": 8,
        "featureCommits": 32
      }
    },
    "totais": { ... },
    "repositorios": [ ... ]
  }
}
```

### Endpoint Unificado
`GET /api/dora-metrics/unified`

Consolida dados de todos os projetos, agregando autores por nome e email.

---

## Melhorias Futuras

- [ ] Filtro por autor específico
- [ ] Gráfico de tendência temporal (commits por semana)
- [ ] Análise de code review (aprovações por autor)
- [ ] Métricas de qualidade (coverage, bugs introduzidos)
- [ ] Comparação entre períodos
- [ ] Exportação de relatórios
- [ ] Alertas de concentração de conhecimento

---

## Tecnologias Utilizadas

- **Frontend:** React + TypeScript + Recharts
- **Backend:** Node.js + Express
- **API:** Azure DevOps REST API
- **Banco de Dados:** MySQL (metadados de projetos)

---

## Notas Técnicas

### Performance
- Commits limitados a 100 por repositório para otimização
- Cálculo de changeCounts via API do Azure DevOps
- Cache recomendado para períodos longos

### Limitações
- Requer Personal Access Token (PAT) do Azure DevOps
- Projetos sem URL configurada não aparecem
- Histórico limitado ao período selecionado

### Fórmula do Impact Score
A fórmula foi calibrada para balancear:
- 1 commit = 1 ponto base
- 100 linhas alteradas = 1 ponto adicional
- 1 PR = 5 pontos (incentiva qualidade)

Ajuste os pesos conforme a cultura do seu time!

---

## Suporte

Para dúvidas ou sugestões sobre as métricas, contate a equipe de DevOps.

**Última atualização:** 13/01/2026
