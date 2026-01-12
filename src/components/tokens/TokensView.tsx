import { useState } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { useTokens } from '@/hooks/use-tokens';
import { TokenAcesso } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TokensDataTable } from './TokensDataTable';
import { TokenForm } from './TokenForm';
import { TokenDetailsDialog } from './TokenDetailsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Spinner } from '@phosphor-icons/react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TokensView() {
  const { logClick, logEvent, logError } = useLogging('tokens-view');
  const { tokens, loading, error, deleteToken, revokeToken, refetch } = useTokens();
  const [selectedToken, setSelectedToken] = useState<TokenAcesso | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editToken, setEditToken] = useState<TokenAcesso | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const handleView = (token: TokenAcesso) => {
    setSelectedToken(token);
    setDetailsOpen(true);
  };

  const handleEdit = (token: TokenAcesso) => {
    setEditToken(token);
    setShowForm(true);
  };

  const handleNewToken = () => {
    setEditToken(undefined);
    setShowForm(true);
  };

  const handleTokenSave = async () => {
    // Recarregar tokens após salvar
    await refetch();
    setShowForm(false);
    setEditToken(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditToken(undefined);
  };

  const handleTokenDelete = async (id: string) => {
    try {
      await deleteToken(id);
      logEvent('token-deleted', { tokenId: id });
    } catch (error) {
      logError('Erro ao excluir token', error instanceof Error ? error.message : 'Erro desconhecido');
      alert('Erro ao excluir token. Por favor, tente novamente.');
    }
  };

  const handleTokenRevoke = async (id: string, motivo: string) => {
    try {
      await revokeToken(id);
      logEvent('token-revoked', { tokenId: id, motivo });
    } catch (error) {
      logError('Erro ao revogar token', error instanceof Error ? error.message : 'Erro desconhecido');
      alert('Erro ao revogar token. Por favor, tente novamente.');
    }
  };

  const handleTokenRenew = async (id: string, novoToken: string) => {
    try {
      const novaDataExpiracao = new Date();
      novaDataExpiracao.setDate(novaDataExpiracao.getDate() + 180); // 180 dias
      
      const { regenerateToken } = await import('@/hooks/use-tokens');
      // Este método será chamado pelo TokensDataTable via prop
      logEvent('token-renewed', { tokenId: id });
    } catch (error) {
      logError('Erro ao renovar token', error instanceof Error ? error.message : 'Erro desconhecido');
      alert('Erro ao renovar token. Por favor, tente novamente.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Tokens de Acesso</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de tokens para autenticação de usuários, aplicações e integrações
            </p>
          </div>
        </div>

        <Separator />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : showForm ? (
          <TokenForm
            onSave={handleTokenSave}
            editToken={editToken}
            onCancel={handleCancel}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Tokens</CardTitle>
                  <CardDescription>
                    {tokens.length} token(s) cadastrado(s)
                  </CardDescription>
                </div>
                <Button onClick={handleNewToken}>
                  <Plus className="mr-2" size={16} />
                  Novo Token
                </Button>
              </div>
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
        )}

        <TokenDetailsDialog token={selectedToken} open={detailsOpen} onOpenChange={setDetailsOpen} />
      </div>
    </div>
  );
}
