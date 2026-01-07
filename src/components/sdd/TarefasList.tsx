import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { RequisitoSDD, TarefaSDD } from '@/types/sdd';
import { TarefaForm } from './TarefaForm';

interface TarefasListProps {
  requisito: RequisitoSDD;
  onUpdate: () => void;
}

const STATUS_COLORS = {
  'TO DO': 'bg-gray-100 text-gray-800',
  'IN PROGRESS': 'bg-blue-100 text-blue-800',
  'DONE': 'bg-green-100 text-green-800',
};

export function TarefasList({ requisito, onUpdate }: TarefasListProps) {
  const [tarefas, setTarefas] = useState<TarefaSDD[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<TarefaSDD | null>(null);

  useEffect(() => {
    loadTarefas();
  }, [requisito.id]);

  const loadTarefas = async () => {
    try {
      const response = await fetch(`/api/sdd/tarefas/${requisito.id}`);
      const data = await response.json();
      setTarefas(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const handleSave = () => {
    loadTarefas();
    onUpdate();
    setShowForm(false);
    setEditingTarefa(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const response = await fetch(`/api/sdd/tarefas/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar tarefa');
      
      toast.success('Tarefa deletada com sucesso');
      loadTarefas();
      onUpdate();
    } catch (error) {
      toast.error('Erro ao deletar tarefa');
    }
  };

  const podeAdicionarTarefa = requisito.status === 'PRONTO P/DEV';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Tarefas do {requisito.sequencia}</h4>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          disabled={!podeAdicionarTarefa}
          title={!podeAdicionarTarefa ? 'Requisito deve estar em "PRONTO P/DEV" para adicionar tarefas' : ''}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {!podeAdicionarTarefa && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4" />
          Tarefas só podem ser criadas para requisitos com status "PRONTO P/DEV"
        </div>
      )}

      {tarefas.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Nenhuma tarefa cadastrada
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Término</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarefas.map((tarefa) => (
              <TableRow key={tarefa.id}>
                <TableCell className="max-w-md">
                  <div className="text-sm">{tarefa.descricao.substring(0, 100)}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(tarefa.data_inicio).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-sm">
                  {tarefa.data_termino 
                    ? new Date(tarefa.data_termino).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {tarefa.dias_decorridos !== undefined ? (
                    <span className={tarefa.dias_decorridos > 30 && tarefa.status === 'IN PROGRESS' ? 'text-red-600 font-semibold' : ''}>
                      {tarefa.dias_decorridos} dias
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[tarefa.status]}>{tarefa.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingTarefa(tarefa); setShowForm(true); }}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(tarefa.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showForm && (
        <TarefaForm
          requisitoId={requisito.id}
          tarefa={editingTarefa || undefined}
          onClose={() => { setShowForm(false); setEditingTarefa(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
