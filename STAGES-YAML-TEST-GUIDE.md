# 🧪 Guia de Teste - Persistência de YAML em Stages

## ✅ Problema Corrigido

O sistema agora salva e recupera corretamente o conteúdo YAML dos stages.

### Mudanças Implementadas:

1. **Frontend (StageWizard.tsx)**:
   - ✅ Adicionado console.log para debug ao salvar e carregar
   - ✅ Campo `yamlContent` incluído no payload de salvamento
   - ✅ YAML carregado automaticamente ao editar um stage

2. **Frontend (StagesView.tsx)**:
   - ✅ **FIX PRINCIPAL**: `handleEdit` agora busca dados completos do stage via GET `/api/stages/:id`
   - ✅ Antes: passava apenas o stage da listagem (sem yamlContent completo)
   - ✅ Agora: busca o stage individual com todos os campos

3. **Backend (server/api.js)**:
   - ✅ GET `/api/stages` - retorna yamlContent na listagem
   - ✅ GET `/api/stages/:id` - retorna yamlContent do stage específico
   - ✅ POST `/api/stages` - salva yaml_content ao criar
   - ✅ PUT `/api/stages/:id` - atualiza yaml_content ao editar

4. **Database**:
   - ✅ Coluna `yaml_content` (TEXT) existente e funcionando

---

## 🧪 Como Testar

### Teste 1: Criar novo stage com YAML

1. Acesse a tela de **Stages**
2. Clique em **"Novo Stage"**
3. Vá até a seção **"Importar configuração YAML"**
4. Clique em **"Upload YAML"** e selecione: `examples/stage-test-yaml.yaml`
5. O YAML deve aparecer na textarea com indicador verde ✓
6. Os campos do formulário devem ser preenchidos automaticamente:
   - Nome: "Test Stage com YAML"
   - Tipo: "Test"
   - Descrição: "Stage de teste para validar persistência de YAML"
   - Timeout: 1800
7. Abra o **Console do navegador** (F12)
8. Clique em **"Salvar"**
9. Verifique no console:
   ```
   🔍 Salvando stage: {
     url: "http://localhost:3000/api/stages",
     method: "POST",
     payload: { ..., yamlContent: "name: Test Stage com YAML\n..." },
     yamlLength: 425
   }
   ```
10. ✅ **Sucesso esperado**: Toast verde "Stage criado com sucesso"

### Teste 2: Editar stage e verificar recuperação do YAML

1. Na listagem de Stages, clique em **"Editar"** no stage criado
2. Verifique no console:
   ```
   🔍 Stage completo carregado: { ..., yamlContent: "name: Test Stage com YAML\n..." }
   🔍 Carregando stage: { ..., yamlContent: "..." }
   🔍 YAML encontrado: name: Test Stage com YAML\ntype: Test\n...
   ```
3. A **textarea de YAML** deve mostrar o conteúdo completo salvo anteriormente
4. O indicador verde ✓ deve aparecer
5. ✅ **Sucesso esperado**: YAML visível e editável

### Teste 3: Modificar YAML e salvar novamente

1. Com o stage em edição, modifique o YAML na textarea:
   ```yaml
   name: Test Stage MODIFICADO
   type: Test
   description: Descrição atualizada via YAML
   timeout: 2400
   reusable: false
   ```
2. O formulário deve atualizar automaticamente
3. Clique em **"Salvar"**
4. Verifique no console o payload com yamlContent atualizado
5. Feche e edite novamente o stage
6. ✅ **Sucesso esperado**: YAML modificado persiste

### Teste 4: Digitar YAML manualmente (sem upload)

1. Crie um **novo stage**
2. **Digite** diretamente na textarea:
   ```yaml
   nome: Stage Manual
   tipo: Build
   descricao: Criado digitando YAML
   timeoutSeconds: 3600
   reutilizavel: true
   ```
