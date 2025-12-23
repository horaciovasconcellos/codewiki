import { useState, useMemo } from 'react';
import { Payload } from '@/lib/types';
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
  MagnifyingGlass,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface PayloadsDataTableProps {
  data: Payload[];
  onEdit: (payload: Payload) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

type SortField = 'sigla' | 'aplicacaoSigla' | 'definicao' | 'dataInicio';
type SortOrder = 'asc' | 'desc';

export function PayloadsDataTable({ data, onEdit, onDelete, loading }: PayloadsDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dataInicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDelete = (id: string, sigla: string) => {
    onDelete(id);
    toast.success(`Payload "${sigla}" excluído com sucesso`);
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
      return <CaretUpDown className="ml-1 h-4 w-4" />;
    }
    return sortOrder === 'asc' ? (
      <CaretUp className="ml-1 h-4 w-4" />
    ) : (
      <CaretDown className="ml-1 h-4 w-4" />
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.sigla?.toLowerCase().includes(term) ||
          item.definicao?.toLowerCase().includes(term) ||
          item.descricao?.toLowerCase().includes(term) ||
          item.aplicacaoSigla?.toLowerCase().includes(term)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Tratamento especial para campos que podem ser undefined
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getValidacaoIcon = (valido: boolean) => {
    return valido ? (
      <CheckCircle className="inline-block text-green-600" size={20} />
    ) : (
      <XCircle className="inline-block text-red-600" size={20} />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payloads OpenAPI</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros e Pesquisa */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Pesquisar por sigla, definição, descrição ou aplicação..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Itens por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('aplicacaoSigla')}>
                  <div className="flex items-center">
                    Aplicação
                    {getSortIcon('aplicacaoSigla')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('sigla')}>
                  <div className="flex items-center">
                    Sigla
                    {getSortIcon('sigla')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('definicao')}>
                  <div className="flex items-center">
                    Definição
                    {getSortIcon('definicao')}
                  </div>
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('dataInicio')}>
                  <div className="flex items-center">
                    Data Início
                    {getSortIcon('dataInicio')}
                  </div>
                </TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead className="text-center">Válido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? 'Nenhum payload encontrado com os filtros aplicados'
                      : 'Nenhum payload cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((payload) => (
                  <TableRow key={payload.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payload.aplicacaoSigla}</div>
                        {payload.aplicacaoDescricao && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {payload.aplicacaoDescricao}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {payload.sigla}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px] truncate" title={payload.definicao}>
                        {payload.definicao}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payload.descricao ? (
                        <div className="max-w-[200px] truncate text-sm text-gray-600" title={payload.descricao}>
                          {payload.descricao}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(payload.dataInicio)}</TableCell>
                    <TableCell>
                      {payload.dataTermino ? (
                        formatDate(payload.dataTermino)
                      ) : (
                        <Badge variant="secondary">Em uso</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getValidacaoIcon(payload.arquivoValido)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(payload)}
                          title="Editar payload"
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Excluir payload"
                            >
                              <Trash className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o payload "{payload.sigla}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(payload.id, payload.sigla)}
                                className="bg-red-600 hover:bg-red-700"
                              >
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
              {Math.min(currentPage * pageSize, filteredAndSortedData.length)} de{' '}
              {filteredAndSortedData.length} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span key={`ellipsis-${page}`} className="px-2">
                          ...
                        </span>
                      )}
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    </>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
