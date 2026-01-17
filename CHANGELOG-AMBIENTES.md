# Atualização de Ambientes - Wizard de Aplicação

## Resumo das Alterações

Esta atualização modifica a funcionalidade de Ambientes na Wizard de Aplicação, adicionando novos campos e atualizando os valores disponíveis.

## Alterações Implementadas

### 1. Novos Tipos de Ambiente
**Antes:** Dev, QA, Prod, Cloud, On-Premise  
**Depois:** DEV, QA, LAB, POC, SANDBOX, PROD

### 2. Novo Campo: Identificador da Aplicação
Campo obrigatório com os seguintes valores:
- `portal` - Aplicações web de portal
- `api` - APIs e serviços REST/GraphQL
- `auth` - Serviços de autenticação
- `erp` - Sistemas ERP
- `crm` - Sistemas CRM
- `etl` - Processos de ETL
- `dw` - Data Warehouse
- `mobile` - Aplicações mobile
- `batch` - Processamentos batch

### 3. Novo Campo: Localização/Região
Campo de texto livre (até 20 caracteres) para especificar a localização ou região do ambiente.
Exemplos: `us-east-1`, `sa-east-1`, `datacenter-sp`, `azure-brazil`

### 4. Nova Ordem dos Campos
Os campos agora aparecem na seguinte ordem:
1. Identificador da Aplicação
2. Tipo de Ambiente
3. Localização/Região
4. URL do Ambiente
5. Data da Criação
6. Tempo de Liberação

## Arquivos Modificados

### Frontend (TypeScript/React)
- ✅ `src/lib/types.ts` - Tipos atualizados
- ✅ `src/components/aplicacoes/wizard-steps/StepAmbientes.tsx` - Formulário e tabela
- ✅ `src/components/aplicacoes/wizard-steps/StepReview.tsx` - Visualização na revisão

### Backend (Node.js)
- ✅ `server/api.js` - Queries e inserts atualizados
- ✅ `package-production/server/api.js` - Queries e inserts atualizados

### Banco de Dados
- ✅ `package-production/database/init-master.sql` - Schema atualizado
- ✅ `package-production/database/13-create-aplicacao-relationships.sql` - Schema atualizado
- ✅ `add-ambiente-fields-migration.sql` - **NOVO** - Script de migration

### Documentação e Templates
- ✅ `data-templates/aplicacoes-completas-exemplo.json` - Exemplo atualizado
- ✅ `data-templates/README-APLICACOES-EXEMPLO.md` - Documentação atualizada

## Estrutura do Banco de Dados

```sql
CREATE TABLE aplicacao_ambientes (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    identificador_aplicacao VARCHAR(20) NOT NULL,  -- NOVO
    tipo_ambiente VARCHAR(50) NOT NULL,
    localizacao_regiao VARCHAR(20) NOT NULL,       -- NOVO
    url_ambiente VARCHAR(500) NOT NULL,
    data_criacao DATE NOT NULL,
    tempo_liberacao INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_tipo (tipo_ambiente),
    INDEX idx_identificador (identificador_aplicacao),  -- NOVO
    INDEX idx_status (status)
);
```

## Exemplo de Dados (JSON)

```json
{
  "ambientes": [
    {
      "identificadorAplicacao": "api",
      "tipoAmbiente": "DEV",
      "localizacaoRegiao": "us-east-1",
      "urlAmbiente": "https://api-dev.example.com",
      "dataCriacao": "2024-01-10",
      "tempoLiberacao": 7,
      "status": "Ativo"
    },
    {
      "identificadorAplicacao": "portal",
      "tipoAmbiente": "PROD",
      "localizacaoRegiao": "sa-east-1",
      "urlAmbiente": "https://portal.example.com",
      "dataCriacao": "2024-01-15",
      "tempoLiberacao": 30,
      "status": "Ativo"
    }
  ]
}
```

## Migration para Bancos Existentes

Execute o script de migration para adicionar as novas colunas em bancos existentes:

```bash
mysql -u root -p auditoria_db < add-ambiente-fields-migration.sql
```

O script:
- Verifica se as colunas já existem antes de adicionar
- Adiciona valores padrão para dados existentes
- Cria índices necessários
- É idempotente (pode ser executado múltiplas vezes)

## Validação

Após a atualização, verifique:

1. **Frontend**: Abra a Wizard de Aplicação e teste a criação/edição de ambientes
2. **API**: Verifique que os novos campos são retornados nas APIs GET
3. **Banco de Dados**: Confirme que as colunas foram adicionadas
4. **Dados Existentes**: Verifique que ambientes antigos foram migrados corretamente

## Observações Importantes

- ⚠️ **Breaking Change**: Os valores de `TipoAmbiente` foram alterados (Dev → DEV, etc.)
- ⚠️ Dados existentes precisarão ser atualizados manualmente ou via script
- ✅ Novos ambientes exigem os 3 campos obrigatórios
- ✅ A migration adiciona valores padrão para registros existentes

## Próximos Passos

1. Executar a migration no banco de dados de desenvolvimento
2. Testar a criação e edição de ambientes
3. Atualizar dados existentes se necessário
4. Executar a migration em produção
5. Atualizar documentação de usuário final se houver

---

**Data da Atualização:** 16/01/2026  
**Versão:** 1.0.0
