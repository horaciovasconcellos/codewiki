import { useState } from 'react';
import { Afastamento, TipoAfastamento } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData, getTodayDate } from '@/lib/utils';
import { apiDelete } from '@/hooks/use-api';
import { generateUUID } from '@/utils/uuid';

interface AfastamentosStepProps {
  afastamentos: Afastamento[];
  setAfastamentos: (afastamentos: Afastamento[]) => void;
  tiposAfastamento: TipoAfastamento[];
}

export function AfastamentosStep({
  afastamentos,
  setAfastamentos,
  tiposAfastamento
}: AfastamentosStepProps) {
  const [tipoAfastamentoId, setTipoAfastamentoId] = useState<string>('');
  const [inicialProvavel, setInicialProvavel] = useState('');
  const [finalProvavel, setFinalProvavel] = useState('');
  const [inicialEfetivo, setInicialEfetivo] = useState('');
  const [finalEfetivo, setFinalEfetivo] = useState('');

  const handleAddAfastamento = () => {
    if (!tipoAfastamentoId || !inicialProvavel || !finalProvavel) {
      toast.error('Preencha todos os campos obrigatórios do afastamento');
      return;
    }

    if (inicialProvavel > finalProvavel) {
      toast.error('A data inicial provável não pode ser posterior à data final');
      return;
    }

    if (inicialEfetivo && finalEfetivo && inicialEfetivo > finalEfetivo) {
      toast.error('A data inicial efetiva não pode ser posterior à data final');
      return;
    }

    const novoAfastamento: Afastamento = {
      id: generateUUID(),
      tipoAfastamentoId,
      inicialProvavel,
      finalProvavel,
      inicialEfetivo: inicialEfetivo || undefined,
      finalEfetivo: finalEfetivo || undefined
    };

    setAfastamentos([...afastamentos, novoAfastamento]);
    
    setTipoAfastamentoId(undefined);
    setInicialProvavel('');
    setFinalProvavel('');
    setInicialEfetivo('');
    setFinalEfetivo('');

    toast.success('Afastamento adicionado');
  };

  const handleRemoveAfastamento = async (id: string) => {
    // Se o ID é um UUID válido do banco, deletar via API
    if (id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        await apiDelete(`/afastamentos/${id}`);
      } catch (error) {
        console.error('Erro ao deletar afastamento:', error);
        toast.error('Erro ao remover afastamento');
        return;
      }
    }
    
    // Remover do estado local
    setAfastamentos(afastamentos.filter(a => a.id !== id));
    toast.success('Afastamento removido');
  };

  const getTipoNome = (tipoId: string) => {
    const tipo = tiposAfastamento.find(t => t.id === tipoId);
    return tipo ? `${tipo.sigla} - ${tipo.descricao}` : tipoId;
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold mb-4">Adicionar Afastamento</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoAfastamento">Tipo de Afastamento</Label>
              <Select value={tipoAfastamentoId} onValueChange={setTipoAfastamentoId}>
                <SelectTrigger id="tipoAfastamento">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposAfastamento.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.sigla} - {tipo.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inicialProvavel">Data Inicial Provável</Label>
              <Input
                id="inicialProvavel"
                type="date"
                value={inicialProvavel}
                onChange={(e) => setInicialProvavel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalProvavel">Data Final Provável</Label>
              <Input
                id="finalProvavel"
                type="date"
                value={finalProvavel}
                onChange={(e) => setFinalProvavel(e.target.value)}
                min={inicialProvavel}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicialEfetivo">Data Inicial Efetiva (Somente leitura)</Label>
              <Input
                id="inicialEfetivo"
                type="date"
                value={inicialEfetivo}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalEfetivo">Data Final Efetiva (Somente leitura)</Label>
              <Input
                id="finalEfetivo"
                type="date"
                value={finalEfetivo}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          <Button onClick={handleAddAfastamento} className="w-full">
            <Plus className="mr-2" />
            Adicionar Afastamento
          </Button>
        </div>
      </div>

      {afastamentos.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Afastamentos Cadastrados ({afastamentos.length})</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Inicial Provável</TableHead>
                  <TableHead>Final Provável</TableHead>
                  <TableHead>Inicial Efetivo</TableHead>
                  <TableHead>Final Efetivo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {afastamentos.map((afastamento) => (
                  <TableRow key={afastamento.id}>
                    <TableCell>{getTipoNome(afastamento.tipoAfastamentoId)}</TableCell>
                    <TableCell>{formatarData(afastamento.inicialProvavel)}</TableCell>
                    <TableCell>{formatarData(afastamento.finalProvavel)}</TableCell>
                    <TableCell>
                      {afastamento.inicialEfetivo ? formatarData(afastamento.inicialEfetivo) : '-'}
                    </TableCell>
                    <TableCell>
                      {afastamento.finalEfetivo ? formatarData(afastamento.finalEfetivo) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAfastamento(afastamento.id)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
