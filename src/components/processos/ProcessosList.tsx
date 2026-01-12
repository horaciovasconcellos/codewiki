import { useState, useMemo } from 'react';
import { ProcessoNegocio } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PencilSimple, 
  Trash, 
  Eye,
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  Funnel
} from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ProcessosListProps {
  processos: ProcessoNegocio[];
  onSelect: (processo: ProcessoNegocio) => void;
  onEdit: (processo: ProcessoNegocio) => void;
  onDelete: (id: string) => void;
}

type SortField = 'identificacao' | 'nome' | 'descricao' | 'nivelMaturidade' | 'areaResponsavel';
type SortOrder = 'asc' | 'desc';

export function ProcessosList({ processos, onSelect, onEdit, onDelete }: ProcessosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaturidade, setFilterMaturidade] = useState<string>('all');
  const [filterComplexidade, setFilterComplexidade] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('identificacao');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDelete = (id: string, descricao: string) => {
    onDelete(id);
    toast.success(`Processo "${descricao}" excluído com sucesso`);
  };

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

  const filteredAndSortedProcessos = useMemo(() => {
    let result = processos.filter(proc => {
      const matchesSearch = 
        proc.identificacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proc.nome && proc.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        proc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.areaResponsavel.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMaturidade = filterMaturidade === 'all' || proc.nivelMaturidade === filterMaturidade;
      const matchesComplexidade = filterComplexidade === 'all' || proc.complexidade === filterComplexidade;

      return matchesSearch && matchesMaturidade && matchesComplexidade;
    });

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    return result;
  }, [processos, searchTerm, filterMaturidade, filterComplexidade, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProcessos.length / pageSize);
  const paginatedProcessos = filteredAndSortedProcessos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getMaturidadeVariant = (maturidade: string) => {
    switch (maturidade) {
      case 'Inicial':
        return 'outline';
      case 'Repetível':
        return 'secondary';
      case 'Definido':
        return 'default';
      case 'Gerenciado':
        return 'default';
      case 'Otimizado':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getComplexidadeColor = (complexidade: string) => {
    const colors: Record<string, string> = {
      'Muito Baixa': 'bg-green-500/10 text-green-700 border-green-200',
      'Baixa': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Média': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'Alta': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'Muito Alta': 'bg-red-500/10 text-red-700 border-red-200',
    };
    return colors[complexidade] || colors['Média'];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por identificação, nome, descrição ou área..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select value={filterMaturidade} onValueChange={(value) => { setFilterMaturidade(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <Funnel className="mr-2" size={16} />
            <SelectValue placeholder="Maturidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os níveis</SelectItem>
            <SelectItem value="Inicial">Inicial</SelectItem>
            <SelectItem value="Repetível">Repetível</SelectItem>
            <SelectItem value="Definido">Definido</SelectItem>
            <SelectItem value="Gerenciado">Gerenciado</SelectItem>
            <SelectItem value="Otimizado">Otimizado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterComplexidade} onValueChange={(value) => { setFilterComplexidade(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Complexidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Muito Baixa">Muito Baixa</SelectItem>
            <SelectItem value="Baixa">Baixa</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Muito Alta">Muito Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrando {paginatedProcessos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedProcessos.length)} de {filteredAndSortedProcessos.length} processos
        </div>
        {(searchTerm || filterMaturidade !== 'all' || filterComplexidade !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setFilterMaturidade('all');
              setFilterComplexidade('all');
              setCurrentPage(1);
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('identificacao')}
                >
                  Sigla
                  {getSortIcon('identificacao')}
                </Button>
              </TableHead>
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
                  onClick={() => handleSort('areaResponsavel')}
                >
                  Área Responsável
                  {getSortIcon('areaResponsavel')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('nivelMaturidade')}
                >
                  Maturidade
                  {getSortIcon('nivelMaturidade')}
                </Button>
              </TableHead>
              <TableHead>Complexidade</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProcessos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum processo encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedProcessos.map((processo) => (
                <TableRow key={processo.id} className="hover:bg-gray-100">
                  <TableCell className="font-medium font-mono">{processo.identificacao}</TableCell>
                  <TableCell className="font-medium">{processo.nome || processo.descricao}</TableCell>
                  <TableCell>{processo.areaResponsavel}</TableCell>
                  <TableCell>
                    <Badge variant={getMaturidadeVariant(processo.nivelMaturidade)}>
                      {processo.nivelMaturidade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getComplexidadeColor(processo.complexidade)} variant="outline">
                      {processo.complexidade}
                    </Badge>
                  </TableCell>
                  <TableCell>{processo.frequencia}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onSelect(processo)}
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onEdit(processo)}
                        title="Editar"
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            title="Excluir"
                          >
                            <Trash size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o processo "{processo.nome || processo.descricao}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(processo.id, processo.nome || processo.descricao)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
