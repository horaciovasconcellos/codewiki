# 📄 Funcionalidade de PRD (Product Requirements Document)

## 📋 Visão Geral

A funcionalidade de PRD permite que você carregue um **Product Requirements Document** em formato Markdown diretamente no formulário de **Novo Projeto SDD**. Os requisitos serão automaticamente extraídos e vinculados à tabela `requisitos_sdd`.

## ✨ Características

### 1. Upload de PRD
- Suporte a arquivos Markdown (`.md` ou `.markdown`)
- Tamanho máximo: **2MB**
- Editor integrado com preview
- Possibilidade de colar ou digitar diretamente

### 2. Extração Automática de Requisitos
- Parser inteligente de Markdown
- Identifica requisitos em listas
- Captura seção/contexto do requisito
- Geração automática de sequência (REQ-001, REQ-002, etc.)

### 3. Rastreabilidade
- Campo `origem_prd`: indica que o requisito veio do PRD
- Campo `secao_prd`: armazena a seção do PRD onde o requisito foi extraído
- Vinculação automática ao projeto

## 🚀 Como Usar

### Passo 1: Carregar o PRD

1. Acesse **Documentação SDD** → **Novo Projeto**
2. Preencha os campos básicos (Nome, IA, etc.)
3. Na seção **PRD (Product Requirements Document)**:
   - Clique em **"Anexar PRD (.md)"** para fazer upload de um arquivo
   - OU cole/digite o conteúdo diretamente no editor

### Passo 2: Estruturar o PRD

Para melhor extração, estruture seu PRD assim:

```markdown
# Product Requirements Document

## 1. REQUISITOS FUNCIONAIS

### RF001 - Gestão de Políticas de Viagem

#### RF001.1 - Criação de Política
**Descrição:** O sistema deve permitir que administradores criem políticas de viagem.

**Critérios de Aceitação:**
- O sistema deve permitir nomear e descrever a política
- O sistema deve permitir definir critérios de aplicação
- O sistema deve validar dados de entrada

**Prioridade:** Alta

#### RF001.2 - Edição de Política
**Descrição:** O sistema deve permitir que administradores editem políticas existentes.

**Prioridade:** Média

### RF002 - Autenticação de Usuários

#### RF002.1 - Login
**Descrição:** O sistema deve autenticar usuários via SSO.

**Prioridade:** Alta

## 2. REQUISITOS NÃO-FUNCIONAIS

### RNF001 - Performance

#### RNF001.1 - Tempo de Resposta
**Descrição:** O sistema deve responder rapidamente às ações do usuário.

**Critérios:**
- Operações comuns: < 2 segundos
- APIs: < 1 segundo

**Prioridade:** Alta
```

### Passo 3: Extrair Requisitos

1. Após salvar o projeto, acesse o **Detalhe do Projeto**
2. Na seção **PRD**, clique em **"Extrair Requisitos do PRD"**
3. Os requisitos serão automaticamente:
   - Criados na tabela `requisitos_sdd`
   - Vinculados ao projeto
   - Marcados como `origem_prd = TRUE`
   - Associados à seção do PRD de origem

## 📊 Estrutura do Banco de Dados

### Tabela: `projetos_sdd`
```sql
ALTER TABLE projetos_sdd 
ADD COLUMN prd_content LONGTEXT COMMENT 'Conteúdo do PRD em formato Markdown';
```

### Tabela: `requisitos_sdd`
```sql
ALTER TABLE requisitos_sdd 
ADD COLUMN origem_prd BOOLEAN DEFAULT FALSE COMMENT 'Indica se o requisito veio do PRD',
ADD COLUMN secao_prd VARCHAR(255) COMMENT 'Seção do PRD de onde o requisito foi extraído';
```

## 🔌 API Endpoints

### POST `/api/sdd/projetos/:id/extrair-requisitos-prd`

Extrai requisitos do PRD de um projeto.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "requisitosExtraidos": 15,
  "requisitos": [
    {
      "id": "uuid",
      "sequencia": "REQ-001",
      "nome": "O sistema deve permitir login de usuários",
      "secao": "Requisitos Funcionais"
    }
  ]
}
```

## 🎯 Padrões de Extração

O parser identifica requisitos nos seguintes formatos hierárquicos:

### 1. **Requisitos Principais (Header Nível 3):**
```markdown
### RF001 - Gestão de Políticas de Viagem
### RNF002 - Performance e Escalabilidade
### RD001 - Integridade de Dados
```
**Formato:** `### [CODIGO] - [Nome do Requisito]`