3. Observe a validação em tempo real
4. Indicador verde deve aparecer
5. Campos do formulário devem atualizar (suporta campos em português!)
6. Salve o stage
7. Edite novamente
8. ✅ **Sucesso esperado**: YAML digitado é salvo e recuperado

### Teste 5: Verificar no banco de dados

Execute no terminal:
```bash
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db \
  -e "SELECT id, nome, LEFT(yaml_content, 100) as yaml_preview, CHAR_LENGTH(yaml_content) as yaml_length FROM stages WHERE yaml_content IS NOT NULL;" \
  2>&1 | grep -v Warning
```

✅ **Resultado esperado**:
```
id      nome    yaml_preview    yaml_length
<uuid>  Test Stage com YAML     name: Test Stage com YAML\ntype: Test\n...  425
<uuid>  Stage Manual            nome: Stage Manual\ntipo: Build\n...        123
```

---

## 🐛 Debug - Console Logs Disponíveis

### Ao carregar stage para edição:
```javascript
🔍 Stage completo carregado: { id, nome, yamlContent, ... }
🔍 Carregando stage: { ... }
🔍 YAML encontrado: name: Test Stage...
// OU
⚠️ Stage não possui YAML salvo
```

### Ao salvar:
```javascript
🔍 Salvando stage: {
  url: "http://localhost:3000/api/stages/<id>",
  method: "PUT",
  payload: { nome, descricao, yamlContent, tipo, ... },
  yamlLength: 425
}
```

---

## 📋 Checklist de Validação

- [ ] Criar stage com upload de arquivo YAML ✓
- [ ] Formulário preenchido automaticamente pelo YAML ✓
- [ ] YAML salvo no banco de dados ✓
- [ ] YAML recuperado ao editar stage ✓
- [ ] Modificar YAML e salvar novamente ✓
- [ ] Digitar YAML manualmente (sem upload) ✓
- [ ] Validação em tempo real funcionando ✓
- [ ] Suporte para campos em português e inglês ✓
- [ ] Console logs mostrando dados corretos ✓
- [ ] Banco de dados contém yaml_content preenchido ✓

---

## 🎯 Campos YAML Suportados (Bilíngue)

O sistema reconhece automaticamente campos em **inglês** ou **português**:

| Inglês | Português | Campo no Formulário |
|--------|-----------|---------------------|
| `name` | `nome` | Nome |
| `type` | `tipo` | Tipo |
| `description` | `descricao` | Descrição |
| `timeout` | `timeoutSeconds` | Timeout (segundos) |
| `reusable` | `reutilizavel` | Stage reutilizável |

---

## 🔧 Troubleshooting

### YAML não aparece ao editar
- ✅ **Corrigido**: `handleEdit` agora busca stage completo via API
- Verifique console: deve mostrar "🔍 YAML encontrado"

### YAML não é salvo
- Verifique console ao salvar: `yamlLength` deve ser > 0
- Confira se servidor está rodando na porta 3000
- Teste endpoint direto: `curl http://localhost:3000/api/stages/<id>`

### Validação falha
- YAML deve ser válido (use yamllint.com para verificar)
- Sistema aceita YAML válido mesmo sem campos reconhecidos (mostra aviso amarelo)

---

## ✨ Funcionalidades YAML

- ✅ **Upload de arquivo** (.yaml, .yml)
- ✅ **Edição manual** na textarea (font monospace)
- ✅ **Validação em tempo real** com js-yaml
- ✅ **Auto-preenchimento** do formulário
- ✅ **Persistência** no banco de dados (coluna yaml_content)
- ✅ **Recuperação** ao editar stage existente
- ✅ **Suporte bilíngue** (EN/PT-BR)
- ✅ **Indicadores visuais** (verde=válido, vermelho=erro, amarelo=aviso)

---

## 📚 Exemplos de YAML

Disponíveis em `/examples/`:
- `stage-example.yaml` - Build básico
- `stage-deploy.yaml` - Deploy Kubernetes
- `stage-security.yaml` - Security Analysis
- `stage-test-yaml.yaml` - Teste de persistência (novo!)
