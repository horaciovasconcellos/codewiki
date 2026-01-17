import { useState, useMemo, useEffect } from 'react';
import { AssociacaoSquadAplicacao, Colaborador, PerfilSquad, TipoSquad } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';
import { useTableSort } from '@/hooks/useTableSort';
import { useTablePagination } from '@/hooks/useTablePagination';
import { SortableTableHeader } from '@/components/ui/SortableTableHeader';

interface StepSquadsProps {
  colaboradores: Colaborador[];
  squadsAssociadas: AssociacaoSquadAplicacao[];
  setSquadsAssociadas: (value: AssociacaoSquadAplicacao[]) => void;
}

type SortField = 'colaborador' | 'perfil' | 'squad' | 'dataInicio' | 'dataTermino' | 'status';

const perfisSquad: PerfilSquad[] = [
  'Analista Negocio',
  'Product Owner',
  'Scrum Master',
  'Desenvolvedor Backend',
  'Desenvolvedor Frontend',
  'Desenvolvedor Mobile',
  'QA/Test Engineer',
  'DevOps / SRE',
  'UX/UI Designer',
  'Data Engineer',
  'Stakeholder',
  'Product Manager',
  'Tech Lead',
  'Agile Coach',
  'Temporário',
  'Gerente de Produto'
];

const tiposSquad: TipoSquad[] = [
  'Produto',
  'Plataforma',
  'DevOps Enablement / Coaching',
  'Site Reliability Engineering',
  'Segurança',
  'Integração / APIs',
  'DataOps / MLOps',
  'Modernização'
];

