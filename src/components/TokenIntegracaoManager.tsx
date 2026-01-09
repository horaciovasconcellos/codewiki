import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye, EyeSlash, Clock, Trash, Plus, Key } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface TokenIntegracao {
  id: string;
  sistema: 'Azure DevOps' | 'SysAid';
  token: string;
  tokenMasked: string;
  dataCriacao: string;
  dataExpiracao?: string;
  ultimoUso?: string;
  status: 'Ativo' | 'Expirado' | 'Revogado';
  descricao?: string;
}

interface TokenIntegracaoManagerProps {
  sistema: 'Azure DevOps' | 'SysAid';
  onTokenChange?: (token: string) => void;
}

export function TokenIntegracaoManager({ sistema, onTokenChange }: TokenIntegracaoManagerProps) {
  const [tokens, setTokens] = useState<TokenIntegracao[]>([]);
  const [novoToken, setNovoToken] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataExpiracao, setDataExpiracao] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Carregar tokens do localStorage
  useEffect(() => {
    const chave = `tokens-${sistema.toLowerCase().replace(/\s/g, '-')}`;
    const tokensArmazenados = localStorage.getItem(chave);
    if (tokensArmazenados) {
      setTokens(JSON.parse(tokensArmazenados));
    }
  }, [sistema]);

  // Salvar tokens no localStorage
  const salvarTokens = (novosTokens: TokenIntegracao[]) => {
    const chave = `tokens-${sistema.toLowerCase().replace(/\s/g, '-')}`;
    localStorage.setItem(chave, JSON.stringify(novosTokens));
    setTokens(novosTokens);
  };

  // Mascarar token para exibição
  const mascarToken = (token: string): string => {
    if (token.length <= 8) return '****';
    return `${token.substring(0, 4)}${'*'.repeat(token.length - 8)}${token.substring(token.length - 4)}`;
  };

  // Verificar se token está expirado
  const isExpirado = (token: TokenIntegracao): boolean => {
    if (!token.dataExpiracao) return false;
    return new Date(token.dataExpiracao) < new Date();
  };

  // Atualizar status dos tokens
  const atualizarStatus = () => {
    const tokensAtualizados = tokens.map(token => ({
      ...token,
      status: isExpirado(token) ? 'Expirado' as const : token.status
    }));
    if (JSON.stringify(tokensAtualizados) !== JSON.stringify(tokens)) {
      salvarTokens(tokensAtualizados);
    }
  };

  useEffect(() => {
    atualizarStatus();
    const interval = setInterval(atualizarStatus, 60000); // Verificar a cada minuto
    return () => clearInterval(interval);
  }, [tokens]);

  // Adicionar novo token
  const handleAdicionarToken = () => {
    if (!novoToken.trim()) {
      toast.error('Digite o token');
      return;
    }

    // Verificar se já existe um token ativo igual
    const tokenExistente = tokens.find(t => t.token === novoToken && t.status === 'Ativo');
    if (tokenExistente) {
      toast.error('Este token já está cadastrado como ativo');
      return;
    }

    const token: TokenIntegracao = {
      id: generateUUID(),
      sistema,
      token: novoToken,
      tokenMasked: mascarToken(novoToken),
      dataCriacao: new Date().toISOString(),
      dataExpiracao: dataExpiracao || undefined,
      status: 'Ativo',
      descricao: descricao || undefined
    };

    // Revogar tokens ativos anteriores automaticamente
    const tokensAtualizados = tokens.map(t => 
      t.status === 'Ativo' ? { ...t, status: 'Revogado' as const } : t
    );

    const novosTokens = [...tokensAtualizados, token];
    salvarTokens(novosTokens);

    // Notificar componente pai
    if (onTokenChange) {
      onTokenChange(novoToken);
    }

    toast.success(`Token do ${sistema} adicionado com sucesso!`);
    
    // Limpar formulário
    setNovoToken('');
    setDescricao('');
    setDataExpiracao('');
    setDialogOpen(false);
  };

  // Renovar token (estender expiração)
  const handleRenovarToken = (tokenId: string) => {
    const novaDataExpiracao = new Date();
    novaDataExpiracao.setFullYear(novaDataExpiracao.getFullYear() + 1);

    const tokensAtualizados = tokens.map(t =>
      t.id === tokenId
        ? {
            ...t,
            dataExpiracao: novaDataExpiracao.toISOString(),
            status: 'Ativo' as const
          }
        : t
    );

    salvarTokens(tokensAtualizados);
    toast.success('Token renovado! Validade estendida por +1 ano.');
  };

  // Revogar token
  const handleRevogarToken = (tokenId: string) => {
    const tokensAtualizados = tokens.map(t =>
      t.id === tokenId ? { ...t, status: 'Revogado' as const } : t
    );

    salvarTokens(tokensAtualizados);
    toast.success('Token revogado');
  };

  // Excluir token
  const handleExcluirToken = (tokenId: string) => {
    const tokensAtualizados = tokens.filter(t => t.id !== tokenId);
    salvarTokens(tokensAtualizados);
    toast.success('Token excluído');
  };

  // Ativar token (tornar o token principal)
  const handleAtivarToken = (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;

    // Revogar todos os outros ativos
    const tokensAtualizados = tokens.map(t =>
      t.id === tokenId
        ? { ...t, status: 'Ativo' as const }
        : t.status === 'Ativo'
        ? { ...t, status: 'Revogado' as const }
        : t
    );

    salvarTokens(tokensAtualizados);

    // Notificar componente pai
    if (onTokenChange) {
      onTokenChange(token.token);
    }

    toast.success('Token ativado como principal');
  };

  // Obter token ativo
  const tokenAtivo = tokens.find(t => t.status === 'Ativo');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key size={20} weight="duotone" />
              Tokens {sistema}
            </CardTitle>
            <CardDescription>
              Gerencie os tokens de acesso para integração com {sistema}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Novo Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Token - {sistema}</DialogTitle>
                <DialogDescription>
                  Configure um novo token de acesso para {sistema}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="novo-token">Token *</Label>
                  <Input
                    id="novo-token"
                    type="password"
                    placeholder="Cole o token aqui"
                    value={novoToken}
                    onChange={(e) => setNovoToken(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex: Token de produção, Token de homologação"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiracao">Data de Expiração (opcional)</Label>
                  <Input
                    id="expiracao"
                    type="date"
                    value={dataExpiracao}
                    onChange={(e) => setDataExpiracao(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionarToken}>
                  Adicionar Token
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum token cadastrado</p>
            <p className="text-sm mt-2">Clique em "Novo Token" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tokenAtivo && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Token Ativo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tokenAtivo.descricao || 'Token principal em uso'}
                    </p>
                  </div>
                  <Badge variant="default">Em Uso</Badge>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {showToken === token.id ? token.token : token.tokenMasked}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowToken(showToken === token.id ? null : token.id)}
                        >
                          {showToken === token.id ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{token.descricao || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(token.dataCriacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {token.dataExpiracao
                        ? new Date(token.dataExpiracao).toLocaleDateString('pt-BR')
                        : 'Sem expiração'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          token.status === 'Ativo'
                            ? 'default'
                            : token.status === 'Expirado'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {token.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {token.status !== 'Ativo' && token.status !== 'Expirado' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAtivarToken(token.id)}
                            title="Ativar este token"
                          >
                            <Key size={16} />
                          </Button>
                        )}
                        {token.status === 'Ativo' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenovarToken(token.id)}
                            title="Renovar validade (+1 ano)"
                          >
                            <Clock size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluirToken(token.id)}
                          title="Excluir token"
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
      </CardContent>
    </Card>
  );
}
