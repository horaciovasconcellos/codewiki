import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LGPDRegistro, TipoDadoLGPD } from '@/types/lgpd';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { MagnifyingGlass, CaretUp, CaretDown, CaretUpDown, Eye, PencilSimple, Trash } from '@phosphor-icons/react';

interface LGPDDataTableProps {
  registros: LGPDRegistro[];
  onView: (registro: LGPDRegistro) => void;
  onEdit: (registro: LGPDRegistro) => void;
  onDelete: (id: number, identificacao: string) => void;
}

type SortField = 'identificacaoDados' | 'tipoDados' | 'tecnicaAnonimizacao' | 'dataInicio' | 'dataTermino';
type SortOrder = 'asc' | 'desc';

export function LGPDDataTable({ registros, onView, onEdit, onDelete }: LGPDDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipoDados, setFilterTipoDados] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('dataInicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <CaretUpDown size={16} />;
    return sortOrder === 'asc' ? <CaretUp size={16} /> : <CaretDown size={16} />;
  };

  const tiposDadosUnicos = useMemo(() => {
    const tipos = new Set(registros.map(r => r.tipoDados));
    return Array.from(tipos).sort();
  }, [registros]);

  const filteredAndSortedRegistros = useMemo(() => {
    return registros
      .filter((registro) => {
        const matchesSearch = 
          searchTerm === '' ||
          registro.identificacaoDados.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.tecnicaAnonimizacao.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesTipo = filterTipoDados === 'todos' || registro.tipoDados === filterTipoDados;
        const matchesStatus = 
          filterStatus === 'todos' ||
          (filterStatus === 'ativo' && registro.ativo) ||
          (filterStatus === 'inativo' && !registro.ativo);
        
        return matchesSearch && matchesTipo && matchesStatus;
      })
      .sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (sortField === 'dataInicio' || sortField === 'dataTermino') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [registros, searchTerm, filterTipoDados, filterStatus, sortField, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipoDados, filterStatus]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterTipoDados('todos');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredAndSortedRegistros.length / pageSize);
  const paginatedRegistros = filteredAndSortedRegistros.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getTipoDadosBadgeVariant = (tipo: TipoDadoLGPD): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (tipo) {
      case 'Dados Identificadores Diretos':
        return 'destructive';
      case 'Dados Sensíveis':
        return 'destructive';
      case 'Dados Financeiros':
        return 'default';
      case 'Dados Identificadores Indiretos':
        return 'secondary';
      case 'Dados de Localização':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatarData = (data: string | undefined) => {
    if (!data) return '-';
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por identificação ou técnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTipoDados} onValueChange={setFilterTipoDados}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            {tiposDadosUnicos.map(tipo => (
              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contador e Limpar Filtros */}
      {(searchTerm || filterTipoDados !== 'todos' || filterStatus !== 'todos') && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredAndSortedRegistros.length} resultado(s) encontrado(s)</span>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('identificacaoDados')}>
                <div className="flex items-center gap-1">
                  Identificação
                  {getSortIcon('identificacaoDados')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('tipoDados')}>
                <div className="flex items-center gap-1">
                  Tipo de Dados
                  {getSortIcon('tipoDados')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('tecnicaAnonimizacao')}>
                <div className="flex items-center gap-1">
                  Técnica Anonimização
                  {getSortIcon('tecnicaAnonimizacao')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('dataInicio')}>
                <div className="flex items-center gap-1">
                  Data Início
                  {getSortIcon('dataInicio')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('dataTermino')}>
                <div className="flex items-center gap-1">
                  Data Término
                  {getSortIcon('dataTermino')}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRegistros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedRegistros.map((registro) => (
                <TableRow key={registro.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{registro.identificacaoDados}</TableCell>
                  <TableCell>
                    <Badge variant={getTipoDadosBadgeVariant(registro.tipoDados)}>
                      {registro.tipoDados}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {registro.tecnicaAnonimizacao}
                  </TableCell>
                  <TableCell>{formatarData(registro.dataInicio)}</TableCell>
                  <TableCell>{formatarData(registro.dataTermino)}</TableCell>
                  <TableCell>
                    <Badge variant={registro.ativo ? 'default' : 'secondary'}>
                      {registro.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onView(registro)}
                        title="Visualizar detalhes"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onEdit(registro)}
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
                              Tem certeza que deseja excluir o registro "{registro.identificacaoDados}"? 
                              Esta ação não pode ser desfeita e todos os campos associados serão removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(registro.id, registro.identificacaoDados)}>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
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
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrando {paginatedRegistros.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedRegistros.length)} de {filteredAndSortedRegistros.length} registros
        </div>

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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
  );
}
