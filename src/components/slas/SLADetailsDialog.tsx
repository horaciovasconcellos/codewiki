import { SLA } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X } from '@phosphor-icons/react';

interface SLADetailsDialogProps {
  sla: SLA;
  onClose: () => void;
}

export function SLADetailsDialog({ sla, onClose }: SLADetailsDialogProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do SLA</DialogTitle>
          <DialogDescription>
            Informações completas do SLA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sigla</p>
                <p className="font-medium">{sla.sigla}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={sla.status === 'Ativo' ? 'default' : 'secondary'}>
                  {sla.status}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{sla.descricao}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de SLA</p>
                <p className="font-medium">{sla.tipoSLA}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Início</p>
                <p className="font-medium">{formatDate(sla.dataInicio)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Término</p>
                <p className="font-medium">{formatDate(sla.dataTermino)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {sla.suporteAtendimento && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Suporte / Atendimento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Resposta</p>
                  <p className="font-medium">{sla.suporteAtendimento.tempoResposta}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Solução</p>
                  <p className="font-medium">{sla.suporteAtendimento.tempoSolucao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horário Inicial</p>
                  <p className="font-medium">{sla.suporteAtendimento.horaInicialAtendimento}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horário de Término</p>
                  <p className="font-medium">{sla.suporteAtendimento.horaTerminoAtendimento}</p>
                </div>
              </div>
            </div>
          )}

          {sla.seguranca && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Segurança</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {sla.seguranca.patchingMensalObrigatorio ? (
                    <Check className="text-green-600" />
                  ) : (
                    <X className="text-red-600" />
                  )}
                  <span>Patching Mensal Obrigatório</span>
                </div>
                <div className="flex items-center gap-2">
                  {sla.seguranca.mfaParaTodosAcessos ? (
                    <Check className="text-green-600" />
                  ) : (
                    <X className="text-red-600" />
                  )}
                  <span>MFA para Todos os Acessos</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo para Correção de Vulnerabilidade Critical</p>
                  <p className="font-medium">{sla.seguranca.tempoCorrecaoVulnerabilidadeCritical}</p>
                </div>
              </div>
            </div>
          )}

          {sla.capacidade && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Capacidade</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">% CPU Máxima</p>
                  <p className="font-medium">{sla.capacidade.percentualCPUMaxima}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacidade de Storage Livre</p>
                  <p className="font-medium">{sla.capacidade.capacidadeStorageLivre} GB</p>
                </div>
                <div className="flex items-center gap-2">
                  {sla.capacidade.escalabilidadeAutomatica ? (
                    <Check className="text-green-600" />
                  ) : (
                    <X className="text-red-600" />
                  )}
                  <span>Escalabilidade Automática</span>
                </div>
              </div>
            </div>
          )}

          {sla.disponibilidade && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Disponibilidade</h3>
              <div>
                <p className="text-sm text-muted-foreground">Percentual de Uptime</p>
                <p className="font-medium">{sla.disponibilidade.percentualUptime}%</p>
              </div>
            </div>
          )}

          {sla.performance && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Latência Máxima</p>
                  <p className="font-medium">{sla.performance.latenciaMaxima} ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Throughput</p>
                  <p className="font-medium">{sla.performance.throughput} req/s</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IOPS de Storage</p>
                  <p className="font-medium">{sla.performance.iopsStorage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Erros por Minuto</p>
                  <p className="font-medium">{sla.performance.errosPorMinuto}</p>
                </div>
              </div>
            </div>
          )}

          {sla.prioridade && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Prioridade / Severidade</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">P1 (Crítico)</p>
                  <p className="font-medium">{sla.prioridade.p1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">P2 (Alto)</p>
                  <p className="font-medium">{sla.prioridade.p2}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">P3 (Médio)</p>
                  <p className="font-medium">{sla.prioridade.p3}</p>
                </div>
              </div>
            </div>
          )}

          {sla.apoio && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Apoio</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">SLA da Empresa</p>
                  <p className="font-medium">{sla.apoio.slaEmpresa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SLA de Fornecedores</p>
                  <p className="font-medium">{sla.apoio.slaFornecedores}</p>
                </div>
              </div>
            </div>
          )}

          {sla.operacional && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Operacional</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Infraestrutura</p>
                  <p className="font-medium">{sla.operacional.infraestrutura}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">{sla.operacional.servico}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rede</p>
                  <p className="font-medium">{sla.operacional.rede}</p>
                </div>
              </div>
            </div>
          )}

          {sla.componentes && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Componentes</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Banco de Dados</p>
                  <p className="font-medium">{sla.componentes.slaBancoDados}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rede</p>
                  <p className="font-medium">{sla.componentes.slaRede}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="font-medium">{sla.componentes.slaStorage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Microserviço</p>
                  <p className="font-medium">{sla.componentes.slaMicroservico}</p>
                </div>
              </div>
            </div>
          )}

          {sla.usuario && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Usuário</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Suporte Prioritário para Área Crítica</p>
                  <p className="font-medium">{sla.usuario.suportePrioritarioAreaCritica}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atendimento Especial para Usuários-Chave</p>
                  <p className="font-medium">{sla.usuario.atendimentoEspecialUsuariosChave}</p>
                </div>
              </div>
            </div>
          )}

          {sla.servico && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Serviço</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibilidade de Sistema</p>
                  <p className="font-medium">{sla.servico.disponibilidadeSistema}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Backup Diário</p>
                  <p className="font-medium">{sla.servico.backupDiario}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Resposta de APIs</p>
                  <p className="font-medium">{sla.servico.tempoRespostaAPIs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RPO/RTO de DR</p>
                  <p className="font-medium">{sla.servico.rpoRtoDR}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clonagem</p>
                  <p className="font-medium">{sla.servico.clonagem}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Alvo de Clonagem</p>
                  <p className="font-medium">{formatDate(sla.servico.dataAlvoClonagem)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
