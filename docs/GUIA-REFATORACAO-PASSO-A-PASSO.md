# 🛠️ Guia Passo a Passo - Refatoração de Duplicação

## StepSquads.tsx - Refatoração Completa

### Passo 1: Adicionar Imports

**Remover:**
```typescript
import { CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
```

**Adicionar:**
```typescript
import { useTableSort } from '@/hooks/useTableSort';
import { useTablePagination } from '@/hooks/useTablePagination';
import { SortableTableHeader } from '@/components/ui/SortableTableHeader';
```

---

### Passo 2: Remover Estado Manual de Ordenação e Paginação

**Remover estas linhas:**
```typescript
const [sortField, setSortField] = useState<SortField>('colaborador');
const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
```

---

### Passo 3: Remover Funções Duplicadas

**Remover estas funções completas:**

```typescript
const handleSort = (field: SortField) => {
  if (sortField === field) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortOrder('asc');
  }
};

const getSortIcon = (field: SortField) => {
  if (sortField !== field) {
    return <CaretUpDown size={16} className="ml-1 text-muted-foreground" />;
  }
  return sortOrder === 'asc' 
    ? <CaretUp size={16} className="ml-1" />
    : <CaretDown size={16} className="ml-1" />;
};
```

---

### Passo 4: Simplificar Filtros e Ordenação

**Substituir:**
```typescript
const filteredAndSortedSquads = useMemo(() => {
  let result = squadsAssociadas.filter(assoc => {
    const colabNome = getColaboradorNome(assoc.colaboradorId).toLowerCase();
    const matchesSearch = colabNome.includes(searchTerm.toLowerCase()) ||
                         assoc.perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assoc.squad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || assoc.status === filterStatus;
    const matchesPerfil = filterPerfil === 'todos' || assoc.perfil === filterPerfil;
    const matchesSquad = filterSquad === 'todos' || assoc.squad === filterSquad;
    
    return matchesSearch && matchesStatus && matchesPerfil && matchesSquad;
  });

  result.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortField === 'colaborador') {
      aValue = getColaboradorNome(a.colaboradorId);
      bValue = getColaboradorNome(b.colaboradorId);
    } else if (sortField === 'perfil') {
      aValue = a.perfil;
      bValue = b.perfil;
    } else if (sortField === 'squad') {
      aValue = a.squad;
      bValue = b.squad;
    } else if (sortField === 'status') {
      aValue = a.status;
      bValue = b.status;
    } else if (sortField === 'dataInicio') {
      aValue = a.dataInicio;
      bValue = b.dataInicio;
    } else if (sortField === 'dataTermino') {
      aValue = a.dataTermino || '';
      bValue = b.dataTermino || '';
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });

  return result;
}, [squadsAssociadas, colaboradores, searchTerm, filterStatus, filterPerfil, filterSquad, sortField, sortOrder]);

const totalPages = Math.ceil(filteredAndSortedSquads.length / pageSize);
const paginatedSquads = filteredAndSortedSquads.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterStatus, filterPerfil, filterSquad]);
```

**Por:**
```typescript
// 1. Apenas filtros (não muda)
const filteredSquads = useMemo(() => {
  return squadsAssociadas.filter(assoc => {
    const colabNome = getColaboradorNome(assoc.colaboradorId).toLowerCase();
    const matchesSearch = colabNome.includes(searchTerm.toLowerCase()) ||
                         assoc.perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assoc.squad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || assoc.status === filterStatus;
    const matchesPerfil = filterPerfil === 'todos' || assoc.perfil === filterPerfil;
    const matchesSquad = filterSquad === 'todos' || assoc.squad === filterSquad;
    
    return matchesSearch && matchesStatus && matchesPerfil && matchesSquad;
  });
}, [squadsAssociadas, colaboradores, searchTerm, filterStatus, filterPerfil, filterSquad]);

// 2. Ordenação com hook
const { sortField, sortOrder, sortedData, handleSort } = useTableSort({
  data: filteredSquads,
  initialField: 'colaborador' as SortField,
  initialOrder: 'asc'
});

// 3. Paginação com hook
const {
  currentPage,
  pageSize,
  totalPages,
  paginatedData: paginatedSquads,
  setCurrentPage,
  setPageSize
} = useTablePagination({
  data: sortedData,
  initialPageSize: 10
});

// 4. Reset automático de página
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterStatus, filterPerfil, filterSquad, setCurrentPage]);
```

---

### Passo 5: Refatorar TableHeaders

**Substituir CADA header:**
```typescript
<TableHead>
  <Button
    variant="ghost"
    size="sm"
    className="h-auto p-0 font-semibold hover:bg-transparent"
    onClick={() => handleSort('colaborador')}
  >
    Colaborador
    {getSortIcon('colaborador')}
  </Button>
</TableHead>
```

**Por:**
```typescript
<TableHead>
  <SortableTableHeader
    field={'colaborador' as SortField}
    currentSortField={sortField}
    sortOrder={sortOrder}
    onSort={handleSort}
  >
    Colaborador
  </SortableTableHeader>
</TableHead>
```

**Repetir para todos os headers:** perfil, squad, dataInicio, dataTermino, status

---

## ExecucoesTesteDataTable.tsx - Refatoração

### Passos Idênticos

1. Adicionar imports de hooks e componente
2. Remover estado manual
3. Remover `handleSort` e `getSortIcon`
4. Separar filtros de ordenação/paginação
5. Usar hooks
6. Refatorar headers

### Diferenças Específicas

