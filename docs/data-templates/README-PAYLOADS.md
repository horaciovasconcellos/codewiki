# Payloads OpenAPI - Sistema de Auditoria

Este módulo gerencia payloads (especificações OpenAPI) das APIs do sistema.

## Funcionalidades

### 1. **Gerenciamento de Payloads**
- Cadastro de especificações OpenAPI (JSON ou YAML)
- Validação automática da estrutura OpenAPI
- Vínculo com aplicações cadastradas
- Controle de versão OpenAPI
- Datas de início e término

### 2. **Validação OpenAPI**
A validação básica verifica:
- Presença da propriedade `openapi` ou `swagger`
- Existência da seção obrigatória `info`
- Presença de `paths` ou `components`
- Sintaxe JSON/YAML válida

### 3. **Campos do Payload**
- **Aplicação**: Relacionamento com aplicação cadastrada
- **Sigla**: Identificador único (máx. 20 caracteres)
- **Definição**: Título/nome da API (máx. 100 caracteres)
- **Descrição**: Descrição detalhada (opcional)
- **Formato**: JSON ou YAML
- **Conteúdo**: Especificação OpenAPI completa
- **Versão OpenAPI**: Ex: 3.0.0, 3.1.0, 2.0
- **Data Início**: Criação automática
- **Data Término**: Opcional (para APIs descontinuadas)

## Exemplo de Payload OpenAPI JSON

\`\`\`json
{
  "openapi": "3.0.0",
  "info": {
    "title": "API de Usuários",
    "version": "1.0.0",
    "description": "API para gerenciamento de usuários do sistema"
  },
  "servers": [
    {
      "url": "https://api.exemplo.com/v1"
    }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "Listar usuários",
        "responses": {
          "200": {
            "description": "Lista de usuários",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Criar usuário",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserInput"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Usuário criado"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string",
            "format": "email"
          }
        }
      },
      "UserInput": {
        "type": "object",
        "required": ["name", "email"],
        "properties": {
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string",
            "format": "email"
          }
        }
      }
    }
  }
}
\`\`\`

## Exemplo de Payload OpenAPI YAML

\`\`\`yaml
openapi: 3.0.0
info:
  title: API de Produtos
  version: 1.0.0
  description: API para gerenciamento de produtos
servers:
  - url: https://api.exemplo.com/v1
paths:
  /products:
    get:
      summary: Listar produtos
      responses:
        '200':
          description: Lista de produtos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
    post:
      summary: Criar produto
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductInput'
      responses:
        '201':
          description: Produto criado
components:
  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        price:
          type: number
          format: double
        category:
          type: string
    ProductInput:
      type: object
      required:
        - name
        - price
      properties:
        name:
          type: string
        price:
          type: number
          format: double
        category:
          type: string
\`\`\`

## Benefícios

1. **Documentação Centralizada**: Todas as especificações de APIs em um só lugar
2. **Validação Automática**: Garante conformidade com padrão OpenAPI
3. **Rastreabilidade**: Histórico de versões e mudanças
4. **Integração**: Permite geração automática de código cliente
5. **Governança**: Controle sobre ciclo de vida das APIs

## Uso

### Criar um Novo Payload
1. Clique em "Novo Payload"
2. Selecione a aplicação relacionada
3. Preencha sigla, definição e descrição
4. Escolha o formato (JSON ou YAML)
5. Cole ou faça upload do arquivo OpenAPI
6. O sistema validará automaticamente
7. Clique em "Criar Payload" quando válido

### Editar um Payload
1. Na tabela, clique no ícone de edição
2. Modifique os campos necessários
3. Revalide o arquivo se necessário
4. Clique em "Atualizar Payload"

### Excluir um Payload
1. Na tabela, clique no ícone de exclusão
2. Confirme a exclusão no diálogo

## Schema do Banco de Dados

```sql
CREATE TABLE payloads (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    sigla VARCHAR(20) UNIQUE NOT NULL,
    definicao VARCHAR(100) NOT NULL,
    descricao TEXT,
    formato_arquivo ENUM('JSON', 'YAML') NOT NULL,
    conteudo_arquivo LONGTEXT NOT NULL,
    versao_openapi VARCHAR(20),
    arquivo_valido BOOLEAN,
    ultima_validacao TIMESTAMP,
    erros_validacao TEXT,
    data_inicio TIMESTAMP,
    data_termino TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id)
);
```

## API Endpoints

- `GET /api/payloads` - Listar todos os payloads
- `GET /api/payloads/:id` - Buscar payload por ID
- `POST /api/payloads` - Criar novo payload
- `PUT /api/payloads/:id` - Atualizar payload
- `DELETE /api/payloads/:id` - Excluir payload
