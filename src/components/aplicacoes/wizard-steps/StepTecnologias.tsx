import { useState, useMemo, useEffect } from 'react';
import { AssociacaoTecnologiaAplicacao, Tecnologia } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash, MagnifyingGlass, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface StepTecnologiasProps {
  tecnologias: Tecnologia[];
  tecnologiasAssociadas: AssociacaoTecnologiaAplicacao[];
  setTecnologiasAssociadas: (value: AssociacaoTecnologiaAplicacao[]) => void;
}

type SortField = 'tecnologia' | 'dataInicio' | 'dataTermino' | 'status';
type SortOrder = 'asc' | 'desc';

export function StepTecnologias({ 
  tecnologias, 
  tecnologiasAssociadas, 
  setTecnologiasAssociadas 
}: StepTecnologiasProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoTecnologiaAplicacao | null>(null);
  const [formData, setFormData] = useState({
    tecnologiaId: undefined as string | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  // Pagination and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('tecnologia');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debug logs
  console.log('[StepTecnologias] Render:', {
    totalTecnologias: tecnologias.length,
    totalAssociadas: tecnologiasAssociadas.length,
    tecnologiasAssociadas,
    isOpen,
    editing: editing?.id
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      tecnologiaId: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoTecnologiaAplicacao) => {
    setEditing(assoc);
    setFormData({
      tecnologiaId: assoc.tecnologiaId,
      dataInicio: assoc.dataInicio,
      dataTermino: assoc.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.tecnologiaId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const assoc: AssociacaoTecnologiaAplicacao = {
      id: editing?.id || generateUUID(),
      tecnologiaId: formData.tecnologiaId,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    console.log('[StepTecnologias] Salvando:', { assoc, editing: !!editing });

    if (editing) {
      const updated = tecnologiasAssociadas.map(t => t.id === editing.id ? assoc : t);
      console.log('[StepTecnologias] Atualizando:', updated);
      setTecnologiasAssociadas(updated);
      toast.success('Tecnologia atualizada');
    } else {
      const updated = [...tecnologiasAssociadas, assoc];
      console.log('[StepTecnologias] Adicionando:', updated);
      setTecnologiasAssociadas(updated);
      toast.success('Tecnologia adicionada');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setTecnologiasAssociadas(tecnologiasAssociadas.map(t => 
      t.id === id ? { ...t, status: 'Inativo' as const } : t
    ));
    toast.success('Tecnologia marcada como inativa');
  };

  const getTecnologiaNome = (id: string) => {
    const tec = tecnologias.find(t => t.id === id);
    return tec ? `${tec.sigla} - ${tec.nome}` : 'Não encontrada';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    // Lidar com formato ISO 8601 (2025-12-15T00:00:00.000Z) ou YYYY-MM-DD
    if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se já está no formato DD/MM/YYYY, retornar como está
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
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
    let result = tecnologiasAssociadas.filter(assoc => {
      const tecNome = getTecnologiaNome(assoc.tecnologiaId).toLowerCase();
      const matchesSearch = tecNome.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || assoc.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'tecnologia') {
        aValue = getTecnologiaNome(a.tecnologiaId);
        bValue = getTecnologiaNome(b.tecnologiaId);
      } else if (sortField === 'status') {
        aValue = a.status;
        bValue = b.status;
      } else if (sortField === 'dataInicio') {
        aValue = a.dataInicio;
        bValue = b.dataInicio;
      } else if (sortField === 'dataTermino') {
        aValue = a.dataTermino || '';
        bValue = b.dataTermino || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    return result;
  }, [tecnologiasAssociadas, tecnologias, searchTerm, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedTecnologias.length / pageSize);
  const paginatedTecnologias = filteredAndSortedTecnologias.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Associe as tecnologias utilizadas por esta aplicação
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Tecnologia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Tecnologia' : 'Nova Tecnologia'}</DialogTitle>
              <DialogDescription>
                Associe uma tecnologia à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tecnologiaId">Tecnologia *</Label>
                <Select
                  value={formData.tecnologiaId}
                  onValueChange={(value) => setFormData({ ...formData, tecnologiaId: value })}
                >
                  <SelectTrigger id="tecnologiaId">
                    <SelectValue placeholder="Selecione uma tecnologia" />
                  </SelectTrigger>
                  <SelectContent>
                    {tecnologias.map((tec) => (
                      <SelectItem key={tec.id} value={tec.id}>
                        {tec.sigla} - {tec.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dataTermino">Data de Término</Label>
                  <Input
                    id="dataTermino"
                    type="date"
                    value={formData.dataTermino}
                    onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por tecnologia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Counter and Clear */}
      {(searchTerm || filterStatus !== 'todos') && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredAndSortedTecnologias.length} resultado(s) encontrado(s)
          </span>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </div>
      )}

      {tecnologiasAssociadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma tecnologia associada
        </div>
      ) : filteredAndSortedTecnologias.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma tecnologia encontrada com os filtros aplicados
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('tecnologia')}
                  >
                    <div className="flex items-center">
                      Tecnologia
                      {getSortIcon('tecnologia')}
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
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('dataTermino')}
                  >
                    <div className="flex items-center">
                      Data Término
                      {getSortIcon('dataTermino')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTecnologias.map((assoc) => (
                  <TableRow 
                    key={assoc.id} 
                    className={`hover:bg-muted/50 ${assoc.status === 'Inativo' ? 'opacity-50' : ''}`}
                  >
                    <TableCell className="font-medium">{getTecnologiaNome(assoc.tecnologiaId)}</TableCell>
                    <TableCell>{formatDate(assoc.dataInicio)}</TableCell>
                    <TableCell>{formatDate(assoc.dataTermino)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        assoc.status === 'Ativo' 
                          ? 'bg-accent/20 text-accent-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {assoc.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(assoc)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assoc.id)}
                          disabled={assoc.status === 'Inativo'}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
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
    </div>
  );
}
