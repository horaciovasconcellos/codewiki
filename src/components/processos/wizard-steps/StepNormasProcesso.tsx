import { useState } from 'react';
import { NormaProcesso, TipoNorma, ObrigatoriedadeNorma } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash, PencilSimple, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface StepNormasProcessoProps {
  normas: NormaProcesso[];
  setNormas: (normas: NormaProcesso[]) => void;
}

export function StepNormasProcesso({ normas, setNormas }: StepNormasProcessoProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tipoNorma, setTipoNorma] = useState<TipoNorma>('Norma Legal');
  const [obrigatoriedade, setObrigatoriedade] = useState<ObrigatoriedadeNorma>('Não obrigatório');
  const [itemNorma, setItemNorma] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const resetForm = () => {
    setTipoNorma('Norma Legal');
    setObrigatoriedade('Não obrigatório');
    setItemNorma('');
    setDataInicio('');
    setDataTermino('');
    setStatus('Ativo');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!obrigatoriedade || !itemNorma || !dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novaNorma: NormaProcesso = {
      id: generateUUID(),
      tipoNorma,
      obrigatoriedade,
      itemNorma,
      dataInicio,
      dataTermino: dataTermino || undefined,
      status,
    };

    setNormas([...normas, novaNorma]);
    toast.success('Norma adicionada com sucesso');
    resetForm();
  };

  const handleEdit = (norma: NormaProcesso) => {
    setEditingId(norma.id);
    setTipoNorma(norma.tipoNorma);
    setObrigatoriedade(norma.obrigatoriedade);
    setItemNorma(norma.itemNorma);
    setDataInicio(norma.dataInicio);
    setDataTermino(norma.dataTermino || '');
    setStatus(norma.status);
    setIsAdding(true);
  };

  const handleUpdate = () => {
    if (!obrigatoriedade || !itemNorma || !dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setNormas(normas.map(norma => 
      norma.id === editingId
        ? {
            ...norma,
            tipoNorma,
            obrigatoriedade,
            itemNorma,
            dataInicio,
            dataTermino: dataTermino || undefined,
            status,
          }
        : norma
    ));
    toast.success('Norma atualizada com sucesso');
    resetForm();
  };

  const handleDelete = (id: string) => {
    setNormas(normas.filter(norma => norma.id !== id));
    toast.success('Norma removida com sucesso');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Normas Aplicáveis</h3>
          <p className="text-sm text-muted-foreground">
            Adicione as normas que se aplicam a este processo
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2" />
            Adicionar Norma
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">
              {editingId ? 'Editar Norma' : 'Nova Norma'}
            </h4>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-norma">
                Tipo de Norma <span className="text-destructive">*</span>
              </Label>
              <Select value={tipoNorma} onValueChange={(value) => setTipoNorma(value as TipoNorma)}>
                <SelectTrigger id="tipo-norma">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Norma Legal">Norma Legal</SelectItem>
                  <SelectItem value="Norma Técnica">Norma Técnica</SelectItem>
                  <SelectItem value="Norma Reguladora">Norma Reguladora</SelectItem>
                  <SelectItem value="Norma Setorial">Norma Setorial</SelectItem>
                  <SelectItem value="Norma Organizacional">Norma Organizacional</SelectItem>
                  <SelectItem value="Norma Contratual">Norma Contratual</SelectItem>
                  <SelectItem value="Regulamentação Internacional">Regulamentação Internacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obrigatoriedade">
                Obrigatoriedade <span className="text-destructive">*</span>
              </Label>
              <Select value={obrigatoriedade} onValueChange={(value) => setObrigatoriedade(value as ObrigatoriedadeNorma)}>
                <SelectTrigger id="obrigatoriedade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não obrigatório">Não obrigatório</SelectItem>
                  <SelectItem value="Recomendado">Recomendado</SelectItem>
                  <SelectItem value="Obrigatório">Obrigatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-norma">
              Item da Norma <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item-norma"
              value={itemNorma}
              onChange={(e) => setItemNorma(e.target.value)}
              placeholder="Ex: Lei 12.965/2014 - Marco Civil da Internet"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">
                Data de Início <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-termino">Data de Término</Label>
              <Input
                id="data-termino"
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'Ativo' | 'Inativo')}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={editingId ? handleUpdate : handleAdd}>
              <Check className="mr-2" />
              {editingId ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {normas.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Item da Norma</TableHead>
                <TableHead>Obrigatoriedade</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normas.map((norma) => (
                <TableRow key={norma.id}>
                  <TableCell>
                    <Badge variant="outline">{norma.tipoNorma}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{norma.itemNorma}</TableCell>
                  <TableCell>{norma.obrigatoriedade}</TableCell>
                  <TableCell>{new Date(norma.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge variant={norma.status === 'Ativo' ? 'default' : 'secondary'}>
                      {norma.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(norma)}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(norma.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {normas.length === 0 && !isAdding && (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <p>Nenhuma norma cadastrada</p>
          <p className="text-sm mt-1">Clique em "Adicionar Norma" para começar</p>
        </div>
      )}
    </div>
  );
}
