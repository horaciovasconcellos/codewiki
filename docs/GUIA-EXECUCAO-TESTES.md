# Guia de Uso - Registro de Execução de Testes

## Visão Geral

A funcionalidade de **Registro de Execução de Testes** foi criada para registrar e rastrear todas as atividades realizadas durante a execução de testes, garantindo rastreabilidade, padronização e evidências formais do resultado final.

## Estrutura do Sistema

### 1. Banco de Dados

Foram criadas duas tabelas principais:

#### `casos_teste`
Armazena os casos de teste das aplicações:
- **id**: Identificador único (UUID)
- **aplicacao_id**: Referência à aplicação
- **titulo**: Título do caso de teste
- **descricao**: Descrição detalhada
- **requisito_vinculado**: Requisito ou User Story vinculada
- **tipo_teste**: Funcional, Integração, Regressão, Performance, Segurança, Unitário, Aceitação
- **prioridade**: Baixa, Média, Alta, Crítica
- **status**: Ativo, Inativo, Obsoleto
- **pre_condicoes**: Pré-condições necessárias
- **passos_execucao**: Passos para executar o teste
- **resultado_esperado**: Resultado esperado

#### `execucoes_teste`
Registra as execuções dos testes:
- **id**: Identificador único (UUID) - **gerado automaticamente**
- **caso_teste_id**: Referência ao caso de teste
- **aplicacao_id**: Referência à aplicação
- **requisito_vinculado**: Requisito ou User Story
- **ambiente**: DEV, QA, HML, PRD
- **executor_id**: Colaborador executor (da tabela de colaboradores)
- **data_hora_inicio**: Data e hora de início da execução
- **data_hora_termino**: Data e hora de término
- **registro_atividades**: Texto livre com as atividades realizadas (5 linhas com scroll)
- **resultado_execucao**: Texto livre com o resultado (5 linhas com scroll)
- **status_execucao**: Aguardando, Em Execução, Passou, Falhou, Bloqueado, Cancelado
- **arquivo_resultado**: Caminho do arquivo de evidência
- **arquivo_nome_original**: Nome original do arquivo
- **arquivo_mime_type**: Tipo do arquivo (PDF, PNG, JPG)
- **arquivo_tamanho**: Tamanho do arquivo em bytes

### 2. API Backend

#### Casos de Teste
- `GET /api/casos-teste` - Listar todos os casos de teste (pode filtrar por aplicacaoId)
- `GET /api/casos-teste/:id` - Buscar caso de teste específico
- `POST /api/casos-teste` - Criar novo caso de teste
- `PUT /api/casos-teste/:id` - Atualizar caso de teste
- `DELETE /api/casos-teste/:id` - Excluir caso de teste

#### Execuções de Teste
- `GET /api/execucoes-teste` - Listar todas as execuções (filtros: aplicacaoId, casoTesteId, ambiente, executorId)
- `GET /api/execucoes-teste/:id` - Buscar execução específica
- `POST /api/execucoes-teste` - Criar nova execução (com upload de arquivo)
- `PUT /api/execucoes-teste/:id` - Atualizar execução (com upload de arquivo)
- `DELETE /api/execucoes-teste/:id` - Excluir execução
- `GET /api/execucoes-teste/:id/download` - Download do arquivo de evidência

## Como Usar

### Passo 1: Acessar a Tela

1. No menu lateral, em **Registros**, clique em **"Execução de Testes"**
2. Selecione a aplicação desejada no dropdown

### Passo 2: Visualizar Execuções

Após selecionar a aplicação, você verá:
- Lista de todas as execuções realizadas naquela aplicação
- Filtros por:
  - Busca textual (caso de teste, executor, requisito)
  - Ambiente (DEV, QA, HML, PRD)
  - Status da execução
- Ordenação por:
  - Data/Hora de Início
  - Caso de Teste
  - Ambiente
  - Executor
  - Status

### Passo 3: Registrar Nova Execução

1. Clique no botão **"Nova Execução"**
2. Preencha o formulário em etapas:

