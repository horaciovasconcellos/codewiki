import { useState, useMemo, useEffect } from 'react';
import { SLA } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash, Eye, MagnifyingGlass, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SLADetailsDialog } from './SLADetailsDialog';

interface SLAsTableProps {
  slas: SLA[];
  onEdit: (sla: SLA) => void;
  onSLADelete: (id: string) => void;
}

type SortField = 'sigla' | 'descricao' | 'tipoSLA' | 'dataInicio' | 'status';
type SortOrder = 'asc' | 'desc';

export function SLAsTable({ slas, onEdit, onSLADelete }: SLAsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slaToDelete, setSLAToDelete] = useState<string | null>(null);
  const [viewingSLA, setViewingSLA] = useState<SLA | undefined>(undefined);

  // Pagination and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDeleteClick = (id: string) => {
    setSLAToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (slaToDelete) {
      onSLADelete(slaToDelete);
      toast.success('SLA excluído com sucesso');
    }
    setDeleteDialogOpen(false);
    setSLAToDelete(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  // Obter lista de tipos únicos
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(slas.map(sla => sla.tipoSLA));
    return Array.from(tipos).sort();
  }, [slas]);

  const filteredAndSortedSLAs = useMemo(() => {
    let result = slas.filter(sla => {
      const matchesSearch = 
        sla.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sla.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'todos' || sla.status === filterStatus;
      const matchesTipo = filterTipo === 'todos' || sla.tipoSLA === filterTipo;
      
      return matchesSearch && matchesStatus && matchesTipo;
    });

    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'dataInicio') {
        aValue = a.dataInicio ? new Date(a.dataInicio).getTime() : 0;
        bValue = b.dataInicio ? new Date(b.dataInicio).getTime() : 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return result;
  }, [slas, searchTerm, filterStatus, filterTipo, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedSLAs.length / pageSize);
  const paginatedSLAs = filteredAndSortedSLAs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTipo]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setFilterTipo('todos');
    setCurrentPage(1);
  };

  if (slas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum SLA cadastrado. Clique em "Novo SLA" para começar.
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar por sigla ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Tipo de SLA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {tiposUnicos.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Counter and Clear */}
        {(searchTerm || filterStatus !== 'todos' || filterTipo !== 'todos') && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredAndSortedSLAs.length} resultado(s) encontrado(s)
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {filteredAndSortedSLAs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <p className="text-lg mb-2">Nenhum SLA encontrado</p>
          <p className="text-sm">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('sigla')}
                  >
                    <div className="flex items-center">
                      Sigla
                      {getSortIcon('sigla')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('descricao')}
                  >
                    <div className="flex items-center">
                      Descrição
                      {getSortIcon('descricao')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('tipoSLA')}
                  >
                    <div className="flex items-center">
                      Tipo
                      {getSortIcon('tipoSLA')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('dataInicio')}
                  >
                    <div className="flex items-center">
                      Data Início
                      {getSortIcon('dataInicio')}
                    </div>
                  </TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSLAs.map((sla) => (
                  <TableRow key={sla.id} className="hover:bg-gray-100">
                    <TableCell className="font-medium">{sla.sigla}</TableCell>
                    <TableCell className="max-w-xs truncate">{sla.descricao}</TableCell>
                    <TableCell>{sla.tipoSLA}</TableCell>
                    <TableCell>{formatDate(sla.dataInicio)}</TableCell>
                    <TableCell>{formatDate(sla.dataTermino)}</TableCell>
                    <TableCell>
                      <Badge variant={sla.status === 'Ativo' ? 'default' : 'secondary'}>
                        {sla.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingSLA(sla)}
                          title="Visualizar detalhes"
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(sla)}
                          title="Editar"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(sla.id)}
                          title="Excluir"
                        >
                          <Trash />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Itens por página:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[70px]">
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
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
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
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
        </>
      )}

      {viewingSLA && (
        <SLADetailsDialog
          sla={viewingSLA}
          onClose={() => setViewingSLA(undefined)}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este SLA? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
