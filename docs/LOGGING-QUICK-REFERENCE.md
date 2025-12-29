# 🎯 Quick Reference - Sistema de Logging

## ✅ Status: IMPLEMENTADO E OPERACIONAL

---

## 🚀 Como Adicionar Logging (Copy & Paste)

### Template Básico
```typescript
// 1. Import
import { useLogging } from '@/hooks/use-logging';

// 2. No início do componente
export function MeuComponente() {
  const { logClick, logEvent, logError } = useLogging('meu-componente');
  
  // 3. Em botões
  const handleClick = () => {
    logClick('button_clicked', { button_id: 'submit' });
    // ... ação
  };
  
  // 4. Em API calls
  const fetchData = async () => {
    try {
      logEvent('api_call_start', 'api_call');
      const response = await fetch('/api/data');
      const data = await response.json();
      logEvent('api_call_success', 'api_call', { count: data.length });
    } catch (error) {
      logError(error as Error, 'api_call_error');
    }
  };
  
  // ... resto do componente
}
```

---

## 📋 Tipos de EventType Disponíveis

```typescript
'click'        // Cliques em botões, links
'navigation'   // Mudanças de tela/rota
'load'         // Carregamento de dados
'error'        // Erros e exceções
'input'        // Digitação, formulários
'api_call'     // Início de chamada API
'api_response' // Resposta de API (sucesso ou erro)
```

---

## 💡 Exemplos Práticos

### Botão de Criar
```typescript
<Button onClick={() => {
  logClick('create_button');
  handleCreate();
}}>
  Criar Novo
</Button>
```

### Botão de Editar com Contexto
```typescript
const handleEdit = (id: string) => {
  logClick('edit_button', { item_id: id });
  // ... lógica
};
```

### Fetch com Logging
```typescript
const loadItems = async () => {
  try {
    logEvent('load_items_start', 'api_call');
    const response = await fetch('/api/items');
    const data = await response.json();
    logEvent('load_items_success', 'api_call', { count: data.length });
    setItems(data);
  } catch (error) {
    logError(error as Error, 'load_items_error');
    toast.error('Erro ao carregar');
  }
};
```

### Formulário Submit
```typescript
const handleSubmit = async (formData: any) => {
  try {
    logClick('form_submit', { form_type: 'create' });
    const response = await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    logEvent('item_created', 'api_response', { item_id: response.id });
    toast.success('Criado com sucesso');
  } catch (error) {
    logError(error as Error, 'create_error', { form_type: 'create' });
  }
};
```

### Delete com Confirmação
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Tem certeza?')) return;
  
  logClick('delete_confirmed', { item_id: id });
  try {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    logEvent('item_deleted', 'api_response', { item_id: id });
    toast.success('Deletado');
  } catch (error) {
    logError(error as Error, 'delete_error', { item_id: id });
  }
};
```

---

## 🎨 Padrões de Nomenclatura

### Nome do Hook
```typescript
// View: nome-do-arquivo-view
useLogging('servidores-view')
useLogging('aplicacoes-view')

// Wizard: nome-do-arquivo-wizard  
useLogging('reportbook-wizard')
useLogging('pipeline-wizard')

// Form: nome-do-arquivo-form
useLogging('habilidade-form')
```

### Nome de Eventos
```typescript
// Botões: verbo_substantivo
'create_button', 'edit_button', 'delete_button'

// Operações: operacao_status
'fetch_start', 'fetch_success', 'save_complete'

// Ações: acao_executada
'item_created', 'data_imported', 'report_generated'
```

---

## 🔍 Ver Logs na Interface

1. Ir para **Observabilidade > Logs e Traces**
2. Filtrar por:
   - Tela: `reportbook-view`
   - Tipo: `click` ou `api_call`
   - Período: últimas 24h
3. Clicar em um log para ver detalhes

---

## 🛠️ Script Automático

### Executar
```bash
python3 scripts/add-logging.py
```

### O que faz
- ✅ Adiciona import do useLogging
- ✅ Inicializa o hook
- ✅ Adiciona logEvent em fetch
- ✅ Adiciona logError em catch
- ✅ Preserva código existente

---

## ✅ Checklist para Novo Componente

- [ ] Import do useLogging adicionado
- [ ] Hook inicializado com nome correto
- [ ] Botões principais têm logClick
- [ ] API calls têm logEvent (start/success)
- [ ] Blocos catch têm logError
- [ ] Build passa sem erros TypeScript

---

## 📊 Atributos Úteis

```typescript
// Para IDs
{ item_id: '123', report_id: 'abc' }

// Para contadores
{ count: 10, columns_count: 5 }

// Para status
{ is_new: true, status: 'active' }

// Para erros
{ error_code: 500, operation: 'fetch' }

// Para uploads
{ file_name: 'data.csv', file_size: 1024 }
```

---

## 🚨 Erros Comuns

### ❌ EventType inválido
```typescript
// ERRADO
logEvent('item_created', 'action');

// CERTO
logEvent('item_created', 'api_response');
```

### ❌ Esquecer logError
```typescript
// ERRADO
catch (error) {
  console.error(error);
}

// CERTO
catch (error) {
  logError(error as Error, 'operation_error');
  console.error(error);
}
```

### ❌ Nome do hook sem hífen
```typescript
// ERRADO
useLogging('ServidoresView')

// CERTO
useLogging('servidores-view')
```

---

## 📚 Documentos Completos

- `LOGGING-AUDIT-REPORT.md` - Análise detalhada
- `LOGGING-IMPLEMENTATION-COMPLETE.md` - Guia completo
- `LOGGING-SUCCESS-SUMMARY.md` - Resumo executivo

---

## 💬 Exemplos Reais do Projeto

Ver implementação completa em:
- `src/components/reportbook/ReportBookView.tsx`
- `src/components/reportbook/ReportBookWizard.tsx`
- `src/components/reportbook/SimilarityAnalyzer.tsx`

---

**Dúvidas?** Consulte os componentes acima como referência! 🚀
