# 📄 Impressão com Cabeçalho Tabular

## 📋 Visão Geral

A funcionalidade de impressão agora inclui um **cabeçalho tabular** com informações do documento antes do conteúdo em Markdown.

## 🎯 Estrutura da Impressão

```
┌─────────────────────────────────────┐
│     TÍTULO DO DOCUMENTO (grande)    │
├─────────────────────────────────────┤
│  TABELA DE INFORMAÇÕES              │
│  ┌───────────────┬─────────────┐    │
│  │ Título:       │ Valor       │    │
│  │ Descrição:    │ Valor       │    │
│  │ Categoria:    │ Valor       │    │
│  │ Status:       │ Valor       │    │
│  │ Versão:       │ Valor       │    │
│  │ Autor:        │ Valor       │    │
│  │ Aplicação:    │ Valor       │    │
│  │ Tags:         │ Valor       │    │
│  └───────────────┴─────────────┘    │
├─────────────────────────────────────┤
│     LINHA DIVISÓRIA                 │
├─────────────────────────────────────┤
│  CONTEÚDO MARKDOWN                  │
│  - Títulos formatados               │
│  - Parágrafos                       │
│  - Listas                           │
│  - Código                           │
│  - Tabelas                          │
│  - etc.                             │
└─────────────────────────────────────┘
```

## 🛠️ Implementação

### Campos do Cabeçalho

| Campo | Descrição | Fallback |
|-------|-----------|----------|
| **Título** | doc.titulo | '-' |
| **Descrição** | doc.descricao | '-' |
| **Categoria** | doc.categoria | '-' |
| **Status** | doc.status | '-' |
| **Versão** | doc.versao | '-' |
| **Autor** | doc.autor | '-' |
| **Aplicação** | doc.aplicacao | '-' |
| **Tags** | doc.tags.join(', ') | 'Sem tags' |

### Estrutura HTML Gerada

```html
<div id="print-window" class="print-only">
  <!-- Cabeçalho -->
  <div class="print-header">
    <h1 class="print-title">TÍTULO DO DOCUMENTO</h1>
    
    <table class="info-table">
      <tbody>
        <tr>
          <th>Título:</th>
          <td>Valor do título</td>
        </tr>
        <!-- Demais campos... -->
      </tbody>
    </table>
  </div>
  
  <!-- Divisória -->
  <div class="print-divider"></div>
  
  <!-- Conteúdo Markdown -->
  <div class="print-content-body">
    <!-- HTML do conteúdo -->
  </div>
</div>
```

## 🎨 Estilização CSS

### Cabeçalho Principal

```css
.print-title {
  font-size: 28pt !important;
  font-weight: bold !important;
  text-align: center !important;
  border-bottom: 3pt solid #333 !important;
  padding-bottom: 8pt !important;
  margin-bottom: 15pt !important;
}
```

### Tabela de Informações

```css
.info-table {
  width: 100% !important;
  border-collapse: collapse !important;
  font-size: 11pt !important;
}

.info-table th {
  width: 25% !important;
  text-align: left !important;
  padding: 8pt 12pt !important;
  background: #f0f0f0 !important;
  border: 1pt solid #999 !important;
  font-weight: bold !important;
}

.info-table td {
  padding: 8pt 12pt !important;
  border: 1pt solid #ccc !important;
}

.info-table tr:nth-child(even) {
  background: #fafafa !important; /* Zebra striping */
}
```

### Linha Divisória

```css
.print-divider {
  height: 2pt !important;
  background: #333 !important;
  margin: 20pt 0 !important;
  border: none !important;
}
```

### Corpo do Conteúdo

```css
.print-content-body {
  margin-top: 15pt !important;
}

/* Títulos, parágrafos, listas, etc. mantêm formatação padrão */
```

## 🧪 Como Testar

### 1. Teste HTML Standalone

```bash
# Abrir no navegador
open http://localhost:3000/test-print.html
```

**O que verificar:**
- ✅ Cabeçalho "Guia de Teste de Impressão" centralizado e grande
- ✅ Tabela com 8 linhas de informação (zebrada)
- ✅ Linha divisória grossa após tabela
- ✅ Conteúdo formatado abaixo

### 2. Teste na Aplicação

1. Acessar "Documentação de Projetos"
2. Clicar no ícone 🖨️ em qualquer documento
3. Verificar preview de impressão

**Resultado esperado:**

```
┌────────────────────────────────────┐
│   Nome do Seu Documento (grande)   │
├────────────────────────────────────┤
│ Título:       | Nome do Seu Doc    │
│ Descrição:    | Descrição aqui     │
│ Categoria:    | Backend            │
│ Status:       | Ativo              │
│ Versão:       | 1.0                │
│ Autor:        | João Silva         │
│ Aplicação:    | CodeWiki API       │
│ Tags:         | api, backend, node │
├────────────────────────────────────┤
│ ════════════════════════════════   │
├────────────────────────────────────┤
│ ## Introdução                      │
│ Este documento descreve...         │
│                                    │
│ ## Arquitetura                     │
│ ...                                │
└────────────────────────────────────┘
```

