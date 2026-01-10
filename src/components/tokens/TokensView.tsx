import { useState } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { TokenAcesso } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TokensDataTable } from './TokensDataTable';
import { TokenForm } from './TokenForm';
import { TokenDetailsDialog } from './TokenDetailsDialog';
import { Button } from '@/components/ui/button';
import { Key, Plus } from '@phosphor-icons/react';
import { StatusToken, HistoricoTokenAcesso } from '@/lib/types';
import { generateUUID } from '@/utils/uuid';

export function TokensView() {
  const { logClick, logEvent, logError } = useLogging('tokens-view');
  const [tokens, setTokens] = useLocalStorage<TokenAcesso[]>('tokens-acesso', []);
  const [selectedToken, setSelectedToken] = useState<TokenAcesso | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editToken, setEditToken] = useState<TokenAcesso | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  const handleView = (token: TokenAcesso) => {
    setSelectedToken(token);
    setDetailsOpen(true);
  };

  const handleEdit = (token: TokenAcesso) => {
    setEditToken(token);
    setFormOpen(true);
  };

  const handleNewToken = () => {
    setEditToken(undefined);
    setFormOpen(true);
  };

  const handleTokenSave = (token: TokenAcesso) => {
    setTokens((current) => {
      const currentList = current || [];
      const existe = currentList.find((t) => t.id === token.id);
      if (existe) {
        return currentList.map((t) => (t.id === token.id ? token : t));
      }
      return [...currentList, token];
    });
    setFormOpen(false);
    setEditToken(undefined);
  };

  const handleTokenDelete = (id: string) => {
    setTokens((current) => {
      const currentList = current || [];
      return currentList.filter((t) => t.id !== id);
    });
  };

  const handleTokenRevoke = async (id: string, motivo: string) => {
    const user = { login: 'sistema' };
    const now = new Date().toISOString();

    setTokens((current) => {
      const currentList = current || [];
      return currentList.map((t) => {
        if (t.id === id) {
          const novaEntradaHistorico: HistoricoTokenAcesso = {
            id: generateUUID(),
            tokenId: id,
            tipoAcao: 'Revogação',
            descricao: `Token revogado - ${motivo}`,
            realizadoPor: user?.login || 'sistema',
            dataHora: now,
            dadosAnteriores: { status: t.status },
            dadosNovos: { status: 'Revogado' as StatusToken },
          };

          return {
            ...t,
            status: 'Revogado' as StatusToken,
            motivoRevogacao: motivo,
            ultimaAtualizacao: now,
            historico: [...(t.historico || []), novaEntradaHistorico],
          };
        }
        return t;
      });
    });
  };

  const handleTokenRenew = async (id: string) => {
    const user = { login: 'sistema' };
    const now = new Date().toISOString();

    setTokens((current) => {
      const currentList = current || [];
      return currentList.map((t) => {
        if (t.id === id && t.permitirRegeneracao) {
          const novaDataExpiracao = new Date();
          novaDataExpiracao.setFullYear(novaDataExpiracao.getFullYear() + 1);

          const novaEntradaHistorico: HistoricoTokenAcesso = {
            id: generateUUID(),
            tokenId: id,
            tipoAcao: 'Renovação',
            descricao: `Token renovado - Nova data de expiração: ${
              novaDataExpiracao.toISOString().split('T')[0]
            }`,
            realizadoPor: user?.login || 'sistema',
            dataHora: now,
            dadosAnteriores: { dataExpiracao: t.dataExpiracao },
            dadosNovos: { dataExpiracao: novaDataExpiracao.toISOString() },
          };

          return {
            ...t,
            dataExpiracao: novaDataExpiracao.toISOString(),
            status: 'Ativo' as StatusToken,
            ultimaAtualizacao: now,
            historico: [...(t.historico || []), novaEntradaHistorico],
          };
        }
        return t;
      });
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Key size={32} weight="duotone" className="text-primary" />
                Tokens de Acesso
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerenciamento de tokens para autenticação de usuários, aplicações e integrações
              </p>
            </div>
            <Button onClick={handleNewToken} size="lg">
              <Plus className="mr-2" size={20} />
              Novo Token
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Lista de Tokens</CardTitle>
              <CardDescription>{tokens.length} token(s) cadastrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <TokensDataTable
                tokens={tokens || []}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleTokenDelete}
                onRevoke={handleTokenRevoke}
                onRenew={handleTokenRenew}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <TokenDetailsDialog token={selectedToken} open={detailsOpen} onOpenChange={setDetailsOpen} />

      <TokenForm
        tokens={tokens || []}
        onSave={handleTokenSave}
        editToken={editToken}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
