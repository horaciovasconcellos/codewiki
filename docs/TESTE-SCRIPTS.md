# 🧪 Teste da Tela de Scripts

## ✅ Correções Implementadas

### 1. **ScriptWizard.tsx**
- Adicionado validação explícita para enviar apenas objetos `File`
- Adicionados logs detalhados no `handleSubmit`
- Corrigida lógica para não enviar `undefined` desnecessariamente

### 2. **ScriptsView.tsx**
- Reorganizada lógica para determinar URL e método antes da verificação de arquivo
- Melhorados logs com emojis para facilitar debug (✅, ❌, ℹ️)
- Adicionadas informações detalhadas sobre o arquivo sendo enviado

### 3. **server/api.js**
- Adicionados logs detalhados no endpoint `POST /api/scripts`
- Logs com emojis para facilitar identificação do fluxo
- Melhor tratamento e retorno de erros

## 🔍 Fluxo de Upload

### **Com Arquivo:**
1. Usuário seleciona arquivo no `ScriptWizard`
2. `handleSubmit` valida se é um objeto `File` válido
3. `ScriptsView.handleScriptSave` cria `FormData`:
   - Campo `arquivo`: o File object
   - Campo `data`: JSON string com os dados do script
4. Backend recebe via multer e processa

### **Sem Arquivo:**
1. Usuário não seleciona arquivo ou remove o arquivo
2. `handleSubmit` não passa arquivo para `onSave`
3. `ScriptsView.handleScriptSave` envia apenas JSON
4. Backend insere no banco sem campos de arquivo

## 📋 Casos de Teste

### Teste 1: Criar Script COM Arquivo
```
Sigla: SCR-TEST-001
Descrição: Script de teste com arquivo
Data Início: 2026-01-02
Tipo: Automação
Arquivo: [Selecionar um arquivo .sh ou .py]
```

**Resultado Esperado:**
- ✅ Script criado com sucesso
- ✅ Arquivo salvo em `uploads/scripts/`
- ✅ Arquivo visível na tabela (com ícone e nome clicável)
- ✅ Logs mostram "✅ BRANCH: Com arquivo (FormData)"

### Teste 2: Criar Script SEM Arquivo
```
Sigla: SCR-TEST-002
Descrição: Script de teste sem arquivo
Data Início: 2026-01-02
Tipo: Administração
Arquivo: [Não selecionar]
```

**Resultado Esperado:**
- ✅ Script criado com sucesso
- ✅ Campo arquivo mostra "-" na tabela
- ✅ Logs mostram "ℹ️ BRANCH: Sem arquivo novo (JSON)"

### Teste 3: Editar Script MANTENDO Arquivo
```
1. Editar um script existente que já tem arquivo
2. NÃO selecionar novo arquivo
3. Alterar apenas a descrição
```

**Resultado Esperado:**
- ✅ Script atualizado
- ✅ Arquivo original PRESERVADO
- ✅ Descrição atualizada

### Teste 4: Editar Script SUBSTITUINDO Arquivo
```
1. Editar um script existente que já tem arquivo
2. Selecionar novo arquivo
3. Salvar
```

**Resultado Esperado:**
- ✅ Script atualizado
- ✅ Novo arquivo salvo
- ✅ Novo arquivo visível na tabela

### Teste 5: Validações
```
Tentar criar script:
- Sem sigla
- Sem descrição
- Sem data de início
- Sem tipo
- Com data término < data início
```

**Resultado Esperado:**
- ❌ Toast de erro para cada validação
- ❌ Não permitir salvar

## 🐛 Debug

### Console do Browser (DevTools)
Verificar os logs:
```
[ScriptWizard] handleSubmit - Script: {...}
[ScriptWizard] handleSubmit - Arquivo: teste.sh (1234 bytes)
[ScriptsView] handleScriptSave - Início
[ScriptsView] ✅ BRANCH: Com arquivo (FormData)
```

### Console do Servidor (Terminal)
Verificar os logs:
```
[POST /api/scripts] ====== INÍCIO ======
[POST /api/scripts] req.file: teste.sh (1234 bytes)
[POST /api/scripts] ✅ BRANCH: Com arquivo
[POST /api/scripts] ✅ Inserido COM arquivo
[POST /api/scripts] ====== FIM ======
```

## 📁 Estrutura de Arquivos

```
uploads/
  scripts/
    1704207600000-123456789-teste.sh
    1704207700000-987654321-deploy.sh
    ...
```

## 🔗 Referências

- Template CSV: `data-templates/scripts.csv`
- Template JSON: `data-templates/scripts-carga.json`
- Exemplo simplificado: `data-templates/exemplo-scripts.csv`
- README: `data-templates/README-SCRIPTS.md`

## ✨ Tipos de Script Disponíveis

1. Automação
2. Administração
3. Banco de Dados
4. Integração
5. Testes
6. Build & Deploy
7. CI/CD
8. Infraestrutura (IaC)
9. Monitoramento
10. Segurança
11. Governança
12. Dados
13. ERP
14. Documentação

## 🎯 Status

**TELA COMPLETA E FUNCIONAL** ✅

- ✅ Criação com arquivo
- ✅ Criação sem arquivo
- ✅ Edição preservando arquivo
- ✅ Edição substituindo arquivo
- ✅ Visualização de detalhes
- ✅ Visualização de conteúdo do arquivo
- ✅ Download de arquivo
- ✅ Deleção
- ✅ Filtros e busca
- ✅ Validações
- ✅ Logs detalhados
