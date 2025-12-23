import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash, PencilSimple, ArrowLeft, Check, Eye } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Certificacao {
  id: string;
  codigo: string;
  descricao: string;
  orgaoCertificador: string;
  urlDocumentacao: string;
}

interface CertificacoesDataTableProps {
  certificacoes: any[];
  onSave: (certificacoes: any[]) => void;
  onPrevious: () => void;
  onCancel: () => void;
}

export function CertificacoesDataTable({ 
  certificacoes: initialCertificacoes, 
  onSave, 
  onPrevious,
  onCancel 
}: CertificacoesDataTableProps) {
  const [certificacoes, setCertificacoes] = useState<Certificacao[]>(
    initialCertificacoes || []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCertificacao, setEditingCertificacao] = useState<Certificacao | null>(null);
  const [viewingCertificacao, setViewingCertificacao] = useState<Certificacao | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    orgaoCertificador: '',
    urlDocumentacao: ''
  });

  const handleOpenDialog = (certificacao?: Certificacao) => {
    if (certificacao) {
      setEditingCertificacao(certificacao);
      setFormData({
        codigo: certificacao.codigo,
        descricao: certificacao.descricao,
        orgaoCertificador: certificacao.orgaoCertificador,
        urlDocumentacao: certificacao.urlDocumentacao
      });
    } else {
      setEditingCertificacao(null);
      setFormData({
        codigo: '',
        descricao: '',
        orgaoCertificador: '',
        urlDocumentacao: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleView = (certificacao: Certificacao) => {
    setViewingCertificacao(certificacao);
    setIsViewDialogOpen(true);
  };

  const handleSaveCertificacao = () => {
    if (!formData.codigo.trim()) {
      toast.error('Código é obrigatório');
      return;
    }
    if (!formData.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    if (!formData.orgaoCertificador.trim()) {
      toast.error('Órgão Certificador é obrigatório');
      return;
    }

    if (editingCertificacao) {
      // Editar
      setCertificacoes(
        certificacoes.map((c) =>
          c.id === editingCertificacao.id
            ? { ...editingCertificacao, ...formData }
            : c
        )
      );
      toast.success('Certificação atualizada com sucesso');
    } else {
      // Criar
      const newCertificacao: Certificacao = {
        id: `cert-${Date.now()}`,
        ...formData
      };
      setCertificacoes([...certificacoes, newCertificacao]);
      toast.success('Certificação adicionada com sucesso');
    }

    setIsDialogOpen(false);
    setEditingCertificacao(null);
    setFormData({
      codigo: '',
      descricao: '',
      orgaoCertificador: '',
      urlDocumentacao: ''
    });
  };

  const handleDelete = (id: string) => {
    setCertificacoes(certificacoes.filter((c) => c.id !== id));
    toast.success('Certificação removida com sucesso');
  };

  const handleFinish = () => {
    onSave(certificacoes);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Certificações</CardTitle>
              <CardDescription>
                Adicione certificações relacionadas a esta habilidade
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              {certificacoes.length} {certificacoes.length === 1 ? 'Certificação' : 'Certificações'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Certificação
            </Button>
          </div>

          {certificacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma certificação adicionada</p>
              <p className="text-sm mt-2">Clique em "Nova Certificação" para começar</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Órgão Certificador</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificacoes.map((certificacao) => (
                    <TableRow key={certificacao.id}>
                      <TableCell className="font-mono">{certificacao.codigo}</TableCell>
                      <TableCell>{certificacao.descricao}</TableCell>
                      <TableCell>{certificacao.orgaoCertificador}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(certificacao)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(certificacao)}
                          >
                            <PencilSimple className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(certificacao.id)}
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleFinish}>
            <Check className="w-4 h-4 mr-2" />
            Concluir
          </Button>
        </div>
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCertificacao ? 'Editar Certificação' : 'Nova Certificação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da certificação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  placeholder="Ex: AWS-SAA"
                  maxLength={20}
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Até 20 caracteres alfanuméricos</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgao">Órgão Certificador *</Label>
                <Input
                  id="orgao"
                  placeholder="Ex: Amazon Web Services"
                  maxLength={30}
                  value={formData.orgaoCertificador}
                  onChange={(e) => setFormData({ ...formData, orgaoCertificador: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Até 30 caracteres</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: AWS Certified Solutions Architect - Associate"
                maxLength={70}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Até 70 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL da Documentação</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.urlDocumentacao}
                onChange={(e) => setFormData({ ...formData, urlDocumentacao: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Link para documentação oficial</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCertificacao}>
              {editingCertificacao ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Certificação</DialogTitle>
          </DialogHeader>
          {viewingCertificacao && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Código</Label>
                  <p className="font-mono font-medium">{viewingCertificacao.codigo}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Órgão Certificador</Label>
                  <p className="font-medium">{viewingCertificacao.orgaoCertificador}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Descrição</Label>
                <p>{viewingCertificacao.descricao}</p>
              </div>
              {viewingCertificacao.urlDocumentacao && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">URL da Documentação</Label>
                  <a
                    href={viewingCertificacao.urlDocumentacao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    {viewingCertificacao.urlDocumentacao}
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
