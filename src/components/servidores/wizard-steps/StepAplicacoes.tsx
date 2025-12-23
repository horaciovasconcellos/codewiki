import { useState } from 'react';
import { AplicacaoServidor, Aplicacao, StatusAplicacaoServidor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, Pencil } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface StepAplicacoesProps {
  aplicacoes: Aplicacao[];
  aplicacoesServidor: AplicacaoServidor[];
  setAplicacoesServidor: (value: AplicacaoServidor[]) => void;
}

export function StepAplicacoes({
  aplicacoes,
  aplicacoesServidor,
  setAplicacoesServidor
}: StepAplicacoesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<AplicacaoServidor>>({
    aplicacaoId: '',
    dataInicio: '',
    dataTermino: '',
    status: 'Planejado'
  });

  const handleAdd = () => {
    setFormData({
      aplicacaoId: '',
      dataInicio: '',
      dataTermino: '',
      status: 'Planejado'
    });
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEdit = (index: number) => {
    const app = aplicacoesServidor[index];
    setFormData({
      aplicacaoId: app.aplicacaoId,
      dataInicio: app.dataInicio,
      dataTermino: app.dataTermino,
      status: app.status
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Tem certeza que deseja remover esta aplicação?')) {
      const newList = aplicacoesServidor.filter((_, i) => i !== index);
      setAplicacoesServidor(newList);
      toast.success('Aplicação removida com sucesso');
    }
  };

  const handleSave = () => {
    if (!formData.aplicacaoId) {
      toast.error('Selecione uma aplicação');
      return;
    }

    if (!formData.dataInicio) {
      toast.error('Data de início é obrigatória');
      return;
    }

    const aplicacao = aplicacoes.find(a => a.id === formData.aplicacaoId);
    if (!aplicacao) {
      toast.error('Aplicação não encontrada');
      return;
    }

    const newApp: AplicacaoServidor = {
      id: editingIndex !== null ? aplicacoesServidor[editingIndex].id : uuidv4(),
      servidorId: '', // Será preenchido ao salvar o servidor
      aplicacaoId: formData.aplicacaoId,
      aplicacaoSigla: aplicacao.sigla,
      aplicacaoDescricao: aplicacao.descricao,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino,
      status: formData.status as StatusAplicacaoServidor
    };

    if (editingIndex !== null) {
      const newList = [...aplicacoesServidor];
      newList[editingIndex] = newApp;
      setAplicacoesServidor(newList);
      toast.success('Aplicação atualizada com sucesso');
    } else {
      setAplicacoesServidor([...aplicacoesServidor, newApp]);
      toast.success('Aplicação adicionada com sucesso');
    }

    setShowForm(false);
    setFormData({
      aplicacaoId: '',
      dataInicio: '',
      dataTermino: '',
      status: 'Planejado'
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndex(null);
    setFormData({
      aplicacaoId: '',
      dataInicio: '',
      dataTermino: '',
      status: 'Planejado'
    });
  };

  const getStatusBadgeClass = (status: StatusAplicacaoServidor) => {
    switch (status) {
      case 'Planejado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Produção':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Aposentado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Aplicações do Servidor</CardTitle>
            <CardDescription>
              Gerencie as aplicações que estão ou estarão hospedadas neste servidor
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Aplicação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-semibold">
              {editingIndex !== null ? 'Editar Aplicação' : 'Nova Aplicação'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aplicacaoId">Aplicação *</Label>
                <Select
                  value={formData.aplicacaoId}
                  onValueChange={(value) => setFormData({ ...formData, aplicacaoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aplicação" />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.sigla} - {app.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as StatusAplicacaoServidor })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Produção">Produção</SelectItem>
                    <SelectItem value="Aposentado">Aposentado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataTermino">Data de Término</Label>
                <Input
                  id="dataTermino"
                  type="date"
                  value={formData.dataTermino}
                  onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {aplicacoesServidor.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma aplicação associada</p>
                <p className="text-sm mt-2">Clique em "Adicionar Aplicação" para começar</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sigla</TableHead>
                      <TableHead>Nome da Aplicação</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Término</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aplicacoesServidor.map((app, index) => (
                      <TableRow key={app.id || index}>
                        <TableCell className="font-medium">
                          {app.aplicacaoSigla}
                        </TableCell>
                        <TableCell>{app.aplicacaoDescricao}</TableCell>
                        <TableCell>
                          {new Date(app.dataInicio).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {app.dataTermino
                            ? new Date(app.dataTermino).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                              app.status
                            )}`}
                          >
                            {app.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(index)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
