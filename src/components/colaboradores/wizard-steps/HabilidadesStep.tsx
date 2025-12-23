import { useState } from 'react';
import { HabilidadeColaborador, Habilidade, NivelHabilidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';
import { apiDelete } from '@/hooks/use-api';

interface HabilidadesStepProps {
  habilidades: HabilidadeColaborador[];
  setHabilidades: (habilidades: HabilidadeColaborador[]) => void;
  habilidadesDisponiveis: Habilidade[];
}

const niveisHabilidade: NivelHabilidade[] = ['Basico', 'Intermediario', 'Avancado', 'Expert'];

export function HabilidadesStep({
  habilidades,
  setHabilidades,
  habilidadesDisponiveis
}: HabilidadesStepProps) {
  const [habilidadeId, setHabilidadeId] = useState<string>('');
  const [nivelDeclarado, setNivelDeclarado] = useState<NivelHabilidade>('Basico');
  const [nivelAvaliado, setNivelAvaliado] = useState<NivelHabilidade>('Basico');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');

  const handleAddHabilidade = () => {
    if (!habilidadeId || !dataInicio) {
      toast.error('Selecione a habilidade e informe a data de início');
      return;
    }

    const jaExiste = habilidades.some(h => h.habilidadeId === habilidadeId);
    if (jaExiste) {
      toast.error('Esta habilidade já foi adicionada');
      return;
    }

    if (dataTermino && dataInicio > dataTermino) {
      toast.error('A data de início não pode ser posterior à data de término');
      return;
    }

    const novaHabilidade: HabilidadeColaborador = {
      id: crypto.randomUUID(),
      habilidadeId,
      nivelDeclarado,
      nivelAvaliado,
      dataInicio,
      dataTermino: dataTermino || undefined
    };

    setHabilidades([...habilidades, novaHabilidade]);
    
    setHabilidadeId('');
    setNivelDeclarado('Basico');
    setNivelAvaliado('Basico');
    setDataInicio('');
    setDataTermino('');

    toast.success('Habilidade adicionada');
  };

  const handleRemoveHabilidade = async (id: string) => {
    // Se o ID é um UUID válido do banco, deletar via API
    if (id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        await apiDelete(`/colaborador-habilidades/${id}`);
      } catch (error) {
        console.error('Erro ao deletar habilidade:', error);
        toast.error('Erro ao remover habilidade');
        return;
      }
    }
    
    // Remover do estado local
    setHabilidades(habilidades.filter(h => h.id !== id));
    toast.success('Habilidade removida');
  };

  const getHabilidadeNome = (habilidadeId: string) => {
    const habilidade = habilidadesDisponiveis.find(h => h.id === habilidadeId);
    return habilidade ? habilidade.descricao : habilidadeId;
  };

  const getNivelColor = (nivel: NivelHabilidade) => {
    switch (nivel) {
      case 'Expert':
        return 'default';
      case 'Avançado':
        return 'secondary';
      case 'Intermediário':
        return 'outline';
      case 'Básico':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold mb-4">Adicionar Habilidade</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habilidade">Habilidade</Label>
            <Select value={habilidadeId} onValueChange={setHabilidadeId}>
              <SelectTrigger id="habilidade">
                <SelectValue placeholder="Selecione a habilidade" />
              </SelectTrigger>
              <SelectContent>
                {habilidadesDisponiveis.map((hab) => (
                  <SelectItem key={hab.id} value={hab.id}>
                    {hab.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nivelDeclarado">Nível Declarado</Label>
              <Select 
                value={nivelDeclarado} 
                onValueChange={(value) => setNivelDeclarado(value as NivelHabilidade)}
              >
                <SelectTrigger id="nivelDeclarado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {niveisHabilidade.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {nivel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivelAvaliado">Nível Avaliado</Label>
              <Select 
                value={nivelAvaliado} 
                onValueChange={(value) => setNivelAvaliado(value as NivelHabilidade)}
              >
                <SelectTrigger id="nivelAvaliado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {niveisHabilidade.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {nivel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataTermino">Data Término (Opcional)</Label>
              <Input
                id="dataTermino"
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
                min={dataInicio}
              />
            </div>
          </div>

          <Button onClick={handleAddHabilidade} className="w-full">
            <Plus className="mr-2" />
            Adicionar Habilidade
          </Button>
        </div>
      </div>

      {habilidades.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Habilidades Cadastradas ({habilidades.length})</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Habilidade</TableHead>
                  <TableHead>Nível Declarado</TableHead>
                  <TableHead>Nível Avaliado</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {habilidades.map((hab) => (
                  <TableRow key={hab.id}>
                    <TableCell>{getHabilidadeNome(hab.habilidadeId)}</TableCell>
                    <TableCell>
                      <Badge variant={getNivelColor(hab.nivelDeclarado)}>
                        {hab.nivelDeclarado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getNivelColor(hab.nivelAvaliado)}>
                        {hab.nivelAvaliado}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatarData(hab.dataInicio)}</TableCell>
                    <TableCell>
                      {hab.dataTermino ? formatarData(hab.dataTermino) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHabilidade(hab.id)}
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
