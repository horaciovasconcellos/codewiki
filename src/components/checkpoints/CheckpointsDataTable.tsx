import React, { useState } from 'react';
import { Checkpoint, StatusCheckpoint, CategoriaCheckpoint } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PencilSimple, Trash, Eye } from '@phosphor-icons/react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CheckpointsDataTableProps {
  checkpoints: Checkpoint[];
  onEdit: (checkpoint: Checkpoint) => void;
  onDelete: (id: string) => void;
  onViewDetails: (checkpoint: Checkpoint) => void;
  onRefresh: () => void;
}

const STATUS_BADGE: Record<StatusCheckpoint, string> = {
  'OK': 'bg-green-100 text-green-800',
  'Em Risco': 'bg-yellow-100 text-yellow-800',
  'Bloqueado': 'bg-red-100 text-red-800',
};

const CATEGORIA_BADGE: Record<CategoriaCheckpoint, string> = {
  'Escopo': 'bg-blue-100 text-blue-800',
  'Prazo': 'bg-purple-100 text-purple-800',
  'Custo': 'bg-orange-100 text-orange-800',
  'Qualidade': 'bg-teal-100 text-teal-800',
  'Seguranca': 'bg-red-100 text-red-800',
  'Compliance': 'bg-indigo-100 text-indigo-800',
};

export function CheckpointsDataTable({
  checkpoints,
  onEdit,
  onDelete,
  onViewDetails,
  onRefresh,
}: CheckpointsDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCheckpoints = checkpoints.filter((checkpoint) => {
    const matchesSearch = checkpoint.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || checkpoint.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'all' || checkpoint.categoria === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const totalPages = Math.ceil(filteredCheckpoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCheckpoints = filteredCheckpoints.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`${API_URL}/api/checkpoints/${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao deletar checkpoint:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isFinalized = (checkpoint: Checkpoint) => !!checkpoint.dataReal;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="OK">OK</SelectItem>
            <SelectItem value="Em Risco">Em Risco</SelectItem>
            <SelectItem value="Bloqueado">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="Escopo">Escopo</SelectItem>
            <SelectItem value="Prazo">Prazo</SelectItem>
            <SelectItem value="Custo">Custo</SelectItem>
            <SelectItem value="Qualidade">Qualidade</SelectItem>
            <SelectItem value="Seguranca">Segurança</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Prevista</TableHead>
              <TableHead>Data Real</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCheckpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum checkpoint encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedCheckpoints.map((checkpoint) => (
                <TableRow key={checkpoint.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {checkpoint.descricao}
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORIA_BADGE[checkpoint.categoria]}>
                      {checkpoint.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[checkpoint.status]}>
                      {checkpoint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(checkpoint.dataPrevista)}</TableCell>
                  <TableCell>{formatDate(checkpoint.dataReal)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(checkpoint)}
                        title="Ver Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(checkpoint)}
                        disabled={isFinalized(checkpoint)}
                        title={isFinalized(checkpoint) ? 'Checkpoint finalizado não pode ser editado' : 'Editar'}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(checkpoint.id)}
                        disabled={isFinalized(checkpoint)}
                        title={isFinalized(checkpoint) ? 'Checkpoint finalizado não pode ser deletado' : 'Deletar'}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Exibindo {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredCheckpoints.length)} de{' '}
            {filteredCheckpoints.length} registros
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm py-2 px-4">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este checkpoint? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
