# 🔍 DEBUG: Erro 500 ao Criar Documentação

## ✅ Verificações Realizadas

### 1. API Backend está funcionando
```bash
curl -X POST http://localhost:3000/api/documentacao-projetos \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Teste","slug":"teste-curl","descricao":"Desc","conteudo":"Conteudo","categoria":"Outros","tags":[],"versao":"1.0.0","autor":"Sistema","status":"Rascunho"}'

# ✅ RESULTADO: Sucesso!
# {"id":"dc496395...","titulo":"Teste",...}
```

**Conclusão:** A API está rodando e funciona corretamente via curl.

### 2. Problema está nos dados do Frontend

O erro acontece especificamente quando o **formulário do frontend** envia os dados.

## 🔎 Próximos Passos de Debug

### 1️⃣ Verificar Console do Navegador

Após a próxima tentativa de criar documentação, procure no console por:

```
📤 Dados sendo enviados: {
  "titulo": "...",
  "slug": "...",
  ...
}
```

**O que verificar:**
- [ ] Todos os campos obrigatórios estão presentes?
- [ ] `aplicacaoId` está como `null` ou `undefined`? (ambos são válidos)
- [ ] `tags` está como array `[]`?
- [ ] Algum campo tem valor `undefined` ou `null` que não deveria?

### 2️⃣ Campos Esperados pelo Servidor

```javascript
// OBRIGATÓRIOS (validados pelo servidor)
titulo: string (não vazio)
slug: string (não vazio)
conteudo: string (não vazio)
autor: string (não vazio)

// OPCIONAIS
descricao: string | null
categoria: enum | null
tags: array | null
versao: string (default: "1.0.0")
aplicacaoId: string | null
status: enum (default: "Rascunho")
```

### 3️⃣ Possíveis Causas do Erro

#### A. Campo com valor inválido
```javascript
// ❌ PROBLEMA
{
  "titulo": "",  // String vazia
  "slug": "   ", // Apenas espaços
  "autor": undefined  // undefined ao invés de string
}
```

#### B. Campo extra não esperado
```javascript
// ❌ PROBLEMA
{
  "titulo": "Teste",
  "slug": "teste",
  "aplicacao": "CodeWiki",  // <-- Deveria ser "aplicacaoId"
  ...
}
```

#### C. Tipo de dado incorreto
```javascript
// ❌ PROBLEMA
{
  "titulo": "Teste",
  "tags": "tag1,tag2",  // <-- String ao invés de array
  ...
}
```

## 🛠️ Como Testar Manualmente

### Teste 1: Dados Mínimos
No console do navegador (F12):

```javascript
fetch('http://localhost:3000/api/documentacao-projetos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    titulo: 'Teste Manual',
    slug: 'teste-manual-browser',
    conteudo: 'Conteúdo teste',
    autor: 'Sistema'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Sucesso:', data))
.catch(err => console.error('❌ Erro:', err));
```

**Se funcionar:** O problema está em algum campo adicional enviado pelo formulário.

### Teste 2: Dados Completos
```javascript
fetch('http://localhost:3000/api/documentacao-projetos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    titulo: 'Teste Completo',
    slug: 'teste-completo-browser',
    descricao: 'Descrição de teste',
    conteudo: '# Conteúdo\n\nTeste de conteúdo',
    categoria: 'Outros',
    tags: ['teste', 'debug'],
    versao: '1.0.0',
    autor: 'Sistema',
    aplicacaoId: null,
    status: 'Rascunho'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Sucesso:', data))
.catch(err => console.error('❌ Erro:', err));
```

## 📋 Checklist de Verificação

Quando o erro ocorrer novamente:

- [ ] **Console do navegador aberto** (F12)
- [ ] **Aba "Console" selecionada**
- [ ] **Procurar mensagem "📤 Dados sendo enviados:"**
- [ ] **Copiar JSON completo dos dados**
- [ ] **Verificar cada campo contra a lista de campos esperados**
- [ ] **Procurar por valores `undefined`, `null` inesperados, ou strings vazias**

## 🔄 Comparação: Funcionou vs Não Funcionou

### ✅ Curl (Funcionou)
```json
{
  "titulo": "Teste",
  "slug": "teste-curl",
  "descricao": "Desc",
  "conteudo": "Conteudo",
  "categoria": "Outros",
  "tags": [],
  "versao": "1.0.0",
  "autor": "Sistema",
  "status": "Rascunho"
}
```

### ❌ Frontend (Erro 500)
```json
{
  // O JSON será exibido no console com 📤
  // Comparar com o que funcionou acima
}
```

## 🎯 Próxima Ação

1. **Tente criar uma documentação novamente**
2. **Abra o console do navegador (F12)**
3. **Copie o JSON que aparece após "📤 Dados sendo enviados:"**
4. **Compare com o JSON que funcionou no curl**
5. **Identifique diferenças**

## 💡 Dicas

### Verificar se `aplicacaoId` está undefined
```javascript
// No código DocumentacaoEditor.tsx, linha ~130
aplicacaoId: aplicacaoId || undefined,  // ✅ Correto
aplicacaoId: aplicacaoId,               // ⚠️ Pode ser undefined
```

### Verificar se tags está como array
```javascript
// No código DocumentacaoEditor.tsx, linha ~125
const tagsArray = tags
  .split(',')
  .map(t => t.trim())
  .filter(t => t.length > 0);

tags: tagsArray,  // ✅ Deve ser array
```

### Verificar campos trim()
```javascript
// No código DocumentacaoEditor.tsx
titulo: titulo.trim(),     // ✅ Remove espaços
slug: slug.trim(),         // ✅ Remove espaços
conteudo: conteudo.trim(), // ✅ Remove espaços
autor: autor.trim(),       // ✅ Remove espaços
```

## 📊 Logs do Servidor

Se tiver acesso aos logs do servidor (terminal onde rodou `node server/api.js`), procure por:

```
Erro ao criar documentação: Error: ...
Stack trace: ...
Dados recebidos: { ... }
```

Isso mostrará exatamente qual erro está acontecendo no lado do servidor.

---

**Status:** 🔍 Aguardando dados do console para identificar problema específico

**Ferramenta adicionada:** Log `📤 Dados sendo enviados` no frontend
