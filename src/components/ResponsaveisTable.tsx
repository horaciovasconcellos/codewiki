import { useState } from 'react';
import { ResponsavelTecnologia, Colaborador, PerfilResponsavel } from '@/lib/types';
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
import { generateUUID } from '@/utils/uuid';

interface ResponsaveisTableProps {
  responsaveis: ResponsavelTecnologia[];
  colaboradores: Colaborador[];
  onChange: (responsaveis: ResponsavelTecnologia[]) => void;
}

const perfisOptions: PerfilResponsavel[] = [
  'Perfis de Negócio / Operacionais',
  'Perfis Técnicos / TI',
  'Perfis de Governança / Gestão',
  'Perfis de Segurança e Compliance',
  'Perfis Específicos de Integração e Dados',
];

export function ResponsaveisTable({ responsaveis, colaboradores, onChange }: ResponsaveisTableProps) {
  const [open, setOpen] = useState(false);
  const [editingResponsavel, setEditingResponsavel] = useState<ResponsavelTecnologia | null>(null);
  const [matriculaFuncionario, setMatriculaFuncionario] = useState('');
  const [dataInicio, setDataInicio] = useState(getTodayDate());
  const [dataTermino, setDataTermino] = useState('');
  const [perfil, setPerfil] = useState<PerfilResponsavel>('Perfis Técnicos / TI');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const colaboradoresAtivos = colaboradores.filter(c => !c.dataDemissao);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingResponsavel(null);
    setMatriculaFuncionario('');
    setDataInicio(getTodayDate());
    setDataTermino('');
    setPerfil('Perfis Técnicos / TI');
    setStatus('Ativo');
  };

  const handleEdit = (responsavel: ResponsavelTecnologia) => {
    setEditingResponsavel(responsavel);
    setMatriculaFuncionario(responsavel.matriculaFuncionario);
    setDataInicio(responsavel.dataInicio);
    setDataTermino(responsavel.dataTermino || '');
    setPerfil(responsavel.perfil);
    setStatus(responsavel.status);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = responsaveis.map(r => 
      r.id === id ? { ...r, status: 'Inativo' as const, dataTermino: new Date().toISOString().split('T')[0] } : r
    );
    onChange(updated);
    toast.success('Responsável marcado como inativo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!matriculaFuncionario || !dataInicio || !perfil) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const colaborador = colaboradores.find(c => c.matricula === matriculaFuncionario);
    if (!colaborador) {
      toast.error('Colaborador não encontrado');
      return;
    }

    if (colaborador.dataDemissao) {
      toast.error('Não é possível adicionar colaborador demitido como responsável');
      return;
    }

    const novoResponsavel: ResponsavelTecnologia = {
      id: editingResponsavel?.id || generateUUID(),
      matriculaFuncionario,
      nomeFuncionario: colaborador.nome,
      dataInicio,
      dataTermino: dataTermino || undefined,
      perfil,
      status,
    };

    if (editingResponsavel) {
      onChange(responsaveis.map(r => r.id === editingResponsavel.id ? novoResponsavel : r));
      toast.success('Responsável atualizado com sucesso');
    } else {
      onChange([...responsaveis, novoResponsavel]);
      toast.success('Responsável adicionado com sucesso');
    }

    setOpen(false);
    resetForm();
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as 'Ativo' | 'Inativo');
    if (value === 'Inativo' && !dataTermino) {
      setDataTermino(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Responsáveis</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2" />
              Adicionar Responsável
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingResponsavel ? 'Editar Responsável' : 'Novo Responsável'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matriculaFuncionario">Matrícula do Funcionário *</Label>
                  <Select value={matriculaFuncionario} onValueChange={setMatriculaFuncionario}>
                    <SelectTrigger id="matriculaFuncionario">
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradoresAtivos.map((colaborador) => (
                        <SelectItem key={colaborador.id} value={colaborador.matricula}>
                          {colaborador.matricula} - {colaborador.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {matriculaFuncionario && colaboradores.find(c => c.matricula === matriculaFuncionario) && (
                    <p className="text-sm text-muted-foreground">
                      Nome: {colaboradores.find(c => c.matricula === matriculaFuncionario)?.nome}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil *</Label>
                  <Select value={perfil} onValueChange={(value) => setPerfil(value as PerfilResponsavel)}>
                    <SelectTrigger id="perfil">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {perfisOptions.map((perfilOption) => (
                        <SelectItem key={perfilOption} value={perfilOption}>
                          {perfilOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="dataTermino">Data Término</Label>
                    <Input
                      id="dataTermino"
                      type="date"
                      value={dataTermino}
                      onChange={(e) => setDataTermino(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={handleStatusChange}>
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingResponsavel ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {responsaveis.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum responsável cadastrado</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsaveis.map((responsavel) => (
                <TableRow key={responsavel.id}>
                  <TableCell>{responsavel.matriculaFuncionario}</TableCell>
                  <TableCell>{responsavel.nomeFuncionario}</TableCell>
                  <TableCell>{responsavel.perfil}</TableCell>
                  <TableCell>{new Date(responsavel.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {responsavel.dataTermino 
                      ? new Date(responsavel.dataTermino).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={responsavel.status === 'Ativo' ? 'default' : 'secondary'}>
                      {responsavel.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(responsavel)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(responsavel.id)}
                        disabled={responsavel.status === 'Inativo'}
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