# Sincronização de Work Items do Azure DevOps

## 📋 Visão Geral

Este documento explica como configurar e sincronizar Work Items do Azure DevOps com o sistema de auditoria.

## 🔧 Pré-requisitos

### 1. Configuração da Organização

Acesse **Configurações** no menu lateral e configure:

- **URL da Organização**: `https://dev.azure.com/{sua-organizacao}/`
- **Personal Access Token (PAT)**: Token com permissão de leitura de Work Items

### 2. Configuração dos Projetos

Na tabela `estruturas_projeto`, cada projeto deve ter:

#### Campos Obrigatórios:
- `produto`: Nome do produto
- `projeto`: Nome do projeto (pode ser diferente do nome no Azure DevOps)
- `url_projeto`: **DEVE** seguir o formato exato: `https://dev.azure.com/{organizacao}/{nome-do-projeto-no-azure}`
- `work_item_process`: Processo do projeto (Scrum, Agile, Basic, CMMI)

#### ⚠️ IMPORTANTE: URL do Projeto

A URL deve ser **exatamente** como aparece no Azure DevOps:

✅ **CORRETO:**
```
https://dev.azure.com/minhaorg/MeuProjeto
https://dev.azure.com/minhaorg/Projeto%20com%20Espacos
```

❌ **INCORRETO:**
```
https://dev.azure.com/minhaorg/EXEMPLO-100  (se o projeto no Azure não se chama EXEMPLO-100)
https://dev.azure.com/minhaorg/             (faltando o nome do projeto)
http://dev.azure.com/minhaorg/MeuProjeto   (http ao invés de https)
```

## 🔍 Como Verificar o Nome Correto do Projeto

1. Acesse o Azure DevOps: `https://dev.azure.com/{sua-organizacao}`
2. Clique no projeto desejado
3. A URL na barra de endereços mostrará o nome exato
4. Use esse nome exato na configuração

**Exemplo:**
- Se a URL é: `https://dev.azure.com/contoso/ContosoProject/_workitems`
- Então `url_projeto` deve ser: `https://dev.azure.com/contoso/ContosoProject`

## 📊 Sincronização de Work Items

### Sincronização Individual

1. Acesse **Azure Work Items** no menu lateral
2. Selecione o projeto desejado
3. Verifique se a URL está configurada corretamente (aparece em amarelo se não estiver)
4. Clique em **"Sincronizar Projeto Selecionado"**

### Sincronização em Massa

1. Acesse **Azure Work Items** no menu lateral
2. Clique em **"Sincronizar TODOS os Projetos"**
3. Apenas projetos com URL configurada serão sincronizados
4. Um relatório detalhado será exibido ao final

## 🚨 Erros Comuns

### Erro: "Projeto não encontrado no Azure DevOps"

**Causa:** O nome do projeto na URL não corresponde a um projeto existente no Azure DevOps.

**Solução:**
1. Verifique se o projeto existe no Azure DevOps
2. Compare o nome na URL com o nome exato no Azure DevOps
3. Se o projeto tiver espaços, use `%20` ou o formato URL-encoded correto
4. Verifique se você tem acesso ao projeto com o PAT configurado

### Erro: "URL do projeto inválida"

**Causa:** A URL não está no formato esperado.

**Solução:**
1. Use o formato: `https://dev.azure.com/{organizacao}/{projeto}`
2. Não inclua caminhos adicionais como `/_workitems` ou `/_boards`

### Erro: "Personal Access Token não configurado"

**Causa:** O PAT não foi configurado nas configurações do sistema.

**Solução:**
1. Acesse **Configurações** no menu lateral
2. Configure a integração com Azure DevOps
3. Adicione um PAT válido com permissão de leitura

## 📈 Visualizando os Dados

Após a sincronização bem-sucedida:

### Dashboard - Aging Chart

1. Acesse o **Dashboard**
2. O **Aging Distribution Chart** será exibido automaticamente
3. Mostra a distribuição de work items por faixas de tempo desde criação
4. Estatísticas incluem: média, mínimo, máximo e total de work items

### Azure Work Items

1. Acesse **Azure Work Items** no menu lateral
2. Visualize todos os work items sincronizados
3. Filtre por estado, tipo, ou busque por título/ID
4. Clique em um work item para ver seu histórico completo

## 🔄 Frequência de Sincronização

- **Manual**: Use os botões de sincronização conforme necessário
- **Recomendado**: Sincronize diariamente ou antes de análises importantes
- **Automático**: Não implementado (versão futura)

## 📝 Estrutura de Dados

### Tabelas Criadas

1. **azure_work_items**: Armazena os work items atuais
2. **azure_work_items_historico**: Armazena todo o histórico de alterações
3. **azure_sync_log**: Registra todas as sincronizações realizadas

### Work Items Sincronizados

Por padrão, são sincronizados work items que **NÃO** estão em estados finais:
- ✅ Incluídos: New, Active, In Progress
- ❌ Excluídos: Done, Closed, Removed, Resolved

Para alterar esse comportamento, edite a query WIQL no arquivo `server/api.js`.

## 🛠️ Troubleshooting

### Verificar Logs de Sincronização

Os logs de sincronização são armazenados na tabela `azure_sync_log`:

```sql
SELECT * FROM azure_sync_log 
ORDER BY inicio_sync DESC 
LIMIT 10;
```

### Verificar Work Items Sincronizados

```sql
SELECT COUNT(*) as total, projeto_nome 
FROM azure_work_items 
GROUP BY projeto_nome;
```

### Limpar Dados e Re-sincronizar

Se necessário, você pode limpar os dados e sincronizar novamente:

```sql
-- Cuidado: Isso apaga todos os work items!
DELETE FROM azure_work_items_historico;
DELETE FROM azure_work_items;
DELETE FROM azure_sync_log;
```

## 📞 Suporte

Para problemas adicionais:
1. Verifique os logs do servidor no terminal
2. Confira o console do navegador (F12)
3. Revise a documentação do Azure DevOps REST API

## 🔗 Links Úteis

- [Azure DevOps REST API - Work Items](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/)
- [Criar Personal Access Token](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [WIQL Syntax Reference](https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax)
