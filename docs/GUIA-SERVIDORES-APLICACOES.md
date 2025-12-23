# Guia: Associar Servidores às Aplicações

## Problema
Os servidores estão cadastrados mas não aparecem no relatório detalhado de aplicações.

## Causa
Para que os servidores apareçam no relatório de aplicações, é necessário associá-los às aplicações através da interface do sistema. O simples cadastro de servidores não cria automaticamente essa relação.

## Solução

### 1. Verificar se há servidores cadastrados
```bash
# Execute o script de teste
node test-servidor-aplicacao.js
```

Este script irá verificar:
- Se a tabela `servidor_aplicacao` existe
- Quantos registros de associação existem
- Se há servidores e aplicações cadastrados

### 2. Associar Servidores às Aplicações

Existem duas formas de fazer isso:

#### Opção A: Pela tela de Servidores

1. Acesse a tela de **Servidores**
2. Clique em **Novo Servidor** ou **Editar** um servidor existente
3. No wizard, vá até o passo **"Aplicações"**
4. Selecione as aplicações que rodam neste servidor
5. Para cada aplicação, informe:
   - Data de início
   - Data de término (opcional)
   - Status (Planejado, Implantado, Ativo, Inativo)
6. Clique em **Salvar**

#### Opção B: Pela API diretamente

```bash
# Criar associação via API
curl -X POST http://localhost:3000/api/servidores/SERVIDOR_ID/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "aplicacaoId": "ID_DA_APLICACAO",
    "dataInicio": "2025-01-01",
    "dataTermino": null,
    "status": "Ativo"
  }'
```

### 3. Verificar a Associação

Após associar, você pode verificar:

```bash
# Testar o endpoint
bash test-endpoint-servidores.sh

# Ou manualmente
curl http://localhost:3000/api/aplicacoes/ID_DA_APLICACAO/servidores
```

### 4. Gerar o Relatório

1. Acesse a tela de **Aplicações**
2. Clique em **Relatório Detalhado**
3. Aguarde a geração do PDF
4. O relatório agora incluirá a seção **Servidores** com:
   - Sigla do Servidor
   - Hostname
   - Um servidor por linha

## Estrutura da Tabela

A tabela `servidor_aplicacao` armazena o relacionamento:

```sql
CREATE TABLE servidor_aplicacao (
    id VARCHAR(36) PRIMARY KEY,
    servidor_id VARCHAR(36) NOT NULL,
    aplicacao_id VARCHAR(36) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Planejado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (servidor_id) REFERENCES servidores(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE
);
```

## Status Possíveis

- **Planejado**: Servidor planejado para a aplicação
- **Implantado**: Servidor implantado mas ainda não ativo
- **Ativo**: Servidor ativo e em uso
- **Inativo**: Servidor desativado

## Exemplos de Uso

### Cenário 1: Servidor Web executando múltiplas aplicações

- Servidor: `WEB-01` (webserver01.empresa.com)
- Aplicações:
  - Portal (Ativo desde 2024-01-01)
  - API Gateway (Ativo desde 2024-06-01)
  - Dashboard (Ativo desde 2024-12-01)

### Cenário 2: Aplicação distribuída em múltiplos servidores

- Aplicação: `SISTEMA-ERP`
- Servidores:
  - `DB-01` (database01.empresa.com) - Banco de dados
  - `APP-01` (app01.empresa.com) - Aplicação
  - `APP-02` (app02.empresa.com) - Aplicação (réplica)
  - `WEB-01` (webserver01.empresa.com) - Frontend

## Troubleshooting

### Problema: Endpoint retorna array vazio
**Solução**: Verifique se as associações foram criadas corretamente.

### Problema: Erro 500 ao buscar servidores
**Solução**: Verifique os logs do servidor (`npm run dev`) para identificar o erro SQL.

### Problema: Servidores aparecem no wizard mas não no relatório
**Solução**: 
1. Abra o console do navegador (F12)
2. Gere o relatório
3. Verifique os logs que começam com "Buscando servidores da aplicação"
4. Se o status for diferente de 200, há um erro na API

## Logs de Debug

O código agora inclui logs detalhados:

```javascript
console.log(`Buscando servidores da aplicação ${app.id} (${app.sigla}):`, status);
console.log(`Servidores encontrados para ${app.sigla}:`, servidores);
```

Verifique o console do navegador ao gerar o relatório para mais informações.

## Scripts de Teste

### test-servidor-aplicacao.js
Testa a conexão com o banco e verifica os dados da tabela.

```bash
node test-servidor-aplicacao.js
```

### test-endpoint-servidores.sh
Testa o endpoint da API.

```bash
bash test-endpoint-servidores.sh
```

## Próximos Passos

1. Execute `node test-servidor-aplicacao.js` para verificar o estado atual
2. Associe servidores às aplicações através da interface
3. Teste o endpoint com `bash test-endpoint-servidores.sh`
4. Gere o relatório detalhado de aplicações
5. Verifique a seção "Servidores" no PDF gerado
