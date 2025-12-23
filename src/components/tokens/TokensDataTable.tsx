import { useState } from 'react';
import { TokenAcesso } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DotsThree, Eye, Pencil, Trash, Prohibit, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface TokensDataTableProps {
  tokens: TokenAcesso[];
  onView: (token: TokenAcesso) => void;
  onEdit: (token: TokenAcesso) => void;
  onDelete: (id: string) => void;
  onRevoke: (id: string, motivo: string) => void;
  onRenew?: (id: string) => void;
}

export function TokensDataTable({
  tokens,
  onView,
  onEdit,
  onDelete,
  onRevoke,
  onRenew,
}: TokensDataTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenAcesso | null>(null);
  const [revokeMotivo, setRevokeMotivo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Ativo: 'default',
      Pendente: 'secondary',
      Suspenso: 'outline',
      Revogado: 'destructive',
      Expirado: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getAmbienteBadge = (ambiente: string) => {
    const colors: Record<string, string> = {
      Desenvolvimento: 'bg-blue-100 text-blue-800 border-blue-200',
      Homologação: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Produção: 'bg-green-100 text-green-800 border-green-200',
    };
    return (
      <Badge variant="outline" className={colors[ambiente] || ''}>
        {ambiente}
      </Badge>
    );
  };

  const isExpired = (token: TokenAcesso) => {
    if (!token.dataExpiracao) return false;
    return new Date(token.dataExpiracao) < new Date();
  };

  const handleDelete = () => {
    if (selectedToken) {
      onDelete(selectedToken.id);
      toast.success('Token deletado com sucesso');
      setDeleteDialogOpen(false);
      setSelectedToken(null);
    }
  };

  const handleRevoke = () => {
    if (!selectedToken || !revokeMotivo.trim()) {
      toast.error('Informe o motivo da revogação');
      return;
    }
    onRevoke(selectedToken.id, revokeMotivo);
    toast.success('Token revogado com sucesso');
    setRevokeDialogOpen(false);
    setSelectedToken(null);
    setRevokeMotivo('');
  };

  const handleRenew = (token: TokenAcesso) => {
    if (!token.permitirRegeneracao) {
      toast.error('Este token não permite regeneração');
      return;
    }
    if (onRenew) {
      onRenew(token.id);
      toast.success('Token renovado com sucesso');
    }
  };

  const filteredTokens = tokens.filter((token) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      token.nomeEntidade.toLowerCase().includes(searchLower) ||
      token.identificadorEntidade.toLowerCase().includes(searchLower) ||
      token.tipoEntidade.toLowerCase().includes(searchLower)
    );
  });

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Nenhum token cadastrado</p>
        <p className="text-sm mt-2">Clique em "Novo Token" para criar o primeiro token de acesso</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Busca */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nome, identificador ou tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredTokens.length} de {tokens.length} token(s)
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Ambiente</TableHead>
              <TableHead>Escopos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Acessos</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhum token encontrado com os critérios de busca
                </TableCell>
              </TableRow>
            ) : (
              filteredTokens.map((token) => (
                <TableRow
                  key={token.id}
                  className={isExpired(token) ? 'opacity-60' : ''}
                >
                  <TableCell className="font-medium">{token.nomeEntidade}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{token.tipoEntidade}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px]">
                    <div className="truncate" title="Token mascarado por segurança">
                      {'*'.repeat(Math.min(token.tokenHash.length, 40))}
                    </div>
                  </TableCell>
                  <TableCell>{getAmbienteBadge(token.ambiente)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {token.escopos.slice(0, 3).map((escopo) => (
                        <Badge key={escopo} variant="secondary" className="text-xs">
                          {escopo}
                        </Badge>
                      ))}
                      {token.escopos.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{token.escopos.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(token.status)}</TableCell>
                  <TableCell className="text-sm">
                    {token.dataExpiracao
                      ? formatarData(token.dataExpiracao)
                      : 'Sem expiração'}
                  </TableCell>
                  <TableCell className="text-center">{token.quantidadeAcessos}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <DotsThree className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView(token)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(token)}
                          disabled={token.status === 'Revogado'}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {token.permitirRegeneracao && token.status === 'Ativo' && (
                          <DropdownMenuItem onClick={() => handleRenew(token)}>
                            <ArrowsClockwise className="mr-2 h-4 w-4" />
                            Renovar
                          </DropdownMenuItem>
                        )}
                        {token.status === 'Ativo' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedToken(token);
                              setRevokeDialogOpen(true);
                            }}
                          >
                            <Prohibit className="mr-2 h-4 w-4" />
                            Revogar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedToken(token);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o token "{selectedToken?.nomeEntidade}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Revogação */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Token</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da revogação do token "{selectedToken?.nomeEntidade}":
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Motivo da revogação..."
              value={revokeMotivo}
              onChange={(e) => setRevokeMotivo(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRevokeMotivo('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
