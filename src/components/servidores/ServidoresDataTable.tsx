import { useState, useMemo } from 'react';
import { Servidor } from '@/lib/types';
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
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ServidoresDataTableProps {
  data: Servidor[];
  onEdit: (servidor: Servidor) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

type SortField = 'sigla' | 'hostname' | 'tipo' | 'ambiente' | 'status';
type SortOrder = 'asc' | 'desc';

export function ServidoresDataTable({ data, onEdit, onDelete, loading }: ServidoresDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inativo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Em manutenção':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Obsoleto':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Físico':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Virtual':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cloud':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = (id: string, hostname: string) => {
    onDelete(id);
    toast.success(`Servidor "${hostname}" excluído com sucesso`);
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

  const filteredAndSortedServidores = useMemo(() => {
    let result = data.filter(servidor => {
      const matchesSearch = 
        servidor.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servidor.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servidor.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servidor.ambiente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servidor.finalidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servidor.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
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
  }, [data, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedServidores.length / pageSize);
  const paginatedServidores = filteredAndSortedServidores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 pt-6">
          <p className="text-muted-foreground">Carregando servidores...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>Lista de Servidores</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por sigla, hostname, tipo, ambiente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedServidores.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedServidores.length)} de {filteredAndSortedServidores.length} servidores
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
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
                    onClick={() => handleSort('hostname')}
                  >
                    Hostname
                    {getSortIcon('hostname')}
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
                <TableHead>Finalidade</TableHead>
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServidores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {data.length === 0 ? 'Nenhum servidor cadastrado' : 'Nenhum servidor encontrado'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServidores.map((servidor) => (
                  <TableRow key={servidor.id} className="hover:bg-gray-100">
                    <TableCell className="font-mono font-semibold">{servidor.sigla}</TableCell>
                    <TableCell className="font-medium">{servidor.hostname}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getTipoColor(servidor.tipo)}`}>
                        {servidor.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{servidor.ambiente}</TableCell>
                    <TableCell>{servidor.finalidade}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(servidor.status)}`}>
                        {servidor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onEdit(servidor)}
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
                                Tem certeza que deseja excluir o servidor "{servidor.hostname}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(servidor.id, servidor.hostname)}>
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
