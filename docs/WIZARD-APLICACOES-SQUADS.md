# Documentação - Página de SQUADS no Wizard de Aplicações

## Visão Geral

A página de SQUADS permite associar colaboradores às aplicações, definindo seus perfis e times (squads) de atuação. Esta funcionalidade foi implementada seguindo o modelo da página de Tecnologias do wizard, oferecendo uma experiência consistente e familiar aos usuários.

## Localização no Wizard

- **Passo 3 de 14** no Wizard de Aplicação
- Entre "Tecnologias" e "ADRs"
- Título: "Squads"
- Descrição: "Equipes e colaboradores"

## Características Principais

### 1. Restrições de Associação
- **Unicidade**: Não é permitido duplicar colaboradores com mesmo perfil e squad na mesma aplicação
- **Regra de Negócio**: Um colaborador só pode estar associado uma vez com uma combinação específica de perfil e squad por aplicação
- **Validação**: Sistema verifica duplicatas antes de permitir salvamento

### 2. Campos Obrigatórios
- **Colaborador** (select): Seleção do colaborador pela matrícula e nome
- **Perfil** (select): Função do colaborador no squad
- **Squad** (select): Time ao qual o colaborador pertence
- **Data de Início** (date): Data de início da atuação

### 3. Campos Opcionais
- **Data de Término** (date): Data de término da atuação (se aplicável)

## Perfis Disponíveis

1. Analista Negócio
2. Product Owner
3. Scrum Master
4. Desenvolvedor Backend
5. Desenvolvedor Frontend
6. Desenvolvedor Mobile
7. QA/Test Engineer
8. DevOps / SRE
9. UX/UI Designer
10. Data Engineer
11. Stakeholder
12. Product Manager
13. Tech Lead
14. Agile Coach
15. Temporário
16. Gerente de Produto

## Tipos de Squad

1. Produto
2. Plataforma
3. DevOps Enablement / Coaching
4. Site Reliability Engineering
5. Segurança
6. Integração / APIs
7. DataOps / MLOps
8. Modernização

## Funcionalidades da Interface

### Busca e Filtros

#### Busca por Texto
- Campo de busca unificado
- Pesquisa simultânea por:
  - Matrícula do colaborador
  - Nome do colaborador
  - Perfil
  - Squad

#### Filtros Disponíveis
1. **Por Status**
   - Todos os Status
   - Ativo
   - Inativo

2. **Por Perfil**
   - Todos os Perfis
   - [Lista completa de perfis]

3. **Por Squad**
   - Todos os Squads
   - [Lista completa de squads]

### Ordenação

Campos ordenáveis (clique no cabeçalho):
- Colaborador
- Perfil
- Squad
- Data Início
- Data Término
- Status

### Paginação

- Itens por página configurável: 10, 25, 50, 100
- Navegação: Primeira, Anterior, Próxima, Última
- Indicador de página atual

### Ações Disponíveis

1. **Adicionar ao Squad**
   - Botão principal no topo da página
   - Abre modal de criação
   - Validações em tempo real

2. **Editar** (ícone de lápis)
   - Permite modificar associação existente
   - Mantém o ID da associação
   - Valida duplicatas excluindo o registro atual

3. **Inativar** (ícone de lixeira)
   - Marca a associação como Inativa
   - Não remove permanentemente do banco
   - Desabilita botão se já estiver Inativo

## Estrutura de Dados

### Tipo TypeScript: `AssociacaoSquadAplicacao`

```typescript
interface AssociacaoSquadAplicacao {
  id: string;
  colaboradorId: string;
  perfil: PerfilSquad;
  squad: TipoSquad;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}
```

### Tabela do Banco de Dados: `aplicacao_squads`

```sql
CREATE TABLE IF NOT EXISTS aplicacao_squads (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    colaborador_id VARCHAR(36) NOT NULL,
    perfil VARCHAR(100) NOT NULL,
    squad VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
    UNIQUE KEY unique_colaborador_perfil_squad (aplicacao_id, colaborador_id, perfil, squad)
);
```

## API Endpoints

### GET `/api/aplicacoes/:id/squads`
Lista todos os squads de uma aplicação específica.

**Response:**
```json
[
  {
    "id": "uuid",
    "colaboradorId": "uuid",
    "colaboradorNome": "Nome do Colaborador",
    "colaboradorMatricula": "12345",
    "perfil": "Desenvolvedor Backend",
    "squad": "Produto",
    "dataInicio": "2024-01-15",
    "dataTermino": null,
    "status": "Ativo"
  }
]
```

### POST `/api/aplicacoes/:id/squads`
Adiciona um colaborador ao squad da aplicação.

**Request Body:**
```json
{
  "colaboradorId": "uuid",
  "perfil": "Desenvolvedor Backend",
  "squad": "Produto",
  "dataInicio": "2024-01-15",
  "dataTermino": null
}
```

