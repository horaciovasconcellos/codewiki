import { useState } from 'react';
import { ContratoTecnologia } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface ContratosTecnologiaTableProps {
  contratos: ContratoTecnologia[];
  onChange: (contratos: ContratoTecnologia[]) => void;
}

export function ContratosTecnologiaTable({ contratos, onChange }: ContratosTecnologiaTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<ContratoTecnologia | null>(null);
  const [formData, setFormData] = useState<Partial<ContratoTecnologia>>({
    numeroContrato: '',
    vigenciaInicial: getTodayDate(),
    vigenciaTermino: '',
    valorContrato: 0,
    status: 'Ativo',
  });

  const handleOpenNew = () => {
    setEditingContrato(null);
    setFormData({
      numeroContrato: '',
      vigenciaInicial: getTodayDate(),
      vigenciaTermino: '',
      valorContrato: 0,
      status: 'Ativo',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (contrato: ContratoTecnologia) => {
    setEditingContrato(contrato);
    setFormData(contrato);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.numeroContrato || !formData.vigenciaInicial || !formData.vigenciaTermino) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.valorContrato === undefined || formData.valorContrato < 0) {
      toast.error('Informe um valor válido para o contrato');
      return;
    }

    const contrato: ContratoTecnologia = {
      id: editingContrato?.id || generateUUID(),
      numeroContrato: formData.numeroContrato!,
      vigenciaInicial: formData.vigenciaInicial!,
      vigenciaTermino: formData.vigenciaTermino!,
      valorContrato: formData.valorContrato!,
      status: formData.status as 'Ativo' | 'Inativo',
    };

    if (editingContrato) {
      onChange(contratos.map(c => c.id === editingContrato.id ? contrato : c));
      toast.success('Contrato atualizado com sucesso');
    } else {
      onChange([...contratos, contrato]);
      toast.success('Contrato adicionado com sucesso');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(contratos.map(c => c.id === id ? { ...c, status: 'Inativo' as const } : c));
    toast.success('Contrato marcado como inativo');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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
              Adicionar Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContrato ? 'Editar Contrato' : 'Novo Contrato'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do contrato da tecnologia
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="numeroContrato">Número do Contrato *</Label>
                <Input
                  id="numeroContrato"
                  value={formData.numeroContrato}
                  onChange={(e) => setFormData({ ...formData, numeroContrato: e.target.value })}
                  placeholder="Ex: CT-2024-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vigenciaInicial">Vigência Inicial *</Label>
                  <Input
                    id="vigenciaInicial"
                    type="date"
                    value={formData.vigenciaInicial}
                    onChange={(e) => setFormData({ ...formData, vigenciaInicial: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="vigenciaTermino">Vigência Término *</Label>
                  <Input
                    id="vigenciaTermino"
                    type="date"
                    value={formData.vigenciaTermino}
                    onChange={(e) => setFormData({ ...formData, vigenciaTermino: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="valorContrato">Valor do Contrato (R$) *</Label>
                <Input
                  id="valorContrato"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorContrato}
                  onChange={(e) => setFormData({ ...formData, valorContrato: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
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

      {contratos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhum contrato cadastrado
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número do Contrato</TableHead>
                <TableHead>Vigência Inicial</TableHead>
                <TableHead>Vigência Término</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((contrato) => (
                <TableRow key={contrato.id} className={contrato.status === 'Inativo' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{contrato.numeroContrato}</TableCell>
                  <TableCell>{formatDate(contrato.vigenciaInicial)}</TableCell>
                  <TableCell>{formatDate(contrato.vigenciaTermino)}</TableCell>
                  <TableCell>{formatCurrency(contrato.valorContrato)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      contrato.status === 'Ativo' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {contrato.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(contrato)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contrato.id)}
                        disabled={contrato.status === 'Inativo'}
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
