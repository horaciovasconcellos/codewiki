import { TokenAcesso } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatarData } from '@/lib/utils';
import { Key, ShieldCheck, Clock, Globe, ChartLineUp } from '@phosphor-icons/react';
import { TokenHistoryPanel } from './TokenHistoryPanel';

interface TokenDetailsDialogProps {
  token: TokenAcesso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokenDetailsDialog({ token, open, onOpenChange }: TokenDetailsDialogProps) {
  if (!token) return null;

  const isExpired = token.dataExpiracao && new Date(token.dataExpiracao) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="text-primary" />
            Detalhes do Token
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o token de acesso
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-6 py-4">
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Key size={16} />
              Identificação
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID do Token</p>
                <p className="font-mono text-sm mt-1">{token.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hash</p>
                <p className="font-mono text-sm mt-1 truncate">{token.tokenHash}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Entidade</p>
                <p className="font-medium mt-1">{token.tipoEntidade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Identificador</p>
                <p className="font-medium mt-1">{token.identificadorEntidade}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Nome / Descrição</p>
                <p className="font-medium mt-1">{token.nomeEntidade}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck size={16} />
              Autorização
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Escopos / Operações Permitidas</p>
                <div className="flex flex-wrap gap-2">
                  {token.escopos.map(escopo => (
                    <Badge key={escopo} variant="secondary">
                      {escopo}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ambiente</p>
                <Badge variant="outline" className="mt-1">{token.ambiente}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant={token.status === 'Ativo' ? 'default' : 'destructive'} 
                  className="mt-1"
                >
                  {token.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock size={16} />
              Validade
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de Geração</p>
                <p className="font-medium mt-1">{formatarData(token.dataGeracao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Início da Validade</p>
                <p className="font-medium mt-1">{formatarData(token.dataInicioValidade)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Expiração</p>
                <p className={`font-medium mt-1 ${isExpired ? 'text-red-600' : ''}`}>
                  {token.dataExpiracao ? formatarData(token.dataExpiracao) : 'Sem expiração'}
                  {isExpired && ' (EXPIRADO)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Temporário</p>
                <Badge variant={token.tokenTemporario ? 'secondary' : 'outline'} className="mt-1">
                  {token.tokenTemporario ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              {token.motivoExpiracao && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Motivo / Observação</p>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{token.motivoExpiracao}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck size={16} />
              Segurança
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Permitir Regeneração</p>
                <Badge variant={token.permitirRegeneracao ? 'default' : 'outline'} className="mt-1">
                  {token.permitirRegeneracao ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requer MFA</p>
                <Badge variant={token.requerMFA ? 'default' : 'outline'} className="mt-1">
                  {token.requerMFA ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rate Limit</p>
                <p className="font-medium mt-1">{token.rateLimitPorHora} chamadas/hora</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Origens Permitidas</p>
                {token.origensPermitidas.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {token.origensPermitidas.map((ip, idx) => (
                      <code key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                        {ip}
                      </code>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm mt-1 text-muted-foreground">Todas as origens</p>
                )}
              </div>
            </div>
          </div>

          {token.status === 'Revogado' && token.motivoRevogacao && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 text-red-600">Motivo da Revogação</h3>
                <p className="text-sm p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                  {token.motivoRevogacao}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ChartLineUp size={16} />
              Auditoria
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Criado Por</p>
                <p className="font-medium mt-1">{token.criadoPor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium mt-1">{formatarData(token.dataHoraCriacao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Atualização</p>
                <p className="font-medium mt-1">{formatarData(token.ultimaAtualizacao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Uso</p>
                <p className="font-medium mt-1">
                  {token.ultimoUso ? formatarData(token.ultimoUso) : 'Nunca utilizado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade de Acessos</p>
                <p className="font-bold mt-1 text-lg">{token.quantidadeAcessos.toLocaleString()}</p>
              </div>
              {token.origemUltimoAcesso && (
                <div>
                  <p className="text-sm text-muted-foreground">Origem do Último Acesso</p>
                  <p className="font-mono text-sm mt-1">{token.origemUltimoAcesso}</p>
                </div>
              )}
              {token.localizacaoUltimoAcesso && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe size={14} />
                    Localização do Último Acesso
                  </p>
                  <p className="font-medium mt-1">{token.localizacaoUltimoAcesso}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="py-4">
          <TokenHistoryPanel historico={token.historico || []} />
        </TabsContent>
      </Tabs>
      </DialogContent>
    </Dialog>
  );
}
