# Implementação da Tela de Payloads OpenAPI

## Resumo da Implementação

Foi criada uma tela completa para gerenciar Payloads (especificações OpenAPI) de APIs, seguindo o padrão da tela de Servidores.

## Arquivos Criados

### 1. **Banco de Dados**
- **[database/32-create-payloads.sql](database/32-create-payloads.sql)**
  - Tabela `payloads` com relacionamento à tabela `aplicacoes`
  - Campos para armazenar especificações OpenAPI em JSON ou YAML
  - Sistema de validação e controle de versão
  - Índices para otimização de consultas

### 2. **Backend (API)**
- **[server/api.js](server/api.js)** (modificado)
  - `GET /api/payloads` - Listar todos os payloads
  - `GET /api/payloads/:id` - Buscar payload específico
  - `POST /api/payloads` - Criar novo payload
  - `PUT /api/payloads/:id` - Atualizar payload
  - `DELETE /api/payloads/:id` - Excluir payload

### 3. **Frontend (React/TypeScript)**

#### Types
- **[src/lib/types.ts](src/lib/types.ts)** (modificado)
  - Interface `Payload` com todos os campos necessários
  - Type `FormatoArquivoPayload` ('JSON' | 'YAML')

#### Componentes
- **[src/components/payloads/PayloadsView.tsx](src/components/payloads/PayloadsView.tsx)**
  - Componente principal da tela
  - Gerencia estado e chamadas à API
  - Integração com DataTable e Wizard

- **[src/components/payloads/PayloadsDataTable.tsx](src/components/payloads/PayloadsDataTable.tsx)**
  - Tabela com paginação, busca e ordenação
  - Filtros por múltiplos campos
  - Ações de editar e excluir
  - Indicador visual de validação (✓/✗)

- **[src/components/payloads/PayloadWizard.tsx](src/components/payloads/PayloadWizard.tsx)**
  - Formulário modal para criar/editar payloads
  - Upload de arquivo JSON/YAML
  - Validação em tempo real da estrutura OpenAPI
  - Editor de código com syntax highlighting

#### Roteamento
- **[src/App.tsx](src/App.tsx)** (modificado)
  - Adicionado 'payloads' ao tipo `ViewType`
  - Importado `PayloadsView`
  - Criado case para renderizar a view
  - Adicionado item de menu na sidebar

### 4. **Documentação e Exemplos**
- **[data-templates/README-PAYLOADS.md](data-templates/README-PAYLOADS.md)**
  - Documentação completa do módulo
  - Exemplos de uso
  - Estrutura do banco de dados
  - Endpoints da API

- **[data-templates/payload-usuarios-exemplo.json](data-templates/payload-usuarios-exemplo.json)**
  - Exemplo completo de OpenAPI 3.0 em JSON
  - API de gestão de usuários
  - Autenticação Bearer JWT
  - CRUD completo

- **[data-templates/payload-produtos-exemplo.yaml](data-templates/payload-produtos-exemplo.yaml)**
  - Exemplo completo de OpenAPI 3.0 em YAML
  - API de produtos e inventário
  - Autenticação por API Key
  - Operações de estoque

## Funcionalidades Implementadas

### ✅ Gerenciamento de Payloads
- [x] Listagem com DataTable responsivo
- [x] Criação de novos payloads
- [x] Edição de payloads existentes
- [x] Exclusão com confirmação
- [x] Busca/filtro por múltiplos campos
- [x] Paginação configurável
- [x] Ordenação por colunas

### ✅ Validação OpenAPI
- [x] Validação de sintaxe JSON/YAML
- [x] Verificação de estrutura OpenAPI básica
  - Propriedade `openapi` ou `swagger`
  - Seção `info` obrigatória
  - Presença de `paths` ou `components`
- [x] Feedback visual de validação
- [x] Mensagens de erro detalhadas
- [x] Extração automática da versão OpenAPI

### ✅ Interface de Usuário
- [x] Upload de arquivo JSON/YAML
- [x] Editor de código embutido
- [x] Seleção de aplicação relacionada
- [x] Campos de metadata (sigla, definição, descrição)
- [x] Controle de versão OpenAPI
- [x] Datas de início e término
- [x] Indicadores visuais de status
- [x] Modal responsivo e acessível