export function StepSquads({ 
  colaboradores, 
  squadsAssociadas, 
  setSquadsAssociadas 
}: StepSquadsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoSquadAplicacao | null>(null);
  const [formData, setFormData] = useState({
    colaboradorId: undefined as string | undefined,
    perfil: undefined as PerfilSquad | undefined,
    squad: undefined as TipoSquad | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPerfil, setFilterPerfil] = useState<string>('todos');
  const [filterSquad, setFilterSquad] = useState<string>('todos');

  console.log('[StepSquads] Render:', {
    totalColaboradores: colaboradores.length,
    totalAssociadas: squadsAssociadas.length,
    squadsAssociadas,
    isOpen,
    editing: editing?.id
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      colaboradorId: undefined,
      perfil: undefined,
      squad: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoSquadAplicacao) => {
    setEditing(assoc);
    setFormData({
      colaboradorId: assoc.colaboradorId,
      perfil: assoc.perfil,
      squad: assoc.squad,
      dataInicio: assoc.dataInicio,
      dataTermino: assoc.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.colaboradorId || !formData.perfil || !formData.squad || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const duplicate = squadsAssociadas.find(s => 
      s.colaboradorId === formData.colaboradorId &&
      s.perfil === formData.perfil &&
      s.squad === formData.squad &&
      s.status === 'Ativo' &&
      s.id !== editing?.id
    );

    if (duplicate) {
      toast.error('Colaborador já está associado com este perfil e squad');
      return;
    }

    const assoc: AssociacaoSquadAplicacao = {
      id: editing?.id || generateUUID(),
      colaboradorId: formData.colaboradorId,
      perfil: formData.perfil,
      squad: formData.squad,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    if (editing) {
      const updated = squadsAssociadas.map(s => s.id === editing.id ? assoc : s);
      setSquadsAssociadas(updated);
      toast.success('Squad atualizado');
    } else {
      const updated = [...squadsAssociadas, assoc];
      setSquadsAssociadas(updated);
      toast.success('Squad adicionado');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setSquadsAssociadas(squadsAssociadas.map(s => 
      s.id === id ? { ...s, status: 'Inativo' as const } : s
    ));
    toast.success('Squad marcado como inativo');
  };

  const getColaboradorNome = (id: string) => {
    const colab = colaboradores.find(c => c.id === id);
    return colab ? `${colab.matricula} - ${colab.nome}` : 'Não encontrado';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  };

  // REFATORADO: Filtros manuais (não podem ser genericizados)
  const filteredSquads = useMemo(() => {
    return squadsAssociadas.filter(assoc => {
      const colabNome = getColaboradorNome(assoc.colaboradorId).toLowerCase();
      const matchesSearch = colabNome.includes(searchTerm.toLowerCase()) ||
                           assoc.perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assoc.squad.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || assoc.status === filterStatus;
      const matchesPerfil = filterPerfil === 'todos' || assoc.perfil === filterPerfil;
      const matchesSquad = filterSquad === 'todos' || assoc.squad === filterSquad;
      
      return matchesSearch && matchesStatus && matchesPerfil && matchesSquad;
    });
  }, [squadsAssociadas, colaboradores, searchTerm, filterStatus, filterPerfil, filterSquad]);

  // REFATORADO: Usando hook useTableSort (elimina 60+ linhas de código duplicado)
  const { sortField, sortOrder, sortedData, handleSort } = useTableSort({
    data: filteredSquads,
    initialField: 'colaborador' as SortField,
    initialOrder: 'asc'
  });

  // REFATORADO: Usando hook useTablePagination (elimina 20+ linhas de código duplicado)
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData: paginatedSquads,
    setCurrentPage,
    setPageSize
  } = useTablePagination({
    data: sortedData,
    initialPageSize: 10
  });

  // Reset de página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPerfil, filterSquad, setCurrentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setFilterPerfil('todos');
    setFilterSquad('todos');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Associe colaboradores aos squads desta aplicação
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar ao Squad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Squad' : 'Adicionar ao Squad'}</DialogTitle>
              <DialogDescription>
                Associe um colaborador com perfil e squad específicos
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="colaboradorId">Colaborador *</Label>
                <Select
                  value={formData.colaboradorId}
                  onValueChange={(value) => setFormData({ ...formData, colaboradorId: value })}
                >
                  <SelectTrigger id="colaboradorId">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores.map((colab) => (
                      <SelectItem key={colab.id} value={colab.id}>
                        {colab.matricula} - {colab.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="perfil">Perfil *</Label>
                <Select
                  value={formData.perfil}
                  onValueChange={(value) => setFormData({ ...formData, perfil: value as PerfilSquad })}
                >
                  <SelectTrigger id="perfil">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfisSquad.map((perfil) => (
                      <SelectItem key={perfil} value={perfil}>
                        {perfil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="squad">Squad *</Label>
                <Select
                  value={formData.squad}
                  onValueChange={(value) => setFormData({ ...formData, squad: value as TipoSquad })}
                >
                  <SelectTrigger id="squad">
                    <SelectValue placeholder="Selecione o squad" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSquad.map((squad) => (
                      <SelectItem key={squad} value={squad}>
                        {squad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataInicio">Data Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataTermino">Data Término</Label>
                <Input
                  id="dataTermino"
                  type="date"
                  value={formData.dataTermino}
                  onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editing ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por colaborador, perfil ou squad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPerfil} onValueChange={setFilterPerfil}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            {perfisSquad.map((perfil) => (
              <SelectItem key={perfil} value={perfil}>
                {perfil}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSquad} onValueChange={setFilterSquad}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os squads</SelectItem>
            {tiposSquad.map((squad) => (
              <SelectItem key={squad} value={squad}>
                {squad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginatedSquads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredSquads.length)} de {filteredSquads.length} registros
        </p>
        {(searchTerm !== '' || filterStatus !== 'todos' || filterPerfil !== 'todos' || filterSquad !== 'todos') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        {paginatedSquads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {squadsAssociadas.length === 0 ? (
              <p>Nenhum squad associado. Clique em "Adicionar ao Squad" para começar.</p>
            ) : (
              <p>Nenhum squad encontrado com os filtros aplicados.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                {/* REFATORADO: Usando componente SortableTableHeader (elimina 10+ linhas por header) */}
                <TableHead>
                  <SortableTableHeader
                    field={'colaborador' as SortField}
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Colaborador
                  </SortableTableHeader>
                </TableHead>
                <TableHead>
                  <SortableTableHeader
                    field={'perfil' as SortField}
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Perfil
                  </SortableTableHeader>
                </TableHead>
                <TableHead>
                  <SortableTableHeader
                    field={'squad' as SortField}
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Squad
                  </SortableTableHeader>
                </TableHead>
                <TableHead>
                  <SortableTableHeader
                    field={'dataInicio' as SortField}
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Data Início
                  </SortableTableHeader>
                </TableHead>
                <TableHead>
                  <SortableTableHeader
                    field={'dataTermino' as SortField}
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Data Término
                  </SortableTableHeader>
                </TableHead>
                <TableHead>
                  <SortableTableHeader
                    field={'status' as SortField}
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Status
                  </SortableTableHeader>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSquads.map((assoc) => (
                <TableRow key={assoc.id}>
                  <TableCell>{getColaboradorNome(assoc.colaboradorId)}</TableCell>
                  <TableCell>{assoc.perfil}</TableCell>
                  <TableCell>{assoc.squad}</TableCell>
                  <TableCell>{formatDate(assoc.dataInicio)}</TableCell>
                  <TableCell>{formatDate(assoc.dataTermino)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${assoc.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {assoc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
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
                    >
                      <Trash size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
          
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
    </div>
  );
}