### 2. **Subtarefas/Requisitos Detalhados (Header Nível 4):**
```markdown
#### RF001.1 - Criação de Política
#### RF001.2 - Edição de Política
#### RNF002.1 - Tempo de Resposta
```
**Formato:** `#### [CODIGO.NUMERO] - [Nome da Tarefa]`

### 3. **Metadados Capturados:**
```markdown
**Descrição:** Texto da descrição do requisito

**Critérios de Aceitação:**
- Critério 1
- Critério 2
- Critério 3

**Prioridade:** Alta/Média/Baixa
```

### 4. **Exemplo Completo:**
```markdown
### RF001 - Autenticação

#### RF001.1 - Login SSO
**Descrição:** O sistema deve autenticar via SSO corporativo.

**Critérios de Aceitação:**
- Integração com SAML 2.0
- Timeout de sessão 60 minutos
- Suporte a MFA

**Prioridade:** Alta
**Complexidade:** Média
```

## 💡 Dicas e Boas Práticas

1. **Estruture por seções**: Use headers (# ## ###) para organizar requisitos
2. **Use listas**: Requisitos em formato de lista são melhor detectados
3. **Seja descritivo**: Linhas com menos de 20 caracteres são ignoradas
4. **Revise após extração**: Sempre revise os requisitos extraídos
5. **Use prefixos**: RF, RNF, REQ ajudam na identificação

## 🔍 Exemplo Completo

### PRD Exemplo:
```markdown
# Sistema de E-commerce

## 1. REQUISITOS FUNCIONAIS

### RF001 - Carrinho de Compras

#### RF001.1 - Adicionar Produto
**Descrição:** O usuário deve poder adicionar produtos ao carrinho.

**Critérios de Aceitação:**
- Validar disponibilidade em estoque
- Atualizar contador do carrinho
- Exibir mensagem de confirmação

**Prioridade:** Alta

#### RF001.2 - Calcular Total
**Descrição:** O sistema deve calcular o valor total automaticamente.

**Prioridade:** Alta

#### RF001.3 - Remover Item
**Descrição:** O usuário deve poder remover itens do carrinho.

**Prioridade:** Média

### RF002 - Pagamento

#### RF002.1 - Processar Cartão
**Descrição:** O sistema deve aceitar cartões de crédito.

**Prioridade:** Alta

#### RF002.2 - Gerar Nota Fiscal
**Descrição:** O sistema deve gerar nota fiscal automaticamente.

**Prioridade:** Alta

## 2. REQUISITOS NÃO-FUNCIONAIS

### RNF001 - Performance

#### RNF001.1 - Tempo de Resposta
**Descrição:** Tempo de resposta inferior a 2s.

**Prioridade:** Alta

#### RNF001.2 - Disponibilidade
**Descrição:** Disponibilidade de 99.9%.

**Prioridade:** Alta
```

### Resultado da Extração:
- ✅ **9 requisitos criados** (2 principais + 7 subtarefas)
- ✅ Sequências: REQ-001 a REQ-009
- ✅ Hierarquia preservada:
  - RF001 - Carrinho de Compras
    - RF001.1 - Adicionar Produto
    - RF001.2 - Calcular Total
    - RF001.3 - Remover Item
  - RF002 - Pagamento
    - RF002.1 - Processar Cartão
    - RF002.2 - Gerar Nota Fiscal
  - RNF001 - Performance
    - RNF001.1 - Tempo de Resposta
    - RNF001.2 - Disponibilidade
- ✅ Status inicial: BACKLOG
- ✅ Descrições e critérios capturados
- ✅ Prioridade incluída na descrição
- ✅ Marcados como origem_prd = TRUE

## 🛠️ Troubleshooting

### Requisitos não foram extraídos
- Verifique se está usando listas (- ou *)
- Certifique-se de que as linhas têm mais de 20 caracteres
- Confira se o PRD foi salvo corretamente

### Muitos requisitos extraídos
- O parser pode pegar linhas que não são requisitos
- Revise e delete os que não são relevantes
- Refine a estrutura do PRD para melhor detecção

### Seção não capturada
- Use headers markdown (# ## ###) para definir seções
- Coloque os headers antes dos requisitos relacionados

## 📚 Referências

- [Markdown Guide](https://www.markdownguide.org/)
- [Writing Good Requirements](https://www.reqview.com/doc/iso-iec-ieee-29148-requirements-engineering.html)
- [PRD Template](https://www.atlassian.com/software/confluence/templates/product-requirements-document)