**Campo inicial diferente:**
```typescript
const { sortField, sortOrder, sortedData, handleSort } = useTableSort({
  data: filteredExecucoes,
  initialField: 'dataHoraInicio' as SortField,  // ← Diferente
  initialOrder: 'desc'  // ← Ordem inicial desc
});
```

---

## TecnologiaWizard.tsx - Refatoração de API

### Passo 1: Adicionar Import

```typescript
import {
  loadResponsaveis,
  loadContratos,
  loadContratosAMS,
  loadCustosSaaS,
  loadManutencoesSaaS,
  loadRelatedData
} from '@/utils/apiHelpers';
```

---

### Passo 2: Remover Funções Duplicadas

**Remover completamente:**
```typescript
const loadResponsaveis = async (tecnologiaId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/responsaveis`);
    if (response.ok) {
      const data = await response.json();
      // Mapear dados...
      setResponsaveis(responsaveisFormatados);
    }
  } catch (error) {
    console.error('Erro ao carregar responsáveis:', error);
  }
};

const loadContratos = async (tecnologiaId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos`);
    if (response.ok) {
      const data = await response.json();
      setContratos(data);
    }
  } catch (error) {
    console.error('Erro ao carregar contratos:', error);
  }
};

// + 3 funções similares (loadContratosAMS, loadCustosSaaS, loadManutencoesSaaS)
```

---

### Passo 3: Refatorar useEffect

**Opção A - Carregar individualmente:**
```typescript
useEffect(() => {
  if (tecnologia?.id) {
    loadResponsaveis(tecnologia.id).then(data => {
      if (data) {
        // Mapear dados...
        setResponsaveis(responsaveisFormatados);
      }
    });
    loadContratos(tecnologia.id).then(data => data && setContratos(data));
    loadContratosAMS(tecnologia.id).then(data => data && setContratosAMS(data));
    loadCustosSaaS(tecnologia.id).then(data => data && setCustosSaaS(data));
    loadManutencoesSaaS(tecnologia.id).then(data => data && setManutencoesSaaS(data));
  }
}, [tecnologia?.id]);
```

**Opção B - Carregar em paralelo (MELHOR):**
```typescript
useEffect(() => {
  if (tecnologia?.id) {
    loadRelatedData({
      responsaveis: `/api/tecnologias/${tecnologia.id}/responsaveis`,
      contratos: `/api/tecnologias/${tecnologia.id}/contratos`,
      contratosAMS: `/api/tecnologias/${tecnologia.id}/contratos-ams`,
      custosSaaS: `/api/tecnologias/${tecnologia.id}/custos-saas`,
      manutencoesSaaS: `/api/tecnologias/${tecnologia.id}/manutencoes-saas`,
    }).then(({ responsaveis, contratos, contratosAMS, custosSaaS, manutencoesSaaS }) => {
      if (responsaveis) {
        // Mapear responsaveis...
        setResponsaveis(responsaveisFormatados);
      }
      if (contratos) setContratos(contratos);
      if (contratosAMS) setContratosAMS(contratosAMS);
      if (custosSaaS) setCustosSaaS(custosSaaS);
      if (manutencoesSaaS) setManutencoesSaaS(manutencoesSaaS);
    });
  }
}, [tecnologia?.id]);
```

---

## ✅ Checklist de Validação

Após cada refatoração:

- [ ] TypeScript compila sem erros: `npm run type-check`
- [ ] Build de produção funciona: `npm run build`
- [ ] Ordenação funciona (clique nos headers)
- [ ] Paginação funciona (navegue entre páginas)
- [ ] Filtros funcionam (busca e selects)
- [ ] Comportamento idêntico ao original

---

## 🔍 Testes Manuais

### Para DataTables:

1. **Ordenação:**
   - Clique em cada header
   - Verifique alternância ASC → DESC → ASC
   - Verifique ícone muda corretamente

2. **Paginação:**
   - Navegue entre páginas
   - Mude tamanho da página
   - Verifique contador de registros

3. **Filtros:**
   - Digite na busca
   - Mude selects de filtro
   - Verifique "Limpar filtros"
   - Confirme que página reseta para 1

### Para TecnologiaWizard:

1. **Carregamento:**
   - Abra modal de edição
   - Verifique se dados carregam
   - Console.log não deve mostrar erros

---

## 📊 Comparação de Complexidade

### Antes:
- **Complexidade Cognitiva:** Alta (80+ linhas de lógica)
- **Linhas de Código:** 196
- **Manutenção:** Difícil (30+ arquivos)
- **Testabilidade:** Baixa

### Depois:
- **Complexidade Cognitiva:** Baixa (38 linhas)
- **Linhas de Código:** 38
- **Manutenção:** Fácil (4 arquivos centralizados)
- **Testabilidade:** Alta (hooks isolados)

---

## 🚨 Problemas Comuns

### Erro: "Cannot find module '@/hooks/useTableSort'"

**Solução:** Verifique que o arquivo foi criado corretamente:
```bash
ls -l src/hooks/useTableSort.ts
```

### Erro: "Type 'string' is not assignable to type 'SortField'"

**Solução:** Adicione cast explícito:
```typescript
field={'colaborador' as SortField}
```

### Ordenação não funciona

**Solução:** Verifique se `sortedData` está sendo usado (não `filteredData`):
```typescript
const { paginatedData } = useTablePagination({
  data: sortedData,  // ← Deve ser sortedData, não filteredData
});
```

---

## 📞 Precisa de Ajuda?

1. Consulte o exemplo completo: `examples/StepSquads.REFATORADO.tsx`
2. Leia a documentação: `docs/DUPLICACAO-CODIGO-REACT.md`
3. Execute o script: `./refactor-duplications.sh`
