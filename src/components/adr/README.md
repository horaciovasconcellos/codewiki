# Componentes ADR

Este diretório contém os componentes React para o sistema de Decisões Arquitetônicas (ADR).

## Componentes

### ADRsView.tsx
**Propósito:** Componente principal container que gerencia o estado e coordena os demais componentes.

**Responsabilidades:**
- Buscar lista de ADRs da API
- Gerenciar abertura/fechamento de dialogs
- Coordenar criação, edição e exclusão de ADRs
- Exibir confirmação de exclusão

**Props:** Nenhuma (componente standalone)

### ADRWizard.tsx
**Propósito:** Wizard multi-etapas para criar e editar ADRs.

**Props:**
```typescript
interface ADRWizardProps {
  open: boolean;              // Controla visibilidade do dialog
  onClose: () => void;        // Callback ao fechar
  onSuccess: () => void;      // Callback após salvar com sucesso
  editingADR?: ADR;          // ADR para editar (opcional)
}
```

**Etapas:**
1. **Dados Básicos:** Descrição, Status, Contexto, Decisão, Justificativa
2. **Detalhes:** Consequências, Riscos, Alternativas, Compliance
3. **Aplicações:** Associação com aplicações do sistema

**Validações:**
- Descrição é obrigatória
- ADR Substituta é obrigatória quando status = "Substituído"
- Formulário multi-etapa com navegação sequencial

### ADRDataTable.tsx
**Propósito:** Tabela com filtros para listar ADRs.

**Props:**
```typescript
interface ADRDataTableProps {
  adrs: ADR[];                     // Lista de ADRs
  onEdit: (adr: ADR) => void;      // Callback para editar
  onDelete: (id: string) => void;  // Callback para excluir
  onView: (adr: ADR) => void;      // Callback para visualizar
}
```

**Funcionalidades:**
- Busca por descrição ou sequência
- Filtro por status
- Badges coloridos por status
- Menu de ações (Visualizar, Editar, Excluir)
- Contador de resultados

### ADRView.tsx
**Propósito:** Modal de visualização detalhada de um ADR.

**Props:**
```typescript
interface ADRViewProps {
  open: boolean;          // Controla visibilidade
  onClose: () => void;    // Callback ao fechar
  adr: ADR | null;        // ADR a visualizar
}
```

**Exibição:**
- Todas as seções do ADR formatadas
- Badges de status coloridos
- Destaque para ADR substituta (se aplicável)
- Lista de aplicações associadas com detalhes completos

## Fluxo de Dados

```
ADRsView (Container)
├── Busca ADRs da API (/api/adrs)
├── Gerencia estado (loading, dialogs)
└── Renderiza componentes filhos:
    ├── ADRDataTable
    │   ├── Filtra e exibe ADRs
    │   └── Dispara ações (edit, delete, view)
    ├── ADRWizard
    │   ├── Cria/edita ADR
    │   └── POST/PUT /api/adrs
    └── ADRView
        └── Exibe detalhes completos
```

## Integração com API

### Endpoints Utilizados
- `GET /api/adrs` - Lista todos os ADRs
- `GET /api/adrs/:id` - Busca ADR específico
- `POST /api/adrs` - Cria novo ADR
- `PUT /api/adrs/:id` - Atualiza ADR
- `DELETE /api/adrs/:id` - Exclui ADR
- `GET /api/aplicacoes` - Lista aplicações para associação

### Formato de Dados

**ADR Completo:**
```typescript
{
  id: string;
  sequencia: number;
  descricao: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  status: StatusADR;
  contexto?: string;
  decisao?: string;
  justificativa?: string;
  consequenciasPositivas?: string;
  consequenciasNegativas?: string;
  riscos?: string;
  alternativasConsideradas?: string;
  complianceConstitution?: string;
  adrSubstitutaId?: string;
  adrSubstitutaSequencia?: number;
  referencias?: string;
  aplicacoes?: ADRAplicacao[];
}
```

