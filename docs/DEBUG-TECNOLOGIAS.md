# 🔍 Guia de Debug - Tecnologias não estão gravando

## ✅ O que já sabemos

Pelo log que você enviou:
- ✅ Frontend está montando os dados corretamente
- ✅ Requisição PUT está sendo enviada com tecnologias
- ✅ Body contém: `"tecnologias": [{ "id": "...", "tecnologiaId": "...", "dataInicio": "2025-12-13", "status": "Ativo" }]`
- ✅ API retorna sucesso (status 200)

## ❓ O que precisamos descobrir

Por que as tecnologias não estão sendo gravadas no banco de dados?

## 🧪 Testes a Executar

### Teste 1: Verificar logs do servidor

1. **Pare o servidor** (Ctrl+C)
2. **Inicie novamente** com logs visíveis:
   ```bash
   cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
   npm run dev:api
   ```

3. **Tente atualizar a aplicação CHAT-BOT** adicionando uma tecnologia

4. **Procure no terminal do servidor** por estas linhas:
   ```
   [API PUT /aplicacoes/:id] ========== ATUALIZAÇÃO ==========
   [API PUT /aplicacoes/:id] ID: app-010
   [API PUT /aplicacoes/:id] Tecnologias recebidas: [...]
   [API PUT /aplicacoes/:id] Iniciando atualização de tecnologias...
   [API PUT /aplicacoes/:id] É array? true
   [API PUT /aplicacoes/:id] Processando X tecnologias
   [API PUT /aplicacoes/:id] Salvando tecnologia: {...}
   [API PUT /aplicacoes/:id] ✓ Tecnologia salva
   ```

**📝 Copie e cole aqui TODOS os logs que aparecerem**

### Teste 2: Verificar diretamente no banco

```bash
docker exec -it mysql-auditoria mysql -u auditoria_user -p auditoria_db
# Senha: auditoria_pass
```

Dentro do MySQL:
```sql
-- Ver aplicação
SELECT id, sigla, descricao FROM aplicacoes WHERE sigla = 'CHAT-BOT';

-- Ver tecnologias associadas (substitua o ID)
SELECT * FROM aplicacao_tecnologias WHERE aplicacao_id = 'app-010';

-- Ver estrutura da tabela
DESCRIBE aplicacao_tecnologias;

-- Ver todas as associações
SELECT 
  a.sigla as aplicacao,
  t.sigla as tecnologia,
  at.data_inicio,
  at.status
FROM aplicacao_tecnologias at
JOIN aplicacoes a ON at.aplicacao_id = a.id
JOIN tecnologias t ON at.tecnologia_id = t.id
WHERE a.sigla = 'CHAT-BOT';
```

**📝 Copie e cole os resultados**

### Teste 3: Script de teste de inserção

Este script testa se consegue inserir diretamente na tabela:

```bash
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
node test-tecnologia-insert.js
```

**📝 Copie e cole o resultado completo**

### Teste 4: Verificar erros silenciosos

No navegador (F12 → Network):
1. Filtre por "aplicacoes"
2. Tente salvar a aplicação com tecnologia
3. Clique na requisição PUT
4. Verifique:
   - **Headers**: Status deve ser 200
   - **Payload**: Deve conter as tecnologias
   - **Response**: Veja se tem algum erro

**📝 Faça um screenshot ou copie a resposta**

## 🎯 Possíveis Causas

### Causa 1: Erro sendo silenciado
O código pode estar entrando no `catch` mas não gravando no banco. Logs vão revelar.

### Causa 2: Constraint do banco
Foreign key ou outro constraint pode estar impedindo. Teste 3 vai revelar.

### Causa 3: Transação não commitada
O INSERT pode estar sendo revertido. Precisamos verificar se há `BEGIN TRANSACTION`.

### Causa 4: Tabela em modo read-only
Improvável mas possível. Teste 3 vai revelar.

### Causa 5: ID da tecnologia inválido
O `tecnologiaId` pode não existir na tabela `tecnologias`. Vamos verificar:

```sql
-- Verificar se a tecnologia existe
SELECT id, sigla, nome FROM tecnologias WHERE id = '5b9a2f37-22bf-4265-8934-36964ba63292';
```

## 📊 Próximos Passos

**Execute os 4 testes acima e me envie TODOS os resultados.** Com essas informações vou identificar exatamente onde está o problema!

## 🔧 Comandos Rápidos

```bash
# Ver logs do servidor
npm run dev:api

# Conectar ao MySQL
docker exec -it mysql-auditoria mysql -u auditoria_user -pauditoria_pass auditoria_db

# Rodar teste de inserção
node test-tecnologia-insert.js

# Ver logs em tempo real (em outra aba do terminal)
tail -f server.log
```
