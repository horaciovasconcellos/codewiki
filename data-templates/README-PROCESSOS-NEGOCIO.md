# Carga de Processos de Negócio com Normas e Compliance

Este documento descreve a estrutura e uso dos dados de exemplo para Processos de Negócio, incluindo normas e compliance.

## 📋 Estrutura dos Dados

### Campos do Processo de Negócio

| Campo | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| `identificacao` | String | Sigla no formato AAAA-00000 | Obrigatório |
| `descricao` | String | Descrição do processo (até 50 caracteres) | Obrigatório |
| `areaResponsavel` | String | Área responsável pelo processo | Obrigatório |
| `nivelMaturidade` | String | Nível de maturidade do processo | "Inicial" |
| `frequencia` | String | Frequência de execução | "Ad-Hoc" |
| `duracaoMedia` | Number | Duração média em horas | 8 |
| `complexidade` | String | Complexidade do processo | "Média" |
| `normas` | Array | Lista de normas aplicáveis | [] |

### Níveis de Maturidade
- **Inicial**: Processos ad-hoc e caóticos
- **Repetível**: Processos rastreáveis
- **Definido**: Processos documentados e padronizados
- **Gerenciado**: Processos medidos e controlados
- **Otimizado**: Foco em melhoria contínua

### Frequências
- **Ad-Hoc**: Sob demanda
- **Diária**: Todos os dias
- **Semanal**: Semanalmente
- **Mensal**: Mensalmente
- **Trimestral**: A cada três meses
- **Anual**: Uma vez por ano

### Complexidades
- **Baixa**: Processos simples
- **Média**: Processos moderados
- **Alta**: Processos complexos

---

## 📚 Estrutura das Normas

### Campos da Norma

| Campo | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| `id` | String | Identificador único da norma | Gerado automaticamente |
| `nome` | String | Nome/código da norma | Obrigatório |
| `tipo` | String | Tipo da norma | Obrigatório |
| `descricao` | String | Descrição da norma | Obrigatório |
| `itemNorma` | String | Item/artigo/seção específica | Obrigatório |
| `dataInicio` | String | Data de início (YYYY-MM-DD) | Obrigatório |
| `dataTermino` | String | Data de término (YYYY-MM-DD) | null |
| `obrigatoriedade` | String | Se é obrigatória ou não | "Não Obrigatória" |
| `status` | String | Status da norma | "Inativo" |

### Tipos de Norma

#### 1. **Norma Técnica**
Normas estabelecidas por organismos de normalização (ABNT, ISO, IEC, etc.).

**Exemplos cadastrados:**
- **ABNT NBR 9050** — Acessibilidade a edificações, mobiliário e espaços urbanos
- **ISO 9001** — Sistema de Gestão da Qualidade
- **ISO/IEC 27001** — Gestão de Segurança da Informação
- **IEC 62304** — Software para dispositivos médicos
- **ABNT NBR 5410** — Instalações elétricas de baixa tensão
- **CPC 00 (R2)** — Estrutura Conceitual para Relatório Financeiro

#### 2. **Norma Reguladora**
Normas estabelecidas por órgãos reguladores governamentais.

**Exemplos cadastrados:**
- **NR-10** — Segurança em instalações e serviços em eletricidade
- **NR-32** — Segurança e saúde em serviços de saúde
- **ANVISA RDC nº 301/2019** — Boas Práticas de Fabricação
- **Resoluções do BACEN** — Regras para o sistema financeiro
- **Lei nº 8.666/93** — Lei de Licitações e Contratos
- **Lei nº 13.146/2015** — Lei Brasileira de Inclusão
- **LGPD (Lei nº 13.709/2018)** — Lei Geral de Proteção de Dados
- **Resolução CMN nº 4.557/2017** — Estrutura de gerenciamento de riscos

#### 3. **Regulamentação Internacional**
Regulamentações e acordos internacionais.

**Exemplos cadastrados:**
- **GDPR** — Regulamento Geral de Proteção de Dados (UE)
- **Basel III** — Regras internacionais para o sistema bancário
- **IFRS** — Normas internacionais de contabilidade
- **Acordos da OMC (WTO)** — Comércio internacional
- **GATT** — Acordo Geral sobre Tarifas e Comércio

