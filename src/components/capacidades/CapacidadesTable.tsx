import { useState, useMemo } from 'react';
import { CapacidadeNegocio } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PencilSimple, 
  Trash, 
  Eye, 
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass,
  Funnel
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CapacidadesTableProps {
  capacidades: CapacidadeNegocio[];
  onEdit: (capacidade: CapacidadeNegocio) => void;
  onCapacidadeSave: (capacidade: CapacidadeNegocio) => void | Promise<void>;
  onCapacidadeDelete: (id: string) => void | Promise<void>;
}

type SortField = 'sigla' | 'nome' | 'nivel' | 'categoria';
type SortOrder = 'asc' | 'desc';

const getNivelColor = (nivel: string) => {
  switch (nivel) {
    case 'Nível 1':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Nível 2':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Nível 3':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCategoriaColor = (categoria: string) => {
  switch (categoria) {
    case 'Financeiro':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'RH':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Logística':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Atendimento':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'Produção':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'Comercial':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export function CapacidadesTable({ capacidades, onEdit, onCapacidadeSave, onCapacidadeDelete }: CapacidadesTableProps) {
  const [selectedCapacidade, setSelectedCapacidade] = useState<CapacidadeNegocio | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDelete = (id: string) => {
    onCapacidadeDelete(id);
    toast.success('Capacidade removida com sucesso');
  };

  const handleView = (capacidade: CapacidadeNegocio) => {
    setSelectedCapacidade(capacidade);
    setViewDialogOpen(true);
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

  const filteredAndSortedCapacidades = useMemo(() => {
    let result = capacidades.filter(cap => {
      const matchesSearch = 
        cap.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cap.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cap.descricao && cap.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesNivel = filterNivel === 'all' || cap.nivel === filterNivel;
      const matchesCategoria = filterCategoria === 'all' || cap.categoria === filterCategoria;

      return matchesSearch && matchesNivel && matchesCategoria;
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
  }, [capacidades, searchTerm, filterNivel, filterCategoria, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedCapacidades.length / pageSize);
  const paginatedCapacidades = filteredAndSortedCapacidades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Buscar por sigla, nome ou descrição..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={filterNivel} onValueChange={(value) => { setFilterNivel(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <Funnel className="mr-2" size={16} />
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="Nível 1">Nível 1</SelectItem>
              <SelectItem value="Nível 2">Nível 2</SelectItem>
              <SelectItem value="Nível 3">Nível 3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={(value) => { setFilterCategoria(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Financeiro">Financeiro</SelectItem>
              <SelectItem value="RH">RH</SelectItem>
              <SelectItem value="Logística">Logística</SelectItem>
              <SelectItem value="Atendimento">Atendimento</SelectItem>
              <SelectItem value="Produção">Produção</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Mostrando {paginatedCapacidades.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedCapacidades.length)} de {filteredAndSortedCapacidades.length} capacidades
          </div>
          {(searchTerm || filterNivel !== 'all' || filterCategoria !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterNivel('all');
                setFilterCategoria('all');
                setCurrentPage(1);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

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
                  onClick={() => handleSort('nivel')}
                >
                  Nível
                  {getSortIcon('nivel')}
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
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCapacidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma capacidade encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedCapacidades.map((capacidade) => (
                <TableRow key={capacidade.id}>
                  <TableCell className="font-mono font-semibold">{capacidade.sigla}</TableCell>
                  <TableCell className="font-medium">{capacidade.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getNivelColor(capacidade.nivel)}>
                      {capacidade.nivel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCategoriaColor(capacidade.categoria)}>
                      {capacidade.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {capacidade.descricao || <span className="text-muted-foreground italic">Sem descrição</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(capacidade)}
                        title="Visualizar"
                      >
                        <Eye />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Editar"
                        onClick={() => onEdit(capacidade)}
                      >
                        <PencilSimple />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir">
                            <Trash className="text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a capacidade <strong>{capacidade.sigla}</strong>?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(capacidade.id)}>
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono">{selectedCapacidade?.sigla}</span>
              <span>-</span>
              <span>{selectedCapacidade?.nome}</span>
            </DialogTitle>
            <DialogDescription>Detalhes completos da capacidade de negócio</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedCapacidade && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Nível</h4>
                    <Badge variant="outline" className={getNivelColor(selectedCapacidade.nivel)}>
                      {selectedCapacidade.nivel}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Categoria</h4>
                    <Badge variant="outline" className={getCategoriaColor(selectedCapacidade.categoria)}>
                      {selectedCapacidade.categoria}
                    </Badge>
                  </div>
                </div>

                {selectedCapacidade.descricao && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h4>
                    <p className="text-sm">{selectedCapacidade.descricao}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Cobertura Estratégica</h3>

                  <div className="space-y-4">
                    {selectedCapacidade.coberturaEstrategica?.alinhamentoObjetivos && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Alinhamento com Objetivos Estratégicos
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.alinhamentoObjetivos}
                        </p>
                      </div>
                    )}

                    {selectedCapacidade.coberturaEstrategica?.beneficiosEsperados && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Benefícios Esperados
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.beneficiosEsperados}
                        </p>
                      </div>
                    )}

                    {selectedCapacidade.coberturaEstrategica?.estadoFuturoDesejado && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Estado Futuro Desejado (Target State)
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.estadoFuturoDesejado}
                        </p>
                      </div>
                    )}

                    {selectedCapacidade.coberturaEstrategica?.gapEstadoAtualFuturo && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Gap entre Estado Atual e Futuro
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.gapEstadoAtualFuturo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
