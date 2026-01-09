import { useState } from 'react';
import { Afastamento, TipoAfastamento } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilSimple, Trash, Check, X, Copy } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface AfastamentosTableProps {
  colaboradorId: string;
  afastamentos: Afastamento[];
  tiposAfastamento: TipoAfastamento[];
  onAfastamentosChange: (afastamentos: Afastamento[]) => void;
}

export function AfastamentosTable({ colaboradorId, afastamentos, tiposAfastamento, onAfastamentosChange }: AfastamentosTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tipoAfastamentoId, setTipoAfastamentoId] = useState<string>('');
  const [inicialProvavel, setInicialProvavel] = useState(getTodayDate());
  const [finalProvavel, setFinalProvavel] = useState('');

  const anoAtual = new Date().getFullYear();
  const proximoAno = anoAtual + 1;

  const afastamentosFiltrados = afastamentos.filter(af => {
    const ano = new Date(af.inicialProvavel).getFullYear();
    return ano === anoAtual || ano === proximoAno;
  });

  const getTipoAfastamento = (id: string) => {
    return tiposAfastamento.find(t => t.id === id);
  };

  const handleAdd = () => {
    if (!tipoAfastamentoId || !inicialProvavel || !finalProvavel) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (new Date(finalProvavel) <= new Date(inicialProvavel)) {
      toast.error('A data final deve ser posterior à data inicial');
      return;
    }

    const anoInicial = new Date(inicialProvavel).getFullYear();
    if (anoInicial !== anoAtual && anoInicial !== proximoAno) {
      toast.error(`Afastamentos devem ser para ${anoAtual} ou ${proximoAno}`);
      return;
    }

    const novoAfastamento: Afastamento = {
      id: generateUUID(),
      tipoAfastamentoId,
      inicialProvavel,
      finalProvavel
    };

    onAfastamentosChange([...afastamentos, novoAfastamento]);
    setIsAdding(false);
    resetForm();
    toast.success('Afastamento adicionado');
  };

  const handleEdit = (afastamento: Afastamento) => {
    setEditingId(afastamento.id);
    setTipoAfastamentoId(afastamento.tipoAfastamentoId);
    setInicialProvavel(afastamento.inicialProvavel);
    setFinalProvavel(afastamento.finalProvavel);
  };

  const handleSaveEdit = () => {
    if (!tipoAfastamentoId || !inicialProvavel || !finalProvavel) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (new Date(finalProvavel) <= new Date(inicialProvavel)) {
      toast.error('A data final deve ser posterior à data inicial');
      return;
    }

    const afastamentosAtualizados = afastamentos.map(af =>
      af.id === editingId
        ? { ...af, tipoAfastamentoId, inicialProvavel, finalProvavel }
        : af
    );

    onAfastamentosChange(afastamentosAtualizados);
    setEditingId(null);
    resetForm();
    toast.success('Afastamento atualizado');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onAfastamentosChange(afastamentos.filter(af => af.id !== id));
    toast.success('Afastamento removido');
  };

  const resetForm = () => {
    setTipoAfastamentoId(undefined);
    setInicialProvavel(getTodayDate());
    setFinalProvavel('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  const copyApiCommand = (afastamentoId: string) => {
    const comando = `window.dispatchEvent(new CustomEvent('api-periodo-efetivo', { detail: { colaboradorId: '${colaboradorId}', afastamentoId: '${afastamentoId}', inicialEfetivo: '2024-01-15', finalEfetivo: '2024-01-30' } }));`;
    navigator.clipboard.writeText(comando);
    toast.success('Comando copiado! Cole no console do navegador para testar a API.');
  };

  if (tiposAfastamento.length === 0) {
    return (
      <div className="border rounded-lg p-10 text-center">
        <p className="text-muted-foreground text-base leading-relaxed">
          Nenhum tipo de afastamento cadastrado. Cadastre tipos de afastamento na tela principal para poder adicionar afastamentos aos colaboradores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="text-base text-muted-foreground font-medium">
          Afastamentos para {anoAtual} e {proximoAno}
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="h-10 px-4">
            <Plus className="mr-2" />
            Adicionar Afastamento
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="border rounded-lg p-6 space-y-5 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3 md:col-span-2">
              <Label className="text-base font-medium">Tipo de Afastamento</Label>
              <Select value={tipoAfastamentoId} onValueChange={setTipoAfastamentoId}>
                <SelectTrigger className="h-11 text-base w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposAfastamento.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id} className="text-base">
                      {tipo.sigla} - {tipo.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">Data Inicial Provável</Label>
              <Input
                type="date"
                value={inicialProvavel}
                onChange={(e) => setInicialProvavel(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">Data Final Provável</Label>
              <Input
                type="date"
                value={finalProvavel}
                onChange={(e) => setFinalProvavel(e.target.value)}
                min={inicialProvavel}
                className="h-11 text-base"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} className="h-10 px-5">
              <Check className="mr-2" />
              Adicionar
            </Button>
            <Button onClick={() => { setIsAdding(false); resetForm(); }} variant="outline" className="h-10 px-5">
              <X className="mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-base h-12">Tipo</TableHead>
              <TableHead className="font-semibold text-base h-12">Início Provável</TableHead>
              <TableHead className="font-semibold text-base h-12">Término Provável</TableHead>
              <TableHead className="font-semibold text-base h-12">Início Efetivo</TableHead>
              <TableHead className="font-semibold text-base h-12">Término Efetivo</TableHead>
              <TableHead className="w-32 font-semibold text-base h-12">Testar API</TableHead>
              <TableHead className="w-28 font-semibold text-base h-12">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {afastamentosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-base">
                  Nenhum afastamento cadastrado para {anoAtual} ou {proximoAno}
                </TableCell>
              </TableRow>
            ) : (
              afastamentosFiltrados.map((afastamento) => {
                const tipo = getTipoAfastamento(afastamento.tipoAfastamentoId);
                
                return (
                  <TableRow key={afastamento.id} className="h-16">
                    {editingId === afastamento.id ? (
                      <>
                        <TableCell>
                          <Select value={tipoAfastamentoId} onValueChange={setTipoAfastamentoId}>
                            <SelectTrigger className="w-full h-10 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposAfastamento.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-base">
                                  {t.sigla} - {t.descricao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={inicialProvavel}
                            onChange={(e) => setInicialProvavel(e.target.value)}
                            className="h-10 text-base"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={finalProvavel}
                            onChange={(e) => setFinalProvavel(e.target.value)}
                            min={inicialProvavel}
                            className="h-10 text-base"
                          />
                        </TableCell>
                        <TableCell colSpan={2} className="text-muted-foreground text-base">
                          Preenchido via API
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => copyApiCommand(afastamento.id)}
                            className="h-9 px-3 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-9 w-9 p-0">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-9 w-9 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {tipo ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono font-bold text-sm px-2 py-1">
                                {tipo.sigla}
                              </Badge>
                              <span className="text-base">{tipo.descricao}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-base">Tipo não encontrado</span>
                          )}
                        </TableCell>
                        <TableCell className="text-base">{formatDate(afastamento.inicialProvavel)}</TableCell>
                        <TableCell className="text-base">{formatDate(afastamento.finalProvavel)}</TableCell>
                        <TableCell>
                          {afastamento.inicialEfetivo ? (
                            <span className="font-medium text-base">{formatDate(afastamento.inicialEfetivo)}</span>
                          ) : (
                            <span className="text-muted-foreground text-base">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {afastamento.finalEfetivo ? (
                            <span className="font-medium text-base">{formatDate(afastamento.finalEfetivo)}</span>
                          ) : (
                            <span className="text-muted-foreground text-base">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => copyApiCommand(afastamento.id)}
                            className="h-9 px-3 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(afastamento)}
                              className="h-9 w-9 p-0"
                            >
                              <PencilSimple className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(afastamento.id)}
                              className="h-9 w-9 p-0"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