**Associação com Aplicação:**
```typescript
{
  aplicacaoId: string;
  dataInicio: string;
  dataTermino: string;
  status: StatusAplicacaoADR;
  observacoes: string;
}
```

## Estilização

Os componentes utilizam:
- **shadcn/ui:** Dialog, Button, Input, Label, Textarea, Select, Badge, Card, ScrollArea, Separator
- **Phosphor Icons:** ArrowLeft, ArrowRight, Check, Plus, Trash, DotsThree, Eye, PencilSimple, MagnifyingGlass
- **Tailwind CSS:** Classes utilitárias para layout e espaçamento
- **date-fns:** Formatação de datas em pt-BR

## Cores de Status

### Status ADR
```typescript
const statusColorMap = {
  'Proposto': 'bg-blue-100 text-blue-800 border-blue-300',
  'Aceito': 'bg-green-100 text-green-800 border-green-300',
  'Rejeitado': 'bg-red-100 text-red-800 border-red-300',
  'Substituído': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Obsoleto': 'bg-gray-100 text-gray-800 border-gray-300',
  'Adiado/Retirado': 'bg-orange-100 text-orange-800 border-orange-300'
};
```

### Status Aplicação
```typescript
const statusAplicacaoColorMap = {
  'Ativo': 'bg-green-100 text-green-800 border-green-300',
  'Inativo': 'bg-gray-100 text-gray-800 border-gray-300',
  'Planejado': 'bg-blue-100 text-blue-800 border-blue-300',
  'Descontinuado': 'bg-red-100 text-red-800 border-red-300'
};
```

## Exemplo de Uso

```typescript
import { ADRsView } from '@/components/adr/ADRsView';

function App() {
  return (
    <div>
      <ADRsView />
    </div>
  );
}
```

O componente é autossuficiente e gerencia todo o ciclo de vida dos dados internamente.

## Tratamento de Erros

Todos os componentes utilizam:
- **toast** (sonner) para feedback ao usuário
- **try/catch** em operações assíncronas
- **console.error** para logging de erros
- **Mensagens descritivas** de erro da API

## Acessibilidade

- Labels associados a inputs
- Botões com texto descritivo
- Dialog modals com títulos e descrições
- Navegação por teclado suportada
- Cores com contraste adequado

## Performance

- **Lazy loading:** Dados carregados sob demanda
- **Debounce:** Busca com debounce automático
- **Memoização:** Filtros aplicados apenas quando necessário
- **Transações:** Operações atômicas no backend

## Testes

Para testar os componentes:

1. **Criar ADR:**
   - Preencher todos os campos obrigatórios
   - Testar validação de status "Substituído"
   - Adicionar múltiplas aplicações
   - Verificar criação no banco

2. **Editar ADR:**
   - Alterar status
   - Atualizar aplicações
   - Verificar persistência

3. **Visualizar ADR:**
   - Verificar exibição de todos os campos
   - Testar link para ADR substituta
   - Conferir lista de aplicações

4. **Excluir ADR:**
   - Confirmar modal de exclusão
   - Verificar remoção do banco
   - Validar cascata de aplicações

## Troubleshooting

### ADR Substituta não aparece no dropdown
**Causa:** ADR atual está se auto-referenciando  
**Solução:** O código filtra o ADR atual da lista de substitutas

### Aplicações não salvam
**Causa:** Transação falhando  
**Solução:** Verificar logs do servidor, validar UUIDs das aplicações

### Sequência não incrementa
**Causa:** AUTO_INCREMENT não configurado  
**Solução:** Verificar schema do banco de dados

### Erro "TEXT column can't have a default value"
**Causa:** MySQL strict mode  
**Solução:** Removido DEFAULT de campo TEXT no schema

## Dependências

```json
{
  "@phosphor-icons/react": "^2.x",
  "date-fns": "^2.x",
  "sonner": "^1.x",
  "react": "^18.x"
}
```

## Contribuindo

Ao adicionar novos recursos:
1. Manter padrão de nomenclatura
2. Adicionar validações apropriadas
3. Documentar props e comportamento
4. Manter acessibilidade
5. Testar fluxos completos
