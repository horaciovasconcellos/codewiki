# Atualização Automática do Catálogo de APIs

## 📝 Descrição

O sistema possui funcionalidade de geração automática do catálogo de APIs com **atualização automática do container MkDocs**.

## ✨ Como Funciona

### 1. Geração do Catálogo

Quando o usuário clica em **"Gerar Catálogo de APIs"** na interface web:

1. **Backend (`/api/catalog/generate`)**:
   - Busca todos os payloads válidos do banco de dados
   - Gera páginas Markdown individuais para cada API
   - Exporta especificações OpenAPI (JSON/YAML) para:
     - `docs/api-catalog/specs/` (para MkDocs)
     - `public/json/` (para download via React)
   - Cria página índice com estatísticas e tabela de APIs
   - **Executa automaticamente `docker restart auditoria-mkdocs`**

2. **Frontend (`ApiCatalogGeneratorView`)**:
   - Exibe progresso da geração
   - Mostra estatísticas (total de aplicações, APIs, páginas geradas)
   - Informa que o container foi reiniciado automaticamente
   - Fornece links diretos para visualização

### 2. Reinicialização Automática do MkDocs

Após a geração do catálogo, o sistema executa:

```javascript
const { exec } = await import('child_process');
const { promisify } = await import('util');
const execPromise = promisify(exec);

await execPromise('docker restart auditoria-mkdocs');
```

**Benefícios**:
- ✅ Documentação disponível imediatamente após geração
- ✅ Não requer intervenção manual
- ✅ Processo totalmente automatizado
- ✅ Logs informativos no console do servidor

### 3. Tratamento de Erros

Se o restart do container falhar:
- O sistema registra um aviso no console
- Sugere comando manual: `docker restart auditoria-mkdocs`
- A geração do catálogo continua normalmente
- Usuário é notificado do sucesso da geração (mesmo que o restart falhe)

## 🚀 Como Usar

### Via Interface Web

1. Acesse http://localhost:5173
2. Navegue até **"Catálogo de APIs"** (menu lateral)
3. Clique em **"Gerar Catálogo de APIs"**
4. Aguarde a mensagem de sucesso
5. Acesse http://localhost:8000/api-catalog/ para ver a documentação atualizada

### Via API

```bash
curl -X POST http://localhost:3000/api/catalog/generate \
  -H 'Content-Type: application/json'
```

**Resposta de Sucesso**:

```json
{
  "success": true,
  "stats": {
    "totalAplicacoes": 5,
    "totalApis": 23,
    "pagesGenerated": 23,
    "specsExportados": 23
  },
  "message": "Catálogo gerado com sucesso! O container MkDocs foi reiniciado e está disponível para consulta."
}
```

## 📂 Estrutura de Arquivos Gerados

```
docs/
└── api-catalog/
    ├── index.md                    # Página índice com estatísticas
    ├── specs/                      # Especificações OpenAPI
    │   ├── API-001.json
    │   ├── API-002.yaml
    │   └── ...
    ├── API-001.md                  # Página individual da API
    ├── API-002.md
    └── ...

public/
└── json/                           # Cópia das specs para download via React
    ├── API-001.json
    ├── API-002.yaml
    └── ...
```

## 🔍 Logs e Monitoramento

### Logs do Backend

```bash
docker logs auditoria-app -f
```

**Exemplo de saída**:

```
🚀 Iniciando geração do catálogo de APIs com Swagger UI...
✅ Catálogo gerado com sucesso!
🔄 Reiniciando container mkdocs...
✅ Container mkdocs reiniciado com sucesso!
```

### Verificar Status dos Containers

```bash
docker ps --filter "name=auditoria"
```

## ⚙️ Configuração

### Requisitos

- Docker instalado e rodando
- Container `auditoria-mkdocs` deve estar em execução
- Permissões para executar comandos Docker do container da aplicação

### Permissões Docker

Se o container da aplicação não tiver permissões para controlar outros containers, existem duas opções:

#### Opção 1: Docker Socket (Recomendado para Dev)

No `docker-compose.yml`, adicione ao serviço `app`:

```yaml
app:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock  # Adicione esta linha
```

#### Opção 2: Script Externo (Recomendado para Produção)

Crie um script separado e execute via cron ou webhook após a geração.

## 🐛 Troubleshooting

### Container não reinicia automaticamente

**Problema**: Aviso no console: "⚠️ Não foi possível reiniciar o container mkdocs"

**Solução**:
1. Verifique se o Docker está rodando: `docker ps`
2. Verifique permissões: container precisa acessar o Docker socket
3. Execute manualmente: `docker restart auditoria-mkdocs`

### Documentação não atualiza após geração

**Problema**: Catálogo gerado mas documentação antiga aparece no MkDocs

**Solução**:
1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
2. Verifique se o container MkDocs foi reiniciado: `docker ps`
3. Force restart: `docker restart auditoria-mkdocs`
4. Verifique os arquivos gerados: `ls -la docs/api-catalog/`

### Erros de permissão ao escrever arquivos

**Problema**: "Error: EACCES: permission denied"

**Solução**:
1. Ajuste permissões dos diretórios:
   ```bash
   chmod -R 755 docs/api-catalog/
   chmod -R 755 public/json/
   ```
2. Se usar Docker volumes, configure corretamente os UIDs/GIDs

## 📊 Estatísticas e Métricas

O sistema registra:
- ✅ Total de aplicações processadas
- ✅ Total de APIs documentadas
- ✅ Número de páginas geradas
- ✅ Número de especificações exportadas
- ✅ Timestamp da última atualização

## 🔗 Links Relacionados

- [Documentação do Gerador de Catálogo](./GERADOR-CATALOGO-APIS.md)
- [Estrutura de Payloads](./ESTRUTURA_PAYLOADS.md)
- [MkDocs Material Theme](https://squidfunk.github.io/mkdocs-material/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

---

**Última Atualização**: 24/12/2025  
**Versão**: 1.0.0
