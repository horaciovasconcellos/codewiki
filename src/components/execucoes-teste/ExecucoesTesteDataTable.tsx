import { useState, useMemo } from 'react';
import { ExecucaoTeste, AmbienteTeste, StatusExecucao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  PencilSimple, 
  Trash,
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  Plus,
  Download,
  Printer
} from '@phosphor-icons/react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatarDataHora } from '@/lib/utils';
import { ExecucaoTesteRelatorio } from './ExecucaoTesteRelatorio';

interface ExecucoesTesteDataTableProps {
  execucoes: ExecucaoTeste[];
  onEdit: (execucao: ExecucaoTeste) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onDownload?: (id: string) => void;
}

type SortField = 'dataHoraInicio' | 'casoTesteTitulo' | 'ambiente' | 'executorNome' | 'statusExecucao';
type SortOrder = 'asc' | 'desc';

const statusColors: Record<StatusExecucao, 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline'> = {
  'Aguardando': 'secondary',
  'Em Execucao': 'default',
  'Passou': 'default',
  'Falhou': 'destructive',
  'Bloqueado': 'warning',
  'Cancelado': 'outline'
};

const ambienteColors: Record<AmbienteTeste, 'default' | 'secondary' | 'outline'> = {
  'DEV': 'secondary',
  'QA': 'default',
  'HML': 'default',
  'PRD': 'destructive'
};

export function ExecucoesTesteDataTable({
  execucoes,
  onEdit,
  onDelete,
  onNew,
  onDownload
}: ExecucoesTesteDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAmbiente, setFilterAmbiente] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('dataHoraInicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [relatorioExecucao, setRelatorioExecucao] = useState<ExecucaoTeste | null>(null);

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

  const filteredExecucoes = useMemo(() => {
    let result = execucoes.filter((execucao) => {
      const matchesSearch = 
        searchTerm === '' ||
        execucao.casoTesteTitulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execucao.executorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execucao.requisitoVinculado?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAmbiente = 
        filterAmbiente === 'todos' || 
        execucao.ambiente === filterAmbiente;

      const matchesStatus = 
        filterStatus === 'todos' ||
        execucao.statusExecucao === filterStatus;

      return matchesSearch && matchesAmbiente && matchesStatus;
    });

    // Ordenação
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'dataHoraInicio':
          aValue = new Date(a.dataHoraInicio).getTime();
          bValue = new Date(b.dataHoraInicio).getTime();
          break;
        case 'casoTesteTitulo':
          aValue = a.casoTesteTitulo || '';
          bValue = b.casoTesteTitulo || '';
          break;
        case 'ambiente':
          aValue = a.ambiente;
          bValue = b.ambiente;
          break;
        case 'executorNome':
          aValue = a.executorNome || '';
          bValue = b.executorNome || '';
          break;
        case 'statusExecucao':
          aValue = a.statusExecucao;
          bValue = b.statusExecucao;
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
  }, [execucoes, searchTerm, filterAmbiente, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredExecucoes.length / pageSize);
  const paginatedExecucoes = filteredExecucoes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterAmbiente('todos');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterAmbiente !== 'todos' || filterStatus !== 'todos';

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Execuções de Teste</CardTitle>
              <CardDescription>
                Registro de execuções de testes realizadas
              </CardDescription>
            </div>
            <Button onClick={onNew}>
              <Plus className="mr-2" />
              Nova Execução
            </Button>
          </div>
        
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                id="search-execucao"
                placeholder="Buscar por caso de teste, executor ou requisito..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={filterAmbiente} onValueChange={(value) => {
                setFilterAmbiente(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger id="filter-ambiente">
                  <SelectValue placeholder="Todos os ambientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os ambientes</SelectItem>
                  <SelectItem value="DEV">DEV</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="HML">HML</SelectItem>
                  <SelectItem value="PRD">PRD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Aguardando">Aguardando</SelectItem>
                  <SelectItem value="Em Execucao">Em Execução</SelectItem>
                  <SelectItem value="Passou">Passou</SelectItem>
                  <SelectItem value="Falhou">Falhou</SelectItem>
                  <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedExecucoes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredExecucoes.length)} de {filteredExecucoes.length} execuç{filteredExecucoes.length !== 1 ? 'ões' : 'ão'}
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {paginatedExecucoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {execucoes.length === 0 ? (
                <>
                  <p className="text-lg">Nenhuma execução de teste registrada</p>
                  <p className="text-sm mt-2">Clique em "Nova Execução" para começar</p>
                </>
              ) : (
                <>
                  <p className="text-lg">Nenhuma execução encontrada</p>
                  <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('casoTesteTitulo')}
                    >
                      Caso de Teste
                      {getSortIcon('casoTesteTitulo')}
                    </Button>
                  </TableHead>
                  <TableHead>Requisito</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('ambiente')}
                    >
                      Ambiente
                      {getSortIcon('ambiente')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('executorNome')}
                    >
                      Executor
                      {getSortIcon('executorNome')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('dataHoraInicio')}
                    >
                      Data/Hora Início
                      {getSortIcon('dataHoraInicio')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('statusExecucao')}
                    >
                      Status
                      {getSortIcon('statusExecucao')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExecucoes.map((execucao) => (
                  <TableRow key={execucao.id} className="hover:bg-gray-100">
                    <TableCell className="font-mono text-xs">
                      {execucao.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">{execucao.casoTesteTitulo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {execucao.requisitoVinculado || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ambienteColors[execucao.ambiente]}>
                        {execucao.ambiente}
                      </Badge>
                    </TableCell>
                    <TableCell>{execucao.executorNome}</TableCell>
                    <TableCell className="text-sm">
                      {formatarDataHora(execucao.dataHoraInicio)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[execucao.statusExecucao]}>
                        {execucao.statusExecucao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRelatorioExecucao(execucao)}
                          title="Ver relatório"
                        >
                          <Printer size={18} />
                        </Button>
                        {execucao.arquivoResultado && onDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(execucao.id)}
                            title="Download evidência"
                          >
                            <Download size={18} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(execucao)}
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
                                Tem certeza que deseja excluir esta execução de teste? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(execucao.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
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
      </CardContent>

      {/* Modal do Relatório */}
      {relatorioExecucao && (
        <ExecucaoTesteRelatorio
          execucao={relatorioExecucao}
          open={!!relatorioExecucao}
          onClose={() => setRelatorioExecucao(null)}
        />
      )}
    </Card>
  );
}
