import { useState, useMemo } from 'react';
import { Runbook } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Eye,
  PencilSimple,
  Trash,
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  BookOpen,
  Plus,
} from '@phosphor-icons/react';

interface RunbooksDataTableProps {
  runbooks: Runbook[];
  onSelect: (runbook: Runbook) => void;
  onEdit: (runbook: Runbook) => void;
  onDelete: (id: string) => void;
  onNew?: () => void;
}

type SortField = 'sigla' | 'descricaoResumida' | 'tipoRunbook';
type SortOrder = 'asc' | 'desc';

const tipoColors: Record<string, string> = {
  'Procedimento de Rotina': 'bg-blue-500/10 text-blue-700 border-blue-300',
  'Contingência': 'bg-red-500/10 text-red-700 border-red-300',
  'Tratamento de Incidente': 'bg-orange-500/10 text-orange-700 border-orange-300',
  'Startup / Shutdown': 'bg-purple-500/10 text-purple-700 border-purple-300',
  'Deploy': 'bg-green-500/10 text-green-700 border-green-300',
  'Backup': 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
  'Restore': 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
  'Operação Programada': 'bg-pink-500/10 text-pink-700 border-pink-300',
};

const tipoRunbookOptions = [
  'Procedimento de Rotina',
  'Contingência',
  'Tratamento de Incidente',
  'Startup / Shutdown',
  'Deploy',
  'Backup',
  'Restore',
  'Operação Programada',
];

export function RunbooksDataTable({
  runbooks,
  onSelect,
  onEdit,
  onDelete,
  onNew,
}: RunbooksDataTableProps) {
  console.log('[RunbooksDataTable] Runbooks recebidos:', runbooks?.length || 0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipoRunbook, setFilterTipoRunbook] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtrar e ordenar runbooks
  const filteredAndSortedRunbooks = useMemo(() => {
    console.log('[RunbooksDataTable] Filtrando runbooks, total:', runbooks?.length || 0);
    
    let filtered = runbooks.filter((runbook) => {
      const matchesSearch =
        searchTerm === '' ||
        runbook.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        runbook.descricaoResumida.toLowerCase().includes(searchTerm.toLowerCase()) ||
        runbook.finalidade.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo =
        filterTipoRunbook === 'all' || runbook.tipoRunbook === filterTipoRunbook;

      return matchesSearch && matchesTipo;
    });

    console.log('[RunbooksDataTable] Runbooks filtrados:', filtered.length);

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'sigla':
          aValue = a.sigla.toLowerCase();
          bValue = b.sigla.toLowerCase();
          break;
        case 'descricaoResumida':
          aValue = a.descricaoResumida.toLowerCase();
          bValue = b.descricaoResumida.toLowerCase();
          break;
        case 'tipoRunbook':
          aValue = a.tipoRunbook.toLowerCase();
          bValue = b.tipoRunbook.toLowerCase();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [runbooks, searchTerm, filterTipoRunbook, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedRunbooks.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRunbooks = filteredAndSortedRunbooks.slice(startIndex, endIndex);

  // Resetar página quando filtros mudarem
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterTipoRunbook(value);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <CaretUpDown size={14} className="ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <CaretUp size={14} className="ml-1" />
    ) : (
      <CaretDown size={14} className="ml-1" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Runbooks</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gerenciamento de runbooks operacionais
            </p>
          </div>
          {onNew && (
            <Button onClick={onNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Runbook
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {/* Busca */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar por sigla, descrição ou finalidade..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterTipoRunbook} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Tipo de Runbook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tipoRunbookOptions.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('sigla')}
                >
                  <div className="flex items-center">
                    Sigla
                    {getSortIcon('sigla')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('descricaoResumida')}
                >
                  <div className="flex items-center">
                    Descrição
                    {getSortIcon('descricaoResumida')}
                  </div>
                </TableHead>
                <TableHead>Finalidade</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('tipoRunbook')}
                >
                  <div className="flex items-center">
                    Tipo
                    {getSortIcon('tipoRunbook')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRunbooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen size={48} className="text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        {runbooks.length === 0 
                          ? 'Nenhum runbook cadastrado'
                          : 'Nenhum runbook encontrado com os filtros aplicados'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {runbooks.length === 0
                          ? 'Clique em "Novo Runbook" para começar'
                          : 'Tente ajustar os filtros de busca'
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentRunbooks.map((runbook) => (
                  <TableRow key={runbook.id}>
                    <TableCell className="font-mono font-medium">
                      {runbook.sigla}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={runbook.descricaoResumida}>
                        {runbook.descricaoResumida}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={runbook.finalidade}>
                        {runbook.finalidade}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tipoColors[runbook.tipoRunbook] ||
                          'bg-gray-500/10 text-gray-700 border-gray-300'
                        }
                      >
                        {runbook.tipoRunbook}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelect(runbook)}
                          title="Visualizar"
                        >
                          <Eye size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(runbook)}
                          title="Editar"
                        >
                          <PencilSimple size={18} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Excluir">
                              <Trash size={18} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o runbook "{runbook.sigla}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(runbook.id)}>
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

        {/* Informações e Paginação */}
        {filteredAndSortedRunbooks.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} até{' '}
              {Math.min(endIndex, filteredAndSortedRunbooks.length)} de{' '}
              {filteredAndSortedRunbooks.length} runbooks
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="25">25 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