#### **Informações Básicas**
- **Caso de Teste*** (obrigatório): Selecione o caso de teste a ser executado
- **Requisito Vinculado**: Código do requisito ou User Story (ex: REQ-001, US-123)
- **Ambiente*** (obrigatório): Selecione DEV, QA, HML ou PRD
- **Status da Execução*** (obrigatório): Selecione o status atual

#### **Executor e Período**
- **Executor*** (obrigatório): Selecione o colaborador que executará o teste
- **Data/Hora de Início*** (obrigatório): Data e hora de início da execução
- **Data/Hora de Término**: Data e hora de conclusão (opcional durante execução)

#### **Registros da Execução**
- **Registro das Atividades**: Descrição detalhada de todas as atividades realizadas
  - Campo de texto com 5 linhas e scroll
  - Use para documentar cada passo executado
- **Resultado da Execução**: Descrição do resultado obtido
  - Campo de texto com 5 linhas e scroll
  - Documente observações, desvios, bugs encontrados

#### **Upload de Evidência**
- **Arquivo de Resultado**: Anexe evidências (PDF, PNG ou JPG - máx 10MB)
  - Screenshots de sucesso/falha
  - Logs exportados
  - Relatórios de execução

3. Clique em **"Salvar Execução"**

### Passo 4: Editar Execução

1. Na lista de execuções, clique no ícone de edição (lápis)
2. Atualize os campos necessários
3. Se necessário, substitua o arquivo de evidência
4. Clique em **"Salvar Execução"**

### Passo 5: Fazer Download de Evidências

- Na lista de execuções, clique no ícone de download para baixar o arquivo anexado

### Passo 6: Excluir Execução

1. Na lista de execuções, clique no ícone de exclusão (lixeira)
2. Confirme a exclusão
3. O arquivo de evidência também será removido

## Recursos Importantes

### ✅ Rastreabilidade Completa
- ID único para cada execução
- Vínculo com caso de teste e aplicação
- Histórico de executor e datas
- Arquivo de evidência anexado

### ✅ Campos com Validação
- Campos obrigatórios marcados com *
- Validação de tipo e tamanho de arquivo
- Apenas colaboradores ativos podem ser selecionados
- Apenas casos de teste ativos da aplicação selecionada

### ✅ Filtros e Ordenação
- Busca rápida por múltiplos campos
- Filtro por ambiente e status
- Ordenação por qualquer coluna
- Paginação configurável (10, 25, 50, 100 itens)

### ✅ Status de Execução
- **Aguardando**: Teste ainda não iniciado
- **Em Execução**: Teste em andamento
- **Passou**: Teste passou com sucesso
- **Falhou**: Teste falhou
- **Bloqueado**: Teste bloqueado por algum impedimento
- **Cancelado**: Teste cancelado

### ✅ Ambientes
- **DEV**: Desenvolvimento
- **QA**: Quality Assurance (Testes)
- **HML**: Homologação
- **PRD**: Produção

## Próximos Passos

Para implementar casos de teste, você precisará criar uma tela similar para cadastrar os casos de teste, ou pode cadastrá-los diretamente no banco via API.

## Arquivos Criados

### Backend
- `/database/migrations/20260115-create-execucao-testes-table.sql` - Migration do banco
- `/server/api.js` - Rotas da API (linhas adicionadas antes do middleware de erros)

### Frontend
- `/src/lib/types.ts` - Tipos TypeScript adicionados
- `/src/lib/utils.ts` - Função `formatarDataHora` adicionada
- `/src/components/execucoes-teste/ExecucaoTesteWizard.tsx` - Formulário de cadastro/edição
- `/src/components/execucoes-teste/ExecucoesTesteDataTable.tsx` - Tabela de listagem
- `/src/components/execucoes-teste/ExecucoesTesteView.tsx` - View principal
- `/src/App.tsx` - Rota e menu adicionados

## Migração do Banco de Dados

Para criar as tabelas no banco de dados, execute:

```bash
mysql -u seu_usuario -p auditoria_db < database/migrations/20260115-create-execucao-testes-table.sql
```

Ou use a ferramenta de migração do seu projeto.

---

**Desenvolvido em:** 15 de janeiro de 2026  
**Baseado em:** Tela de Colaboradores existente  
**Padrão:** Step by step com wizard guiado
