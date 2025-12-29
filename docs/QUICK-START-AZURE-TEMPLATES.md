# 🚀 Guia Rápido: Templates YAML/Markdown do Azure DevOps

## ✅ O que foi implementado

Na tela de **Configuração → Integrações**, no bloco **Azure DevOps**, foram adicionadas 4 cargas de arquivos para templates YAML:

1. **Pull Request** - Template para pipelines de PR
2. **Hotfix** - Template para correções urgentes
3. **Main** - Template para branch principal
4. **Develop** - Template para branch de desenvolvimento

## 📋 Como usar

### 1. Acessar a tela de configuração

Navegue até: **Menu → Configuração → Integrações**

### 2. Localizar o bloco Azure DevOps

Role a página até encontrar o card **Azure DevOps** e a seção **Templates de Pipeline YAML**

### 3. Fazer upload de um template

1. Clique no botão "Escolher arquivo" do template desejado
2. Selecione um arquivo `.yaml`, `.yml` ou `.md` (máximo 500KB)
3. O arquivo será automaticamente enviado e salvo
4. Uma mensagem de sucesso será exibida
5. O nome do arquivo aparecerá com um ✓ verde

### 4. Atualizar um template existente

- Basta fazer upload de um novo arquivo do mesmo tipo
- O template anterior será automaticamente substituído

## 🎯 Estrutura dos Templates

Cada template pode ser YAML (para pipelines) ou Markdown (para documentação):

### Template YAML
```yaml
# Exemplo básico de template
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildJob
        steps:
          - script: echo "Building..."
```

### Template Markdown
```markdown
# Pipeline de Pull Request

## Objetivo
Validar código antes do merge

## Etapas
1. Build
2. Testes
3. Validação de qualidade

## Configurações
- Node.js: 18.x
- Ambiente: Development
```

## 📊 Banco de Dados

Para criar a tabela necessária, execute o script SQL:

```bash
# Conectar ao MySQL
mysql -u app_user -p auditoria_db

# Executar o script
source database/32-create-azure-devops-templates.sql
```

Ou manualmente:

```bash
mysql -u app_user -p auditoria_db < database/32-create-azure-devops-templates.sql
```

## 🧪 Testar a funcionalidade

Execute o script de teste:

```bash
# Instalar dependências (se necessário)
npm install form-data node-fetch

# Executar testes
node scripts/test-azure-templates.js
```

## 🔌 Endpoints da API

### Upload/Atualizar Template
```bash
curl -X POST http://localhost:3000/api/azure-devops/templates \
  -F "file=@template.yml" \
  -F "templateType=pullRequest"
```

### Listar Templates
```bash
curl http://localhost:3000/api/azure-devops/templates
```

### Buscar Template Específico
```bash
curl http://localhost:3000/api/azure-devops/templates/pullRequest
```

### Deletar Template
```bash
curl -X DELETE http://localhost:3000/api/azure-devops/templates/pullRequest
```

## ⚠️ Validações

O sistema valida automaticamente:

✅ Formato do arquivo (apenas .yaml, .yml ou .md)  
✅ Tamanho máximo (500KB)  
✅ Conteúdo não vazio  
✅ Tipo de template válido  

## 🎨 Interface Visual

A seção de templates está integrada ao bloco Azure DevOps com:

- **Grid 2x2** para os 4 tipos de templates
- **Inputs de arquivo** estilizados
- **Indicador visual** (✓ verde) para templates carregados
- **Tooltip informativo** explicando cada tipo
- **Card de informações** com dicas sobre os templates

## 📝 Arquivos Modificados/Criados

### Frontend
- ✅ `src/components/ConfiguracaoIntegracoesView.tsx` - Interface visual e lógica

### Backend
- ✅ `server/api.js` - Endpoints da API e validações

### Banco de Dados
- ✅ `database/32-create-azure-devops-templates.sql` - Schema e dados iniciais

### Documentação
- ✅ `docs/README-AZURE-DEVOPS-TEMPLATES.md` - Documentação completa
- ✅ `docs/QUICK-START-AZURE-TEMPLATES.md` - Este guia rápido

### Scripts
- ✅ `scripts/test-azure-templates.js` - Testes automatizados

## 🐛 Troubleshooting

### Erro: "Servidor não está rodando"
```bash
# Iniciar o servidor
npm run dev
```

### Erro: "Tabela não existe"
```bash
# Criar a tabela
mysql -u app_user -p auditoria_db < database/32-create-azure-devops-templates.sql
```

### Erro: "Arquivo muito grande"
- O tamanho máximo é 500KB
- Comprima ou simplifique o template

### Erro: "Formato inválido"
- Apenas arquivos .yaml, .yml ou .md são aceitos
- Verifique a extensão do arquivo

## 📚 Próximos Passos

1. **Upload dos templates reais** da sua organização
2. **Testar os templates** no Azure DevOps
3. **Ajustar validações** conforme necessário
4. **Integrar com wizard** de criação de pipelines (se houver)

## 💡 Dicas

- Mantenha templates simples e reutilizáveis
- Use variáveis para valores que mudam frequentemente
- Documente parâmetros e configurações
- Versione seus templates (comentários no YAML)
- Teste templates em ambiente de desenvolvimento primeiro

## 🔗 Links Úteis

- [Documentação Completa](./README-AZURE-DEVOPS-TEMPLATES.md)
- [Azure DevOps YAML Schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [Pipeline Triggers](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers)

---

**Implementado em**: 29 de dezembro de 2025  
**Versão**: 1.0.0
