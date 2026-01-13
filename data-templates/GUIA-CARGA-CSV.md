# Guia de Carga de Dados - Arquivos CSV de Exemplo

Este guia explica como usar os arquivos CSV de exemplo para carregar dados no sistema de auditoria.

## 📋 Arquivos Disponíveis

### lgpd-campos-exemplo.csv (NOVO ✨)
**Campos obrigatórios:** `Nome do Campo`, `Descrição`, `Vendas`, `Marketing`, `Financeiro`, `RH`, `Logística`, `Assistência Técnica`, `Analytics`

**Campos recomendados:** `Base Legal` (coluna 6)

**Colunas ignoradas (reservadas):** `Identificação dos Dados`, `Hierarquia de Sensibilidade`, `Tipo de Dado`, `Técnica de Anonimização` (colunas 3, 4, 5, 7)

**Estrutura do arquivo (14 colunas):**
```csv
Nome do Campo,Descrição,Identificação,Hierarquia,Tipo,Base Legal,Técnica,Vendas,Marketing,Financeiro,RH,Logística,Assistência Técnica,Analytics
cpf,Cadastro de Pessoa Física,Dados Identificadores,Dados Identificadores,Identificadores Direto,Art. 7º II LGPD,Supressão,Supressão,Supressão,Supressão,Supressão,Supressão,Supressão,Supressão
```

**Observações:**
- Base Legal (coluna 6) é capturada para compliance LGPD ✅
- Nome do Campo convertido para MAIÚSCULO automaticamente
- Valores vazios recebem "Sem Anonimização" como padrão
- **Importação via:** LGPD > Novo Registro > Step 2 > Importar CSV
- **Documentação completa:** `README-LGPD.md`

---

### exemplo-tecnologias.csv
**Campos obrigatórios:** `sigla`, `nome`

**Campos opcionais:** `versaoRelease`, `categoria`, `status`, `fornecedorFabricante`, `tipoLicenciamento`, `maturidadeInterna`, `nivelSuporteInterno`

**Estrutura do arquivo:**
```csv
sigla,nome,versaoRelease,categoria,status,fornecedorFabricante,tipoLicenciamento,maturidadeInterna,nivelSuporteInterno
REACT,React,18.2.0,Frontend,Ativa,Meta,Open Source,Padronizada,Suporte Completo / Especializado
```

**Observações:**
- Não incluir campo `id` (gerado automaticamente)
- Não incluir arrays JSON (contratos, responsaveis, custos) - estes devem ser adicionados via UI após a carga inicial
- A sigla deve ter entre 2 e 10 caracteres alfanuméricos ou hífens

---

### exemplo-colaboradores.csv
**Campos obrigatórios:** `matricula`, `nome`, `setor`, `dataAdmissao`

**Campos opcionais:** `dataDemissao`

**Estrutura do arquivo:**
```csv
matricula,nome,setor,dataAdmissao
5664,João Silva Santos,Tecnologia da Informação,2020-01-15
```

**Observações:**
- Não incluir campo `id` (gerado automaticamente)
- Não incluir arrays JSON (afastamentos, habilidades) - estes devem ser associados via UI após a carga inicial
- Formato de data: YYYY-MM-DD
- Matricula deve ser única

---

### exemplo-aplicacoes.csv
**Campos obrigatórios:** `sigla`, `descricao`, `urlDocumentacao`, `tipoAplicacao`, `faseCicloVida`, `criticidadeNegocio`

**Campos opcionais:** `categoriaSistema`, `fornecedor`, `tipoHospedagem`, `cloudProvider`, `custoMensal`, `numeroUsuarios`, `dataImplantacao`, `versaoAtual`, `responsavelTecnico`, `responsavelNegocio`, `statusOperacional`, `observacoes`

**Estrutura do arquivo:**
```csv
sigla,descricao,urlDocumentacao,tipoAplicacao,faseCicloVida,criticidadeNegocio
CRM-WEB,Sistema de gestão de relacionamento com clientes,https://docs.empresa.com/crm,INTERNO,Produção,Média
```

**Valores válidos:**
- **tipoAplicacao**: INTERNO, EXTERNO
- **faseCicloVida**: Planejamento, Desenvolvimento, Homologação, Produção, Manutenção, Descomissionamento
- **criticidadeNegocio**: Baixa, Média, Alta, Muito Alta, Crítica

**Observações:**
- Não incluir campo `id` (gerado automaticamente)
- Não incluir arrays JSON (tecnologias, ambientes, capacidades, processos, integracoes, slas) - estes devem ser associados via UI após a carga inicial
- A sigla deve ter no máximo 20 caracteres
- A descrição deve ter no máximo 200 caracteres

---

### exemplo-tipos-afastamento.csv
**Campos obrigatórios:** `sigla`, `descricao`, `argumentacaoLegal`, `numeroDias`, `tipoTempo`

**Estrutura do arquivo:**
```csv
sigla,descricao,argumentacaoLegal,numeroDias,tipoTempo
FERIAS,Férias anuais remuneradas,Art. 129 da CLT - Todo empregado terá direito anualmente ao gozo de um período de férias,30,Dias
```

**Valores válidos para tipoTempo:**
- Dias
- Meses
- Anos

