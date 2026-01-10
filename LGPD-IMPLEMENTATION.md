# Sistema de Gestão LGPD - Documentação Completa

## 📋 Visão Geral

Sistema completo para gerenciamento de dados pessoais e conformidade com a Lei Geral de Proteção de Dados (LGPD), incluindo:

- ✅ Cadastro de conjuntos de dados pessoais
- ✅ Classificação por tipo de dados (5 categorias)
- ✅ Técnicas de anonimização (4 tipos)
- ✅ Matriz de anonimização por departamento (7 departamentos)
- ✅ Gestão de campos individuais com controle granular
- ✅ Interface completa com wizard multi-step
- ✅ DataTable com paginação, filtros e ações CRUD

## 🏗️ Arquitetura

### Frontend (React 19 + TypeScript)
```
src/
├── types/lgpd.ts                    # Tipos TypeScript
├── components/lgpd/
│   ├── LGPDDataTable.tsx           # Tabela principal
│   └── LGPDWizard.tsx              # Wizard cadastro/edição
└── views/
    └── LGPDView.tsx                 # View principal
```

### Backend (Node.js + Express)
```
server/
└── api.js                           # Rotas CRUD /api/lgpd
```

### Banco de Dados (MySQL)
```
database/
├── lgpd-tables.sql                  # Script completo
└── (scripts auxiliares)
```

## 📊 Modelo de Dados

### Tabela: lgpd_registros
Registra conjuntos de dados pessoais e técnica de anonimização padrão.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| identificacao_dados | VARCHAR(255) | Nome/identificação do conjunto |
| tipo_dados | VARCHAR(100) | Tipo de dados (5 opções) |
| tecnica_anonimizacao | VARCHAR(150) | Técnica padrão (4 opções) |
| data_inicio | DATE | Data de início do tratamento |
| data_termino | DATE | Data de término (opcional) |
| ativo | BOOLEAN | Status ativo/inativo |

**Tipos de Dados:**
1. Dados Identificadores Diretos
2. Dados Identificadores Indiretos
3. Dados Sensíveis
4. Dados Financeiros
5. Dados de Localização

**Técnicas de Anonimização:**
1. Anonimização por Supressão
2. Anonimização por Generalização
3. Pseudonimização (Embaralhamento Reversível)
4. Anonimização por Permutação

### Tabela: lgpd_campos
Campos individuais com matriz de anonimização por departamento.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| lgpd_id | INT | FK para lgpd_registros |
| nome_campo | VARCHAR(255) | Nome do campo da tabela |
| descricao | TEXT | Descrição do campo |
| matriz_vendas | VARCHAR(150) | Técnica para Vendas |
| matriz_marketing | VARCHAR(150) | Técnica para Marketing |
| matriz_financeiro | VARCHAR(150) | Técnica para Financeiro |
| matriz_rh | VARCHAR(150) | Técnica para RH |
| matriz_logistica | VARCHAR(150) | Técnica para Logística |
| matriz_assistencia_tecnica | VARCHAR(150) | Técnica para Assistência Técnica |
| matriz_analytics | VARCHAR(150) | Técnica para Analytics |

**Departamentos da Matriz:**
1. Vendas
2. Marketing
3. Financeiro
4. RH
5. Logística
6. Assistência Técnica
7. Analytics

## 🎨 Componentes Frontend

### 1. LGPDView (View Principal)
**Localização:** `src/views/LGPDView.tsx`

**Responsabilidades:**
- Orquestração geral da tela LGPD
- Fetch de dados da API
- Gerenciamento de estados (CRUD)
- Dialogs de visualização detalhada

**Estados Principais:**
```typescript
registros: LGPDRegistro[]          // Lista de registros
showWizard: boolean                 // Controle do wizard
editingRegistro?: LGPDRegistro      // Registro em edição
viewingRegistro?: LGPDRegistro      // Registro sendo visualizado
```

### 2. LGPDDataTable
**Localização:** `src/components/lgpd/LGPDDataTable.tsx`

