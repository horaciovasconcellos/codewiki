import { useState, useMemo } from 'react';
import { Colaborador } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, PencilSimple, Plus, Trash, MagnifyingGlass, X, FilePdf, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
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
import { formatarData } from '@/lib/utils';

interface ColaboradoresDataTableProps {
  colaboradores: Colaborador[];
  onView: (colaborador: Colaborador) => void;
  onEdit: (colaborador: Colaborador) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onGeneratePDF?: (colaborador: Colaborador) => void;
}

type SortField = 'matricula' | 'nome' | 'setor' | 'dataAdmissao';
type SortOrder = 'asc' | 'desc';

export function ColaboradoresDataTable({
  colaboradores,
  onView,
  onEdit,
  onDelete,
  onNew,
  onGeneratePDF
}: ColaboradoresDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const setores = useMemo(() => {
    const uniqueSetores = new Set(colaboradores.map(c => c.setor));
    return Array.from(uniqueSetores).sort();
  }, [colaboradores]);

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

  const filteredColaboradores = useMemo(() => {
    let result = colaboradores.filter((colaborador) => {
      const matchesSearch = 
        searchTerm === '' ||
        colaborador.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaborador.setor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSetor = 
        filterSetor === 'todos' || 
        colaborador.setor === filterSetor;

      const isAtivo = !colaborador.dataDemissao;
      const matchesStatus = 
        filterStatus === 'todos' ||
        (filterStatus === 'ativo' && isAtivo) ||
        (filterStatus === 'demitido' && !isAtivo);

      return matchesSearch && matchesSetor && matchesStatus;
    });

    // Ordenação
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'matricula':
          aValue = a.matricula;
          bValue = b.matricula;
          break;
        case 'nome':
          aValue = a.nome;
          bValue = b.nome;
          break;
        case 'setor':
          aValue = a.setor;
          bValue = b.setor;
          break;
        case 'dataAdmissao':
          aValue = new Date(a.dataAdmissao).getTime();
          bValue = new Date(b.dataAdmissao).getTime();
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
  }, [colaboradores, searchTerm, filterSetor, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredColaboradores.length / pageSize);
  const paginatedColaboradores = filteredColaboradores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterSetor('todos');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterSetor !== 'todos' || filterStatus !== 'todos';

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Colaboradores</CardTitle>
              <CardDescription>
                Cadastro e gerenciamento de colaboradores
              </CardDescription>
            </div>
            <Button onClick={onNew}>
              <Plus className="mr-2" />
              Novo Colaborador
            </Button>
          </div>
        
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="search-colaborador"
                  placeholder="Buscar por matrícula, nome ou setor..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
                </div>
              <div className="w-full sm:w-[200px]">
                <Select value={filterSetor} onValueChange={(value) => {
                  setFilterSetor(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="filter-setor">
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os setores</SelectItem>
                    {setores.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="demitido">Demitidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedColaboradores.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredColaboradores.length)} de {filteredColaboradores.length} colaborador{filteredColaboradores.length !== 1 ? 'es' : ''}
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
          {paginatedColaboradores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {colaboradores.length === 0 ? (
                <>
                  <p className="text-lg">Nenhum colaborador cadastrado</p>
                  <p className="text-sm mt-2">Clique em "Novo Colaborador" para começar</p>
                </>
              ) : (
                <>
                  <p className="text-lg">Nenhum colaborador encontrado</p>
                  <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('matricula')}
                    >
                      Matrícula
                      {getSortIcon('matricula')}
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
                      onClick={() => handleSort('setor')}
                    >
                      Setor
                      {getSortIcon('setor')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('dataAdmissao')}
                    >
                      Data Admissão
                      {getSortIcon('dataAdmissao')}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Afastamentos</TableHead>
                  <TableHead>Habilidades</TableHead>
                  <TableHead>Avaliações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedColaboradores.map((colaborador) => (
                  <TableRow key={colaborador.id} className="hover:bg-gray-100 data-[state=selected]:bg-gray-100">
                    <TableCell className="font-medium">{colaborador.matricula}</TableCell>
                    <TableCell>{colaborador.nome}</TableCell>
                    <TableCell>{colaborador.setor}</TableCell>
                    <TableCell>{formatarData(colaborador.dataAdmissao)}</TableCell>
                    <TableCell>
                      {colaborador.dataDemissao ? (
                        <Badge variant="destructive">Demitido</Badge>
                      ) : (
                        <Badge variant="default">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {colaborador.afastamentos?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {colaborador.habilidades?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {colaborador.avaliacoes?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {onGeneratePDF && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onGeneratePDF(colaborador)}
                            title="Gerar PDF"
                          >
                            <FilePdf />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(colaborador)}
                          title="Visualizar"
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(colaborador)}
                          title="Editar"
                        >
                          <PencilSimple />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o colaborador "{colaborador.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(colaborador.id)}>
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
    </Card>
  );
}