**Validações:**
- Verifica se a aplicação existe
- Verifica se o colaborador existe
- Verifica duplicatas (mesmo colaborador, perfil e squad ativos)

**Response (201):**
```json
{
  "id": "uuid-gerado",
  "aplicacaoId": "uuid",
  "colaboradorId": "uuid",
  "colaboradorNome": "Nome do Colaborador",
  "colaboradorMatricula": "12345",
  "perfil": "Desenvolvedor Backend",
  "squad": "Produto",
  "dataInicio": "2024-01-15",
  "dataTermino": null,
  "status": "Ativo"
}
```

### PUT `/api/aplicacoes/:id/squads/:squadId`
Atualiza uma associação de squad existente.

**Request Body:**
```json
{
  "colaboradorId": "uuid",
  "perfil": "Tech Lead",
  "squad": "Produto",
  "dataInicio": "2024-01-15",
  "dataTermino": "2024-12-31",
  "status": "Ativo"
}
```

**Validações:**
- Verifica se a associação existe
- Verifica se o colaborador existe
- Verifica duplicatas (excluindo o registro atual)

### DELETE `/api/aplicacoes/:id/squads/:squadId`
Remove uma associação de squad.

**Response (204):** Sem conteúdo

## Códigos de Erro

- **400** - Campos obrigatórios faltando
- **404** - Aplicação/Colaborador/Associação não encontrada
- **409** - Colaborador já está associado com este perfil e squad
- **500** - Erro interno do servidor

## Mensagens ao Usuário

### Sucesso
- "Squad adicionado"
- "Squad atualizado"
- "Squad marcado como inativo"

### Erro
- "Preencha todos os campos obrigatórios"
- "Colaborador já está associado com este perfil e squad"
- "Erro ao associar colaborador"
- "Erro ao atualizar dados"
- "Erro ao remover associação"

## Componentes Relacionados

### Frontend
- `StepSquads.tsx` - Componente principal da página
- `AplicacaoWizard.tsx` - Wizard que integra o passo de squads
- `AplicacoesView.tsx` - View que carrega colaboradores e passa para o wizard

### Backend
- `server/api.js` - Endpoints da API para squads
- `database/17-create-aplicacao-squads.sql` - Script de criação da tabela

### Types
- `src/lib/types.ts` - Definições de tipos TypeScript (`PerfilSquad`, `TipoSquad`, `AssociacaoSquadAplicacao`)

## Fluxo de Uso

1. Usuário acessa Wizard de Aplicação (criar ou editar)
2. Navega até o Passo 3 - "Squads"
3. Clica em "Adicionar ao Squad"
4. Seleciona colaborador do dropdown (matrícula - nome)
5. Seleciona perfil do dropdown
6. Seleciona squad do dropdown
7. Define data de início (obrigatória)
8. Opcionalmente define data de término
9. Clica em "Salvar"
10. Sistema valida:
    - Campos obrigatórios preenchidos
    - Não há duplicata da combinação colaborador+perfil+squad
11. Associação é adicionada à lista
12. Ao finalizar o wizard, dados são salvos no banco

## Comportamento Especial

### Validação de Duplicatas
O sistema previne a criação de duplicatas verificando se já existe uma associação **ATIVA** com:
- Mesmo `colaboradorId`
- Mesmo `perfil`
- Mesmo `squad`
- Na mesma `aplicacao_id`

### Inativação vs Exclusão
- O botão de "lixeira" **marca como Inativo**, não exclui
- Registros inativos ficam na lista com opacity reduzida
- Permite histórico de participação dos colaboradores
- Botão fica desabilitado se já estiver Inativo

### Formatação de Datas
- Backend armazena no formato MySQL: `YYYY-MM-DD`
- Frontend exibe no formato brasileiro: `DD/MM/YYYY`
- Input usa tipo `date` nativo do HTML5

## Melhorias Futuras (Sugestões)

1. **Histórico de Mudanças**
   - Log de alterações de perfil/squad
   - Auditoria de movimentações

2. **Dashboard de Alocação**
   - Visualização de capacidade por squad
   - Colaboradores sem alocação
   - Sobreposição de datas

3. **Exportação**
   - Relatório de composição de squads
   - Timeline de participação

4. **Notificações**
   - Alerta de término de alocação próximo
   - Notificar colaborador de nova alocação

5. **Métricas**
   - Tempo médio de permanência por perfil
   - Rotatividade por squad
   - Distribuição de perfis

## Referências

- Baseado no padrão de `StepTecnologias.tsx`
- Segue convenções do projeto CodeWiki
- Utiliza componentes do shadcn/ui
- Ícones do Phosphor Icons

---

**Última atualização:** Janeiro 2026
**Versão:** 1.0
**Autor:** Sistema CodeWiki
