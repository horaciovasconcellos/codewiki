import { useState } from 'react';
import { ContratoAMS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { getTodayDate } from '@/lib/utils';

interface ContratosAMSTableProps {
  contratos: ContratoAMS[];
  onChange: (contratos: ContratoAMS[]) => void;
}

export function ContratosAMSTable({ contratos, onChange }: ContratosAMSTableProps) {
  const [open, setOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<ContratoAMS | null>(null);
  const [contrato, setContrato] = useState('');
  const [cnpjContratado, setCnpjContratado] = useState('');
  const [custoAnual, setCustoAnual] = useState('');
  const [dataInicio, setDataInicio] = useState(getTodayDate());
  const [dataTermino, setDataTermino] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingContrato(null);
    setContrato('');
    setCnpjContratado('');
    setCustoAnual('');
    setDataInicio(getTodayDate());
    setDataTermino('');
    setStatus('Ativo');
  };

  const handleEdit = (contratoItem: ContratoAMS) => {
    setEditingContrato(contratoItem);
    setContrato(contratoItem.contrato);
    setCnpjContratado(contratoItem.cnpjContratado);
    setCustoAnual(contratoItem.custoAnual.toString());
    setDataInicio(contratoItem.dataInicio);
    setDataTermino(contratoItem.dataTermino);
    setStatus(contratoItem.status);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = contratos.map(c => 
      c.id === id ? { ...c, status: 'Inativo' as const } : c
    );
    onChange(updated);
    toast.success('Contrato marcado como inativo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contrato || !cnpjContratado || !custoAnual || !dataInicio || !dataTermino) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const custoAnualNum = parseFloat(custoAnual);
    if (isNaN(custoAnualNum) || custoAnualNum < 0) {
      toast.error('Custo anual deve ser um número válido');
      return;
    }

    const novoContrato: ContratoAMS = {
      id: editingContrato?.id || crypto.randomUUID(),
      contrato,
      cnpjContratado,
      custoAnual: custoAnualNum,
      dataInicio,
      dataTermino,
      status,
    };

    if (editingContrato) {
      onChange(contratos.map(c => c.id === editingContrato.id ? novoContrato : c));
      toast.success('Contrato atualizado com sucesso');
    } else {
      onChange([...contratos, novoContrato]);
      toast.success('Contrato adicionado com sucesso');
    }

    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Contratos AMS</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2" />
              Adicionar Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContrato ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contrato">Contrato *</Label>
                  <Input
                    id="contrato"
                    value={contrato}
                    onChange={(e) => setContrato(e.target.value)}
                    maxLength={100}
                    placeholder="Número do contrato"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpjContratado">CNPJ do Contratado *</Label>
                  <Input
                    id="cnpjContratado"
                    value={cnpjContratado}
                    onChange={(e) => setCnpjContratado(e.target.value)}
                    maxLength={18}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custoAnual">Custo Anual (R$) *</Label>
                  <Input
                    id="custoAnual"
                    type="number"
                    step="0.01"
                    value={custoAnual}
                    onChange={(e) => setCustoAnual(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataTermino">Data Término *</Label>
                  <Input
                    id="dataTermino"
                    type="date"
                    value={dataTermino}
                    onChange={(e) => setDataTermino(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingContrato ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contratos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato cadastrado</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Custo Anual</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((contratoItem) => (
                <TableRow key={contratoItem.id}>
                  <TableCell>{contratoItem.contrato}</TableCell>
                  <TableCell>{contratoItem.cnpjContratado}</TableCell>
                  <TableCell>R$ {contratoItem.custoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{new Date(contratoItem.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{new Date(contratoItem.dataTermino).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge variant={contratoItem.status === 'Ativo' ? 'default' : 'secondary'}>
                      {contratoItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(contratoItem)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(contratoItem.id)}
                        disabled={contratoItem.status === 'Inativo'}
                      >
                        <Trash />
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