### Status da Norma
- **Ativo**: Norma em vigor e sendo aplicada
- **Inativo**: Norma não aplicada ou suspensa

### Obrigatoriedade
- **Obrigatória**: Norma que deve ser cumprida
- **Não Obrigatória**: Norma recomendada mas não mandatória

---

## 🚀 Como Usar

> **IMPORTANTE**: Este sistema usa `localStorage` no navegador. A carga é feita via Console do DevTools.

### Método 1: Carga via Console do Navegador (RECOMENDADO)

1. **Abrir o sistema no navegador**
   ```
   http://localhost:5173
   ```

2. **Abrir o Console do DevTools**
   - Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
   - Pressione `Cmd+Option+I` (macOS)
   - Ou clique com botão direito > "Inspecionar" > aba "Console"

3. **Executar o script de carga**
   ```bash
   # Copie todo o conteúdo do arquivo
   cat scripts/carga-processos-browser.js
   
   # Cole no Console do navegador e pressione Enter
   ```

4. **Recarregar a página**
   ```
   Pressione F5 para recarregar e visualizar os dados
   ```

### Método 2: Carga Manual via Interface

1. Acesse a tela "Processos de Negócio"
2. Clique no botão "+ Processo de Negócio"
3. Preencha os dados do wizard seguindo os exemplos do arquivo `processos-negocio-carga.json`
4. Adicione as normas em cada processo

### 3. Verificar a Carga

Após recarregar a página, você verá:

```
✓ 10 processos de negócio carregados
✓ 22 normas distribuídas
✓ Dados disponíveis na interface
```

**Saída do Console:**

```
╔════════════════════════════════════════════════════════════╗
║     CARGA DE PROCESSOS DE NEGÓCIO - CONSOLE MODE          ║
╚════════════════════════════════════════════════════════════╝

✓ CARGA CONCLUÍDA COM SUCESSO!

╔════════════════════════════════════════════════════════════╗
║                    RESUMO DA CARGA                         ║
╚════════════════════════════════════════════════════════════╝

✓ Total de processos carregados: 10

ESTATÍSTICAS DE NORMAS:
  ➜ Total de normas: 22
  ➜ Normas Técnicas: 7
  ➜ Normas Reguladoras: 10
  ➜ Regulamentações Internacionais: 6

PROCESSOS CARREGADOS:
  ✓ ADMN-00001 - Gestão de Contratos Administrativos (2 normas)
  ✓ FINA-00001 - Controle de Contas a Pagar (2 normas)
  ...

⚠ IMPORTANTE: Recarregue a página (F5) para visualizar os dados!
```

---

## 📊 Processos Cadastrados

### 1. ADMN-00001 - Gestão de Contratos Administrativos
- **Área**: Administração
- **Normas**: ISO 9001, Lei nº 8.666/93

### 2. FINA-00001 - Controle de Contas a Pagar
- **Área**: Financeiro
- **Normas**: IFRS 9, Resoluções do BACEN nº 4.557

### 3. TECH-00001 - Desenvolvimento de Software
- **Área**: Tecnologia da Informação
- **Normas**: ISO/IEC 27001, GDPR

### 4. SAUDE-00001 - Atendimento Ambulatorial
- **Área**: Saúde
- **Normas**: NR-32, ANVISA RDC nº 301/2019, IEC 62304

### 5. ELET-00001 - Manutenção de Infraestrutura Elétrica
- **Área**: Engenharia
- **Normas**: NR-10, ABNT NBR 5410

### 6. ACES-00001 - Adequação de Acessibilidade
- **Área**: Obras e Infraestrutura
- **Normas**: ABNT NBR 9050, Lei nº 13.146/2015

### 7. COME-00001 - Importação e Exportação de Produtos
- **Área**: Comercial
- **Normas**: Acordos da OMC (WTO), Regulamento Aduaneiro

