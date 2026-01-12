import { useState, useMemo } from 'react';
import { ProjetoGerado } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Trash, Eye, CloudArrowUp, GitBranch, MagnifyingGlass, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';

type SortField = 'produto' | 'projeto' | 'dataCriacao' | 'dataInicial';
type SortOrder = 'asc' | 'desc';

interface GeradorProjetosDataTableProps {
  projetos: ProjetoGerado[];
  onEdit: (projeto: ProjetoGerado) => void;
  onDelete: (projeto: ProjetoGerado) => void;
  onView: (projeto: ProjetoGerado) => void;
  onIntegrarAzure: (projeto: ProjetoGerado) => void;
  onCriarRepositorios: (projeto: ProjetoGerado) => void;
}

export function GeradorProjetosDataTable({ 
  projetos, 
  onEdit, 
  onDelete, 
  onView, 
  onIntegrarAzure, 
  onCriarRepositorios
}: GeradorProjetosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('dataCriacao');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
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

  const filteredAndSortedProjetos = useMemo(() => {
    let result = projetos.filter(projeto => {
      const matchesSearch = 
        searchTerm === '' ||
        projeto.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projeto.projeto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'todos' || 
        (projeto.status || 'Pendente') === filterStatus;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'produto':
          aValue = a.produto;
          bValue = b.produto;
          break;
        case 'projeto':
          aValue = a.projeto;
          bValue = b.projeto;
          break;
        case 'dataCriacao':
          aValue = new Date(a.dataCriacao).getTime();
          bValue = new Date(b.dataCriacao).getTime();
          break;
        case 'dataInicial':
          aValue = new Date(a.dataInicial).getTime();
          bValue = new Date(b.dataInicial).getTime();
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
  }, [projetos, searchTerm, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProjetos.length / pageSize);
  const paginatedProjetos = filteredAndSortedProjetos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'todos';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por aplicação ou projeto..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={filterStatus} onValueChange={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Processado">Processado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrando {paginatedProjetos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedProjetos.length)} de {filteredAndSortedProjetos.length} projeto{filteredAndSortedProjetos.length !== 1 ? 's' : ''}
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

      <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('produto')}
              >
                Aplicação Base
                {getSortIcon('produto')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('projeto')}
              >
                Projeto
                {getSortIcon('projeto')}
              </Button>
            </TableHead>
            <TableHead>Processo</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('dataInicial')}
              >
                Data Inicial
                {getSortIcon('dataInicial')}
              </Button>
            </TableHead>
            <TableHead>Semanas</TableHead>
            <TableHead>Iteração</TableHead>
            <TableHead>Repositórios</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('dataCriacao')}
              >
                Data Criação
                {getSortIcon('dataCriacao')}
              </Button>
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProjetos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                {projetos.length === 0 ? 'Nenhum projeto cadastrado' : 'Nenhum projeto encontrado'}
              </TableCell>
            </TableRow>
          ) : (
            paginatedProjetos.map((projeto) => (
              <TableRow key={projeto.id} className="hover:bg-gray-100 data-[state=selected]:bg-gray-100">
                <TableCell className="font-medium">{projeto.produto}</TableCell>
                <TableCell>
                  {projeto.urlProjeto ? (
                    <a 
                      href={projeto.urlProjeto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {projeto.projeto}
                    </a>
                  ) : (
                    projeto.projeto
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{projeto.workItemProcess}</Badge>
                </TableCell>
                <TableCell>{new Date(projeto.dataInicial).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{projeto.numeroSemanas || '-'}</TableCell>
                <TableCell>{projeto.iteracao}</TableCell>
                <TableCell>
                  <Badge>{projeto.repositorios.length}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={(projeto.status || 'Pendente') === 'Processado' ? 'default' : 'secondary'}>
                    {projeto.status || 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(projeto.dataCriacao).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(projeto)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Visualizar</TooltipContent>
                      </Tooltip>
                      
                      {(projeto.status || 'Pendente') === 'Pendente' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(projeto)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onIntegrarAzure(projeto)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CloudArrowUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Integrar com Azure DevOps</TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      {projeto.status === 'Processado' && projeto.repositorios && projeto.repositorios.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onCriarRepositorios(projeto)}
                              disabled={projeto.statusRepositorio === 'Y'}
                              className={projeto.statusRepositorio === 'Y' 
                                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                                : "bg-green-600 hover:bg-green-700"
                              }
                            >
                              <GitBranch className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {projeto.statusRepositorio === 'Y' 
                              ? 'Repositórios já criados' 
                              : 'Criar Repositórios Git'
                            }
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(projeto)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Excluir projeto
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
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
