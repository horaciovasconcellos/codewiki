# Guia de Carga LGPD - Campos e Matriz de Anonimização

## 📋 Formato do Arquivo CSV

### Estrutura das Colunas

O arquivo CSV deve conter 14 colunas na seguinte ordem:

| # | Coluna | Descrição | Obrigatório | Uso |
|---|--------|-----------|-------------|-----|
| 1 | Nome do Campo | Identificador do campo (convertido para MAIÚSCULO) | ✅ Sim | Usado |
| 2 | Descrição | Descrição detalhada do campo | ✅ Sim | Usado |
| 3 | Identificação dos Dados | Classificação geral dos dados | ❌ Não | Reservado* |
| 4 | Hierarquia de Sensibilidade | Nível de sensibilidade | ❌ Não | Reservado* |
| 5 | Tipo de Dado | Tipo específico do dado | ❌ Não | Reservado* |
| 6 | Base Legal | Fundamentação legal LGPD | ⚠️ Recomendado | **Usado** |
| 7 | Técnica de Anonimização | Técnica geral | ❌ Não | Reservado* |
| 8 | Vendas | Técnica para departamento Vendas | ✅ Sim | Usado |
| 9 | Marketing | Técnica para departamento Marketing | ✅ Sim | Usado |
| 10 | Financeiro | Técnica para departamento Financeiro | ✅ Sim | Usado |
| 11 | RH | Técnica para departamento RH | ✅ Sim | Usado |
| 12 | Logística | Técnica para departamento Logística | ✅ Sim | Usado |
| 13 | Assistência Técnica | Técnica para departamento Assistência Técnica | ✅ Sim | Usado |
| 14 | Analytics | Técnica para departamento Analytics | ✅ Sim | Usado |

\* *Colunas 3, 4, 5 e 7 são ignoradas na importação atual (reservadas para uso futuro)*

### Valores Aceitos para Técnicas de Anonimização

As colunas 8-14 (departamentos) aceitam os seguintes valores (case-insensitive):

| Valor no CSV | Mapeamento no Sistema | Variações Aceitas |
|--------------|----------------------|-------------------|
| Supressão | Supressão | supress, supressao |
| Generalização | Generalização | generaliz, generalizacao |
| Embaralhamento | Embaralhamento | embaralh, pseudo, pseudonim |
| Permutação | Permutação | permut, permutacao |
| Sem Anonimização | Sem Anonimização | sem, sem anonimizacao |

**Padrão:** Se um valor não for informado ou não for reconhecido, será usado "Sem Anonimização"

### Exemplos de Base Legal (Coluna 6)

Valores comuns para fundamentação legal conforme LGPD:

| Artigo | Descrição | Exemplo de Uso |
|--------|-----------|----------------|
| Art. 7º I LGPD | Consentimento do titular | Dados públicos, marketing |
| Art. 7º II LGPD | Cumprimento de obrigação legal | CPF, dados fiscais |
| Art. 7º V LGPD | Execução de contrato | Dados contratuais |
| Art. 7º VI LGPD | Exercício regular de direitos | Defesa em processos |
| Art. 7º IX LGPD | Legítimo interesse | Analytics, melhorias |
| Art. 11 II LGPD | Dados sensíveis - obrigação legal | Dados de saúde, biométricos |

## 📝 Exemplo de Arquivo

```csv
Nome do Campo,Descrição,Identificação dos Dados,Hierarquia de Sensibilidade,Tipo de Dado,Base Legal,Técnica de Anonimização,Vendas,Marketing,Financeiro,RH,Logística,Assistência Técnica,Analytics
nome_empresa,Razão social da empresa,Dados Públicos,Dados Públicos,Dados Públicos,Art. 7º I LGPD,Sem Anonimização,Sem Anonimização,Sem Anonimização,Sem Anonimização,Sem Anonimização,Sem Anonimização,Sem Anonimização,Sem Anonimização
cpf,Cadastro de Pessoa Física,Dados Identificadores,Dados Identificadores,Identificadores Direto,Art. 7º II LGPD,Supressão,Supressão,Supressão,Supressão,Supressão,Supressão,Supressão,Supressão
email_corporativo,E-mail corporativo,Dados Pessoais,Dados Pessoais,Identificadores Direto,Art. 7º VI LGPD,Generalização,Generalização,Supressão,Supressão,Generalização,Generalização,Generalização,Generalização
```

## 🚀 Como Importar

### Via Interface Web

1. Acesse **LGPD > Novo Registro**
2. Preencha os dados do **Step 1: Dados Mestres**
3. No **Step 2: Campos e Matriz**, clique em **Importar CSV**
4. Escolha uma das opções:
   - **Carregar Arquivo**: Selecione seu arquivo `.csv`
   - **Colar Texto**: Cole o conteúdo CSV diretamente
5. Clique em **Importar Campos**
6. Revise os campos importados antes de salvar

### Comportamento da Importação

- ✅ Nome do Campo é convertido automaticamente para MAIÚSCULO
- ✅ Base Legal (coluna 6) é capturada e associada ao campo
- ✅ Primeira linha pode ser cabeçalho ou dados (detectado automaticamente)
- ✅ Campos vazios na matriz recebem "Sem Anonimização" como padrão
- ✅ Campos importados são **adicionados** aos existentes (não substituem)
- ✅ Colunas 3, 4, 5 e 7 são ignoradas (reservadas para uso futuro)

## 🔍 Validações

O sistema valida:
- ✅ Nome do Campo não pode estar vazio
- ✅ Descrição não pode estar vazia
- ✅ Técnicas de anonimização devem ser valores válidos
- ✅ CSV deve ter pelo menos 2 linhas (cabeçalho + dados)

## 📁 Arquivos de Exemplo

- `lgpd-campos-exemplo.csv` - Exemplo completo com diversos tipos de dados
- Veja mais exemplos na pasta `data-templates/`

## 💡 Dicas

1. **Use Excel ou Google Sheets** para preparar o CSV antes de importar
2. **Salve com encoding UTF-8** para evitar problemas com acentuação
3. **Teste com poucos registros** primeiro para validar o formato
4. **Revise os dados** após importação antes de salvar o registro LGPD
5. **Base Legal é importante** para compliance - preencha sempre que possível
6. **Diferentes departamentos** podem ter técnicas diferentes para o mesmo campo

## ⚠️ Limitações Conhecidas

- Colunas 3, 4, 5 e 7 são atualmente ignoradas (reservadas para uso futuro)
- Não há validação de valores duplicados durante importação
- Máximo recomendado: 1000 campos por importação

## 🆘 Solução de Problemas

**Erro: "Erro ao processar CSV"**
- Verifique se há 14 colunas em todas as linhas
- Confira se não há vírgulas extras nos valores
- Use aspas duplas para valores que contenham vírgulas: `"Nome, Sobrenome"`

**Campos não aparecem após importação**
- Verifique se Nome e Descrição não estão vazios
- Clique em "Importar Campos" após colar/carregar o arquivo
- Aguarde a mensagem de sucesso

**Base Legal não aparece**
- Certifique-se de que a coluna 6 contém o valor desejado
- Base Legal é opcional mas recomendado
