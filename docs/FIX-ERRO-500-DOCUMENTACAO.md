# Fix: Erro 500 ao Salvar Documentação

## Problema Identificado

**Data:** 17/01/2026  
**Erro:** HTTP 500 Internal Server Error ao criar/editar documentação

### Stack Trace
```
POST http://localhost:3000/api/documentacao-projetos 500 (Internal Server Error)
handleSave @ DocumentacaoProjetosView.tsx:85
handleSubmit @ DocumentacaoEditor.tsx:138

Erro ao salvar documentação: Error: Erro ao salvar documentação
```

## Causa Raiz

### 1. Campos Extras no Payload
O `DocumentacaoEditor` estava enviando campos que não devem ser controlados pelo frontend:
- `dataPublicacao` - Controlado pela API baseado no status
- `dataUltimaAtualizacao` - Timestamp automático do MySQL

**Código problemático (DocumentacaoEditor.tsx, linha 122-137):**
```typescript
const doc = {
  id: documentacao?.id,
  titulo: titulo.trim(),
  // ... outros campos
  status: status as any,
  dataPublicacao: status === 'Publicado' && !documentacao?.dataPublicacao 
    ? new Date().toISOString() 
    : documentacao?.dataPublicacao,  // ❌ Não deveria estar aqui
  dataUltimaAtualizacao: new Date().toISOString(),  // ❌ Não deveria estar aqui
};
```

### 2. Falta de Validações na API
O endpoint não validava campos obrigatórios antes de tentar inserir no banco.

### 3. Mensagens de Erro Genéricas
- Frontend: "Erro ao salvar documentação" (sem detalhes)
- Backend: "Erro ao criar documentação" (sem especificidade)

## Solução Implementada

### 1. Remover Campos Extras do Editor

**Arquivo:** `src/components/documentacao-projetos/DocumentacaoEditor.tsx`

**Antes (linhas 118-138):**
```typescript
const doc = {
  id: documentacao?.id,
  titulo: titulo.trim(),
  slug: slug.trim(),
  descricao: descricao.trim(),
  conteudo: conteudo.trim(),
  categoria: categoria as any,
  tags: tagsArray,
  versao: versao.trim(),
  autor: autor.trim(),
  aplicacaoId: aplicacaoId || undefined,
  status: status as any,
  dataPublicacao: status === 'Publicado' && !documentacao?.dataPublicacao ? new Date().toISOString() : documentacao?.dataPublicacao,
  dataUltimaAtualizacao: new Date().toISOString(),
};
```

**Depois:**
```typescript
const doc = {
  id: documentacao?.id,
  titulo: titulo.trim(),
  slug: slug.trim(),
  descricao: descricao.trim(),
  conteudo: conteudo.trim(),
  categoria: categoria as any,
  tags: tagsArray,
  versao: versao.trim(),
  autor: autor.trim(),
  aplicacaoId: aplicacaoId || undefined,
  status: status as any,
  // ✅ dataPublicacao e dataUltimaAtualizacao removidos
};
```

### 2. Adicionar Validações na API

**Arquivo:** `server/api.js` (POST /api/documentacao-projetos)

**Adicionado após linha 10370:**
```javascript
// Validações
if (!titulo || !titulo.trim()) {
  return res.status(400).json({ error: 'Título é obrigatório' });
}

if (!slug || !slug.trim()) {
  return res.status(400).json({ error: 'Slug é obrigatório' });
}

if (!conteudo || !conteudo.trim()) {
  return res.status(400).json({ error: 'Conteúdo é obrigatório' });
}

if (!autor || !autor.trim()) {
  return res.status(400).json({ error: 'Autor é obrigatório' });
}
```

### 3. Melhorar Tratamento de Erros na API

**Arquivo:** `server/api.js` (POST, linhas 10431-10443)

**Antes:**
```javascript
} catch (error) {
  console.error('Erro ao criar documentação:', error);
  res.status(500).json({ error: 'Erro ao criar documentação' });
}
```

**Depois:**
```javascript
} catch (error) {
  console.error('Erro ao criar documentação:', error);
  
  // Tratamento de erro de slug duplicado
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ 
      error: 'Já existe uma documentação com este slug',
      code: 'DUPLICATE_SLUG' 
    });
  }
  
  res.status(500).json({ 
    error: 'Erro ao criar documentação',
    message: error.message 
  });
}
```

### 4. Melhorar Mensagens de Erro no Frontend

**Arquivo:** `src/components/documentacao-projetos/DocumentacaoProjetosView.tsx` (linhas 85-105)

**Antes:**
```typescript
if (!response.ok) throw new Error('Erro ao salvar documentação');
// ...
toast.error('Não foi possível salvar a documentação');
```

