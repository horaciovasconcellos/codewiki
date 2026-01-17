import React, { useState, useEffect } from 'react';
import { Aplicacao, Checkpoint } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CheckpointsDataTable } from './CheckpointsDataTable';
import { CheckpointForm } from './CheckpointForm';
import { CheckpointDetails } from './CheckpointDetails';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function CheckpointsView() {
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [aplicacaoSelecionada, setAplicacaoSelecionada] = useState<string>('');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [checkpointSelecionado, setCheckpointSelecionado] = useState<Checkpoint | null>(null);

  useEffect(() => {
    fetchAplicacoes();
  }, []);

  useEffect(() => {
    if (aplicacaoSelecionada) {
      fetchCheckpoints();
    } else {
      setCheckpoints([]);
    }
  }, [aplicacaoSelecionada]);

  const fetchAplicacoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/aplicacoes`);
      const data = await response.json();
      setAplicacoes(data);
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
      toast.error('Erro ao carregar aplicações');
    }
  };

  const fetchCheckpoints = async () => {
    if (!aplicacaoSelecionada) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/checkpoints?aplicacaoId=${aplicacaoSelecionada}`);
      const data = await response.json();
      
      // Converter snake_case para camelCase
      const converted = data.map((c: any) => ({
        id: c.id,
        aplicacaoId: c.aplicacao_id,
        aplicacaoSigla: c.aplicacaoSigla,
        descricao: c.descricao,
        categoria: c.categoria,
        status: c.status,
        dataPrevista: c.data_prevista,
        dataReal: c.data_real,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
      
      setCheckpoints(converted);
    } catch (error) {
      console.error('Erro ao carregar checkpoints:', error);
      toast.error('Erro ao carregar checkpoints');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (checkpoint: Checkpoint) => {
    setCheckpointSelecionado(checkpoint);
    setShowForm(true);
  };

  const handleViewDetails = (checkpoint: Checkpoint) => {
    setCheckpointSelecionado(checkpoint);
    setShowDetails(true);
  };

  const handleBackFromDetails = () => {
    setShowDetails(false);
    setCheckpointSelecionado(null);
    fetchCheckpoints(); // Recarregar para pegar possíveis alterações nos detalhes
  };

  const handleDelete = () => {
    fetchCheckpoints();
  };

  const handleSave = () => {
    fetchCheckpoints();
    setCheckpointSelecionado(null);
    setShowForm(false);
  };

  const handleNovo = () => {
    setCheckpointSelecionado(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setCheckpointSelecionado(null);
  };

  const aplicacaoNome = aplicacoes.find(a => a.id === aplicacaoSelecionada)?.sigla || '';

  // Se estiver visualizando detalhes, renderizar a tela de detalhes
  if (showDetails && checkpointSelecionado) {
    return <CheckpointDetails checkpoint={checkpointSelecionado} onBack={handleBackFromDetails} />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Checkpoints de Aplicações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie checkpoints de escopo, prazo, custo, qualidade, segurança e compliance das aplicações
            </p>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Selecione a Aplicação</CardTitle>
            <CardDescription>
              Escolha uma aplicação para visualizar e gerenciar seus checkpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="aplicacao">Aplicação *</Label>
                <Select value={aplicacaoSelecionada} onValueChange={setAplicacaoSelecionada}>
                  <SelectTrigger id="aplicacao">
                    <SelectValue placeholder="Escolha uma aplicação..." />
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
              {aplicacaoSelecionada && (
                <Button onClick={handleNovo}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Checkpoint
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {aplicacaoSelecionada && (
          <Card>
            <CardHeader>
              <CardTitle>Checkpoints de {aplicacaoNome}</CardTitle>
              <CardDescription>
                Lista de checkpoints com status, categoria e prazos. Checkpoints finalizados não podem ser editados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando checkpoints...
                </div>
              ) : (
                <CheckpointsDataTable
                  checkpoints={checkpoints}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                  onRefresh={fetchCheckpoints}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Formulário de Checkpoint */}
        {showForm && (
          <CheckpointForm
            open={showForm}
            onOpenChange={(open) => {
              if (!open) handleCancel();
            }}
            checkpoint={checkpointSelecionado}
            aplicacaoId={aplicacaoSelecionada}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
