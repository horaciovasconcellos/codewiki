# 🔧 Troubleshooting - Templates Azure DevOps

## ✅ Problema Resolvido

O erro ao carregar arquivos era causado pela **ausência da tabela `azure_devops_templates`** no banco de dados.

### Solução Aplicada

1. **Criação da tabela**: Executado script SQL `32-create-azure-devops-templates.sql`
2. **Melhorias no código**:
   - Adicionada tipagem explícita na função `handleTemplateUpload`
   - Melhorado tratamento de erros com mensagens mais específicas
   - Criado script de verificação (`check-templates-table.js`)

---

## 🚀 Como Resolver o Erro

Se você encontrar o erro ao carregar templates, siga estes passos:

### Passo 1: Verificar se a tabela existe

```bash
node scripts/check-templates-table.js
```

**Resultado esperado:**
```
✓ Tabela azure_devops_templates existe!
Templates cadastrados: 4
```

### Passo 2: Criar a tabela (se não existir)

**Para MySQL no Docker:**
```bash
docker exec -i mysql-master mysql -u app_user -papppass123 auditoria_db < database/32-create-azure-devops-templates.sql
```

**Para MySQL local:**
```bash
mysql -u app_user -p auditoria_db < database/32-create-azure-devops-templates.sql
```

### Passo 3: Verificar novamente

```bash
node scripts/check-templates-table.js
```

---

## 🔍 Diagnóstico de Problemas

### Erro: "Arquivo não fornecido"

**Causa**: O arquivo não chegou ao servidor

**Soluções**:
1. Verifique o console do navegador (F12)
2. Confirme que o arquivo tem extensão válida (.yaml, .yml, .md)
3. Verifique o tamanho do arquivo (máximo 500KB)

### Erro: "Tabela não existe"

**Causa**: Tabela `azure_devops_templates` não foi criada

**Solução**: Execute o script SQL conforme Passo 2 acima

### Erro: "Access denied"

**Causa**: Credenciais do banco incorretas

**Soluções**:
1. Verifique as variáveis de ambiente no `.env`
2. Confirme usuário e senha do MySQL
3. Verifique se o usuário tem permissões na base `auditoria_db`

### Erro: "Connection refused"

**Causa**: Banco de dados não está acessível

**Soluções**:
1. Verifique se o MySQL está rodando: `docker ps | grep mysql`
2. Inicie o Docker: `docker-compose up -d`
3. Verifique os logs: `docker logs mysql-master`

### Erro: "Erro ao enviar template"

**Causa**: Erro genérico no backend

**Diagnóstico**:
1. Abra o console do navegador (F12)
2. Veja a mensagem de erro específica
3. Verifique os logs do servidor Node.js
4. Use o script de teste: `node scripts/test-azure-templates.js`

---

## 📊 Scripts de Diagnóstico

### 1. Verificar Tabela
```bash
node scripts/check-templates-table.js
```

### 2. Testar API
```bash
node scripts/test-azure-templates.js
```

### 3. Verificar MySQL
```bash
docker exec mysql-master mysql -u app_user -papppass123 -e "SHOW TABLES FROM auditoria_db LIKE 'azure%'"
```

### 4. Ver Templates Existentes
```bash
docker exec mysql-master mysql -u app_user -papppass123 auditoria_db -e "SELECT template_type, file_name FROM azure_devops_templates"
```

---

## 🔧 Comandos Úteis

### Resetar Tabela
```bash
docker exec mysql-master mysql -u app_user -papppass123 auditoria_db -e "DROP TABLE IF EXISTS azure_devops_templates"
docker exec -i mysql-master mysql -u app_user -papppass123 auditoria_db < database/32-create-azure-devops-templates.sql
```

### Ver Estrutura da Tabela
```bash
docker exec mysql-master mysql -u app_user -papppass123 auditoria_db -e "DESCRIBE azure_devops_templates"
```

### Limpar Todos os Templates
```bash
docker exec mysql-master mysql -u app_user -papppass123 auditoria_db -e "TRUNCATE TABLE azure_devops_templates"
```

### Fazer Backup dos Templates
```bash
docker exec mysql-master mysqldump -u app_user -papppass123 auditoria_db azure_devops_templates > backup-templates.sql
```

---

## 🐛 Debug no Frontend

### Abrir DevTools
1. Pressione `F12` ou `Cmd+Option+I` (Mac)
2. Vá para a aba **Console**
3. Vá para a aba **Network** para ver requisições

### Logs Importantes
No console, procure por:
- `Erro ao carregar template:` - Erro genérico
- `template-upload-success` - Upload bem-sucedido
- `template-upload-error` - Erro específico

### Verificar Requisição
Na aba **Network**:
1. Faça upload de um template
2. Procure por `templates` na lista
3. Clique para ver detalhes (Headers, Payload, Response)

---

## 📝 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] MySQL está rodando (`docker ps`)
- [ ] Tabela existe (`node scripts/check-templates-table.js`)
- [ ] Servidor Node.js está rodando (`npm run dev`)
- [ ] Arquivo tem extensão válida (.yaml, .yml, .md)
- [ ] Arquivo tem menos de 500KB
- [ ] Arquivo não está vazio
- [ ] Console do navegador não mostra erros
- [ ] Variáveis de ambiente estão corretas

---

## 💡 Melhorias Implementadas

### Frontend
✅ Tipagem explícita em `handleTemplateUpload`  
✅ Mensagens de erro mais detalhadas  
✅ Validação de resposta da API aprimorada  

### Backend
✅ Suporte para arquivos Markdown (.md)  
✅ Validações mais robustas  
✅ Mensagens de erro específicas  

### Scripts
✅ `check-templates-table.js` - Verificação rápida  
✅ `test-azure-templates.js` - Testes automatizados  

### Banco de Dados
✅ Tabela criada com sucesso  
✅ 4 templates de exemplo incluídos  
✅ Índices para performance  

---

## 📞 Suporte

Se o problema persistir:

1. **Verificar logs do servidor**:
   ```bash
   # Ver logs do MySQL
   docker logs mysql-master
   
   # Ver logs do Node.js (se rodando em background)
   pm2 logs
   ```

2. **Coletar informações**:
   - Output do `check-templates-table.js`
   - Logs do console do navegador
   - Mensagem de erro completa
   - Screenshot (se aplicável)

3. **Testar com curl**:
   ```bash
   curl -X POST http://localhost:3000/api/azure-devops/templates \
     -F "file=@data-templates/azure-devops-templates/template-pull-request.yml" \
     -F "templateType=pullRequest"
   ```

---

**Última atualização**: 29 de dezembro de 2025  
**Status**: ✅ Problema resolvido
