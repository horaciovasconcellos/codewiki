# 🐛 Debug - Squads Não Aparecem no Review

## 🔍 Diagnóstico Passo a Passo

### 1️⃣ Abrir Console do Navegador
1. Pressione `F12` ou `Cmd+Option+I` (Mac)
2. Vá para aba **Console**
3. Limpe o console: botão 🚫 ou `Ctrl+L`

### 2️⃣ Adicionar Squad e Verificar Logs

**Ao adicionar um squad no Step 3, você deve ver:**

```
[StepSquads] Salvando: { assoc: {...}, editing: false }
[StepSquads] Estado atual antes de salvar: 0 squads
[StepSquads] Adicionando: [{...}]
[StepSquads] Total após adição: 1
```

**Se NÃO aparecer** → Problema no componente StepSquads

### 3️⃣ Avançar para Step 14 (Review)

**Verifique se o Review recebeu os squads:**

```
[StepReview] Recebendo squads: X
```

**Se receber 0** → Problema na passagem de props

### 4️⃣ Salvar Aplicação e Verificar Payload

**Na aba Network do DevTools:**
1. Vá para aba **Network** / **Rede**
2. Filtrar por `aplicacoes`
3. Salvar a aplicação
4. Clicar na requisição POST ou PUT
5. Ver **Payload** / **Carga útil**

**Deve conter:**
```json
{
  "sigla": "...",
  "squads": [
    {
      "id": "...",
      "colaboradorId": "...",
      "perfil": "...",
      "squad": "...",
      "dataInicio": "2025-01-14",
      "status": "Ativo"
    }
  ]
}
```

**Se `squads` não estiver no payload ou estiver vazio** → Problema no AplicacaoWizard

### 5️⃣ Verificar Logs do Backend

**Abra um terminal e execute:**

```bash
cd /Users/horaciovasconcellos/repositorio/codewiki
tail -f nohup.out | grep -i squad
```

**Ao salvar, deve aparecer:**

```
[API POST /aplicacoes] Salvando Squads: 1
[API POST /aplicacoes] Squad salvo: <id> <perfil> <squad>
```

**Se NÃO aparecer** → Backend não está recebendo os dados

### 6️⃣ Verificar Banco de Dados

**Execute:**

```bash
node test-squads.cjs
```

**Deve mostrar:**
```
Total de aplicações com squads: 1
Total de colaboradores em squads: 1
Total de associações: X
Associações ativas: X
```

**Se mostrar 0** → Dados não foram salvos no banco

---

## 🎯 Checklist de Problemas Comuns

### ❌ Squads não aparecem na lista do Step 3

**Causa**: `setSquadsAssociadas` não está atualizando o state

**Solução**:
1. Verificar console: logs `[StepSquads] Adicionando:`
2. Verificar se `toast.success('Squad adicionado')` aparece
3. Recarregar a página e tentar novamente

### ❌ Squads somem ao avançar para outro step

**Causa**: State não está sendo mantido no AplicacaoWizard

**Solução**:
1. Verificar se `squadsAssociadas` é um `useState` no AplicacaoWizard
2. Verificar se o StepSquads recebe `setSquadsAssociadas` como prop

### ❌ Squads não aparecem no Review

**Possíveis causas**:

1. **Props não passados para StepReview**
   - Verificar se `AplicacaoWizard` passa `squadsAssociadas` e `colaboradores`
   - Código correto:
   ```tsx
   <StepReview
     squadsAssociadas={squadsAssociadas}
     colaboradores={colaboradores}
     ...
   />
   ```

2. **StepReview não está renderizando**
   - Verificar console: deve ter log com squads recebidos
   - Adicionar log temporário no início do StepReview:
   ```tsx
   console.log('[StepReview] Props recebidas:', { 
     squadsLength: squadsAssociadas?.length,
     colaboradoresLength: colaboradores?.length
   });
   ```

