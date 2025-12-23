# Dashboard de Aplicações

## Visão Geral

O Dashboard de Aplicações fornece uma visualização gráfica abrangente das aplicações cadastradas no sistema, permitindo análise rápida da distribuição por tipo, fase do ciclo de vida e criticidade do negócio.

## Funcionalidades

### 1. Estatísticas Gerais
- **Total de Aplicações**: Contador com o número total de aplicações cadastradas
- **Visualização em Cards**: Informações resumidas e de fácil leitura

### 2. Gráficos Disponíveis

#### 2.1 Por Tipo de Aplicação
- **Tipo**: Gráfico de Pizza (Pie Chart)
- **Informações**: Distribuição percentual por tipo
- **Tipos**: BOT, COTS, INTERNO, MOTS, OSS, OTS, PAAS, SAAS
- **Cores**: Esquema de cores diferenciado para cada tipo

#### 2.2 Por Fase do Ciclo de Vida
- **Tipo**: Gráfico de Barras Verticais (Bar Chart)
- **Informações**: Quantidade de aplicações em cada fase
- **Fases**:
  - Planejamento
  - Desenvolvimento
  - Homologação
  - Produção
  - Manutenção
  - Descontinuado
- **Cores**: Gradiente de verde (início) a vermelho (descontinuado)

#### 2.3 Por Criticidade do Negócio
- **Tipo**: Gráfico de Barras Horizontais (Bar Chart)
- **Informações**: Quantidade de aplicações por nível de criticidade
- **Níveis**:
  - Crítica
  - Alta
  - Média
  - Baixa
- **Cores**: Escala de vermelho (crítica) a verde (baixa)

## API Endpoint

### GET /api/aplicacoes-stats

Retorna estatísticas agregadas das aplicações.

**Resposta de Sucesso (200 OK)**:
```json
{
  "total": 25,
  "porTipo": [
    { "tipo": "INTERNO", "quantidade": 10 },
    { "tipo": "SAAS", "quantidade": 8 },
    { "tipo": "COTS", "quantidade": 5 },
    { "tipo": "OSS", "quantidade": 2 }
  ],
  "porFase": [
    { "fase": "Produção", "quantidade": 15 },
    { "fase": "Desenvolvimento", "quantidade": 6 },
    { "fase": "Homologação", "quantidade": 3 },
    { "fase": "Descontinuado", "quantidade": 1 }
  ],
  "porCriticidade": [
    { "criticidade": "Crítica", "quantidade": 8 },
    { "criticidade": "Alta", "quantidade": 10 },
    { "criticidade": "Média", "quantidade": 5 },
    { "criticidade": "Baixa", "quantidade": 2 }
  ]
}
```

**Resposta de Erro (500)**:
```json
{
  "error": "Erro ao buscar dados",
  "code": "DATABASE_ERROR"
}
```

## Componentes Técnicos

### Bibliotecas Utilizadas
- **Recharts**: Biblioteca de gráficos React baseada em D3
- **React**: Framework para UI
- **TypeScript**: Tipagem estática

### Componentes Criados

#### 1. AplicacoesDashboard.tsx
Componente principal que:
- Busca estatísticas da API
- Renderiza os gráficos
- Gerencia estado de loading
- Trata erros de requisição

#### 2. Integração com DashboardView.tsx
- Adicionado ao dashboard principal
- Posicionado abaixo dos cards de resumo
- Responsivo para diferentes tamanhos de tela

## Estrutura de Dados

### Interface TypeScript
```typescript
interface AplicacoesStats {
  total: number;
  porTipo: Array<{ tipo: string; quantidade: number }>;
  porFase: Array<{ fase: string; quantidade: number }>;
  porCriticidade: Array<{ criticidade: string; quantidade: number }>;
}
```

## Consultas SQL

### Total de Aplicações
```sql
SELECT COUNT(*) as total FROM aplicacoes
```

### Por Tipo
```sql
SELECT tipo_aplicacao, COUNT(*) as quantidade 
FROM aplicacoes 
WHERE tipo_aplicacao IS NOT NULL
GROUP BY tipo_aplicacao
ORDER BY quantidade DESC
```