**Funcionalidades:**
- ✅ Busca por identificação ou técnica
- ✅ Filtro por tipo de dados (dropdown dinâmico)
- ✅ Filtro por status (Ativo/Inativo)
- ✅ Ordenação em 5 colunas (clicável)
- ✅ Paginação completa (10/25/50/100 itens)
- ✅ Ações: Visualizar, Editar, Excluir
- ✅ Badges coloridos por tipo de dados
- ✅ Contador de resultados
- ✅ Botão limpar filtros

**Props:**
```typescript
interface LGPDDataTableProps {
  registros: LGPDRegistro[];
  onView: (registro: LGPDRegistro) => void;
  onEdit: (registro: LGPDRegistro) => void;
  onDelete: (id: number, identificacao: string) => void;
}
```

### 3. LGPDWizard (Wizard Multi-Step)
**Localização:** `src/components/lgpd/LGPDWizard.tsx`

**Etapa 1 - Dados Mestres:**
- Identificação de Dados (campo texto)
- Tipo de Dados (select - 5 opções)
- Técnica de Anonimização Padrão (select - 4 opções)
- Data de Início (date picker, default: hoje)
- Data de Término (date picker, opcional)

**Etapa 2 - Campos e Matriz:**
- Tabela de campos cadastrados
- Botão "Adicionar Campo"
- Ações: Editar, Excluir, Ver Matriz

**Formulário de Campo:**
- Nome do Campo (ex: cpf, email, telefone)
- Descrição do Campo
- Matriz de Anonimização (7 selects - 1 por departamento)
  - Cada departamento pode ter técnica diferente
  - Default: técnica padrão do registro mestre

**Dialog de Visualização de Matriz:**
- Exibe técnica aplicada em cada departamento
- Badges coloridos para fácil visualização

**Props:**
```typescript
interface LGPDWizardProps {
  open: boolean;
  onClose: () => void;
  registro?: LGPDRegistro;            // undefined = novo, preenchido = edição
  onSave: (data: any) => Promise<void>;
}
```

## 🔌 API Endpoints

### Backend: `server/api.js`

**Base URL:** `http://localhost:3000/api/lgpd`

#### GET /api/lgpd
Lista todos os registros LGPD (sem campos).

