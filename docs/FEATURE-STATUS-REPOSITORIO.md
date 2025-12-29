# Feature: Status de Repositórios Persistido

**Data:** 29/12/2024  
**Status:** ✅ Implementado

## 📋 Objetivo

Persistir o status de criação de repositórios no banco de dados para que o botão "Criar Repositórios" permaneça desabilitado após a criação, mesmo quando a página é recarregada.

## 🔄 Problema Anterior

Antes da implementação, o status de criação dos repositórios era mantido apenas no estado local do React (`useState`), o que causava:

- ❌ Perda de estado ao recarregar a página
- ❌ Botão habilitado novamente permitindo duplicação
- ❌ Possibilidade de tentativas duplicadas de criação

## ✅ Solução Implementada

### 1. **Banco de Dados**

Criada coluna `status_repositorio` na tabela `estruturas_projeto`:

```sql
ALTER TABLE estruturas_projeto 
ADD COLUMN status_repositorio CHAR(1) DEFAULT 'N' 
CHECK (status_repositorio IN ('N', 'Y'));

CREATE INDEX idx_estruturas_status_repo ON estruturas_projeto(status_repositorio);
```

**Valores:**
- `'N'` = Repositórios **não criados** (valor padrão ao criar registro)
- `'Y'` = Repositórios **já criados** no Azure DevOps

### 2. **Backend (server/api.js)**

#### GET /api/estruturas-projeto
Adiciona `statusRepositorio` na resposta:

```javascript
statusRepositorio: row.status_repositorio || 'N'
```

#### POST /api/estruturas-projeto
Cria novo projeto com `status_repositorio = 'N'`:

```javascript
INSERT INTO estruturas_projeto (..., status_repositorio)
VALUES (..., 'N')
```

#### PUT /api/estruturas-projeto/:id
Permite atualizar o status:

```javascript
UPDATE estruturas_projeto SET ..., status_repositorio = ?
```

#### POST /api/azure-devops/criar-repositorios
Atualiza status para `'Y'` após criação bem-sucedida:

```javascript
if (repositoriosCriados.length > 0) {
  await pool.query(
    'UPDATE estruturas_projeto SET status_repositorio = ? WHERE id = ?',
    ['Y', projetoId]
  );
}
```

### 3. **Frontend**

#### Tipo TypeScript (src/lib/types.ts)
```typescript
export interface ProjetoGerado {
  // ... outros campos
  statusRepositorio?: 'N' | 'Y';
}
```

#### GeradorProjetosView.tsx
- ❌ **Removido:** Estado local `repositoriosCriados: Set<string>`
- ✅ **Implementado:** Verificação usando `projeto.statusRepositorio === 'Y'`
- ✅ **Implementado:** `refetch()` após criação para atualizar dados do banco

```typescript
const handleCriarRepositorios = (projeto: ProjetoGerado) => {
  if (projeto.statusRepositorio === 'Y') {
    toast.info('Os repositórios deste projeto já foram criados');
    return;
  }
  // ...
};
```

#### GeradorProjetosDataTable.tsx
- ✅ Botão desabilitado quando `projeto.statusRepositorio === 'Y'`
- ✅ Estilo visual cinza quando desabilitado
- ✅ Tooltip contextual: "Repositórios já criados" vs "Criar Repositórios Git"

```typescript
<Button
  disabled={projeto.statusRepositorio === 'Y'}
  className={projeto.statusRepositorio === 'Y' 
    ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
    : "bg-green-600 hover:bg-green-700"
  }
>
  <GitBranch className="h-4 w-4" />
</Button>
```

## 🎯 Comportamento

### Fluxo Completo

1. **Criação do Projeto**
   - Novo registro com `status_repositorio = 'N'`
   - Botão "Criar Repositórios" **habilitado** (verde)

2. **Criação dos Repositórios**
   - Usuário clica em "Criar Repositórios"
   - Backend cria repositórios no Azure DevOps
   - Backend atualiza `status_repositorio = 'Y'`
   - Frontend faz `refetch()` para buscar dados atualizados

3. **Após Criação**
   - Botão fica **desabilitado** (cinza)
   - Tooltip mostra "Repositórios já criados"
   - Estado persiste ao recarregar a página ✅

4. **Tentativa de Duplicação**
   - Se usuário tentar clicar, vê toast: "Os repositórios deste projeto já foram criados"
   - Prevenção no handler antes de abrir modal

## 📁 Arquivos Modificados

### Banco de Dados
- ✅ `/database/migrations/20241229-add-status-repositorio.sql` (criado)

### Backend
- ✅ `/server/api.js`
  - GET /api/estruturas-projeto (linha ~4670)
  - POST /api/estruturas-projeto (linha ~4764)
  - PUT /api/estruturas-projeto/:id (linha ~4812)
  - POST /api/azure-devops/criar-repositorios (linha ~5494)

### Frontend
- ✅ `/src/lib/types.ts` (interface ProjetoGerado)
- ✅ `/src/components/gerador-projetos/GeradorProjetosView.tsx`
- ✅ `/src/components/gerador-projetos/GeradorProjetosDataTable.tsx`

## 🧪 Testes Sugeridos

1. ✅ Criar novo projeto → verificar `status_repositorio = 'N'` no banco
2. ✅ Criar repositórios → verificar `status_repositorio = 'Y'` no banco
3. ✅ Recarregar página → verificar botão permanece desabilitado
4. ✅ Tentar clicar no botão desabilitado → verificar toast de aviso
5. ✅ Verificar estilo visual (verde → cinza)
6. ✅ Verificar tooltip muda de texto

## 📊 Benefícios

✅ **Persistência:** Estado sobrevive a recarregamento de página  
✅ **Integridade:** Previne criação duplicada de repositórios  
✅ **UX Melhor:** Feedback visual claro (verde/cinza)  
✅ **Performance:** Índice no banco para queries rápidas  
✅ **Rastreabilidade:** Histórico no banco de quais projetos têm repos criados  

## 🔍 Validação SQL

```sql
-- Verificar estrutura da tabela
DESCRIBE estruturas_projeto;

-- Ver status de todos os projetos
SELECT id, projeto, status, status_repositorio, url_projeto 
FROM estruturas_projeto;

-- Contar projetos por status de repositório
SELECT status_repositorio, COUNT(*) as total
FROM estruturas_projeto
GROUP BY status_repositorio;

-- Atualizar manualmente (se necessário)
UPDATE estruturas_projeto 
SET status_repositorio = 'Y' 
WHERE id = 'projeto-xyz';
```

## 🚀 Migration Executada

```bash
# Adicionar coluna
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db \
  -e "ALTER TABLE estruturas_projeto ADD COLUMN status_repositorio CHAR(1) DEFAULT 'N';"

# Atualizar existentes e criar índice
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db \
  -e "UPDATE estruturas_projeto SET status_repositorio = 'Y' WHERE url_projeto IS NOT NULL; \
      CREATE INDEX idx_estruturas_status_repo ON estruturas_projeto(status_repositorio);"

# Reiniciar backend
docker-compose restart app
```

## 📝 Notas

- Projetos antigos com `url_projeto` preenchida foram marcados como `'Y'` (assume que repos já foram criados)
- Campo aceita apenas `'N'` ou `'Y'` via constraint CHECK
- Índice criado para otimizar consultas por status
- Compatível com replicação MySQL master-slave
