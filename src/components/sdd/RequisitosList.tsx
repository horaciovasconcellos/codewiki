import { useState, useEffect, Fragment } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Undo, ChevronDown, ChevronUp } from 'lucide-react';
import { RequisitoSDD, StatusRequisito } from '@/types/sdd';
import { RequisitoForm } from './RequisitoForm';
import { TarefasList } from './TarefasList';
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

interface RequisitosListProps {
  projetoId: string;
}

const STATUS_COLORS: Record<StatusRequisito, string> = {
  'BACKLOG': 'bg-gray-100 text-gray-800',
  'REFINAMENTO': 'bg-blue-100 text-blue-800',
  'PRONTO P/DEV': 'bg-green-100 text-green-800',
  'DONE': 'bg-purple-100 text-purple-800',
  'BLOQUEADO': 'bg-red-100 text-red-800',
  'EM RETRABALHO': 'bg-orange-100 text-orange-800',
  'SPIKE TÉCNICO': 'bg-yellow-100 text-yellow-800',
  'PAUSADO': 'bg-gray-200 text-gray-700',
  'CANCELADO': 'bg-red-200 text-red-900',
  'ROLLBACK': 'bg-pink-100 text-pink-800',
};

const STATUS_ESPECIAIS = ['BLOQUEADO', 'EM RETRABALHO', 'SPIKE TÉCNICO', 'PAUSADO', 'CANCELADO', 'ROLLBACK'];

export function RequisitosList({ projetoId }: RequisitosListProps) {
  const [requisitos, setRequisitos] = useState<RequisitoSDD[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState<RequisitoSDD | null>(null);
  const [expandedRequisitos, setExpandedRequisitos] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequisitos();
  }, [projetoId]);

  const loadRequisitos = async () => {
    try {
      const response = await fetch(`/api/sdd/requisitos/${projetoId}`);
      if (!response.ok) throw new Error('Erro ao carregar requisitos');
      const data = await response.json();
      setRequisitos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar requisitos:', error);
      toast.error('Erro ao carregar requisitos');
      setRequisitos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadRequisitos();
    setShowForm(false);
    setEditingRequisito(null);
  };

  const handleEdit = (requisito: RequisitoSDD) => {
    setEditingRequisito(requisito);
    setShowForm(true);
    // Fechar todos os requisitos expandidos
    setExpandedRequisitos(new Set());
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sdd/requisitos/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar requisito');
      }

      toast.success('Requisito deletado com sucesso');
      loadRequisitos();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestaurarStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/sdd/requisitos/${id}/restaurar-status`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Erro ao restaurar status');

      toast.success('Status anterior restaurado');
      loadRequisitos();
    } catch (error) {
      toast.error('Erro ao restaurar status');
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRequisitos);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRequisitos(newExpanded);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Requisitos / Histórias de Usuário</CardTitle>
            <Button onClick={() => {
              setShowForm(true);
              // Fechar todos os requisitos expandidos
              setExpandedRequisitos(new Set());
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Requisito
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requisitos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum requisito cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Sequência</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarefas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitos.map((requisito) => (
                  <Fragment key={requisito.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(requisito.id)}
                        >
                          {expandedRequisitos.has(requisito.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{requisito.sequencia}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-medium">{requisito.nome}</div>
                        {requisito.descricao && (
                          <div className="text-xs text-muted-foreground truncate">
                            {requisito.descricao.substring(0, 100)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[requisito.status]}>
                          {requisito.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {requisito.tarefas_count ? (
                          <span className="text-sm">
                            {requisito.tarefas_done_count || 0} / {requisito.tarefas_count}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {STATUS_ESPECIAIS.includes(requisito.status) && requisito.status_anterior && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestaurarStatus(requisito.id)}
                              title="Restaurar status anterior"
                            >
                              <Undo className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(requisito)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingId(requisito.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRequisitos.has(requisito.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-white">
                          <TarefasList requisito={requisito} onUpdate={loadRequisitos} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <RequisitoForm
          projetoId={projetoId}
          requisito={editingRequisito || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingRequisito(null);
          }}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este requisito? Esta ação não pode ser desfeita.
              {requisitos.find(r => r.id === deletingId)?.tarefas_count && (
                <span className="block mt-2 text-destructive font-semibold">
                  Este requisito possui tarefas não finalizadas e não pode ser excluído.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
