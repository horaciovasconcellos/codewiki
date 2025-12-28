# Diretório para Arquivos JSON de Payloads

Este diretório contém os arquivos de especificação OpenAPI exportados automaticamente.

## Estrutura

- Cada arquivo é nomeado com a sigla do payload
- Formatos suportados: `.json` e `.yaml`
- Acessível via: `http://localhost:5173/json/SIGLA.json`

## Geração Automática

Os arquivos são gerados quando você:
1. Acessa a interface em http://localhost:5173
2. Navega para "Catálogo de APIs"
3. Clica em "Gerar Catálogo de APIs"

## Uso no MkDocs

Os arquivos são referenciados na tag Swagger UI:

```markdown
<swagger-ui src="http://localhost:5173/json/SIGLA.json"/>
```

## ⚠️ Importante

- Este diretório é gerado automaticamente
- Não edite os arquivos manualmente
- Para atualizar, regenere o catálogo via interface web
