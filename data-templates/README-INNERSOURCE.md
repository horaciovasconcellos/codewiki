# README - Projetos InnerSource

## 📖 Sobre

Esta funcionalidade permite gerenciar projetos InnerSource da organização de forma centralizada, facilitando a descoberta, documentação e promoção de iniciativas de código aberto interno.

## 🎯 Modelo de Dados (repos.json)

O arquivo `data-templates/repos.json` contém exemplos de projetos InnerSource seguindo o padrão completo. Use-o como referência para cadastrar novos projetos.

### Estrutura de um Projeto

```json
{
  "id": "innersource-001",
  "nome": "frontend-library",
  "full_nome": "myorg/frontend-library",
  "html_url": "https://github.com/myorg/frontend-library",
  "descricao": "Biblioteca de componentes React compartilhados",
  "stargazers_count": 45,
  "watchers_count": 12,
  "language": "TypeScript",
  "forks_count": 8,
  "open_issues_count": 3,
  "license": "MIT",
  "owner": {
    "login": "myorg",
    "avatar_url": "https://avatars.githubusercontent.com/u/123456",
    "html_url": "https://github.com/myorg",
    "type": "Organization"
  },
  "_InnerSourceMetadata": {
    "logo": "data:image/png;base64,...",
    "topics": ["react", "typescript", "components"],
    "participation": {
      "contributors_count": 15,
      "commits_last_year": 234,
      "pull_requests_count": 67
    },
    "description_extended": "Descrição detalhada...",
    "documentation": "https://docs.example.com",
    "contribution_guidelines": "https://github.com/.../CONTRIBUTING.md",
    "maturity": "mature",
    "contact": "slack://frontend-team",
    "last_sync": "2025-12-31T10:00:00.000Z"
  }
}
```

## 🚀 Como Usar

### 1. Acessar a Tela
- No menu lateral, clique em **Azure DevOps** → **Projetos InnerSource**

### 2. Cadastrar Novo Projeto

#### Opção A: Busca Automática (Recomendado)
1. Clique em **"Novo Projeto"**
2. Cole a URL do repositório GitHub no campo **"URL do Repositório"**
3. Clique em **"Buscar Dados"**
4. O sistema irá:
   - Buscar informações do repositório na API do GitHub
   - Preencher automaticamente os campos básicos
   - Carregar estatísticas atualizadas
   - Importar tópicos (topics)
5. Complete os campos de metadados InnerSource:
   - Upload do logo (opcional)
   - Descrição estendida
   - Links de documentação
   - Nível de maturidade
   - Canal de contato
6. Clique em **"Salvar Projeto"**

#### Opção B: Cadastro Manual
1. Clique em **"Novo Projeto"**
2. Preencha manualmente todos os campos obrigatórios
3. Adicione estatísticas e metadados
4. Upload de imagens (logo e avatar)
5. Salvar

### 3. Editar Projeto Existente
1. Na tabela, localize o projeto
2. Clique no ícone de **lápis** (editar)
3. Modifique os campos desejados
4. Salvar alterações

### 4. Excluir Projeto
1. Na tabela, localize o projeto
2. Clique no ícone de **lixeira**
3. Confirme a exclusão

## 🎨 Upload de Imagens

### Logo do Projeto
- **Formato:** PNG, JPG, GIF
- **Tamanho:** Recomendado 200x200px
- **Propósito:** Identidade visual do projeto
- **Armazenamento:** Base64 no banco de dados

### Avatar do Proprietário
- **Formato:** PNG, JPG, GIF
- **Tamanho:** Recomendado 128x128px
- **Propósito:** Foto da organização/usuário
- **Captura:** Automática via API do GitHub

## 📊 Campos Obrigatórios

- ✅ Nome
- ✅ Nome Completo
- ✅ URL do Repositório
- ✅ Login do Proprietário

## 🏷️ Tópicos (Topics)

Adicione tópicos para facilitar a busca e classificação:
- Tecnologias: `javascript`, `python`, `react`
- Categorias: `library`, `api`, `tool`
- Domínios: `frontend`, `backend`, `data`

### Como Adicionar
1. Digite o tópico no campo
2. Pressione Enter ou clique em "Adicionar"
3. Para remover, clique no X no badge do tópico

## 📈 Níveis de Maturidade

Escolha o nível adequado para o projeto:

| Nível | Descrição | Badge |
|-------|-----------|-------|
| **Emerging** | Projeto inicial, em fase experimental | 🔵 |
| **Growing** | Adoção crescente, documentação básica | 🟢 |
| **Mature** | Amplamente utilizado, bem documentado | 🟣 |
| **Graduated** | Projeto referência, estável | 🟡 |

## 🔗 Links Importantes

### Documentação
- Link para Wiki, Confluence ou docs gerados
- Exemplos: README.md detalhado, GitHub Pages

### Guia de Contribuição
- URL do CONTRIBUTING.md
- Instruções de como contribuir
- Padrões de código e PR

### Contato
Formato recomendado:
- `slack://channel-name`
- `teams://team-id`
- `email@empresa.com`
- `https://chat.empresa.com/channel`

## 📊 Estatísticas de Participação

Métricas importantes para avaliar o engajamento:

| Métrica | Descrição |
|---------|-----------|
| **Contributors Count** | Número total de contribuidores |
| **Commits Last Year** | Commits realizados no último ano |
| **Pull Requests Count** | Total de Pull Requests |

Essas métricas ajudam a identificar projetos ativos e com boa colaboração.

## 🔍 Integração com GitHub

### API do GitHub
A funcionalidade "Buscar Dados" utiliza a API pública do GitHub:

```
GET https://api.github.com/repos/{owner}/{repo}
```

**Exemplo:**
```bash
curl https://api.github.com/repos/facebook/react
```

### Dados Capturados
- ✅ Nome e nome completo
- ✅ Descrição
- ✅ Linguagem principal
- ✅ Licença
- ✅ Stars, Watchers, Forks, Issues
- ✅ Dados do proprietário
- ✅ Tópicos

### Limitações
- Taxa de limite: 60 requisições/hora (sem autenticação)
- Taxa de limite: 5000 requisições/hora (com token)
- Apenas repositórios públicos (sem token)

## 🗂️ Arquivo repos.json

O arquivo `data-templates/repos.json` contém 3 exemplos completos:

1. **frontend-library** - Biblioteca TypeScript/React
2. **api-gateway** - Gateway Java/Spring Boot
3. **data-pipeline** - Pipeline Python/Spark

Use como referência para estrutura e boas práticas.

## ✅ Checklist de Cadastro Completo

- [ ] Nome e nome completo preenchidos
- [ ] URL do repositório válida
- [ ] Descrição curta informativa
- [ ] Logo do projeto adicionado
- [ ] Linguagem principal definida
- [ ] Licença especificada
- [ ] Nível de maturidade selecionado
- [ ] Tópicos relevantes adicionados (mínimo 3)
- [ ] Descrição estendida detalhada
- [ ] Link de documentação funcional
- [ ] Guia de contribuição disponível
- [ ] Canal de contato ativo
- [ ] Estatísticas de participação preenchidas

## 🎯 Boas Práticas

### Documentação
- Mantenha README.md atualizado
- Inclua exemplos de uso
- Documente APIs públicas
- Adicione badges no README

### Contribuição
- Crie CONTRIBUTING.md claro
- Defina código de conduta
- Template de issues e PRs
- Processo de review definido

### Maturidade
- Inicie como "Emerging"
- Evolua conforme adoção
- Documente marcos importantes
- Celebre conquistas

### Engajamento
- Responda issues rapidamente
- Revise PRs em até 48h
- Participe de discussões
- Promova em canais internos

## 🚨 Troubleshooting

### Erro ao Buscar Dados
- Verifique se a URL está correta
- Confirme que o repositório é público
- Verifique limite de taxa da API

### Imagem Não Carrega
- Tamanho máximo: 5MB
- Formatos aceitos: PNG, JPG, GIF
- Use ferramentas de otimização

### Projeto Não Aparece na Lista
- Verifique se foi salvo com sucesso
- Recarregue a página
- Verifique logs do servidor

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte a documentação completa: `docs/TELA-INNERSOURCE.md`
- Abra uma issue no repositório
- Contate a equipe de arquitetura

## 🎓 Recursos Adicionais

- [InnerSource Commons](https://innersourcecommons.org/)
- [InnerSource Patterns](https://patterns.innersourcecommons.org/)
- [GitHub InnerSource Guide](https://resources.github.com/innersource/)
