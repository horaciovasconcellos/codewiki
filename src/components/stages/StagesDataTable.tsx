import { useState, useMemo } from 'react';
import { Stage } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PencilSimple, Trash, MagnifyingGlass, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';

interface StagesDataTableProps {
  stages: Stage[];
  loading: boolean;
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

type SortField = 'nome' | 'tipo' | 'timeoutSeconds';
type SortOrder = 'asc' | 'desc';

const TIPO_COLORS: Record<string, string> = {
  Build: 'bg-blue-100 text-blue-800',
  Test: 'bg-green-100 text-green-800',
  Security: 'bg-red-100 text-red-800',
  Deploy: 'bg-purple-100 text-purple-800',
  Quality: 'bg-yellow-100 text-yellow-800',
  Notification: 'bg-gray-100 text-gray-800',
  Custom: 'bg-pink-100 text-pink-800',
};

export function StagesDataTable({
  stages,
  loading,
  onEdit,
  onDelete,
}: StagesDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const filteredAndSortedStages = useMemo(() => {
    let result = stages.filter(stage => {
      const matchesSearch = 
        searchTerm === '' ||
        stage.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stage.descricao && stage.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTipo = 
        filterTipo === 'todos' || 
        stage.tipo === filterTipo;

      return matchesSearch && matchesTipo;
    });

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome;
          bValue = b.nome;
          break;
        case 'tipo':
          aValue = a.tipo;
          bValue = b.tipo;
          break;
        case 'timeoutSeconds':
          aValue = a.timeoutSeconds || 3600;
          bValue = b.timeoutSeconds || 3600;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [stages, searchTerm, filterTipo, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedStages.length / pageSize);
  const paginatedStages = filteredAndSortedStages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterTipo('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterTipo !== 'todos';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={filterTipo} onValueChange={(value) => {
            setFilterTipo(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Build">Build</SelectItem>
              <SelectItem value="Test">Test</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="Deploy">Deploy</SelectItem>
              <SelectItem value="Quality">Quality</SelectItem>
              <SelectItem value="Notification">Notification</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrando {paginatedStages.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedStages.length)} de {filteredAndSortedStages.length} stage{filteredAndSortedStages.length !== 1 ? 's' : ''}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {paginatedStages.length === 0 ? (
        <div className="flex items-center justify-center p-8 border rounded-lg">
          <p className="text-muted-foreground">
            {stages.length === 0 ? 'Nenhum stage cadastrado' : 'Nenhum stage encontrado'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('nome')}
                  >
                    Nome
                    {getSortIcon('nome')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('tipo')}
                  >
                    Tipo
                    {getSortIcon('tipo')}
                  </Button>
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Reutilizável</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('timeoutSeconds')}
                  >
                    Timeout (s)
                    {getSortIcon('timeoutSeconds')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStages.map((stage) => (
                <TableRow key={stage.id} className="hover:bg-gray-100 data-[state=selected]:bg-gray-100">
              <TableCell className="font-medium">{stage.nome}</TableCell>
              <TableCell>
                <Badge className={TIPO_COLORS[stage.tipo] || 'bg-gray-100 text-gray-800'}>
                  {stage.tipo}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">
                {stage.descricao || '-'}
              </TableCell>
              <TableCell className="text-center">
                {stage.reutilizavel ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Sim
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Não
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {stage.timeoutSeconds || 3600}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(stage)}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(stage)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
