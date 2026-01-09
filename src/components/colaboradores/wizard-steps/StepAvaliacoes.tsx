import { useState } from 'react';
import { AvaliacaoColaborador } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash, ChartBar } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { apiDelete } from '@/hooks/use-api';
import { generateUUID } from '@/utils/uuid';

interface StepAvaliacoesProps {
  avaliacoes: AvaliacaoColaborador[];
  setAvaliacoes: (value: AvaliacaoColaborador[]) => void;
}

export function StepAvaliacoes({ avaliacoes, setAvaliacoes }: StepAvaliacoesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AvaliacaoColaborador | null>(null);
  const [formData, setFormData] = useState({
    dataAvaliacao: getTodayDate(),
    resultadosEntregas: 0,
    competenciasTecnicas: 0,
    qualidadeSeguranca: 0,
    comportamentoCultura: 0,
    evolucaoAprendizado: 0,
    motivo: '',
    dataConversa: '',
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      dataAvaliacao: getTodayDate(),
      resultadosEntregas: 0,
      competenciasTecnicas: 0,
      qualidadeSeguranca: 0,
      comportamentoCultura: 0,
      evolucaoAprendizado: 0,
      motivo: '',
      dataConversa: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (avaliacao: AvaliacaoColaborador) => {
    setEditing(avaliacao);
    
    // Converter datas ISO para YYYY-MM-DD
    const formatDateForInput = (dateStr: string | undefined) => {
      if (!dateStr) return '';
      return dateStr.split('T')[0];
    };
    
    setFormData({
      dataAvaliacao: formatDateForInput(avaliacao.dataAvaliacao),
      resultadosEntregas: avaliacao.resultadosEntregas,
      competenciasTecnicas: avaliacao.competenciasTecnicas,
      qualidadeSeguranca: avaliacao.qualidadeSeguranca,
      comportamentoCultura: avaliacao.comportamentoCultura,
      evolucaoAprendizado: avaliacao.evolucaoAprendizado,
      motivo: avaliacao.motivo || '',
      dataConversa: formatDateForInput(avaliacao.dataConversa),
    });
    setIsOpen(true);
  };

  const validateForm = () => {
    if (!formData.dataAvaliacao) {
      toast.error('Data da avaliação é obrigatória');
      return false;
    }

    const campos = [
      { nome: 'Resultados/Entregas', valor: formData.resultadosEntregas },
      { nome: 'Competências Técnicas', valor: formData.competenciasTecnicas },
      { nome: 'Qualidade e Segurança', valor: formData.qualidadeSeguranca },
      { nome: 'Comportamento/Cultura', valor: formData.comportamentoCultura },
      { nome: 'Evolução e Aprendizado', valor: formData.evolucaoAprendizado },
    ];

    for (const campo of campos) {
      if (campo.valor < 0 || campo.valor > 10) {
        toast.error(`${campo.nome} deve estar entre 0 e 10`);
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const novaAvaliacao: AvaliacaoColaborador = {
      id: editing?.id || generateUUID(),
      colaboradorId: editing?.colaboradorId || '',
      dataAvaliacao: formData.dataAvaliacao,
      resultadosEntregas: Number(formData.resultadosEntregas),
      competenciasTecnicas: Number(formData.competenciasTecnicas),
      qualidadeSeguranca: Number(formData.qualidadeSeguranca),
      comportamentoCultura: Number(formData.comportamentoCultura),
      evolucaoAprendizado: Number(formData.evolucaoAprendizado),
      motivo: formData.motivo || undefined,
      dataConversa: formData.dataConversa || undefined,
    };

    if (editing) {
      setAvaliacoes(avaliacoes.map(a => a.id === editing.id ? novaAvaliacao : a));
      toast.success('Avaliação atualizada');
    } else {
      setAvaliacoes([...avaliacoes, novaAvaliacao]);
      toast.success('Avaliação adicionada');
    }

    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    // Se o ID é um UUID válido do banco, deletar via API
    if (id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Verificar se tem createdAt (indica que veio do banco)
      const avaliacao = avaliacoes.find(a => a.id === id);
      if (avaliacao && 'createdAt' in avaliacao) {
        try {
          await apiDelete(`/avaliacoes/${id}`);
        } catch (error) {
          console.error('Erro ao deletar avaliação:', error);
          toast.error('Erro ao remover avaliação');
          return;
        }
      }
    }
    
    setAvaliacoes(avaliacoes.filter(a => a.id !== id));
    toast.success('Avaliação removida');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    // Lidar com formatos ISO 8601 (2025-12-15T00:00:00.000Z) e YYYY-MM-DD
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  const calcularMedia = (avaliacao: AvaliacaoColaborador) => {
    const soma = 
      avaliacao.resultadosEntregas +
      avaliacao.competenciasTecnicas +
      avaliacao.qualidadeSeguranca +
      avaliacao.comportamentoCultura +
      avaliacao.evolucaoAprendizado;
    return (soma / 5).toFixed(1);
  };

  const getCorNota = (nota: number) => {
    if (nota >= 8) return 'text-green-600 font-semibold';
    if (nota >= 6) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ChartBar size={20} />
          <p className="text-sm text-muted-foreground">
            Registre as avaliações de desempenho do colaborador
          </p>
        </div>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Avaliação' : 'Nova Avaliação'}</DialogTitle>
              <DialogDescription>
                Registre a avaliação de desempenho do colaborador
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dataAvaliacao">Data da Avaliação *</Label>
                  <Input
                    id="dataAvaliacao"
                    type="date"
                    value={formData.dataAvaliacao}
                    onChange={(e) => setFormData({ ...formData, dataAvaliacao: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dataConversa">Data da Conversa</Label>
                  <Input
                    id="dataConversa"
                    type="date"
                    value={formData.dataConversa}
                    onChange={(e) => setFormData({ ...formData, dataConversa: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <h4 className="font-semibold text-sm">Critérios de Avaliação (0 a 10)</h4>
                
                <div className="grid gap-2">
                  <Label htmlFor="resultadosEntregas">Resultados/Entregas *</Label>
                  <Input
                    id="resultadosEntregas"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.resultadosEntregas}
                    onChange={(e) => setFormData({ ...formData, resultadosEntregas: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="competenciasTecnicas">Competências Técnicas *</Label>
                  <Input
                    id="competenciasTecnicas"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.competenciasTecnicas}
                    onChange={(e) => setFormData({ ...formData, competenciasTecnicas: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="qualidadeSeguranca">Qualidade e Segurança *</Label>
                  <Input
                    id="qualidadeSeguranca"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.qualidadeSeguranca}
                    onChange={(e) => setFormData({ ...formData, qualidadeSeguranca: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="comportamentoCultura">Comportamento/Cultura *</Label>
                  <Input
                    id="comportamentoCultura"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.comportamentoCultura}
                    onChange={(e) => setFormData({ ...formData, comportamentoCultura: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="evolucaoAprendizado">Evolução e Aprendizado *</Label>
                  <Input
                    id="evolucaoAprendizado"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.evolucaoAprendizado}
                    onChange={(e) => setFormData({ ...formData, evolucaoAprendizado: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="motivo">Motivo/Observações</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Descreva o motivo da avaliação ou observações relevantes"
                  rows={4}
                />
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

      {avaliacoes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <ChartBar size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhuma avaliação registrada</p>
          <p className="text-sm mt-1">Clique em "Nova Avaliação" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Resultados</TableHead>
                <TableHead className="text-center">Comp. Técnicas</TableHead>
                <TableHead className="text-center">Qualidade</TableHead>
                <TableHead className="text-center">Comportamento</TableHead>
                <TableHead className="text-center">Evolução</TableHead>
                <TableHead className="text-center">Média</TableHead>
                <TableHead className="text-center">Data Conversa</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avaliacoes.map((avaliacao) => {
                const media = calcularMedia(avaliacao);
                return (
                  <TableRow key={avaliacao.id}>
                    <TableCell className="font-medium">{formatDate(avaliacao.dataAvaliacao)}</TableCell>
                    <TableCell className={`text-center ${getCorNota(avaliacao.resultadosEntregas)}`}>
                      {avaliacao.resultadosEntregas.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-center ${getCorNota(avaliacao.competenciasTecnicas)}`}>
                      {avaliacao.competenciasTecnicas.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-center ${getCorNota(avaliacao.qualidadeSeguranca)}`}>
                      {avaliacao.qualidadeSeguranca.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-center ${getCorNota(avaliacao.comportamentoCultura)}`}>
                      {avaliacao.comportamentoCultura.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-center ${getCorNota(avaliacao.evolucaoAprendizado)}`}>
                      {avaliacao.evolucaoAprendizado.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-center font-bold ${getCorNota(Number(media))}`}>
                      {media}
                    </TableCell>
                    <TableCell className="text-center">{formatDate(avaliacao.dataConversa)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(avaliacao)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(avaliacao.id)}
                          title="Excluir"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {avaliacoes.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="font-semibold mb-2">Resumo das Avaliações</h4>
          <p className="text-sm text-muted-foreground">
            Total de avaliações: <span className="font-semibold">{avaliacoes.length}</span>
          </p>
          {avaliacoes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Média geral: <span className={`font-bold ${getCorNota(
                avaliacoes.reduce((acc, a) => acc + Number(calcularMedia(a)), 0) / avaliacoes.length
              )}`}>
                {(avaliacoes.reduce((acc, a) => acc + Number(calcularMedia(a)), 0) / avaliacoes.length).toFixed(1)}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