### 8. BANC-00001 - Gestão de Riscos Financeiros
- **Área**: Compliance Bancário
- **Normas**: Basel III, Resolução CMN nº 4.557/2017

### 9. CONT-00001 - Elaboração de Demonstrações Financeiras
- **Área**: Contabilidade
- **Normas**: IFRS 15, CPC 00 (R2)

### 10. SEGU-00001 - Gestão de Incidentes de Segurança
- **Área**: Segurança da Informação
- **Normas**: ISO/IEC 27001, LGPD, GDPR

---

## 📈 Estatísticas

### Total de Normas por Tipo
- **Normas Técnicas**: 7
- **Normas Reguladoras**: 10
- **Regulamentações Internacionais**: 7

### Distribuição por Obrigatoriedade
- **Obrigatórias**: 23
- **Não Obrigatórias**: 1

### Distribuição por Status
- **Ativas**: 24
- **Inativas**: 0

---

## 🔍 Exemplos de Uso

### Inspecionar dados no Console

```javascript
// Visualizar todos os processos
const processos = JSON.parse(localStorage.getItem('processos-negocio'));
console.table(processos.map(p => ({
  Sigla: p.identificacao,
  Descrição: p.descricao,
  Área: p.areaResponsavel,
  Normas: p.normas.length
})));

// Buscar processo específico
const processo = processos.find(p => p.identificacao === 'TECH-00001');
console.log(processo);

// Listar todas as normas
const todasNormas = processos.flatMap(p => p.normas);
console.table(todasNormas.map(n => ({
  Nome: n.nome,
  Tipo: n.tipo,
  Obrigatória: n.obrigatoriedade,
  Status: n.status
})));

// Contar processos por área
const porArea = processos.reduce((acc, p) => {
  acc[p.areaResponsavel] = (acc[p.areaResponsavel] || 0) + 1;
  return acc;
}, {});
console.table(porArea);

// Filtrar normas técnicas
const normasTecnicas = todasNormas.filter(n => n.tipo === 'Norma Técnica');
console.log(`Total de Normas Técnicas: ${normasTecnicas.length}`);
normasTecnicas.forEach(n => console.log(`  • ${n.nome} - ${n.descricao.substring(0, 50)}...`));
```

### Exportar dados

```javascript
// Exportar como JSON
const data = localStorage.getItem('processos-negocio');
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'processos-negocio-export.json';
a.click();
```

---

## 🔧 Personalização

### Adicionar Novos Processos via Console

```javascript
// 1. Carregar dados existentes
const processos = JSON.parse(localStorage.getItem('processos-negocio')) || [];

// 2. Adicionar novo processo
const novoProcesso = {
  id: "nova-00001",
  identificacao: "NOVA-00001",
  descricao: "Meu Novo Processo",
  objetivo: "Objetivo do processo",
  areaResponsavel: "Minha Área",
  nivelMaturidade: "Inicial",
  frequencia: "Ad-Hoc",
  duracaoMedia: 8,
  complexidade: "Média",
  entradas: ["Entrada 1", "Entrada 2"],
  saidas: ["Saída 1", "Saída 2"],
  responsaveis: [],
  normas: [
    {
      id: "norma-xxx",
      nome: "Nome da Norma",
      tipo: "Norma Técnica",
      descricao: "Descrição da norma",
      itemNorma: "Item/Artigo/Seção",
      dataInicio: "2024-01-01",
      dataTermino: null,
      obrigatoriedade: "Obrigatória",
      status: "Ativo"
    }
  ]
};

// 3. Adicionar ao array
processos.push(novoProcesso);

// 4. Salvar no localStorage
localStorage.setItem('processos-negocio', JSON.stringify(processos));

// 5. Recarregar a página
location.reload();
```

### Atualizar Processo Existente

