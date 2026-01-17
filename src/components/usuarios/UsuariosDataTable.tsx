import { useState, useMemo } from 'react';
import { Usuario, Colaborador } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  PencilSimple,
  Trash,
  MagnifyingGlass,
  ShieldCheck,
  CheckCircle,
  XCircle,
  CaretLeft,
  CaretRight,
  Plus,
} from '@phosphor-icons/react';

interface UsuariosDataTableProps {
  usuarios: Usuario[];
  colaboradores: Colaborador[];
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
}

export function UsuariosDataTable({ usuarios, colaboradores, loading, onCreateNew, onEdit, onDelete }: UsuariosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  
  const itemsPerPage = 10;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-500 hover:bg-red-600';
      case 'Back-office':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Usuário':
        return 'bg-green-500 hover:bg-green-600';
      case 'Consulta':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-400';
    }
  };

  // Filtrar e buscar
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch =
        usuario.colaboradorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.colaboradorMatricula?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'todos' || usuario.role === roleFilter;
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'ativo' && usuario.ativo) ||
        (statusFilter === 'inativo' && !usuario.ativo);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usuarios, searchTerm, roleFilter, statusFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (usuarioToDelete) {
      onDelete(usuarioToDelete.id);
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Botão Novo Usuário */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Lista de Usuários</h2>
          <p className="text-sm text-muted-foreground">Total: {usuarios.length} usuários cadastrados</p>
        </div>
        <Button onClick={onCreateNew} size="default">
          <span className="mr-2">+</span> Novo Usuário
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou matrícula..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Back-office">Back-office</SelectItem>
            <SelectItem value="Usuário">Usuário</SelectItem>
            <SelectItem value="Consulta">Consulta</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || roleFilter !== 'todos' || statusFilter !== 'todos'
                      ? 'Nenhum usuário encontrado com os filtros aplicados'
                      : 'Nenhum usuário cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                currentUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usuario.colaboradorNome}</p>
                        <p className="text-sm text-muted-foreground">
                          Mat. {usuario.colaboradorMatricula}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(usuario.role)}>
                        <ShieldCheck className="mr-1" size={14} weight="fill" />
                        {usuario.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{usuario.colaboradorSetor || '-'}</TableCell>
                    <TableCell>
                      {usuario.ativo ? (
                        <div className="flex items-center gap-1 text-green-700">
                          <CheckCircle weight="fill" size={16} />
                          <span className="text-sm">Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-700">
                          <XCircle weight="fill" size={16} />
                          <span className="text-sm">Inativo</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(usuario)}
                        >
                          <PencilSimple className="mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(usuario)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsuarios.length)} de{' '}
            {filteredUsuarios.length} usuário(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <CaretLeft />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <CaretRight />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{' '}
              <strong>{usuarioToDelete?.colaboradorNome}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. O acesso ao sistema será revogado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
