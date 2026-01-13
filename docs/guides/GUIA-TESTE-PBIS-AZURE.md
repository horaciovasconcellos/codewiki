# Guia: Testar Criação de PBIs e Tasks no Azure DevOps

## ✅ Status Atual

### Projeto Configurado Corretamente
- **Nome:** TODOS-JUNTOS
- **ID:** projeto-1767892009925
- **Aplicação Base ID:** 09490777-a5db-4f8a-aeed-e4e68dec8f71

### Projeto SPEC-KIT Correspondente
- **Nome:** TODOS-JUNTOS  
- **ID:** 343629cc-0abb-4280-8ac8-fef948af7143
- **Aplicação ID:** 09490777-a5db-4f8a-aeed-e4e68dec8f71
- **Gerador de Projetos:** ✅ ATIVO

### Work Items que Serão Criados
- **2 PBIs** (Product Backlog Items) - Requisitos com status "PRONTO P/DEV"
- **3 Tasks** - Tarefas com status "TO DO"

#### Detalhes dos PBIs:

**PBI 1:**
- Title: `REQ-001 - RF-001: Campo Nome do Projeto`
- Description: Input de texto obrigatório, Limite máximo de 200 caracteres, Validação: não permite caracteres especiais
- **2 Tasks:**
  1. `REQ-001 - 1 : Estrutura da Datatable de Requisitos...`
  2. `REQ-001 - 2 : Regras: Um requisito em BACKLOG só pode avançar...`

**PBI 2:**
- Title: `REQ-002 - RF-002: Seleção de Aplicação`
- Description: Componente: ListBox, Tipo: Seleção única obrigatória...
- **1 Task:**
  1. `REQ-002 - 1 : Regras: Ao aplicar um status especial...`

---

## 📋 Passo a Passo para Testar

### 1. Acessar o Sistema
1. Abra o navegador em: http://localhost:5173
2. Faça login se necessário

### 2. Navegar para Gerador de Projetos
1. No menu lateral, clique em **"Gerador de Projetos"**
2. Localize o projeto **"TODOS-JUNTOS"**

### 3. Integrar com Azure DevOps
1. Clique no botão de **"Integrar ao Azure DevOps"** do projeto TODOS-JUNTOS
2. O sistema irá:
   - Criar o projeto no Azure DevOps (se não existir)
   - Criar o time
   - Criar as iterações (sprints)
   - **Buscar o projeto SPEC-KIT correspondente**
   - **Criar 2 PBIs dos requisitos "PRONTO P/DEV"**
   - **Criar 3 Tasks associadas aos PBIs**

### 4. Acompanhar Logs
Abra um terminal e execute:
```bash
docker logs -f auditoria-app | grep "AZURE INTEGRAÇÃO"
```

Você verá logs detalhados como:
```
[AZURE INTEGRAÇÃO] Step 14: Verificando projeto SPEC-KIT associado...
[AZURE INTEGRAÇÃO] Step 14: Projetos SPEC-KIT encontrados: 1
[AZURE INTEGRAÇÃO] Projeto SPEC-KIT encontrado: ID=343629cc-0abb-4280-8ac8-fef948af7143
[AZURE INTEGRAÇÃO] Total de requisitos no projeto: 3
[AZURE INTEGRAÇÃO] Status dos requisitos:
[AZURE INTEGRAÇÃO]   - REQ-001: RF-001: Campo Nome do Projeto (Status: PRONTO P/DEV)
[AZURE INTEGRAÇÃO]   - REQ-002: RF-002: Seleção de Aplicação (Status: PRONTO P/DEV)
[AZURE INTEGRAÇÃO]   - REQ-003: RF-003: Seleção de IA (Status: BACKLOG)
[AZURE INTEGRAÇÃO] Requisitos com status 'PRONTO P/DEV' encontrados: 2
[AZURE INTEGRAÇÃO] Processando Requisito: REQ-001 - RF-001: Campo Nome do Projeto
[AZURE INTEGRAÇÃO] ✅ PBI criado com sucesso: ID=123
[AZURE INTEGRAÇÃO]   ✅ Task criada com sucesso: ID=124
[AZURE INTEGRAÇÃO]   ✅ Task criada com sucesso: ID=125
[AZURE INTEGRAÇÃO] Processando Requisito: REQ-002 - RF-002: Seleção de Aplicação
[AZURE INTEGRAÇÃO] ✅ PBI criado com sucesso: ID=126
[AZURE INTEGRAÇÃO]   ✅ Task criada com sucesso: ID=127
[AZURE INTEGRAÇÃO] ✅ Criados 2 PBIs e 3 Tasks do SPEC-KIT
```

### 5. Verificar no Azure DevOps
1. Acesse sua organização no Azure DevOps
2. Abra o projeto **"TODOS-JUNTOS"**
3. Vá para **Boards** > **Work Items**
4. Você deverá ver:
   - 2 Product Backlog Items (PBIs)
   - 3 Tasks vinculadas aos PBIs

---

## 🔍 Troubleshooting

### Se os PBIs não forem criados:

1. **Verificar logs detalhados:**
   ```bash
   docker logs auditoria-app | grep -A 20 "Step 14"
   ```

2. **Verificar se a correspondência está correta:**
   ```bash
   node debug-spec-kit-azure.cjs
   ```
   - Deve mostrar "✅ CORRESPONDÊNCIA ENCONTRADA"

3. **Verificar configurações do Azure:**
   - Menu lateral > **Configurações** > **Integrações**
   - Certifique-se que:
     - URL da Organização está correta
     - Personal Access Token (PAT) tem permissões de Work Items

4. **Verificar status dos requisitos:**
   - No Spec-Kit, abra o projeto TODOS-JUNTOS
   - Verifique se os requisitos estão com status **"PRONTO P/DEV"**
   - Verifique se as tarefas estão com status **"TO DO"**

### Se houver erros de permissão no Azure:

O PAT precisa das seguintes permissões:
- ✅ Work Items: Read, Write, & Manage
- ✅ Project and Team: Read
- ✅ Analytics: Read

---

## 📊 Regras Implementadas

### Para PBIs:
- ✅ Apenas requisitos com status = **"PRONTO P/DEV"**
- ✅ Title: `{SEQUENCIA} - {NOME}`
- ✅ Description: `{DESCRIÇÃO do requisito}`
- ✅ State: `Approved`
- ✅ Tags: `PRONTO P/DEV`

### Para Tasks:
- ✅ Apenas tarefas com status = **"TO DO"**
- ✅ Title: `{SEQUENCIA_REQUISITO} - {NUMERO_SEQUENCIAL} : {DESCRICAO}`
- ✅ Description: `{DESCRIÇÃO da tarefa}`
- ✅ State: `New`
- ✅ Ordenadas por `data_inicio`
- ✅ Associadas ao PBI pai

---

## ✅ Correções Aplicadas

1. ✅ Corrigido nome das tabelas: `sdd_projetos` → `projetos_sdd`, etc.
2. ✅ Associado projeto TODOS-JUNTOS com aplicação correta
3. ✅ Adicionados logs detalhados de debug
4. ✅ Implementadas regras de filtro por status
5. ✅ Servidor reiniciado com as alterações

---

## 🎯 Próximos Passos

1. Execute a integração do projeto TODOS-JUNTOS
2. Observe os logs
3. Verifique os Work Items no Azure DevOps
4. Se tudo estiver correto, você pode criar mais requisitos e tarefas no Spec-Kit
5. Ao integrar novamente, apenas os novos items "PRONTO P/DEV" e "TO DO" serão criados

Boa sorte! 🚀