## 📊 Formatação por Tipo de Campo

### Tags

```typescript
// Se houver tags
const tagsFormatadas = doc.tags.join(', ');
// Resultado: "api, backend, node"

// Se não houver tags
const tagsFormatadas = 'Sem tags';
```

### Campos Vazios

Todos os campos usam fallback `'-'` se estiverem vazios:

```html
<td>${doc.categoria || '-'}</td>
```

## 🔍 Seletor CSS Importante

Para evitar conflito entre **tabela de cabeçalho** e **tabelas do conteúdo**:

```css
/* Tabela de cabeçalho - estilo específico */
.info-table th {
  background: #f0f0f0 !important;
  width: 25% !important;
}

/* Tabelas do conteúdo Markdown - estilo diferente */
.print-content-body table:not(.info-table) {
  /* Estilo padrão de tabelas */
}

.print-content-body th:not(.info-table th) {
  background: #e0e0e0 !important;
  width: auto !important;
}
```

O seletor `:not(.info-table)` garante que as tabelas do Markdown não herdem o estilo do cabeçalho.

## ✅ Checklist de Validação

- [ ] **Cabeçalho visível no PDF**
  - [ ] Título grande e centralizado
  - [ ] Borda inferior no título
  
- [ ] **Tabela de informações formatada**
  - [ ] 8 linhas (Título → Tags)
  - [ ] Coluna da esquerda com 25% de largura
  - [ ] Células com fundo cinza claro (zebra striping)
  - [ ] Bordas visíveis
  
- [ ] **Linha divisória presente**
  - [ ] Linha grossa entre cabeçalho e conteúdo
  - [ ] Cor escura (#333)
  
- [ ] **Conteúdo Markdown formatado**
  - [ ] Títulos hierárquicos (h1, h2, h3)
  - [ ] Listas com bullets/números
  - [ ] Código com fundo cinza
  - [ ] Tabelas do conteúdo diferentes da tabela de cabeçalho
  
- [ ] **Sem elementos de UI**
  - [ ] Sem botões
  - [ ] Sem sidebars
  - [ ] Sem headers da aplicação

## 🐛 Troubleshooting

### Problema: Tabela de cabeçalho não aparece

**Diagnóstico:**
```javascript
console.log('Tags:', doc.tags); // Verificar se existe
console.log('HTML:', printWindow.innerHTML); // Ver HTML gerado
```

**Solução:**
- Verificar se todos os campos do documento existem no banco
- Verificar se `info-table` tem estilos CSS corretos

### Problema: Tabelas do conteúdo com estilo do cabeçalho

**Causa:** Seletores CSS conflitantes

**Solução:**
Usar `:not(.info-table)` em todos os seletores de tabela do conteúdo:

```css
/* ❌ ERRADO - afeta todas as tabelas */
.print-only table { ... }

/* ✅ CORRETO - exclui tabela de cabeçalho */
.print-only table:not(.info-table) { ... }
```

### Problema: Campos vazios aparecem como "undefined"

**Causa:** Operador `||` não funcionando corretamente

**Solução:**
```javascript
// ❌ ERRADO
<td>${doc.categoria}</td>

// ✅ CORRETO
<td>${doc.categoria || '-'}</td>
```

### Problema: Tags não formatadas

**Causa:** `doc.tags` é array mas não foi convertido para string

**Solução:**
```javascript
const tagsFormatadas = doc.tags && doc.tags.length > 0 
  ? doc.tags.join(', ') 
  : 'Sem tags';
```

## 📁 Arquivos Modificados

- ✅ `DocumentacaoProjetosView.tsx` - Função `handlePrint()` atualizada
- ✅ `DocumentacaoProjetosView.tsx` - CSS `@media print` atualizado
- ✅ `test-print.html` - Exemplo standalone atualizado

## 🎯 Próximas Melhorias (Opcional)

1. **Data de criação/modificação** no cabeçalho
2. **Logo da empresa** no topo
3. **Rodapé** com número de páginas
4. **Índice automático** para documentos longos
5. **QR Code** com link para documento online

## 📚 Referências

- [CSS @media print](https://developer.mozilla.org/en-US/docs/Web/CSS/@media)
- [CSS :not() selector](https://developer.mozilla.org/en-US/docs/Web/CSS/:not)
- [HTML Table Best Practices](https://www.w3.org/WAI/tutorials/tables/)

---

**Status:** ✅ Implementado e pronto para testes

**Última atualização:** 17/01/2026