**Response:**
```json
[
  {
    "id": 1,
    "identificacaoDados": "Dados de Clientes - CRM",
    "tipoDados": "Dados Identificadores Diretos",
    "tecnicaAnonimizacao": "Pseudonimização (Embaralhamento Reversível)",
    "dataInicio": "2024-01-01",
    "dataTermino": null,
    "ativo": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/lgpd/:id
Busca registro específico com campos e matriz.

**Response:**
```json
{
  "id": 1,
  "identificacaoDados": "Dados de Clientes - CRM",
  "tipoDados": "Dados Identificadores Diretos",
  "tecnicaAnonimizacao": "Pseudonimização (Embaralhamento Reversível)",
  "dataInicio": "2024-01-01",
  "dataTermino": null,
  "ativo": true,
  "campos": [
    {
      "id": 1,
      "lgpdId": 1,
      "nomeCampo": "cpf",
      "descricao": "CPF do cliente",
      "matrizAnonimizacao": {
        "vendas": "Pseudonimização (Embaralhamento Reversível)",
        "marketing": "Anonimização por Supressão",
        "financeiro": "Pseudonimização (Embaralhamento Reversível)",
        "rh": "Anonimização por Supressão",
        "logistica": "Anonimização por Supressão",
        "assistenciaTecnica": "Pseudonimização (Embaralhamento Reversível)",
        "analytics": "Anonimização por Generalização"
      }
    }
  ]
}
```

#### POST /api/lgpd
Cria novo registro com campos.

**Request Body:**
```json
{
  "identificacaoDados": "Dados de Colaboradores",
  "tipoDados": "Dados Identificadores Diretos",
  "tecnicaAnonimizacao": "Pseudonimização (Embaralhamento Reversível)",
  "dataInicio": "2024-02-01",
  "dataTermino": null,
  "campos": [
    {
      "nomeCampo": "matricula",
      "descricao": "Matrícula do colaborador",
      "matrizAnonimizacao": {
        "vendas": "Anonimização por Supressão",
        "marketing": "Anonimização por Supressão",
        "financeiro": "Pseudonimização (Embaralhamento Reversível)",
        "rh": "Pseudonimização (Embaralhamento Reversível)",
        "logistica": "Anonimização por Supressão",
        "assistenciaTecnica": "Anonimização por Supressão",
        "analytics": "Anonimização por Generalização"
      }
    }
  ]
}
```

#### PUT /api/lgpd/:id
Atualiza registro existente. Deleta campos antigos e recria.

**Request Body:** Igual ao POST.

#### DELETE /api/lgpd/:id
Exclui registro e todos os campos associados (CASCADE).

**Response:**
```json
{
  "message": "Registro LGPD excluído com sucesso"
}
```

## 🚀 Como Usar

### 1. Acesse o Menu
No menu lateral, clique em:
**Governança e Compliance > LGPD**

### 2. Criar Novo Registro

1. Clique no botão **"Novo Registro"**
2. **Etapa 1:** Preencha os dados mestres
   - Identificação: ex. "Dados de Clientes - CRM"
   - Tipo de Dados: selecione entre 5 opções
   - Técnica Padrão: selecione entre 4 opções
   - Data Início: default = hoje
   - Data Término: opcional
3. Clique em **"Próximo: Campos"**
4. **Etapa 2:** Adicione campos
   - Clique em **"Adicionar Campo"**
   - Preencha nome e descrição
   - Configure matriz de anonimização (7 departamentos)
   - Clique em **"Adicionar Campo"**
   - Repita para cada campo
5. Clique em **"Criar Registro"**

### 3. Visualizar Detalhes

1. Na tabela, clique no ícone **👁️ (Olho)**
2. Visualize:
   - Dados mestres completos
   - Lista de campos com matriz expandida
   - Badges coloridos por departamento

### 4. Editar Registro

1. Na tabela, clique no ícone **✏️ (Lápis)**
2. Wizard abrirá com dados preenchidos
3. Altere o que for necessário
4. Adicione/remova/edite campos
5. Clique em **"Salvar Alterações"**

### 5. Excluir Registro

1. Na tabela, clique no ícone **🗑️ (Lixeira)**
2. Confirme a exclusão no dialog
3. Registro e todos os campos serão removidos

### 6. Filtrar e Buscar

**Busca Textual:**
- Digite na caixa de busca
- Busca em: Identificação + Técnica de Anonimização

**Filtros:**
- **Tipo de Dados:** dropdown com opções únicas do sistema
- **Status:** Todos / Ativos / Inativos

**Ordenação:**
- Clique no cabeçalho da coluna
- 1º clique = ASC ⬆️
- 2º clique = DESC ⬇️
- Ícones indicam direção

**Limpar Filtros:**
- Botão aparece quando há filtros ativos
- Reseta busca, filtros e página

### 7. Paginação

- **Itens por página:** 10 / 25 / 50 / 100
- **Navegação:** Primeira | Anterior | Próxima | Última
- **Contador:** "Mostrando X até Y de Z registros"
- Auto-reset ao página 1 quando filtros mudam

## 🎯 Casos de Uso

### Exemplo 1: Dados de CRM

**Registro Mestre:**
- Identificação: "Dados de Clientes - CRM"
- Tipo: Dados Identificadores Diretos
- Técnica Padrão: Pseudonimização

**Campos:**
1. **CPF**
   - Vendas: Pseudonimização (precisa identificar cliente)
   - Marketing: Supressão (não precisa)
   - Financeiro: Pseudonimização (cobrança)
   - RH: Supressão
   - Logística: Supressão
   - Assistência Técnica: Pseudonimização
   - Analytics: Generalização (estatísticas agregadas)

2. **Email**
   - Vendas: Pseudonimização
   - Marketing: Pseudonimização (campanhas)
   - Financeiro: Pseudonimização
   - RH: Supressão
   - Logística: Supressão
   - Assistência Técnica: Pseudonimização
   - Analytics: Generalização

### Exemplo 2: Dados de Navegação Web

**Registro Mestre:**
- Identificação: "Histórico de Navegação - Analytics"
- Tipo: Dados Identificadores Indiretos
- Técnica Padrão: Generalização

**Campos:**
1. **IP do Usuário**
   - Todos os departamentos: Generalização (ex: 192.168.*.*)
   
2. **User-Agent**
   - Analytics: Generalização
   - Demais: Supressão

## 📂 Arquivos Criados

### Tipos e Interfaces
- ✅ `src/types/lgpd.ts` - Tipos TypeScript completos

### Componentes
- ✅ `src/components/lgpd/LGPDDataTable.tsx` - Tabela principal
- ✅ `src/components/lgpd/LGPDWizard.tsx` - Wizard multi-step

### Views
- ✅ `src/views/LGPDView.tsx` - View principal

### Backend
- ✅ `server/api.js` - Rotas CRUD (modificado)

### Database
- ✅ `database/lgpd-tables.sql` - Script SQL completo
- ✅ `create-lgpd-tables.cjs` - Script Node.js auxiliar

### Documentação
- ✅ `LGPD-SETUP-INSTRUCTIONS.md` - Instruções de setup
- ✅ `LGPD-IMPLEMENTATION.md` - Este arquivo

### Configurações
- ✅ `src/App.tsx` - Rota e menu adicionados

## ✅ Checklist de Implementação

- [x] Tipos TypeScript definidos
- [x] Backend API implementado
- [x] DataTable com paginação/filtros/ordenação
- [x] Wizard multi-step completo
- [x] Formulário de campos com matriz
- [x] Dialog de visualização detalhada
- [x] Integração no menu
- [x] Rota configurada
- [x] Scripts SQL criados
- [x] Documentação completa
- [ ] Tabelas criadas no banco (manual pendente)
- [ ] Testes de integração

## 🔧 Próximos Passos

1. **Criar tabelas no banco de dados**
   - Siga instruções em `LGPD-SETUP-INSTRUCTIONS.md`

2. **Testar fluxo completo**
   - Criar registro com campos
   - Visualizar matriz de anonimização
   - Editar e atualizar
   - Filtrar e paginar
   - Excluir registro

3. **Melhorias Futuras (Opcional)**
   - Exportar matriz para Excel/PDF
   - Histórico de alterações (audit trail)
   - Validação de conformidade automática
   - Dashboard de cobertura LGPD
   - Integração com sistemas externos
   - Geração de relatórios de impacto

## 🎓 Conceitos LGPD Implementados

### Tipos de Dados
1. **Identificadores Diretos:** Nome, CPF, RG, passaporte
2. **Identificadores Indiretos:** IP, cookies, device ID
3. **Dados Sensíveis:** Saúde, biometria, orientação sexual
4. **Dados Financeiros:** Conta bancária, cartão, renda
5. **Dados de Localização:** GPS, endereço, geolocalização

### Técnicas de Anonimização
1. **Supressão:** Remover completamente o dado
2. **Generalização:** Reduzir precisão (ex: idade → faixa etária)
3. **Pseudonimização:** Substituir por código reversível
4. **Permutação:** Embaralhar valores entre registros

### Matriz de Anonimização
Permite controle granular por departamento, respeitando o princípio de **minimização de dados** da LGPD: cada área só acessa dados necessários para sua função, com nível de anonimização adequado ao risco.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique `LGPD-SETUP-INSTRUCTIONS.md`
2. Consulte logs do backend: `docker logs auditoria-app-prod`
3. Inspecione tabelas: `SELECT * FROM lgpd_registros`