### Por Fase
```sql
SELECT fase_ciclo_vida, COUNT(*) as quantidade 
FROM aplicacoes 
WHERE fase_ciclo_vida IS NOT NULL
GROUP BY fase_ciclo_vida
ORDER BY quantidade DESC
```

### Por Criticidade
```sql
SELECT criticidade_negocio, COUNT(*) as quantidade 
FROM aplicacoes 
WHERE criticidade_negocio IS NOT NULL
GROUP BY criticidade_negocio
ORDER BY quantidade DESC
```

## Layout e Design

### Responsividade
- **Mobile**: Gráficos empilhados verticalmente
- **Tablet**: Grade de 2 colunas para gráficos lado a lado
- **Desktop**: Layout otimizado com espaçamento adequado

### Esquema de Cores

#### Tipo de Aplicação
- Paleta de 8 cores variadas para diferenciação clara

#### Fase do Ciclo de Vida
- Verde: Fases iniciais (Planejamento, Desenvolvimento)
- Amarelo: Fases intermediárias (Homologação)
- Laranja: Produção
- Vermelho: Descontinuado

#### Criticidade
- Vermelho: Crítica
- Laranja: Alta
- Amarelo: Média
- Verde: Baixa

## Estados da Interface

### Loading
```
Carregando estatísticas...
```

### Erro
```
Erro ao carregar estatísticas
```

### Sem Dados
- Gráficos são ocultados se não houver dados para a categoria
- Mensagem apropriada é exibida

## Interatividade

### Tooltips
- Hover sobre gráficos mostra valores exatos
- Informações contextuais em cada ponto de dados

### Labels
- Gráfico de pizza: Mostra tipo, quantidade e percentual
- Gráficos de barras: Eixos claramente rotulados

## Performance

### Otimizações
- Estado de loading evita renderização prematura
- Requisição única na montagem do componente
- Atualização automática não implementada (pode ser adicionada)

### Sugestões de Melhoria
- Cache de dados
- Atualização periódica com WebSocket ou polling
- Filtros interativos por período

## Integração

### Como Usar

1. **Visualizar Dashboard**
   - Acesse a aba "Dashboard" no menu principal
   - Visualize os cards de resumo no topo
   - Role para baixo para ver os gráficos de aplicações

2. **Interpretar Dados**
   - Use os gráficos para identificar padrões
   - Compare distribuições entre categorias
   - Tome decisões baseadas em dados visuais

## Troubleshooting

### Erro: "Erro ao buscar estatísticas"
- Verifique se o servidor está rodando
- Confirme que a porta 3000 está acessível
- Verifique logs do servidor para erros SQL

### Gráficos não aparecem
- Verifique se há aplicações cadastradas
- Confirme que os campos obrigatórios estão preenchidos
- Verifique console do navegador para erros

### Dados não atualizados
- Faça refresh da página
- Verifique se as aplicações foram salvas corretamente
- Confirme que o banco de dados está atualizado

## Manutenção

### Adicionar Novo Gráfico
1. Adicionar consulta SQL em `api.js`
2. Atualizar interface `AplicacoesStats`
3. Adicionar componente de gráfico em `AplicacoesDashboard.tsx`
4. Atualizar cores se necessário

### Modificar Cores
- Editar objeto `COLORS` em `AplicacoesDashboard.tsx`
- Manter contraste adequado para acessibilidade

### Ajustar Layout
- Modificar classes Tailwind CSS
- Ajustar ResponsiveContainer height
- Testar em diferentes resoluções

## Recursos Futuros

### Planejado
- [ ] Filtros por período (mês, trimestre, ano)
- [ ] Exportação de gráficos como imagem
- [ ] Gráficos de tendência temporal
- [ ] Dashboard comparativo
- [ ] Drill-down interativo
- [ ] Relatórios PDF

### Possíveis Melhorias
- Animações nos gráficos
- Temas claro/escuro
- Gráficos customizáveis pelo usuário
- Dashboards favoritos/salvos
- Alertas baseados em métricas

## Referências

- [Recharts Documentation](https://recharts.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