### ✅ Integração
- [x] Relacionamento com tabela de aplicações
- [x] API RESTful completa
- [x] Tratamento de erros
- [x] Notificações toast
- [x] Loading states

## Campos do Payload

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Aplicação** | Select | Sim | Aplicação relacionada (FK) |
| **Sigla** | String(20) | Sim | Identificador único |
| **Definição** | String(100) | Sim | Nome/título da API |
| **Descrição** | Text | Não | Descrição detalhada |
| **Formato** | Enum | Sim | JSON ou YAML |
| **Conteúdo** | LongText | Sim | Especificação OpenAPI completa |
| **Versão OpenAPI** | String(20) | Não | Ex: 3.0.0 (auto-detectado) |
| **Arquivo Válido** | Boolean | Auto | Resultado da validação |
| **Erros de Validação** | Text | Auto | Mensagens de erro |
| **Data Início** | Date | Auto | Data de criação |
| **Data Término** | Date | Não | Para APIs descontinuadas |

## Validações Implementadas

### Frontend
1. Campos obrigatórios preenchidos
2. Formato JSON/YAML válido
3. Estrutura OpenAPI básica presente
4. Arquivo válido antes de salvar

### Backend
1. Validação de campos obrigatórios
2. Unicidade da sigla
3. FK válida para aplicação
4. Validação de formato

## Próximos Passos (Opcionais)

### Melhorias Futuras
- [ ] Validação OpenAPI completa usando biblioteca especializada
- [ ] Visualização interativa da documentação (Swagger UI)
- [ ] Geração de código cliente (JavaScript, Python, etc.)
- [ ] Testes automatizados de endpoints
- [ ] Versionamento de payloads
- [ ] Comparação de versões (diff)
- [ ] Export para múltiplos formatos
- [ ] Importação de URLs públicas
- [ ] Mock server automático

## Como Usar

### 1. Executar a Migration
```bash
# Conectar ao MySQL e executar
mysql -u root -p auditoria_db < database/32-create-payloads.sql
```

### 2. Iniciar o Sistema
```bash
# Terminal 1 - Backend
cd /Users/horaciovasconcellos/repositorio/sistema-de-auditoria
npm run dev

# Terminal 2 - Frontend
npm run dev:client
```

### 3. Acessar a Tela
1. Abrir http://localhost:5173
2. No menu lateral, clicar em "Payloads"
3. Clicar em "Novo Payload"
4. Preencher os campos e fazer upload do arquivo
5. O sistema validará automaticamente
6. Salvar quando o arquivo estiver válido

## Estrutura de Arquivos

```
sistema-de-auditoria/
├── database/
│   └── 32-create-payloads.sql          # Schema do banco
├── server/
│   └── api.js                           # Rotas da API (modificado)
├── src/
│   ├── App.tsx                          # Roteamento (modificado)
│   ├── lib/
│   │   └── types.ts                     # Types TypeScript (modificado)
│   └── components/
│       └── payloads/
│           ├── PayloadsView.tsx         # View principal
│           ├── PayloadsDataTable.tsx    # Tabela de dados
│           └── PayloadWizard.tsx        # Formulário modal
└── data-templates/
    ├── README-PAYLOADS.md               # Documentação
    ├── payload-usuarios-exemplo.json    # Exemplo JSON
    └── payload-produtos-exemplo.yaml    # Exemplo YAML
```

## Tecnologias Utilizadas

- **Backend**: Node.js + Express + MySQL
- **Frontend**: React + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS
- **Ícones**: Phosphor Icons
- **Validação**: JSON.parse + lógica customizada
- **Notificações**: Sonner

## Status

✅ **Implementação Completa**

Todos os requisitos foram atendidos:
- ✅ Tela seguindo padrão de Servidores
- ✅ DataTable com filtros e paginação
- ✅ CRUD completo
- ✅ Validação OpenAPI
- ✅ Upload de arquivo JSON/YAML
- ✅ Relacionamento com Aplicações
- ✅ Documentação e exemplos