```javascript
// 1. Carregar dados
const processos = JSON.parse(localStorage.getItem('processos-negocio'));

// 2. Encontrar processo
const processo = processos.find(p => p.identificacao === 'TECH-00001');

// 3. Atualizar campos
processo.nivelMaturidade = 'Gerenciado';
processo.complexidade = 'Alta';

// 4. Adicionar norma
processo.normas.push({
  id: "norma-nova-001",
  nome: "Nova Norma",
  tipo: "Norma Técnica",
  descricao: "Descrição",
  itemNorma: "Item X",
  dataInicio: "2024-02-01",
  dataTermino: null,
  obrigatoriedade: "Obrigatória",
  status: "Ativo"
});

// 5. Salvar
localStorage.setItem('processos-negocio', JSON.stringify(processos));

// 6. Recarregar
location.reload();
```

### Adicionar Novas Normas

As normas podem ser dos tipos:
- `Norma Técnica`
- `Norma Reguladora`
- `Regulamentação Internacional`

Campos obrigatórios:
- `nome`: Identificação da norma
- `tipo`: Um dos tipos acima
- `descricao`: Descrição resumida
- `itemNorma`: Item/artigo específico aplicável
- `dataInicio`: Data de vigência

Campos opcionais com valores padrão:
- `obrigatoriedade`: "Não Obrigatória"
- `status`: "Inativo"
- `dataTermino`: null

---

## 📝 Manutenção

### Atualizar Processos Existentes

```javascript
// Método 1: Via Console
const processos = JSON.parse(localStorage.getItem('processos-negocio'));
// ... fazer alterações ...
localStorage.setItem('processos-negocio', JSON.stringify(processos));
location.reload();
```

```bash
# Método 2: Editar arquivo e recarregar
vim scripts/carga-processos-browser.js
# Cole o conteúdo atualizado no Console do navegador
```

### Limpar Dados

```javascript
// Remover todos os processos
localStorage.removeItem('processos-negocio');
location.reload();
```

### Backup de Dados

```javascript
// Criar backup
const backup = localStorage.getItem('processos-negocio');
console.log('BACKUP:', backup);
// Copie e salve em um arquivo

// Restaurar backup
const dadosBackup = '...'; // Cole os dados aqui
localStorage.setItem('processos-negocio', dadosBackup);
location.reload();
```

---

## ✅ Validações

O script valida:
1. ✓ Formato da sigla: AAAA-00000
2. ✓ Descrição com até 50 caracteres
3. ✓ Área responsável preenchida
4. ✓ Duração média > 0
5. ✓ Tipo de norma válido
6. ✓ Status da norma válido
7. ✓ Formato de datas (YYYY-MM-DD)

---

## 🆘 Troubleshooting

### Erro: Dados não aparecem após reload

```javascript
// Verificar se os dados foram salvos
console.log(localStorage.getItem('processos-negocio'));

// Se retornar null, execute o script novamente
```

### Erro: Console não aceita o script

1. Certifique-se de copiar TODO o conteúdo do arquivo
2. Cole em uma única operação no Console
3. Pressione Enter apenas UMA vez

### Erro: Dados duplicados

```javascript
// Limpar dados existentes antes de carregar
localStorage.removeItem('processos-negocio');

// Executar o script de carga novamente
```

### Visualizar estrutura dos dados

```javascript
const processos = JSON.parse(localStorage.getItem('processos-negocio'));
console.log('Total de processos:', processos.length);
console.log('Primeiro processo:', processos[0]);
console.log('Estrutura completa:', processos);
```

---

## 📚 Referências

- [ISO 9001:2015 - Gestão da Qualidade](https://www.iso.org/iso-9001-quality-management.html)
- [ISO/IEC 27001 - Segurança da Informação](https://www.iso.org/isoiec-27001-information-security.html)
- [GDPR - Regulamento Geral de Proteção de Dados](https://gdpr.eu/)
- [Basel III - BIS](https://www.bis.org/bcbs/basel3.htm)
- [IFRS Standards](https://www.ifrs.org/)
- [Normas Regulamentadoras - MTE](https://www.gov.br/trabalho-e-previdencia/pt-br/composicao/orgaos-especificos/secretaria-de-trabalho/inspecao/seguranca-e-saude-no-trabalho/normas-regulamentadoras)
- [ABNT - Catálogo de Normas](https://www.abnt.org.br/)
