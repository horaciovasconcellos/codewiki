import React, { useState, useEffect } from 'react';
import { CheckpointDetalhe, Colaborador } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
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
import { DetalheForm } from './DetalheForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CheckpointDetalhesManagerProps {
  checkpointId: string;
  isFinalized: boolean;
}

export function CheckpointDetalhesManager({ checkpointId, isFinalized }: CheckpointDetalhesManagerProps) {
  const [detalhes, setDetalhes] = useState<CheckpointDetalhe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDetalhe, setSelectedDetalhe] = useState<CheckpointDetalhe | null>(null);
  const [detalheToDelete, setDetalheToDelete] = useState<CheckpointDetalhe | null>(null);

  useEffect(() => {
    if (checkpointId) {
      fetchDetalhes();
    }
  }, [checkpointId]);

  const fetchDetalhes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/checkpoints/${checkpointId}/detalhes`);
      const data = await response.json();
      
      // Converter snake_case para camelCase
      const converted = data.map((d: any) => ({
        id: d.id,
        checkpointId: d.checkpoint_id,
        responsavelId: d.responsavel_id,
        responsavelNome: d.responsavelNome,
        dataPlanejada: d.data_planejada,
        dataEfetiva: d.data_efetiva,
        descricaoDetalhada: d.descricao_detalhada,
        comentarios: d.comentarios,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      
      setDetalhes(converted);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedDetalhe(null);
    setShowForm(true);
  };

  const handleEdit = (detalhe: CheckpointDetalhe) => {
    setSelectedDetalhe(detalhe);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!detalheToDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/checkpoints/${checkpointId}/detalhes/${detalheToDelete.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Detalhe removido com sucesso');
        fetchDetalhes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao remover detalhe');
      }
    } catch (error) {
      console.error('Erro ao remover detalhe:', error);
      toast.error('Erro ao remover detalhe');
    } finally {
      setDetalheToDelete(null);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setSelectedDetalhe(null);
    fetchDetalhes();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhes do Checkpoint</CardTitle>
              <CardDescription>
                Gerencie informações detalhadas sobre o checkpoint
              </CardDescription>
            </div>
            {!isFinalized && (
              <Button onClick={handleAdd} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Detalhe
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
            </div>
          ) : detalhes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum detalhe adicionado ainda
              </p>
              {!isFinalized && (
                <Button onClick={handleAdd} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Detalhe
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data Planejada</TableHead>
                    <TableHead>Data Efetiva</TableHead>
                    <TableHead>Descrição</TableHead>
                    {!isFinalized && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalhes.map((detalhe) => (
                    <TableRow key={detalhe.id}>
                      <TableCell>
                        {detalhe.responsavelNome || (
                          <span className="text-muted-foreground">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(detalhe.dataPlanejada)}</TableCell>
                      <TableCell>
                        {detalhe.dataEfetiva ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            {formatDate(detalhe.dataEfetiva)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Não realizado</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={detalhe.descricaoDetalhada || ''}>
                          {detalhe.descricaoDetalhada || (
                            <span className="text-muted-foreground">Sem descrição</span>
                          )}
                        </div>
                      </TableCell>
                      {!isFinalized && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(detalhe)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDetalheToDelete(detalhe)}
                              title="Excluir"
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DetalheForm
        open={showForm}
        onOpenChange={setShowForm}
        detalhe={selectedDetalhe}
        checkpointId={checkpointId}
        onSave={handleFormSave}
      />

      <AlertDialog open={!!detalheToDelete} onOpenChange={() => setDetalheToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este detalhe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
