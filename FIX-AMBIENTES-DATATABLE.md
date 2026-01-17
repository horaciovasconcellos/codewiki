# Correção: Ambientes não aparecendo no DataTable

## Problema Identificado

Após a atualização dos campos de Ambientes na Wizard de Aplicação, os ambientes existentes não estavam aparecendo na tabela porque:

1. **Campos novos obrigatórios**: `identificadorAplicacao` e `localizacaoRegiao` foram adicionados
2. **Dados legados**: Ambientes existentes no banco não tinham esses campos
3. **Frontend esperando dados**: O componente tentava acessar propriedades `undefined`, causando erros de renderização

## Solução Implementada

### 1. Frontend - Compatibilidade com Dados Legados

**Arquivo: `src/lib/types.ts`**
- Campos `identificadorAplicacao` e `localizacaoRegiao` tornados **opcionais** (usando `?`)
- Permite que o TypeScript aceite objetos sem esses campos

**Arquivo: `src/components/aplicacoes/wizard-steps/StepAmbientes.tsx`**
- Renderização segura com valores padrão: `amb.identificadorAplicacao || 'N/A'`
- Validação ajustada para permitir edição de registros legados
- Novos registros ainda exigem todos os campos

**Arquivo: `src/components/aplicacoes/wizard-steps/StepReview.tsx`**
- Exibição segura dos badges com valores padrão

### 2. Backend - Valores Padrão nas Queries

**Arquivos: `server/api.js` e `package-production/server/api.js`**

Queries atualizadas com `COALESCE` para fornecer valores padrão:

```sql
SELECT id, 
       COALESCE(identificador_aplicacao, 'api') as identificadorAplicacao, 
       tipo_ambiente as tipoAmbiente,
       COALESCE(localizacao_regiao, 'not-specified') as localizacaoRegiao, 
       url_ambiente as urlAmbiente, 
       data_criacao as dataCriacao, 
       tempo_liberacao as tempoLiberacao, 
       status
FROM aplicacao_ambientes
WHERE aplicacao_id = ?
```

Inserts atualizados com fallback:
```javascript
amb.identificadorAplicacao || 'api'
amb.localizacaoRegiao || 'not-specified'
```

### 3. Banco de Dados - Script de Correção Rápida

**Novo arquivo: `fix-ambiente-data.sql`**

Execute este script para corrigir dados existentes:

```bash
mysql -u root -p auditoria_db < fix-ambiente-data.sql
```

O script:
- ✅ Atualiza registros NULL ou vazios
- ✅ Define `identificador_aplicacao = 'api'` como padrão
- ✅ Define `localizacao_regiao = 'not-specified'` como padrão
- ✅ Exibe estatísticas antes e depois
- ✅ Mostra amostra dos dados corrigidos

## Como Resolver

### Opção 1: Execute o Script de Correção (RECOMENDADO)

```bash
cd /Users/horaciovasconcellos/repositorio/codewiki
mysql -u root -p auditoria_db < fix-ambiente-data.sql
```

### Opção 2: Execute a Migration Completa

Se as colunas ainda não existem:
```bash
mysql -u root -p auditoria_db < add-ambiente-fields-migration.sql
```

### Opção 3: Correção Manual via SQL

```sql
USE auditoria_db;

UPDATE aplicacao_ambientes 
SET identificador_aplicacao = 'api'
WHERE identificador_aplicacao IS NULL OR identificador_aplicacao = '';

UPDATE aplicacao_ambientes 
SET localizacao_regiao = 'not-specified'
WHERE localizacao_regiao IS NULL OR localizacao_regiao = '';
```

## Teste da Correção

1. **Recarregue a aplicação** (o Vite já deve ter recarregado automaticamente)
2. **Abra a Wizard de Aplicação** de uma aplicação existente
3. **Navegue até a tela de Ambientes**
4. **Verifique** se os ambientes agora aparecem na tabela

### O que você deve ver:

```
| Identificador | Tipo | Localização/Região | URL                      | Data Criação | Tempo Liberação | Status |
|---------------|------|-------------------|--------------------------|--------------|-----------------|--------|
| api          | DEV  | not-specified     | https://app-dev.com      | 15/01/2024   | 7 dias         | Ativo  |
| N/A          | PROD | N/A               | https://app.com          | 15/01/2024   | 30 dias        | Ativo  |
```

> **Nota:** Registros com "N/A" são dados legados que ainda não foram atualizados. Você pode editá-los para preencher os campos corretamente.

## Funcionalidades Preservadas

✅ **Criar novo ambiente** - exige todos os campos  
✅ **Editar ambiente existente** - permite salvar mesmo sem os novos campos  
✅ **Visualizar ambientes** - mostra "N/A" para campos vazios  
✅ **Ambientes legados** - continuam funcionando normalmente  
✅ **Tela de Review** - exibe todos os ambientes corretamente  

## Melhorias Aplicadas

1. **Retrocompatibilidade total** com dados antigos
2. **Validação inteligente** - distingue entre criar e editar
3. **Valores padrão seguros** em todas as camadas (frontend, backend, banco)
4. **Scripts de correção** idempotentes e seguros
5. **Mensagens claras** sobre campos obrigatórios

## Status Final

🟢 **Frontend**: Atualizado e compatível  
🟢 **Backend**: Queries com COALESCE  
🟢 **Banco de Dados**: Scripts de correção prontos  
🟢 **Documentação**: Completa  

---

**Data:** 16/01/2026  
**Status:** ✅ **RESOLVIDO**
