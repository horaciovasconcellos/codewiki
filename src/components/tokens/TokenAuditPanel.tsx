import { TokenAcesso } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartLineUp, Key, ShieldCheck, Warning, Clock } from '@phosphor-icons/react';
import { formatarData } from '@/lib/utils';

interface TokenAuditPanelProps {
  tokens: TokenAcesso[];
}

export function TokenAuditPanel({ tokens }: TokenAuditPanelProps) {
  const tokensAtivos = tokens.filter(t => t.status === 'Ativo');
  const tokensRevogados = tokens.filter(t => t.status === 'Revogado');
  const tokensExpirados = tokens.filter(t => t.status === 'Expirado' || (t.dataExpiracao && new Date(t.dataExpiracao) < new Date()));
  const tokensSuspensos = tokens.filter(t => t.status === 'Suspenso');

  const totalAcessos = tokens.reduce((sum, token) => sum + token.quantidadeAcessos, 0);
  const tokensComMFA = tokens.filter(t => t.requerMFA).length;
  const tokensPorAmbiente = {
    'Produção': tokens.filter(t => t.ambiente === 'Produção').length,
    'Homologação': tokens.filter(t => t.ambiente === 'Homologação').length,
    'Desenvolvimento': tokens.filter(t => t.ambiente === 'Desenvolvimento').length,
  };

  const tokensComMaiorUso = [...tokens]
    .sort((a, b) => b.quantidadeAcessos - a.quantidadeAcessos)
    .slice(0, 10);

  const tokensRecentementeUsados = [...tokens]
    .filter(t => t.ultimoUso)
    .sort((a, b) => new Date(b.ultimoUso!).getTime() - new Date(a.ultimoUso!).getTime())
    .slice(0, 10);

  const tokensProximosDeExpirar = tokens
    .filter(t => {
      if (!t.dataExpiracao) return false;
      const dias = Math.ceil((new Date(t.dataExpiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return dias > 0 && dias <= 30;
    })
    .sort((a, b) => new Date(a.dataExpiracao!).getTime() - new Date(b.dataExpiracao!).getTime());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Key size={16} className="text-green-600" />
              Tokens Ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tokensAtivos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Warning size={16} className="text-red-600" />
              Revogados / Expirados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tokensRevogados.length + tokensExpirados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ChartLineUp size={16} className="text-blue-600" />
              Total de Acessos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAcessos.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-600" />
              Com MFA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tokensComMFA}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Visão geral do estado dos tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ativo</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-green-600 rounded" style={{ width: `${(tokensAtivos.length / tokens.length) * 100}px` }} />
                  <Badge variant="default">{tokensAtivos.length}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Revogado</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-red-600 rounded" style={{ width: `${(tokensRevogados.length / tokens.length) * 100}px` }} />
                  <Badge variant="destructive">{tokensRevogados.length}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expirado</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-orange-600 rounded" style={{ width: `${(tokensExpirados.length / tokens.length) * 100}px` }} />
                  <Badge variant="destructive">{tokensExpirados.length}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Suspenso</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-yellow-600 rounded" style={{ width: `${(tokensSuspensos.length / tokens.length) * 100}px` }} />
                  <Badge variant="outline">{tokensSuspensos.length}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Ambiente</CardTitle>
            <CardDescription>Tokens por ambiente de execução</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Produção</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-red-500 rounded" style={{ width: `${(tokensPorAmbiente['Produção'] / tokens.length) * 100}px` }} />
                  <Badge variant="default">{tokensPorAmbiente['Produção']}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Homologação</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-yellow-500 rounded" style={{ width: `${(tokensPorAmbiente['Homologação'] / tokens.length) * 100}px` }} />
                  <Badge variant="secondary">{tokensPorAmbiente['Homologação']}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Desenvolvimento</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${(tokensPorAmbiente['Desenvolvimento'] / tokens.length) * 100}px` }} />
                  <Badge variant="outline">{tokensPorAmbiente['Desenvolvimento']}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {tokensProximosDeExpirar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-orange-600" />
              Tokens Próximos de Expirar (30 dias)
            </CardTitle>
            <CardDescription>
              {tokensProximosDeExpirar.length} token(s) expirando em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Data Expiração</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokensProximosDeExpirar.map((token) => {
                    const diasRestantes = Math.ceil((new Date(token.dataExpiracao!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">{token.nomeEntidade}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{token.ambiente}</Badge>
                        </TableCell>
                        <TableCell>{formatarData(token.dataExpiracao!)}</TableCell>
                        <TableCell>
                          <Badge variant={diasRestantes <= 7 ? 'destructive' : 'secondary'}>
                            {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tokens Mais Utilizados</CardTitle>
            <CardDescription>Top 10 tokens por número de acessos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acessos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokensComMaiorUso.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">{token.nomeEntidade}</TableCell>
                      <TableCell>
                        <Badge variant={token.status === 'Ativo' ? 'default' : 'destructive'}>
                          {token.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {token.quantidadeAcessos.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimos tokens utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Último Uso</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokensRecentementeUsados.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">{token.nomeEntidade}</TableCell>
                      <TableCell>{token.ultimoUso ? formatarData(token.ultimoUso) : '-'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {token.origemUltimoAcesso || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
