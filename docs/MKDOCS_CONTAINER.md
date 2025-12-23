# Container MkDocs - Documentação do Sistema

## 📖 Visão Geral

Container Docker dedicado para servir a documentação completa do sistema usando **MkDocs Material**.

## 🚀 Acesso

- **URL**: http://localhost:8082
- **Container**: `auditoria-mkdocs`
- **Porta**: 8082

## 🔧 Configuração

### Arquivos

- **Dockerfile**: `Dockerfile.mkdocs`
- **Configuração**: `mkdocs.yml`
- **Documentos**: `docs/` + arquivos raiz (.md)

### Volumes Montados

```yaml
volumes:
  - ./docs:/docs/docs:ro                          # Diretório principal
  - ./mkdocs.yml:/docs/mkdocs.yml:ro              # Configuração
  - ./README.md:/docs/docs/README.md:ro           # Readme
  - ./QUICKSTART.md:/docs/docs/QUICKSTART.md:ro   # Quick Start
  - ./CHANGELOG.md:/docs/docs/CHANGELOG.md:ro     # Changelog
  - ./LIQUIBASE_QUICKSTART.md:/docs/docs/LIQUIBASE_QUICKSTART.md:ro
  - ./PRODUCTION_CLEANUP.md:/docs/docs/PRODUCTION_CLEANUP.md:ro
  - ./PRODUCTION_DEPLOY.md:/docs/docs/PRODUCTION_DEPLOY.md:ro
  - ./LICENSE:/docs/docs/LICENSE.md:ro            # Licença
  - ./SECURITY.md:/docs/docs/SECURITY.md:ro       # Segurança
```

## 📦 Dependências Python

- `mkdocs==1.5.3` - Core do MkDocs
- `mkdocs-material==9.5.3` - Tema Material Design
- `mkdocs-material-extensions==1.3.1` - Extensões do Material
- `pymdown-extensions==10.7` - Extensões Markdown
- `mkdocs-minify-plugin==0.7.2` - Minificação HTML/CSS/JS
- `mkdocs-git-revision-date-localized-plugin==1.2.2` - Data de revisão Git

## 🏃 Comandos

### Subir Container

```bash
# Junto com toda a stack
docker-compose up -d

# Apenas MkDocs
docker-compose up -d mkdocs
```

### Rebuild (após alterações)

```bash
# Rebuild sem cache
docker-compose build --no-cache mkdocs

# Recriar container
docker-compose up -d --force-recreate mkdocs
```

### Logs

```bash
# Ver logs em tempo real
docker-compose logs -f mkdocs

# Últimas 50 linhas
docker-compose logs --tail=50 mkdocs
```

### Parar/Remover

```bash
# Parar
docker-compose stop mkdocs

# Remover
docker-compose down mkdocs
```

## 🔗 Integração com Frontend

O botão de acesso foi adicionado à tela **Documentação de APIs**:

```tsx
<Button
  onClick={() => window.open('http://localhost:8082', '_blank')}
  className="gap-2"
  variant="outline"
>
  <BookOpen size={20} />
  Documentação Completa (MkDocs)
</Button>
```

## 📚 Estrutura de Navegação

### Seções Principais

1. **Home** - Página inicial
2. **Começando** - Guias de instalação e quick start
3. **Produção** - Deploy e limpeza
4. **Database** - Liquibase e migrations
5. **Funcionalidades** - Recursos do sistema
6. **Desenvolvimento** - Guias técnicos
7. **Integrações** - Azure DevOps, WITs
8. **API** - Documentação de endpoints
9. **Gestão** - Custos, SLAs, normas
10. **Sobre** - PRD, licença, segurança

## 🎨 Tema Material

### Features Habilitadas

- ✅ Busca instantânea
- ✅ Destaque de código com copy
- ✅ Navegação instant (SPA-like)
- ✅ Dark/Light mode
- ✅ Suporte a Mermaid diagrams
- ✅ Tooltips em footnotes
- ✅ Tabelas ordenáveis

### Cores

- **Primary**: Deep Purple
- **Accent**: Indigo
- Suporte a tema claro/escuro automático

## 🔧 Troubleshooting

### Problema: Container não inicia

```bash
# Ver logs detalhados
docker-compose logs mkdocs

# Verificar porta 8082
sudo lsof -i :8082

# Rebuild completo
docker-compose build --no-cache mkdocs
docker-compose up -d mkdocs
```

### Problema: Documentação não atualiza

```bash
# Volumes são read-only, edite arquivos localmente
# Depois, recarregue a página

# Se não atualizar, reinicie:
docker-compose restart mkdocs
```

### Problema: 404 em páginas

```bash
# Verificar mkdocs.yml - seção nav:
# Caminhos devem ser relativos a docs/

# Exemplo correto:
# nav:
#   - Home: index.md
#   - Guia: MANUAL_INSTALACAO.md
```

### Problema: CSS/JS não carrega

```bash
# Verificar extra_css e extra_javascript no mkdocs.yml
# Arquivos devem estar em docs/styles/ e docs/javascripts/

ls -la docs/styles/
ls -la docs/javascripts/
```

## 📊 Monitoramento

### Health Check

```bash
# Verificar se está respondendo
curl http://localhost:8082

# Status do container
docker-compose ps mkdocs

# Logs de acesso
docker-compose logs mkdocs | grep "GET"
```

### Métricas

```bash
# Uso de recursos
docker stats auditoria-mkdocs

# Espaço em disco
docker system df
```

## 🚀 Deploy em Produção

### 1. Variáveis de Ambiente

Não há variáveis específicas. Configuração via `mkdocs.yml`.

### 2. Alterar Porta (se necessário)

```yaml
# docker-compose.yml
mkdocs:
  ports:
    - "8000:8082"  # Porta externa:interna
```

E no botão do frontend:

```tsx
window.open('http://seudominio.com:8000', '_blank')
```

### 3. Nginx Proxy (Recomendado)

```nginx
# /etc/nginx/sites-available/auditoria
location /docs {
    proxy_pass http://localhost:8082;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Acesso: `https://seudominio.com/docs`

### 4. SSL/TLS

O MkDocs roda HTTP. Use Nginx como proxy reverso com SSL.

## 📝 Adicionando Nova Página

### 1. Criar arquivo Markdown

```bash
# Criar em docs/
echo "# Nova Página" > docs/nova-pagina.md
```

### 2. Adicionar ao mkdocs.yml

```yaml
nav:
  - Nova Seção:
      - Nova Página: nova-pagina.md
```

### 3. Recarregar

O MkDocs detecta mudanças automaticamente (volumes montados).

## 🔐 Segurança

### Read-Only Volumes

Todos os volumes são montados como `:ro` (read-only) para segurança.

### Sem Dados Sensíveis

Documentação é pública. Não inclua:
- ❌ Senhas
- ❌ Tokens
- ❌ Credenciais
- ❌ IPs internos

### Acesso Público

Em produção, considere:
- Autenticação via Nginx (basic auth)
- VPN para acesso interno
- Firewall rules

## 📖 Referências

- [MkDocs](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [PyMdown Extensions](https://facelessuser.github.io/pymdown-extensions/)

---

**Versão**: 1.0  
**Container**: auditoria-mkdocs  
**Porta**: 8082  
**Tema**: Material Design
