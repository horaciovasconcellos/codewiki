import { useState } from 'react';
import { NormaProcesso, TipoNorma, ObrigatoriedadeNorma } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';

interface NormasProcessoTableProps {
  normas: NormaProcesso[];
  onChange: (normas: NormaProcesso[]) => void;
}

export function NormasProcessoTable({ normas, onChange }: NormasProcessoTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingNorma, setEditingNorma] = useState<NormaProcesso | null>(null);
  const [formData, setFormData] = useState<Partial<NormaProcesso>>({
    tipoNorma: 'Norma Legal',
    obrigatoriedade: 'Não obrigatório',
    itemNorma: '',
    dataInicio: getTodayDate(),
    dataTermino: '',
    status: 'Ativo',
  });

  const handleOpenNew = () => {
    setEditingNorma(null);
    setFormData({
      tipoNorma: 'Norma Legal',
      obrigatoriedade: 'Não obrigatório',
      itemNorma: '',
      dataInicio: getTodayDate(),
      dataTermino: '',
      status: 'Ativo',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (norma: NormaProcesso) => {
    setEditingNorma(norma);
    setFormData(norma);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.tipoNorma || !formData.obrigatoriedade || !formData.itemNorma || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const norma: NormaProcesso = {
      id: editingNorma?.id || crypto.randomUUID(),
      tipoNorma: formData.tipoNorma as TipoNorma,
      obrigatoriedade: formData.obrigatoriedade!,
      itemNorma: formData.itemNorma!,
      dataInicio: formData.dataInicio!,
      dataTermino: formData.dataTermino,
      status: formData.status as 'Ativo' | 'Inativo',
    };

    if (editingNorma) {
      onChange(normas.map(n => n.id === editingNorma.id ? norma : n));
      toast.success('Norma atualizada com sucesso');
    } else {
      onChange([...normas, norma]);
      toast.success('Norma adicionada com sucesso');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(normas.map(n => n.id === id ? { ...n, status: 'Inativo' as const } : n));
    toast.success('Norma marcada como inativa');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Norma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNorma ? 'Editar Norma' : 'Nova Norma'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações sobre a norma aplicável ao processo
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipoNorma">Tipo de Norma *</Label>
                <Select
                  value={formData.tipoNorma}
                  onValueChange={(value) => setFormData({ ...formData, tipoNorma: value as TipoNorma })}
                >
                  <SelectTrigger id="tipoNorma">
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

              <div className="grid gap-2">
                <Label htmlFor="obrigatoriedade">Obrigatoriedade *</Label>
                <Select
                  value={formData.obrigatoriedade}
                  onValueChange={(value) => setFormData({ ...formData, obrigatoriedade: value as ObrigatoriedadeNorma })}
                >
                  <SelectTrigger id="obrigatoriedade">
                    <SelectValue placeholder="Selecione a obrigatoriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não obrigatório">Não obrigatório</SelectItem>
                    <SelectItem value="Recomendado">Recomendado</SelectItem>
                    <SelectItem value="Obrigatório">Obrigatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="itemNorma">Item da Norma *</Label>
                <Input
                  id="itemNorma"
                  value={formData.itemNorma}
                  onChange={(e) => setFormData({ ...formData, itemNorma: e.target.value })}
                  placeholder="Ex: Artigo 5º, Item 3.2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dataTermino">Data de Término</Label>
                  <Input
                    id="dataTermino"
                    type="date"
                    value={formData.dataTermino}
                    onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })}
                >
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {normas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma norma cadastrada
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Norma</TableHead>
                <TableHead>Obrigatoriedade</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normas.map((norma) => (
                <TableRow key={norma.id} className={norma.status === 'Inativo' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{norma.tipoNorma}</TableCell>
                  <TableCell>{norma.obrigatoriedade}</TableCell>
                  <TableCell>{norma.itemNorma}</TableCell>
                  <TableCell>{formatDate(norma.dataInicio)}</TableCell>
                  <TableCell>{formatDate(norma.dataTermino || '')}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      norma.status === 'Ativo' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {norma.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(norma)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(norma.id)}
                        disabled={norma.status === 'Inativo'}
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
    </div>
  );
}
