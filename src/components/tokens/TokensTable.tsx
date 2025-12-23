import { useState } from 'react';
import { TokenAcesso } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Prohibit, ArrowsClockwise, Info, Clock } from '@phosphor-icons/react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TokensTableProps {
  tokens: TokenAcesso[];
  onTokenSave: (token: TokenAcesso) => void;
  onTokenDelete: (id: string) => void;
  onTokenRevoke: (id: string, motivo: string) => void;
  onTokenRenew?: (id: string) => void;
  onTokenSelect: (token: TokenAcesso | null) => void;
}

export function TokensTable({ tokens, onTokenSave, onTokenDelete, onTokenRevoke, onTokenRenew, onTokenSelect }: TokensTableProps) {
  const [revokeMotivo, setRevokeMotivo] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Ativo': 'default',
      'Pendente': 'secondary',
      'Suspenso': 'outline',
      'Revogado': 'destructive',
      'Expirado': 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const handleRevoke = () => {
    if (!selectedTokenId || !revokeMotivo.trim()) {
      toast.error('Informe o motivo da revogação');
      return;
    }
    onTokenRevoke(selectedTokenId, revokeMotivo);
    setRevokeMotivo('');
    setSelectedTokenId(null);
    toast.success('Token revogado com sucesso');
  };

  const handleRegenerate = (token: TokenAcesso) => {
    if (!token.permitirRegeneracao) {
      toast.error('Este token não permite regeneração');
      return;
    }

    const newToken: TokenAcesso = {
      ...token,
      tokenHash: `hash_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      dataGeracao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      quantidadeAcessos: 0,
      ultimoUso: undefined,
      origemUltimoAcesso: undefined,
    };

    onTokenSave(newToken);
    toast.success('Token regenerado com sucesso. Um novo hash foi criado.');
  };

  const isExpired = (token: TokenAcesso) => {
    if (!token.dataExpiracao) return false;
    return new Date(token.dataExpiracao) < new Date();
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Nome Entidade', 'Tipo', 'Identificador', 'Ambiente', 'Status',
      'Escopos', 'Data Geração', 'Expira em', 'Último Uso', 'Total Acessos'
    ];

    const rows = tokens.map(token => [
      token.id,
      token.nomeEntidade,
      token.tipoEntidade,
      token.identificadorEntidade,
      token.ambiente,
      token.status,
      token.escopos.join('; '),
      token.dataGeracao,
      token.dataExpiracao || 'N/A',
      token.ultimoUso || 'Nunca',
      token.quantidadeAcessos.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokens-acesso-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exportação concluída');
  };

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum token cadastrado.</p>
        <p className="text-sm mt-2">Clique em "Gerar Novo Token" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportToCSV}>
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Ambiente</TableHead>
              <TableHead>Escopos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Último Uso</TableHead>
              <TableHead>Acessos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id} className={isExpired(token) ? 'opacity-60' : ''}>
                <TableCell className="font-medium">{token.nomeEntidade}</TableCell>
                <TableCell>{token.tipoEntidade}</TableCell>
                <TableCell className="font-mono text-sm">{token.identificadorEntidade}</TableCell>
                <TableCell>
                  <Badge variant="outline">{token.ambiente}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {token.escopos.slice(0, 2).map(escopo => (
                      <Badge key={escopo} variant="secondary" className="text-xs">
                        {escopo}
                      </Badge>
                    ))}
                    {token.escopos.length > 2 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs cursor-help">
                              +{token.escopos.length - 2}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {token.escopos.slice(2).map(escopo => (
                                <div key={escopo}>{escopo}</div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(token.status)}</TableCell>
                <TableCell className="text-sm">
                  {token.dataExpiracao ? formatarData(token.dataExpiracao) : 'Sem expiração'}
                </TableCell>
                <TableCell className="text-sm">
                  {token.ultimoUso ? formatarData(token.ultimoUso) : 'Nunca'}
                </TableCell>
                <TableCell className="text-center">{token.quantidadeAcessos}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onTokenSelect(token)}
                          >
                            <Info />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {token.status === 'Ativo' && token.permitirRegeneracao && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRegenerate(token)}
                            >
                              <ArrowsClockwise />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Regenerar token (novo hash)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {token.status === 'Ativo' && token.permitirRegeneracao && onTokenRenew && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                onTokenRenew(token.id);
                                toast.success('Token renovado! Validade estendida por mais 1 ano.');
                              }}
                            >
                              <Clock />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Renovar validade (+1 ano)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {token.status === 'Ativo' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedTokenId(token.id)}
                          >
                            <Prohibit />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revogar Token</DialogTitle>
                            <DialogDescription>
                              Você está prestes a revogar o token de "{token.nomeEntidade}". Esta ação não pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="motivo-revogacao">Motivo da Revogação *</Label>
                              <Textarea
                                id="motivo-revogacao"
                                value={revokeMotivo}
                                onChange={(e) => setRevokeMotivo(e.target.value)}
                                placeholder="Descreva o motivo da revogação..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedTokenId(null)}>
                              Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleRevoke}>
                              Revogar Token
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <Trash />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o token de "{token.nomeEntidade}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              onTokenDelete(token.id);
                              toast.success('Token excluído com sucesso');
                            }}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