**Observações:**
- A sigla deve ter entre 2 e 10 caracteres alfanuméricos ou hífens
- numeroDias deve ser um número inteiro

---

### exemplo-habilidades.csv
**Campos obrigatórios:** `sigla`, `tipo`

**Campos opcionais:** `descricao`, `dominio`, `subcategoria`

**Estrutura do arquivo:**
```csv
sigla,descricao,tipo,dominio,subcategoria
JAVA,Linguagem de programação Java,Técnica,Desenvolvimento & Engenharia,Linguagens
```

**Valores válidos para tipo:**
- Técnica
- Comportamental
- Metodológica

**Valores válidos para dominio:**
- Desenvolvimento & Engenharia
- Infraestrutura & Cloud
- Gestão & Liderança
- Negócio & Produto
- Dados & Analytics

**Observações:**
- Se não informado, `descricao` será igual a `sigla`
- Se não informado, `dominio` será "Desenvolvimento & Engenharia"
- Se não informado, `subcategoria` será "Outras"

---

### exemplo-scripts.csv
**Campos obrigatórios:** `sigla`, `descricao`, `dataInicio`, `tipoScript`

**Campos opcionais:** `dataTermino`

**Estrutura do arquivo:**
```csv
sigla,descricao,dataInicio,tipoScript
SCR-AUTO-001,Script de backup automático diário,2024-01-15,Automação
```

**Valores válidos para tipoScript:**
- Automação
- Administração
- Banco de Dados
- Integração
- Testes
- Build & Deploy
- CI/CD
- Infraestrutura (IaC)
- Monitoramento
- Segurança

**Observações:**
- Formato de data: YYYY-MM-DD
- dataTermino é opcional (deixe vazio se o script ainda está ativo)

---

## 🚀 Como Usar

### 1. Preparar os Dados
- Baixe o arquivo de exemplo correspondente à entidade que deseja carregar
- Abra o arquivo em um editor de texto ou Excel
- Modifique os dados conforme necessário, mantendo a estrutura do cabeçalho
- Salve o arquivo mantendo a codificação UTF-8

### 2. Validar os Dados
Antes de carregar, verifique se:
- ✅ Todos os campos obrigatórios estão preenchidos
- ✅ As datas estão no formato YYYY-MM-DD
- ✅ Os valores enumerados (como status, tipo, etc.) correspondem aos valores válidos
- ✅ Não há IDs gerados manualmente (remova a coluna `id` se existir)
- ✅ Não há arrays JSON complexos (remova colunas como `tecnologias`, `afastamentos`, etc.)

### 3. Carregar no Sistema
1. Acesse a tela **Carga de Dados** no menu lateral
2. Clique em **Escolher arquivos** ou arraste o arquivo CSV para a área de upload
3. O sistema detectará automaticamente o tipo de entidade baseado no nome do arquivo
4. Revise os arquivos listados
5. Clique em **Processar Todos** para iniciar a importação
6. Acompanhe o log de processamento em tempo real

### 4. Verificar Resultados
- ✅ Registros importados com sucesso aparecerão com status "concluído"
- ⚠️ Erros serão listados com detalhes específicos sobre o problema
- 📝 Consulte o log para ver linha por linha o resultado da importação

---

## ⚠️ Problemas Comuns

### Erro: "Campos obrigatórios faltando"
**Solução:** Verifique se todos os campos obrigatórios estão preenchidos no CSV.

### Erro: "Sigla já cadastrada"
**Solução:** A sigla/matricula já existe no banco. Use uma sigla/matricula diferente ou atualize o registro existente via UI.

### Erro: "Dados inválidos"
**Solução:** Verifique se os valores estão nos formatos corretos (datas, números, enumerados).

### Erro: "Não foi possível detectar o tipo de entidade"
**Solução:** Renomeie o arquivo para incluir palavras-chave como "tecnologia", "colaborador", "aplicacao", etc.

---

## 📌 Boas Práticas

1. **Comece Simples**: Use os arquivos de exemplo como base e faça modificações graduais
2. **Teste com Poucos Registros**: Teste a carga com 2-3 registros antes de carregar grandes volumes
3. **Backup**: Sempre mantenha um backup dos arquivos CSV originais
4. **Encoding UTF-8**: Salve os arquivos CSV em UTF-8 para evitar problemas com caracteres especiais
5. **Relacionamentos Complexos**: Carregue primeiro as entidades base (tecnologias, colaboradores) e depois associe-as via UI
6. **Validação Incremental**: Após cada carga, valide os dados importados antes de prosseguir

---

## 🔗 Relacionamentos

Alguns relacionamentos **não podem** ser carregados via CSV e devem ser criados através da interface:

- **Tecnologias**: contratos, responsáveis, custos SaaS, manutenções
- **Colaboradores**: afastamentos, habilidades, avaliações
- **Aplicações**: tecnologias associadas, ambientes, capacidades, processos, integrações, SLAs, runbooks, servidores

**Processo recomendado:**
1. Carregue as entidades principais via CSV
2. Acesse a tela de detalhes de cada entidade
3. Adicione os relacionamentos através dos formulários específicos

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Consulte o log detalhado na tela de Carga de Dados
2. Verifique a documentação técnica das APIs em `docs/API-REFERENCIA-COMPLETA.md`
3. Revise os exemplos completos em `data-templates/README-CARGA.md`
