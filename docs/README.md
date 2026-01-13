# 📚 Documentação CodeWiki

Esta pasta contém toda a documentação do projeto CodeWiki, organizada para uso com [MkDocs](https://www.mkdocs.org/).

## 🎯 Estrutura

```
docs/
├── index.md                     # 🏠 Página inicial (obrigatória)
├── INDEX.md                     # 📋 Índice completo de navegação
├── PROJECT-CONVENTIONS.md       # 📐 Convenções do projeto
│
├── deployment/                  # 🚀 Deploy e produção
├── guides/                      # 📖 Guias e tutoriais
├── issues/                      # 🐛 Problemas e soluções
├── setup/                       # ⚙️ Configuração e instalação
├── api-catalog/                 # 🔌 Catálogo de APIs
├── data-templates/              # 📦 Templates de dados
├── runbooks/                    # 📚 Runbooks operacionais
│
├── javascripts/                 # Scripts JS para MkDocs
├── styles/                      # CSS customizado
└── theme/                       # Tema customizado
```

## 🚀 Visualizar Documentação

### Localmente

```bash
# Iniciar servidor MkDocs
docker-compose up mkdocs

# Acessar em http://localhost:8082
```

### Build Estático

```bash
# Gerar site estático
docker-compose run --rm mkdocs mkdocs build

# Arquivos gerados em: site/
```

## 📝 Criar Novo Documento

### Usando o Script Helper

```bash
# Sintaxe
./create-doc.sh <categoria> <nome-do-arquivo>

# Exemplos
./create-doc.sh deployment DEPLOY-AWS
./create-doc.sh guides GUIDE-API-USAGE
./create-doc.sh setup SETUP-DATABASE
```

### Manualmente

1. **Criar arquivo** na pasta apropriada:
   ```bash
   touch docs/setup/NOME-DO-DOCUMENTO.md
   ```

2. **Adicionar front matter**:
   ```markdown
   ---
   title: Título do Documento
   description: Breve descrição
   tags:
     - categoria
   ---
   ```

3. **Adicionar ao mkdocs.yml**:
   ```yaml
   nav:
     - "⚙️ Setup":
         - "Nome": "setup/NOME-DO-DOCUMENTO.md"
   ```

4. **Testar**:
   ```bash
   docker-compose up mkdocs
   ```

## 📐 Convenções

### Nomenclatura de Arquivos

- **Formato**: `NOME-DO-ARQUIVO.md` (UPPER-KEBAB-CASE)
- **Prefixos comuns**:
  - `GUIDE-` - Guias e tutoriais
  - `SETUP-` - Instruções de setup
  - `DEPLOY-` - Documentação de deploy
  - `ISSUE-` - Problemas e soluções

### Categorias

| Categoria | Pasta | Uso |
|-----------|-------|-----|
| 🚀 Deploy | `deployment/` | Deploy, produção, Docker |
| 📖 Guias | `guides/` | Tutoriais, HOWTOs |
| 🐛 Issues | `issues/` | Troubleshooting |
| ⚙️ Setup | `setup/` | Configuração, instalação |
| 🔌 APIs | `api-catalog/` | Especificações de API |
| 📦 Templates | `data-templates/` | Templates de dados |
| 📚 Runbooks | `runbooks/` | Procedimentos operacionais |
| 📄 Geral | `docs/` (raiz) | Documentação geral |

### Links Internos

Use caminhos relativos:

```markdown
# ✅ Correto
[Outro Doc](../setup/LGPD-SETUP.md)
[API Reference](API-REFERENCIA-COMPLETA.md)

# ❌ Incorreto
[Outro Doc](/setup/LGPD-SETUP.md)
[API Reference](../../API-REFERENCIA-COMPLETA.md)
```

## 🎨 Recursos Markdown

### Admonitions (Alertas)

```markdown
!!! note "Nota"
    Informação importante

!!! warning "Atenção"
    Cuidado!

!!! tip "Dica"
    Melhor prática
```

### Tabs

```markdown
=== "Python"
    ```python
    print("Hello")
    ```

=== "JavaScript"
    ```javascript
    console.log("Hello");
    ```
```

### Mermaid Diagrams

```markdown
\`\`\`mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
```

### Code Highlighting

```markdown
\`\`\`python title="exemplo.py" linenums="1"
def hello():
    print("Hello World")
\`\`\`
```

## 🔍 Verificação

### Verificar Sintaxe

```bash
# Build estrito (falha em warnings)
docker-compose run --rm mkdocs mkdocs build --strict
```

### Verificar Links

```bash
# Procurar links quebrados
grep -r "](../" docs/ | grep -v ".git"
```

### Verificar Arquivos Órfãos

```bash
# Listar arquivos não referenciados no mkdocs.yml
find docs/ -name "*.md" -type f | while read file; do
  if ! grep -q "${file#docs/}" mkdocs.yml; then
    echo "⚠️  Não referenciado: $file"
  fi
done
```

## 📚 Recursos

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [PyMdown Extensions](https://facelessuser.github.io/pymdown-extensions/)
- [PROJECT-CONVENTIONS.md](PROJECT-CONVENTIONS.md) - Convenções completas

## 🤝 Contribuindo

1. Leia [PROJECT-CONVENTIONS.md](PROJECT-CONVENTIONS.md)
2. Crie seu documento seguindo as convenções
3. Adicione ao `mkdocs.yml`
4. Teste localmente
5. Faça pull request

---

**Última atualização**: 12 de Janeiro de 2026  
**Mantenedor**: Equipe de Desenvolvimento
