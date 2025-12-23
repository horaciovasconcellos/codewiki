import { useState } from 'react';
import { Contrato, StatusContrato } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StepContratosProps {
  aplicacaoId: string;
  contratos: Contrato[];
  setContratos: (value: Contrato[]) => void;
}

const statusOptions: StatusContrato[] = ['Vigente', 'Vencido', 'Em Renovação', 'Cancelado'];

const getStatusColor = (status: StatusContrato) => {
  switch (status) {
    case 'Vigente': return 'bg-green-100 text-green-800';
    case 'Vencido': return 'bg-red-100 text-red-800';
    case 'Em Renovação': return 'bg-yellow-100 text-yellow-800';
    case 'Cancelado': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function StepContratos({ aplicacaoId, contratos, setContratos }: StepContratosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [formData, setFormData] = useState({
    numeroContrato: '',
    dataVigenciaInicial: '',
    dataVigenciaFinal: '',
    status: 'Vigente' as StatusContrato,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      numeroContrato: '',
      dataVigenciaInicial: '',
      dataVigenciaFinal: '',
      status: 'Vigente',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (contrato: Contrato) => {
    setEditing(contrato);
    setFormData({
      numeroContrato: contrato.numeroContrato,
      dataVigenciaInicial: formatDateForInput(contrato.dataVigenciaInicial),
      dataVigenciaFinal: formatDateForInput(contrato.dataVigenciaFinal),
      status: contrato.status,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.numeroContrato.trim()) {
      toast.error('Número do contrato é obrigatório');
      return;
    }
    
    if (!formData.dataVigenciaInicial) {
      toast.error('Data de vigência inicial é obrigatória');
      return;
    }
    
    if (!formData.dataVigenciaFinal) {
      toast.error('Data de vigência final é obrigatória');
      return;
    }

    // Validar se data final é maior que inicial
    if (new Date(formData.dataVigenciaFinal) < new Date(formData.dataVigenciaInicial)) {
      toast.error('Data final deve ser maior que data inicial');
      return;
    }

    const contrato: Contrato = {
      id: editing?.id || crypto.randomUUID(),
      aplicacaoId,
      numeroContrato: formData.numeroContrato,
      dataVigenciaInicial: formData.dataVigenciaInicial,
      dataVigenciaFinal: formData.dataVigenciaFinal,
      status: formData.status,
    };

    // Se tem aplicacaoId válido, salvar na API
    if (aplicacaoId) {
      try {
        const url = editing 
          ? `${API_URL}/api/contratos/${editing.id}`
          : `${API_URL}/api/aplicacoes/${aplicacaoId}/contratos`;
        
        const response = await fetch(url, {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contrato.id,
            numeroContrato: contrato.numeroContrato,
            dataVigenciaInicial: contrato.dataVigenciaInicial,
            dataVigenciaFinal: contrato.dataVigenciaFinal,
            status: contrato.status
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar contrato');
        }

        // Atualizar lista local
        if (editing) {
          setContratos(contratos.map(c => c.id === editing.id ? contrato : c));
          toast.success('Contrato atualizado');
        } else {
          setContratos([...contratos, contrato]);
          toast.success('Contrato adicionado');
        }
      } catch (error) {
        console.error('[StepContratos] Erro:', error);
        toast.error('Erro ao salvar contrato');
        return;
      }
    } else {
      // Se não tem aplicacaoId (nova aplicação), apenas gerencia em memória
      if (editing) {
        setContratos(contratos.map(c => c.id === editing.id ? contrato : c));
        toast.success('Contrato atualizado');
      } else {
        setContratos([...contratos, contrato]);
        toast.success('Contrato adicionado');
      }
    }

    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    // Se tem aplicacaoId válido, deletar na API
    if (aplicacaoId) {
      try {
        const response = await fetch(`${API_URL}/api/contratos/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Erro ao excluir contrato');
        }

        setContratos(contratos.filter(c => c.id !== id));
        toast.success('Contrato removido');
      } catch (error) {
        console.error('[StepContratos] Erro:', error);
        toast.error('Erro ao excluir contrato');
      }
    } else {
      // Se não tem aplicacaoId, apenas remove da memória
      setContratos(contratos.filter(c => c.id !== id));
      toast.success('Contrato removido');
    }
  };

  // Formata data do formato YYYY-MM-DD para DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    // Lidar com formato ISO 8601 (2025-12-15T00:00:00.000Z) ou YYYY-MM-DD
    if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se já está no formato DD/MM/YYYY, retornar como está
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  };

  // Converte data do backend (Date ou string) para formato YYYY-MM-DD para o input
  const formatDateForInput = (date: string | Date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Gerencie os contratos da aplicação
        </p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Contrato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
              <DialogDescription>
                Preencha as informações do contrato
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="numeroContrato">Número do Contrato *</Label>
                <Input
                  id="numeroContrato"
                  value={formData.numeroContrato}
                  onChange={(e) => setFormData({ ...formData, numeroContrato: e.target.value })}
                  placeholder="Ex: CT-2025-001"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVigenciaInicial">Data Vigência Inicial *</Label>
                <Input
                  id="dataVigenciaInicial"
                  type="date"
                  value={formData.dataVigenciaInicial}
                  onChange={(e) => setFormData({ ...formData, dataVigenciaInicial: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVigenciaFinal">Data Vigência Final *</Label>
                <Input
                  id="dataVigenciaFinal"
                  type="date"
                  value={formData.dataVigenciaFinal}
                  onChange={(e) => setFormData({ ...formData, dataVigenciaFinal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as StatusContrato })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {contratos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em "Adicionar Contrato" para começar
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número do Contrato</TableHead>
                <TableHead>Vigência Inicial</TableHead>
                <TableHead>Vigência Final</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((contrato) => (
                <TableRow key={contrato.id}>
                  <TableCell className="font-medium">{contrato.numeroContrato}</TableCell>
                  <TableCell>{formatDate(contrato.dataVigenciaInicial)}</TableCell>
                  <TableCell>{formatDate(contrato.dataVigenciaFinal)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contrato.status)}>
                      {contrato.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(contrato)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(contrato.id)}
                      >
                        <Trash className="h-4 w-4" />
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
