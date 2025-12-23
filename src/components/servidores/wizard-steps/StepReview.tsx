import { Servidor, AplicacaoServidor, Aplicacao, StatusAplicacaoServidor } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from '@phosphor-icons/react';

interface StepReviewProps {
  servidor: Servidor;
  aplicacoesServidor: AplicacaoServidor[];
  aplicacoes: Aplicacao[];
}

export function StepReview({ servidor, aplicacoesServidor, aplicacoes }: StepReviewProps) {
  const getStatusBadgeClass = (status: StatusAplicacaoServidor) => {
    switch (status) {
      case 'Planejado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Produção':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Aposentado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revisão dos Dados</CardTitle>
          <CardDescription>
            Revise todas as informações antes de salvar
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sigla</p>
              <p className="font-medium">{servidor.sigla}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hostname</p>
              <p className="font-medium">{servidor.hostname}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{servidor.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ambiente</p>
              <p className="font-medium">{servidor.ambiente}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finalidade</p>
              <p className="font-medium">{servidor.finalidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={servidor.status === 'Ativo' ? 'default' : 'secondary'}>
                {servidor.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Provedor</p>
              <p className="font-medium">{servidor.provedor}</p>
            </div>
            {servidor.datacenterRegiao && (
              <div>
                <p className="text-sm text-muted-foreground">Datacenter/Região</p>
                <p className="font-medium">{servidor.datacenterRegiao}</p>
              </div>
            )}
            {servidor.zonaAvailability && (
              <div>
                <p className="text-sm text-muted-foreground">Zona de Disponibilidade</p>
                <p className="font-medium">{servidor.zonaAvailability}</p>
              </div>
            )}
            {servidor.clusterHost && (
              <div>
                <p className="text-sm text-muted-foreground">Cluster/Host</p>
                <p className="font-medium">{servidor.clusterHost}</p>
              </div>
            )}
            {servidor.virtualizador && (
              <div>
                <p className="text-sm text-muted-foreground">Virtualizador</p>
                <p className="font-medium">{servidor.virtualizador}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sistema Operacional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sistema Operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sistema Operacional</p>
              <p className="font-medium">{servidor.sistemaOperacional}</p>
            </div>
            {servidor.distribuicaoVersao && (
              <div>
                <p className="text-sm text-muted-foreground">Distribuição/Versão</p>
                <p className="font-medium">{servidor.distribuicaoVersao}</p>
              </div>
            )}
            {servidor.arquitetura && (
              <div>
                <p className="text-sm text-muted-foreground">Arquitetura</p>
                <p className="font-medium">{servidor.arquitetura}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operação e Monitoramento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operação e Monitoramento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ferramenta de Monitoramento</p>
              <p className="font-medium">{servidor.ferramentaMonitoramento || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Política de Backup</p>
              <div className="space-y-1 mt-1">
                <div className="flex items-center gap-2">
                  {servidor.backupDiario ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Backup Diário</span>
                </div>
                <div className="flex items-center gap-2">
                  {servidor.backupSemanal ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Backup Semanal</span>
                </div>
                <div className="flex items-center gap-2">
                  {servidor.backupMensal ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Backup Mensal</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aplicações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aplicações do Servidor</CardTitle>
          <CardDescription>
            {aplicacoesServidor.length} aplicação(ões) associada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aplicacoesServidor.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma aplicação associada
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla</TableHead>
                    <TableHead>Nome da Aplicação</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Término</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aplicacoesServidor.map((app, index) => (
                    <TableRow key={app.id || index}>
                      <TableCell className="font-medium">
                        {app.aplicacaoSigla}
                      </TableCell>
                      <TableCell>{app.aplicacaoDescricao}</TableCell>
                      <TableCell>
                        {new Date(app.dataInicio).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {app.dataTermino
                          ? new Date(app.dataTermino).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
