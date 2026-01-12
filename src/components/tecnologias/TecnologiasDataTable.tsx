import { useState, useMemo } from 'react';
import { Tecnologia } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PencilSimple, 
  Trash, 
  Eye,
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  DeviceMobile,
  TestTube,
  RocketLaunch,
  Cloud,
  HardDrives
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface TecnologiasDataTableProps {
  tecnologias: Tecnologia[];
  onSelect: (tecnologia: Tecnologia) => void;
  onEdit: (tecnologia: Tecnologia) => void;
  onDelete: (id: string) => void;
}

type SortField = 'nome' | 'sigla' | 'categoria' | 'status' | 'versaoRelease' | 'fornecedorFabricante' | 'maturidadeInterna';
type SortOrder = 'asc' | 'desc';

export function TecnologiasDataTable({ tecnologias, onSelect, onEdit, onDelete }: TecnologiasDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDelete = (id: string, nome: string) => {
    onDelete(id);
    toast.success(`Tecnologia "${nome}" excluída com sucesso`);
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

  const filteredAndSortedTecnologias = useMemo(() => {
    let result = tecnologias.filter(tech => {
      const matchesSearch = 
        tech.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.fornecedorFabricante.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategoria = filterCategoria === 'all' || tech.categoria === filterCategoria;
      const matchesStatus = filterStatus === 'all' || tech.status === filterStatus;

      return matchesSearch && matchesCategoria && matchesStatus;
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
  }, [tecnologias, searchTerm, filterCategoria, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedTecnologias.length / pageSize);
  const paginatedTecnologias = filteredAndSortedTecnologias.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'default';
      case 'Em avaliação':
        return 'secondary';
      case 'Obsoleta':
        return 'outline';
      case 'Descontinuada':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Frontend': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Backend': 'bg-green-500/10 text-green-700 border-green-200',
      'Banco de Dados': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'Infraestrutura': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'Devops': 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
      'Segurança': 'bg-red-500/10 text-red-700 border-red-200',
      'Analytics': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'Integração': 'bg-pink-500/10 text-pink-700 border-pink-200',
      'Inteligencia Artificial': 'bg-violet-500/10 text-violet-700 border-violet-200',
      'Aplicação Terceira': 'bg-gray-500/10 text-gray-700 border-gray-200',
      'Outras': 'bg-slate-500/10 text-slate-700 border-slate-200',
    };
    return colors[categoria] || colors['Outras'];
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>Lista de Tecnologias</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por nome, sigla ou fornecedor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategoria} onValueChange={(value) => {
                setFilterCategoria(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="Frontend">Frontend</SelectItem>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
                  <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                  <SelectItem value="Devops">Devops</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Integração">Integração</SelectItem>
                  <SelectItem value="Inteligencia Artificial">Inteligência Artificial</SelectItem>
                  <SelectItem value="Aplicação Terceira">Aplicação Terceira</SelectItem>
                  <SelectItem value="Outras">Outras</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Em avaliação">Em avaliação</SelectItem>
                  <SelectItem value="Obsoleta">Obsoleta</SelectItem>
                  <SelectItem value="Descontinuada">Descontinuada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedTecnologias.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedTecnologias.length)} de {filteredAndSortedTecnologias.length} tecnologias
            </div>
            {(searchTerm || filterCategoria !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategoria('all');
                  setFilterStatus('all');
                  setCurrentPage(1);
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
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
                    onClick={() => handleSort('sigla')}
                  >
                    Sigla
                    {getSortIcon('sigla')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('categoria')}
                  >
                    Categoria
                    {getSortIcon('categoria')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('versaoRelease')}
                  >
                    Versão
                    {getSortIcon('versaoRelease')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('fornecedorFabricante')}
                  >
                    Fornecedor
                    {getSortIcon('fornecedorFabricante')}
                  </Button>
                </TableHead>
                <TableHead>Ambientes</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('maturidadeInterna')}
                  >
                    Maturidade
                    {getSortIcon('maturidadeInterna')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTecnologias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhuma tecnologia encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTecnologias.map((tecnologia) => (
                  <TableRow key={tecnologia.id} className="hover:bg-gray-100">
                    <TableCell className="font-medium">{tecnologia.nome}</TableCell>
                    <TableCell>{tecnologia.sigla}</TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(tecnologia.categoria)} variant="outline">
                        {tecnologia.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(tecnologia.status)}>
                        {tecnologia.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tecnologia.versaoRelease}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tecnologia.fornecedorFabricante}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {tecnologia.ambientes.dev && (
                          <Badge variant="secondary" className="text-xs px-1">
                            <DeviceMobile size={12} />
                          </Badge>
                        )}
                        {tecnologia.ambientes.qa && (
                          <Badge variant="secondary" className="text-xs px-1">
                            <TestTube size={12} />
                          </Badge>
                        )}
                        {tecnologia.ambientes.prod && (
                          <Badge variant="secondary" className="text-xs px-1">
                            <RocketLaunch size={12} />
                          </Badge>
                        )}
                        {tecnologia.ambientes.cloud && (
                          <Badge variant="secondary" className="text-xs px-1">
                            <Cloud size={12} />
                          </Badge>
                        )}
                        {tecnologia.ambientes.onPremise && (
                          <Badge variant="secondary" className="text-xs px-1">
                            <HardDrives size={12} />
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tecnologia.maturidadeInterna}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onSelect(tecnologia)}
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onEdit(tecnologia)}
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
                                Tem certeza que deseja excluir a tecnologia "{tecnologia.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tecnologia.id, tecnologia.nome)}>
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
              <span className="text-sm text-muted-foreground px-2">
                Página {currentPage} de {totalPages}
              </span>
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
        )}
      </CardContent>
    </Card>
  );
}
  