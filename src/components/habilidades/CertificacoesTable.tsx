import { useState } from 'react';
import { CertificacaoRelacionada } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLogging } from '@/hooks/use-logging';

interface CertificacoesTableProps {
  certificacoes: CertificacaoRelacionada[];
  onCertificacaoAdd: (certificacao: CertificacaoRelacionada) => void;
  onCertificacaoUpdate: (certificacao: CertificacaoRelacionada) => void;
  onCertificacaoDelete: (id: string) => void;
}

export function CertificacoesTable({ 
  certificacoes, 
  onCertificacaoAdd, 
  onCertificacaoUpdate, 
  onCertificacaoDelete 
}: CertificacoesTableProps) {
  const { logClick } = useLogging('certificacoes-table');
  const [open, setOpen] = useState(false);
  const [editingCertificacao, setEditingCertificacao] = useState<CertificacaoRelacionada | null>(null);
  const [nomeCertificacao, setNomeCertificacao] = useState('');
  const [tempoValidadeDias, setTempoValidadeDias] = useState<string>('9999999');

  const handleOpenDialog = (certificacao?: CertificacaoRelacionada) => {
    if (certificacao) {
      setEditingCertificacao(certificacao);
      setNomeCertificacao(certificacao.nomeCertificacao);
      setTempoValidadeDias(certificacao.tempoValidadeDias.toString());
      logClick('certificacao_edit_opened', { certificacao_id: certificacao.id });
    } else {
      setEditingCertificacao(null);
      setNomeCertificacao('');
      setTempoValidadeDias('9999999');
      logClick('certificacao_add_opened');
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!nomeCertificacao.trim()) {
      toast.error('Nome da certificação é obrigatório');
      return;
    }

    const validadeDias = parseInt(tempoValidadeDias);
    if (isNaN(validadeDias) || validadeDias < 0) {
      toast.error('Tempo de validade deve ser um número positivo');
      return;
    }

    if (editingCertificacao) {
      const updated: CertificacaoRelacionada = {
        ...editingCertificacao,
        nomeCertificacao: nomeCertificacao.trim(),
        tempoValidadeDias: validadeDias
      };
      onCertificacaoUpdate(updated);
      logClick('certificacao_updated', { certificacao_id: updated.id });
      toast.success('Certificação atualizada com sucesso');
    } else {
      const nova: CertificacaoRelacionada = {
        id: crypto.randomUUID(),
        nomeCertificacao: nomeCertificacao.trim(),
        tempoValidadeDias: validadeDias
      };
      onCertificacaoAdd(nova);
      logClick('certificacao_added', { certificacao_id: nova.id });
      toast.success('Certificação adicionada com sucesso');
    }

    setOpen(false);
    setNomeCertificacao('');
    setTempoValidadeDias('9999999');
    setEditingCertificacao(null);
  };

  const handleDelete = (id: string) => {
    onCertificacaoDelete(id);
    logClick('certificacao_deleted', { certificacao_id: id });
    toast.success('Certificação removida com sucesso');
  };

  const handleCancel = () => {
    setOpen(false);
    setNomeCertificacao('');
    setTempoValidadeDias('9999999');
    setEditingCertificacao(null);
  };

  const formatarValidadeDias = (dias: number): string => {
    if (dias >= 9999999) {
      return 'Sem validade';
    }
    if (dias >= 365) {
      const anos = Math.floor(dias / 365);
      return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    }
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Certificações Relacionadas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2" />
              Adicionar Certificação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCertificacao ? 'Editar Certificação' : 'Nova Certificação'}
              </DialogTitle>
              <DialogDescription>
                Informe o nome da certificação e seu tempo de validade em dias
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome-certificacao">Nome da Certificação</Label>
                <Input
                  id="nome-certificacao"
                  placeholder="Ex: AWS Certified Solutions Architect, SAP S/4HANA Consultant"
                  value={nomeCertificacao}
                  onChange={(e) => setNomeCertificacao(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo-validade">Tempo de Validade (dias)</Label>
                <Input
                  id="tempo-validade"
                  type="number"
                  placeholder="9999999 para sem validade"
                  value={tempoValidadeDias}
                  onChange={(e) => setTempoValidadeDias(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Preencha com 9999999 para certificações sem validade
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCertificacao ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {certificacoes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          Nenhuma certificação cadastrada
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Certificação</TableHead>
                <TableHead>Tempo de Validade</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificacoes.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.nomeCertificacao}</TableCell>
                  <TableCell>{formatarValidadeDias(cert.tempoValidadeDias)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(cert)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(cert.id)}
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
