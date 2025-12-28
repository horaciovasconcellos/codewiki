import { useState, useMemo } from 'react';
import { Colaborador } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, PencilSimple, Plus, Trash, MagnifyingGlass, X, FilePdf } from '@phosphor-icons/react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatarData } from '@/lib/utils';

interface ColaboradoresDataTableProps {
  colaboradores: Colaborador[];
  onView: (colaborador: Colaborador) => void;
  onEdit: (colaborador: Colaborador) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onGeneratePDF?: (colaborador: Colaborador) => void;
}

export function ColaboradoresDataTable({
  colaboradores,
  onView,
  onEdit,
  onDelete,
  onNew,
  onGeneratePDF
}: ColaboradoresDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const setores = useMemo(() => {
    const uniqueSetores = new Set(colaboradores.map(c => c.setor));
    return Array.from(uniqueSetores).sort();
  }, [colaboradores]);

  const filteredColaboradores = useMemo(() => {
    return colaboradores.filter((colaborador) => {
      const matchesSearch = 
        searchTerm === '' ||
        colaborador.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaborador.setor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSetor = 
        filterSetor === 'todos' || 
        colaborador.setor === filterSetor;

      const isAtivo = !colaborador.dataDemissao;
      const matchesStatus = 
        filterStatus === 'todos' ||
        (filterStatus === 'ativo' && isAtivo) ||
        (filterStatus === 'demitido' && !isAtivo);

      return matchesSearch && matchesSetor && matchesStatus;
    });
  }, [colaboradores, searchTerm, filterSetor, filterStatus]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterSetor('todos');
    setFilterStatus('todos');
  };

  const hasActiveFilters = searchTerm !== '' || filterSetor !== 'todos' || filterStatus !== 'todos';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Lista de Colaboradores</CardTitle>
            <CardDescription>
              Cadastro e gerenciamento de colaboradores
            </CardDescription>
          </div>
          <Button onClick={onNew}>
            <Plus className="mr-2" />
            Novo Colaborador
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-colaborador"
                  placeholder="Buscar por matrícula, nome ou setor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Setor
              </label>
              <Select value={filterSetor} onValueChange={setFilterSetor}>
                <SelectTrigger id="filter-setor">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os setores</SelectItem>
                  {setores.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Status
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="demitido">Demitidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                <X className="mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Exibindo {filteredColaboradores.length} de {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6">
          {filteredColaboradores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {colaboradores.length === 0 ? (
                <>
                  <p className="text-lg">Nenhum colaborador cadastrado</p>
                  <p className="text-sm mt-2">Clique em "Novo Colaborador" para começar</p>
                </>
              ) : (
                <>
                  <p className="text-lg">Nenhum colaborador encontrado</p>
                  <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Data Admissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Afastamentos</TableHead>
                  <TableHead>Habilidades</TableHead>
                  <TableHead>Avaliações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.map((colaborador) => (
                  <TableRow key={colaborador.id}>
                    <TableCell className="font-medium">{colaborador.matricula}</TableCell>
                    <TableCell>{colaborador.nome}</TableCell>
                    <TableCell>{colaborador.setor}</TableCell>
                    <TableCell>{formatarData(colaborador.dataAdmissao)}</TableCell>
                    <TableCell>
                      {colaborador.dataDemissao ? (
                        <Badge variant="destructive">Demitido</Badge>
                      ) : (
                        <Badge variant="default">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {colaborador.afastamentos?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {colaborador.habilidades?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {colaborador.avaliacoes?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {onGeneratePDF && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onGeneratePDF(colaborador)}
                            title="Gerar PDF"
                          >
                            <FilePdf />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(colaborador)}
                          title="Visualizar"
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(colaborador)}
                          title="Editar"
                        >
                          <PencilSimple />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o colaborador "{colaborador.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(colaborador.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

