import { useState, useMemo } from 'react';
import { OnPremiseToOnPremise, Aplicacao } from '@/lib/types';
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
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface OnPremiseToOnPremiseDataTableProps {
  data: OnPremiseToOnPremise[];
  aplicacoes: Aplicacao[];
  onEdit: (item: OnPremiseToOnPremise) => void;
  onDelete: (id: string) => void;
}

type SortField = 'aplicacaoOrigemId' | 'aplicacaoDestinoId' | 'tipoAutenticacao' | 'periodicidade' | 'frequenciaUso';
type SortOrder = 'asc' | 'desc';

export function OnPremiseToOnPremiseDataTable({ data, aplicacoes, onEdit, onDelete }: OnPremiseToOnPremiseDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('aplicacaoOrigemId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getAplicacaoNome = (id: string) => {
    const app = aplicacoes.find(a => a.id === id);
    return app ? `${app.sigla}` : '-';
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success('Registro excluído com sucesso');
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

  const filteredAndSortedData = useMemo(() => {
    let result = data.filter(item => {
      const origemNome = getAplicacaoNome(item.aplicacaoOrigemId);
      const destinoNome = getAplicacaoNome(item.aplicacaoDestinoId);
      const matchesSearch = 
        origemNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destinoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tipoAutenticacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.periodicidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.frequenciaUso.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    result.sort((a, b) => {
      let aValue: string;
      let bValue: string;
      
      if (sortField === 'aplicacaoOrigemId' || sortField === 'aplicacaoDestinoId') {
        aValue = getAplicacaoNome(a[sortField]);
        bValue = getAplicacaoNome(b[sortField]);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>Integrações OnPremise to OnPremise</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por aplicação, autenticação, periodicidade..."
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
              Mostrando {paginatedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedData.length)} de {filteredAndSortedData.length} registros
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
                    onClick={() => handleSort('aplicacaoOrigemId')}
                  >
                    Aplicação Origem
                    {getSortIcon('aplicacaoOrigemId')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('aplicacaoDestinoId')}
                  >
                    Aplicação Destino
                    {getSortIcon('aplicacaoDestinoId')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('tipoAutenticacao')}
                  >
                    Autenticação
                    {getSortIcon('tipoAutenticacao')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('periodicidade')}
                  >
                    Periodicidade
                    {getSortIcon('periodicidade')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('frequenciaUso')}
                  >
                    Frequência
                    {getSortIcon('frequenciaUso')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {data.length === 0 ? 'Nenhum registro cadastrado' : 'Nenhum registro encontrado'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-100">
                    <TableCell className="font-medium">{getAplicacaoNome(item.aplicacaoOrigemId)}</TableCell>
                    <TableCell>{getAplicacaoNome(item.aplicacaoDestinoId)}</TableCell>
                    <TableCell>{item.tipoAutenticacao}</TableCell>
                    <TableCell>{item.periodicidade}</TableCell>
                    <TableCell>{item.frequenciaUso}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onEdit(item)}
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
                                Tem certeza que deseja excluir esta integração? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
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
