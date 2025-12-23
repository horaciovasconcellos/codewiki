import { useState, useMemo } from 'react';
import { TipoComunicacao, TipoComunicacaoEnum } from '@/lib/types';
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
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass
} from '@phosphor-icons/react';

interface TiposComunicacaoDataTableProps {
  tiposComunicacao: TipoComunicacao[];
  onEdit: (tipo: TipoComunicacao) => void;
  onDelete: (id: string) => void;
}

type SortField = 'sigla' | 'tipo';
type SortOrder = 'asc' | 'desc';

export function TiposComunicacaoDataTable({ tiposComunicacao, onEdit, onDelete }: TiposComunicacaoDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const tipos: TipoComunicacaoEnum[] = ['Sincrono', 'Assincrono', 'Ambos'];

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

  const getTipoColor = (tipo: TipoComunicacaoEnum) => {
    const colors: Record<TipoComunicacaoEnum, string> = {
      'Sincrono': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      'Assincrono': 'bg-green-500/10 text-green-700 dark:text-green-400',
      'Ambos': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    };
    return colors[tipo] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };

  const filteredAndSortedTipos = useMemo(() => {
    let result = tiposComunicacao.filter(tipo => {
      const matchesSearch = 
        tipo.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tipo.usoTipico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tipo.tecnologias.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTipo = tipoFilter === 'all' || tipo.tipo === tipoFilter;
      
      return matchesSearch && matchesTipo;
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
  }, [tiposComunicacao, searchTerm, tipoFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedTipos.length / pageSize);
  const paginatedTipos = filteredAndSortedTipos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>Lista de Tipos de Comunicação</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por sigla, tecnologia ou uso típico..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={tipoFilter}
              onValueChange={(value) => {
                setTipoFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {tipos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedTipos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedTipos.length)} de {filteredAndSortedTipos.length} tipos de comunicação
            </div>
            {(searchTerm || tipoFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTipoFilter('all');
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
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 w-[120px]"
                  onClick={() => handleSort('sigla')}
                >
                  <div className="flex items-center">
                    Sigla
                    {getSortIcon('sigla')}
                  </div>
                </TableHead>
                <TableHead>Tecnologias</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 w-[150px]"
                  onClick={() => handleSort('tipo')}
                >
                  <div className="flex items-center">
                    Tipo
                    {getSortIcon('tipo')}
                  </div>
                </TableHead>
                <TableHead>Uso Típico</TableHead>
                <TableHead className="text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTipos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum tipo de comunicação encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTipos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium font-mono">{tipo.sigla}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tipo.tecnologias.map((tec, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tec}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(tipo.tipo)} variant="secondary">
                        {tipo.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">{tipo.usoTipico}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(tipo)}
                        >
                          <PencilSimple size={18} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash size={18} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o tipo de comunicação "{tipo.sigla}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(tipo.id)}>
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
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / pág</SelectItem>
                  <SelectItem value="25">25 / pág</SelectItem>
                  <SelectItem value="50">50 / pág</SelectItem>
                  <SelectItem value="100">100 / pág</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
