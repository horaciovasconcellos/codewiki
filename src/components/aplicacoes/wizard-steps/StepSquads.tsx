import { useState, useMemo, useEffect } from 'react';
import { AssociacaoSquadAplicacao, Colaborador, PerfilSquad, TipoSquad } from '@/lib/types';
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

interface StepSquadsProps {
  colaboradores: Colaborador[];
  squadsAssociadas: AssociacaoSquadAplicacao[];
  setSquadsAssociadas: (value: AssociacaoSquadAplicacao[]) => void;
}

type SortField = 'colaborador' | 'perfil' | 'squad' | 'dataInicio' | 'dataTermino' | 'status';
type SortOrder = 'asc' | 'desc';

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

  // Pagination and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPerfil, setFilterPerfil] = useState<string>('todos');
  const [filterSquad, setFilterSquad] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('colaborador');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

    // Verificar se já existe associação ativa com mesmo colaborador, perfil e squad
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

    console.log('[StepSquads] Salvando:', { assoc, editing: !!editing });
    console.log('[StepSquads] Estado atual antes de salvar:', squadsAssociadas.length, 'squads');

    if (editing) {
      const updated = squadsAssociadas.map(s => s.id === editing.id ? assoc : s);
      console.log('[StepSquads] Atualizando:', updated);
      console.log('[StepSquads] Total após atualização:', updated.length);
      setSquadsAssociadas(updated);
      toast.success('Squad atualizado');
    } else {
      const updated = [...squadsAssociadas, assoc];
      console.log('[StepSquads] Adicionando:', updated);
      console.log('[StepSquads] Total após adição:', updated.length);
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

  const filteredAndSortedSquads = useMemo(() => {
    let result = squadsAssociadas.filter(assoc => {
      const colabNome = getColaboradorNome(assoc.colaboradorId).toLowerCase();
      const matchesSearch = colabNome.includes(searchTerm.toLowerCase()) ||
                           assoc.perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assoc.squad.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || assoc.status === filterStatus;
      const matchesPerfil = filterPerfil === 'todos' || assoc.perfil === filterPerfil;
      const matchesSquad = filterSquad === 'todos' || assoc.squad === filterSquad;
      
      return matchesSearch && matchesStatus && matchesPerfil && matchesSquad;
    });

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'colaborador') {
        aValue = getColaboradorNome(a.colaboradorId);
        bValue = getColaboradorNome(b.colaboradorId);
      } else if (sortField === 'perfil') {
        aValue = a.perfil;
        bValue = b.perfil;
      } else if (sortField === 'squad') {
        aValue = a.squad;
        bValue = b.squad;
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
  }, [squadsAssociadas, colaboradores, searchTerm, filterStatus, filterPerfil, filterSquad, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedSquads.length / pageSize);
  const paginatedSquads = filteredAndSortedSquads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPerfil, filterSquad]);

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
                    <SelectValue placeholder="Selecione um colaborador" />
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
                    <SelectValue placeholder="Selecione um perfil" />
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
                    <SelectValue placeholder="Selecione um squad" />
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
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por colaborador, perfil ou squad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
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
          <Select value={filterPerfil} onValueChange={setFilterPerfil}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Perfis</SelectItem>
              {perfisSquad.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSquad} onValueChange={setFilterSquad}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por squad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Squads</SelectItem>
              {tiposSquad.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Counter and Clear */}
      {(searchTerm || filterStatus !== 'todos' || filterPerfil !== 'todos' || filterSquad !== 'todos') && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredAndSortedSquads.length} resultado(s) encontrado(s)
          </span>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </div>
      )}

      {squadsAssociadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhum colaborador associado aos squads
        </div>
      ) : filteredAndSortedSquads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhum colaborador encontrado com os filtros aplicados
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('colaborador')}
                  >
                    <div className="flex items-center">
                      Colaborador
                      {getSortIcon('colaborador')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('perfil')}
                  >
                    <div className="flex items-center">
                      Perfil
                      {getSortIcon('perfil')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('squad')}
                  >
                    <div className="flex items-center">
                      Squad
                      {getSortIcon('squad')}
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
                {paginatedSquads.map((assoc) => (
                  <TableRow 
                    key={assoc.id} 
                    className={`hover:bg-gray-100 ${assoc.status === 'Inativo' ? 'opacity-50' : ''}`}
                  >
                    <TableCell className="font-medium">{getColaboradorNome(assoc.colaboradorId)}</TableCell>
                    <TableCell>{assoc.perfil}</TableCell>
                    <TableCell>{assoc.squad}</TableCell>
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
