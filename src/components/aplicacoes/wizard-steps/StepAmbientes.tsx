import { useState } from 'react';
import { AmbienteTecnologico, TipoAmbiente } from '@/lib/types';
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

interface StepAmbientesProps {
  ambientes: AmbienteTecnologico[];
  setAmbientes: (value: AmbienteTecnologico[]) => void;
}

export function StepAmbientes({ ambientes, setAmbientes }: StepAmbientesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AmbienteTecnologico | null>(null);
  const [formData, setFormData] = useState({
    tipoAmbiente: 'Dev' as TipoAmbiente,
    urlAmbiente: '',
    dataCriacao: getTodayDate(),
    tempoLiberacao: 0,
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      tipoAmbiente: 'Dev',
      urlAmbiente: '',
      dataCriacao: getTodayDate(),
      tempoLiberacao: 0,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (amb: AmbienteTecnologico) => {
    setEditing(amb);
    
    // Converter data para formato YYYY-MM-DD se necessário (dd/mm/yyyy -> yyyy-mm-dd)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return getTodayDate();
      // Se já está no formato YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateStr.split('T')[0];
      }
      // Se está no formato DD/MM/YYYY
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };
    
    setFormData({
      tipoAmbiente: amb.tipoAmbiente,
      urlAmbiente: amb.urlAmbiente,
      dataCriacao: formatDateForInput(amb.dataCriacao),
      tempoLiberacao: amb.tempoLiberacao,
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.tipoAmbiente || !formData.urlAmbiente || !formData.dataCriacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const ambiente: AmbienteTecnologico = {
      id: editing?.id || generateUUID(),
      tipoAmbiente: formData.tipoAmbiente,
      urlAmbiente: formData.urlAmbiente,
      dataCriacao: formData.dataCriacao,
      tempoLiberacao: formData.tempoLiberacao,
      status: 'Ativo',
    };

    if (editing) {
      setAmbientes(ambientes.map(a => a.id === editing.id ? ambiente : a));
      toast.success('Ambiente atualizado');
    } else {
      setAmbientes([...ambientes, ambiente]);
      toast.success('Ambiente adicionado');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setAmbientes(ambientes.map(a => 
      a.id === id ? { ...a, status: 'Inativo' as const } : a
    ));
    toast.success('Ambiente marcado como inativo');
  };

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure os ambientes tecnológicos da aplicação
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Ambiente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Ambiente' : 'Novo Ambiente'}</DialogTitle>
              <DialogDescription>
                Configure um ambiente tecnológico
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipoAmbiente">Tipo de Ambiente *</Label>
                <Select
                  value={formData.tipoAmbiente}
                  onValueChange={(value) => setFormData({ ...formData, tipoAmbiente: value as TipoAmbiente })}
                >
                  <SelectTrigger id="tipoAmbiente">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dev">Dev</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="Prod">Prod</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="On-Premise">On-Premise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="urlAmbiente">URL do Ambiente *</Label>
                <Input
                  id="urlAmbiente"
                  type="url"
                  value={formData.urlAmbiente}
                  onChange={(e) => setFormData({ ...formData, urlAmbiente: e.target.value })}
                  placeholder="https://app.example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dataCriacao">Data da Criação *</Label>
                  <Input
                    id="dataCriacao"
                    type="date"
                    value={formData.dataCriacao}
                    onChange={(e) => setFormData({ ...formData, dataCriacao: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tempoLiberacao">Tempo de Liberação (dias)</Label>
                  <Input
                    id="tempoLiberacao"
                    type="number"
                    min="0"
                    value={formData.tempoLiberacao}
                    onChange={(e) => setFormData({ ...formData, tempoLiberacao: parseInt(e.target.value) || 0 })}
                  />
                </div>
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

      {ambientes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhum ambiente configurado
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Tempo Liberação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ambientes.map((amb) => (
                <TableRow key={amb.id} className={`hover:bg-gray-100 ${amb.status === 'Inativo' ? 'opacity-50' : ''}`}>
                  <TableCell className="font-medium">{amb.tipoAmbiente}</TableCell>
                  <TableCell>{amb.urlAmbiente}</TableCell>
                  <TableCell>{formatDate(amb.dataCriacao)}</TableCell>
                  <TableCell>{amb.tempoLiberacao} dias</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      amb.status === 'Ativo' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {amb.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(amb)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(amb.id)}
                        disabled={amb.status === 'Inativo'}
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