**Depois:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
  console.error('Erro da API:', errorData);
  throw new Error(errorData.error || 'Erro ao salvar documentação');
}
// ...
toast.error(`Não foi possível salvar a documentação: ${(error as Error).message}`);
```

### 5. Mesmo Tratamento para PUT

Aplicadas mesmas melhorias para o endpoint PUT (atualização).

## Arquivos Modificados

### 1. `src/components/documentacao-projetos/DocumentacaoEditor.tsx`
- **Linha 122-137:** Removidos `dataPublicacao` e `dataUltimaAtualizacao`
- **Motivo:** Esses campos são gerenciados automaticamente pela API

### 2. `src/components/documentacao-projetos/DocumentacaoProjetosView.tsx`
- **Linha 88-92:** Tratamento melhorado de erro HTTP
- **Linha 103:** Mensagem de erro com detalhes
- **Motivo:** Melhor debugging e feedback ao usuário

### 3. `server/api.js`
- **POST /api/documentacao-projetos:**
  - Linhas 10371-10388: Validações de campos obrigatórios
  - Linhas 10431-10445: Tratamento de erros específicos
- **PUT /api/documentacao-projetos/:id:**
  - Linhas 10461-10478: Validações de campos obrigatórios
  - Linhas 10528-10542: Tratamento de erros específicos

## Testes de Validação

### Teste 1: Criação Normal
```bash
curl -X POST http://localhost:3000/api/documentacao-projetos \
  -H "Content-Type: application/json" \
  -d '{
    "titulo":"Teste",
    "slug":"teste",
    "descricao":"Teste",
    "conteudo":"# Teste",
    "categoria":"API",
    "tags":["teste"],
    "versao":"1.0.0",
    "autor":"Admin",
    "status":"Rascunho"
  }'
```
**Resultado:** ✅ 201 Created

### Teste 2: Título Vazio
```bash
curl -X POST http://localhost:3000/api/documentacao-projetos \
  -H "Content-Type: application/json" \
  -d '{
    "titulo":"",
    "slug":"teste",
    "conteudo":"# Teste",
    "autor":"Admin"
  }'
```
**Resultado:** ✅ 400 Bad Request - "Título é obrigatório"

### Teste 3: Slug Duplicado
```bash
# Criar primeira vez
curl -X POST ... -d '{"slug":"teste-unico",...}'

# Tentar criar novamente com mesmo slug
curl -X POST ... -d '{"slug":"teste-unico",...}'
```
**Resultado:** ✅ 400 Bad Request - "Já existe uma documentação com este slug"

### Teste 4: Campos Extras Ignorados
```bash
curl -X POST http://localhost:3000/api/documentacao-projetos \
  -H "Content-Type: application/json" \
  -d '{
    "titulo":"Teste",
    "slug":"teste-extra",
    "conteudo":"# Teste",
    "autor":"Admin",
    "dataPublicacao":"2026-01-01",
    "dataUltimaAtualizacao":"2026-01-01"
  }'
```
**Resultado:** ✅ 201 Created - Campos extras ignorados, timestamps corretos gerados

## Comportamento Correto

### Campos Controlados pela API
| Campo | Quem Define | Como |
|-------|-------------|------|
| `id` | API | UUID gerado com `uuidv4()` |
| `dataPublicacao` | API | `new Date()` quando status = "Publicado" |
| `dataUltimaAtualizacao` | MySQL | `CURRENT_TIMESTAMP` automático |
| `createdAt` | MySQL | `CURRENT_TIMESTAMP` na criação |
| `updatedAt` | MySQL | `ON UPDATE CURRENT_TIMESTAMP` |

### Campos Enviados pelo Frontend
- `titulo` (obrigatório)
- `slug` (obrigatório, único)
- `descricao` (opcional)
- `conteudo` (obrigatório)
- `categoria` (enum)
- `tags` (array)
- `versao` (string)
- `autor` (obrigatório)
- `aplicacaoId` (opcional, FK)
- `status` (enum)

## Mensagens de Erro Possíveis

### Frontend
- ✅ "Título é obrigatório"
- ✅ "Slug é obrigatório"
- ✅ "Conteúdo é obrigatório"
- ✅ "Autor é obrigatório"
- ✅ "Já existe uma documentação com este slug"
- ✅ "Documentação não encontrada" (PUT)
- ✅ "Erro ao criar/atualizar documentação: [detalhes]"

### Backend (Console)
```
Erro ao criar documentação: Error: ...
  (stack trace completo)
```

## Impacto

### Performance
- ✅ Sem impacto - Validações são O(1)
- ✅ Redução de queries desnecessárias (validação antes de INSERT)

### Segurança
- ✅ Validação de entrada previne SQL injection indireto
- ✅ Timestamps confiáveis (não manipuláveis pelo cliente)

### Usabilidade
- ✅ Mensagens de erro claras e específicas
- ✅ Usuário sabe exatamente o que corrigir

## Prevenção de Regressão

### 1. Testes Automatizados (Recomendado)
```typescript
describe('DocumentacaoEditor', () => {
  it('não deve enviar dataPublicacao no payload', () => {
    // Mock onSave
    const mockSave = jest.fn();
    
    // Preencher form e submeter
    // ...
    
    // Verificar payload
    expect(mockSave).toHaveBeenCalledWith(
      expect.not.objectContaining({
        dataPublicacao: expect.anything(),
        dataUltimaAtualizacao: expect.anything()
      })
    );
  });
});
```

### 2. Code Review Checklist
- [ ] Campos automáticos não enviados pelo frontend
- [ ] Validações de entrada na API
- [ ] Mensagens de erro específicas
- [ ] Timestamps gerenciados pelo banco

### 3. Documentação
- Atualizar README com estrutura de payload
- Documentar campos automáticos
- Exemplos de erros comuns

## Referências

- [Documentação MySQL TIMESTAMP](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**Status:** ✅ Resolvido  
**Data do Fix:** 17/01/2026  
**Testado:** Chrome 120, API via curl