3. **Filtro de status**
   - Verificar se squads têm `status: 'Ativo'`
   - Código filtra por: `squadsAssociadas.filter(s => s.status === 'Ativo')`

### ❌ Squads não são salvos no banco

**Possíveis causas**:

1. **Payload não inclui squads**
   - Verificar Network tab
   - Verificar log: `[AplicacaoWizard] Squads detalhados:`

2. **Backend não processa squads**
   - Verificar se `req.body.squads` existe
   - Verificar logs: `[API POST /aplicacoes] Salvando Squads:`

3. **Erro no SQL**
   - Verificar se tabela existe: `node test-squads.cjs`
   - Verificar constraints: colaboradorId deve existir em `colaboradores`

### ❌ Squads não são recuperados na edição

**Possíveis causas**:

1. **GET não retorna squads**
   - Verificar response no Network tab
   - Deve ter campo `squads: [...]`

2. **Query SQL com erro**
   - JOIN com `colaboradores` deve estar correto
   - Verificar logs do MySQL

3. **Frontend não popula state**
   - Verificar `useEffect` no AplicacaoWizard
   - Deve ter: `setSquadsAssociadas(aplicacao.squads || [])`

---

## 🧪 Testes Rápidos

### Teste 1: Verificar se dados foram salvos
```bash
mysql -h 127.0.0.1 -P 3308 -u app_user -papppass123 auditoria_db -e "
  SELECT a.sigla, c.nome, asq.perfil, asq.squad, asq.data_inicio 
  FROM aplicacao_squads asq 
  JOIN aplicacoes a ON asq.aplicacao_id = a.id 
  JOIN colaboradores c ON asq.colaborador_id = c.id 
  WHERE asq.status = 'Ativo' 
  ORDER BY asq.created_at DESC 
  LIMIT 5;
"
```

### Teste 2: Verificar última aplicação editada
```bash
mysql -h 127.0.0.1 -P 3308 -u app_user -papppass123 auditoria_db -e "
  SELECT id, sigla, updated_at 
  FROM aplicacoes 
  ORDER BY updated_at DESC 
  LIMIT 1;
"
```

### Teste 3: Ver squads da última aplicação
```bash
# Copie o ID da query acima e execute:
node test-squads.cjs "<ID_DA_APLICACAO>"
```

---

## 📝 Logs Esperados (Fluxo Completo)

### Frontend - Adicionando Squad:
```
[StepSquads] Salvando: { assoc: {...}, editing: false }
[StepSquads] Estado atual antes de salvar: 0 squads
[StepSquads] Adicionando: [{...}]
[StepSquads] Total após adição: 1
✓ Squad adicionado
```

### Frontend - Salvando Aplicação:
```
[AplicacaoWizard] ========== SALVANDO ==========
[AplicacaoWizard] Squads detalhados: [{...}]
[AplicacaoWizard] Contadores: { squads: 1, ... }
```

### Backend - Recebendo e Salvando:
```
[API POST /aplicacoes] Salvando Squads: 1
[API POST /aplicacoes] Squad salvo: <uuid> Tech Lead Alpha
```

### Frontend - Recuperando na Edição:
```
[AplicacaoWizard] Aplicação carregada com squads: 1
[StepReview] Recebendo squads: 1
```

---

## 🆘 Ainda Não Funciona?

1. **Compartilhe os logs do console** (Print ou copie o texto)
2. **Mostre o payload** da requisição no Network tab
3. **Execute** `node test-squads.cjs` e compartilhe o resultado
4. **Verifique** se o toast "Squad adicionado" aparece ao adicionar

---

## ✅ Verificação Final

Depois de adicionar squads e salvar:

```bash
# Ver total de squads no banco
mysql -h 127.0.0.1 -P 3308 -u app_user -papppass123 auditoria_db -e "SELECT COUNT(*) as total FROM aplicacao_squads WHERE status='Ativo';"

# Deve retornar um número > 0
```

Se retornar 0, os dados **não foram salvos** no banco.
