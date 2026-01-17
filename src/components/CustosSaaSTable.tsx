import { useState } from 'react';
import { CustoSaaS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface CustosSaaSTableProps {
  custos: CustoSaaS[];
  onChange: (custos: CustoSaaS[]) => void;
}

export function CustosSaaSTable({ custos, onChange }: CustosSaaSTableProps) {
  const [open, setOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoSaaS | null>(null);
  const [custoTotalSaaS, setCustoTotalSaaS] = useState('');
  const [custoPorLicenca, setCustoPorLicenca] = useState('');
  const [numeroLicencasContratadas, setNumeroLicencasContratadas] = useState('');
  const [licencasUtilizadas, setLicencasUtilizadas] = useState('');
  const [crescimentoCustoMensalMoM, setCrescimentoCustoMensalMoM] = useState('');
  const [slaCumprido, setSlaCumprido] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingCusto(null);
    setCustoTotalSaaS('');
    setCustoPorLicenca('');
    setNumeroLicencasContratadas('');
    setLicencasUtilizadas('');
    setCrescimentoCustoMensalMoM('');
    setSlaCumprido('');
  };

  const handleEdit = (custo: CustoSaaS) => {
    setEditingCusto(custo);
    setCustoTotalSaaS(custo.custoTotalSaaS.toString());
    setCustoPorLicenca(custo.custoPorLicenca.toString());
    setNumeroLicencasContratadas(custo.numeroLicencasContratadas.toString());
    setLicencasUtilizadas(custo.licencasUtilizadas.toString());
    setCrescimentoCustoMensalMoM(custo.crescimentoCustoMensalMoM.toString());
    setSlaCumprido(custo.slaCumprido.toString());
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(custos.filter(c => c.id !== id));
    toast.success('Custo removido com sucesso');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!custoTotalSaaS || !custoPorLicenca || !numeroLicencasContratadas || !licencasUtilizadas || !crescimentoCustoMensalMoM || !slaCumprido) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const custoTotalNum = parseFloat(custoTotalSaaS);
    const custoPorLicencaNum = parseFloat(custoPorLicenca);
    const numeroLicencasContratadasNum = parseInt(numeroLicencasContratadas);
    const licencasUtilizadasNum = parseInt(licencasUtilizadas);
    const crescimentoNum = parseFloat(crescimentoCustoMensalMoM);
    const slaNum = parseFloat(slaCumprido);

    if (isNaN(custoTotalNum) || custoTotalNum < 0) {
      toast.error('Custo total deve ser um número válido');
      return;
    }

    if (isNaN(custoPorLicencaNum) || custoPorLicencaNum < 0) {
      toast.error('Custo por licença deve ser um número válido');
      return;
    }

    if (isNaN(numeroLicencasContratadasNum) || numeroLicencasContratadasNum < 0) {
      toast.error('Número de licenças contratadas deve ser um número válido');
      return;
    }

    if (isNaN(licencasUtilizadasNum) || licencasUtilizadasNum < 0) {
      toast.error('Licenças utilizadas deve ser um número válido');
      return;
    }

    if (licencasUtilizadasNum > numeroLicencasContratadasNum) {
      toast.error('Licenças utilizadas não pode ser maior que licenças contratadas');
      return;
    }

    if (isNaN(crescimentoNum)) {
      toast.error('Crescimento do custo mensal deve ser um número válido');
      return;
    }

    if (isNaN(slaNum) || slaNum < 0 || slaNum > 100) {
      toast.error('SLA cumprido deve ser um percentual entre 0 e 100');
      return;
    }

    const novoCusto: CustoSaaS = {
      id: editingCusto?.id || generateUUID(),
      custoTotalSaaS: custoTotalNum,
      custoPorLicenca: custoPorLicencaNum,
      numeroLicencasContratadas: numeroLicencasContratadasNum,
      licencasUtilizadas: licencasUtilizadasNum,
      crescimentoCustoMensalMoM: crescimentoNum,
      slaCumprido: slaNum,
    };

    if (editingCusto) {
      onChange(custos.map(c => c.id === editingCusto.id ? novoCusto : c));
      toast.success('Custo atualizado com sucesso');
    } else {
      onChange([...custos, novoCusto]);
      toast.success('Custo adicionado com sucesso');
    }

    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Custos SaaS</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2" />
              Adicionar Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCusto ? 'Editar Custo SaaS' : 'Novo Custo SaaS'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custoTotalSaaS">Custo Total do SaaS (TCS) (R$) *</Label>
                  <Input
                    id="custoTotalSaaS"
                    type="number"
                    step="0.01"
                    max="9999999999999.99"
                    value={custoTotalSaaS}
                    onChange={(e) => setCustoTotalSaaS(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Até 13 dígitos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custoPorLicenca">Custo por Licença / Usuário (R$) *</Label>
                  <Input
                    id="custoPorLicenca"
                    type="number"
                    step="0.01"
                    max="9999999999999.99"
                    value={custoPorLicenca}
                    onChange={(e) => setCustoPorLicenca(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Até 13 dígitos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroLicencasContratadas">Nº de Licenças Contratadas *</Label>
                  <Input
                    id="numeroLicencasContratadas"
                    type="number"
                    min="0"
                    value={numeroLicencasContratadas}
                    onChange={(e) => setNumeroLicencasContratadas(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licencasUtilizadas">Licenças Utilizadas *</Label>
                  <Input
                    id="licencasUtilizadas"
                    type="number"
                    min="0"
                    value={licencasUtilizadas}
                    onChange={(e) => setLicencasUtilizadas(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crescimentoCustoMensalMoM">Crescimento do Custo Mensal (MoM) (%) *</Label>
                  <Input
                    id="crescimentoCustoMensalMoM"
                    type="number"
                    step="0.01"
                    min="-999.99"
                    max="999.99"
                    value={crescimentoCustoMensalMoM}
                    onChange={(e) => setCrescimentoCustoMensalMoM(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre -999.99 e 999.99
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slaCumprido">SLA Cumprido (%) *</Label>
                  <Input
                    id="slaCumprido"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={slaCumprido}
                    onChange={(e) => setSlaCumprido(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre 0 e 100
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCusto ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {custos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum custo cadastrado</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TCS (R$)</TableHead>
                <TableHead>Custo/Licença</TableHead>
                <TableHead>Licenças Contratadas</TableHead>
                <TableHead>Licenças Utilizadas</TableHead>
                <TableHead>Crescimento MoM (%)</TableHead>
                <TableHead>SLA (%)</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custos.map((custo) => (
                <TableRow key={custo.id}>
                  <TableCell>R$ {custo.custoTotalSaaS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>R$ {custo.custoPorLicenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{custo.numeroLicencasContratadas}</TableCell>
                  <TableCell>{custo.licencasUtilizadas}</TableCell>
                  <TableCell>{custo.crescimentoCustoMensalMoM.toFixed(2)}%</TableCell>
                  <TableCell>{custo.slaCumprido.toFixed(2)}%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(custo)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(custo.id)}
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
