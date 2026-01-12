import { Runbook } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ListChecks, Play, CheckCircle, Robot, Camera, Warning } from '@phosphor-icons/react';

interface StepReviewProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

const tipoColors: Record<string, string> = {
  'Procedimento de Rotina': 'bg-blue-500/10 text-blue-700 border-blue-300',
  'Contingência': 'bg-red-500/10 text-red-700 border-red-300',
  'Tratamento de Incidente': 'bg-orange-500/10 text-orange-700 border-orange-300',
  'Startup / Shutdown': 'bg-purple-500/10 text-purple-700 border-purple-300',
  'Deploy': 'bg-green-500/10 text-green-700 border-green-300',
  'Backup': 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
  'Restore': 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
  'Operação Programada': 'bg-pink-500/10 text-pink-700 border-pink-300',
};

function ReviewSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  if (!value || value.trim() === '') {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm italic text-muted-foreground">Não informado</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <div className="bg-white border rounded p-3">
        <pre className="text-sm whitespace-pre-wrap font-mono">{value}</pre>
      </div>
    </div>
  );
}

export function StepReview({ data }: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Revisão do Runbook</h3>
        <p className="text-sm text-muted-foreground">
          Revise todas as informações antes de salvar
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="font-mono text-base px-3 py-1">
              {data.sigla || 'N/A'}
            </Badge>
            {data.tipoRunbook && (
              <Badge className={tipoColors[data.tipoRunbook] || ''}>
                {data.tipoRunbook}
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl">{data.descricaoResumida || 'Sem descrição'}</CardTitle>
          <CardDescription>{data.finalidade || 'Sem finalidade definida'}</CardDescription>
        </CardHeader>
      </Card>

      <Separator />

      <ReviewSection icon={ListChecks} title="Pré-Requisitos">
        <ReviewField label="Acessos Necessários" value={data.preRequisitos?.acessosNecessarios || ''} />
        <ReviewField label="Validações antes de iniciar" value={data.preRequisitos?.validacoesAntesIniciar || ''} />
        <ReviewField label="Ferramentas necessárias" value={data.preRequisitos?.ferramentasNecessarias || ''} />
      </ReviewSection>

      <ReviewSection icon={Play} title="Procedimento Operacional">
        <ReviewField label="Comandos" value={data.procedimentoOperacional?.comandos || ''} />
        <ReviewField label="Pontos de atenção" value={data.procedimentoOperacional?.pontosAtencao || ''} />
        <ReviewField label="Checks intermediários" value={data.procedimentoOperacional?.checksIntermediarios || ''} />
        <ReviewField label="Critérios de sucesso" value={data.procedimentoOperacional?.criteriosSucesso || ''} />
        <ReviewField label="Critérios de falha" value={data.procedimentoOperacional?.criteriosFalha || ''} />
      </ReviewSection>

      <ReviewSection icon={CheckCircle} title="Pós-Execução">
        <ReviewField label="Validações obrigatórias" value={data.posExecucao?.validacoesObrigatorias || ''} />
        <ReviewField label="Verificação de logs" value={data.posExecucao?.verificacaoLogs || ''} />
        <ReviewField label="Status esperado da aplicação" value={data.posExecucao?.statusEsperadoAplicacao || ''} />
        <ReviewField label="Notificações Necessárias" value={data.posExecucao?.notificacoesNecessarias || ''} />
      </ReviewSection>

      <ReviewSection icon={Robot} title="Execução Automatizada">
        <ReviewField label="Scripts relacionados" value={data.execucaoAutomatizada?.scriptsRelacionados || ''} />
        <ReviewField label="Jobs associados" value={data.execucaoAutomatizada?.jobsAssociados || ''} />
        <ReviewField label="URL da Localização dos scripts" value={data.execucaoAutomatizada?.urlLocalizacaoScripts || ''} />
        <ReviewField label="Condições para automação" value={data.execucaoAutomatizada?.condicoesAutomacao || ''} />
      </ReviewSection>

      <ReviewSection icon={Camera} title="Evidências">
        <ReviewField label="Prints / Logs necessários" value={data.evidencias?.printsLogsNecessarios || ''} />
        <ReviewField label="Arquivos gerados" value={data.evidencias?.arquivosGerados || ''} />
        <ReviewField label="Tempo médio de execução" value={data.evidencias?.tempoMedioExecucao || ''} />
      </ReviewSection>

      <ReviewSection icon={Warning} title="Riscos e Mitigações">
        <ReviewField label="Principais riscos" value={data.riscosMitigacoes?.principaisRiscos || ''} />
        <ReviewField label="Ações preventivas" value={data.riscosMitigacoes?.acoesPreventivas || ''} />
        <ReviewField label="Ações corretivas rápidas" value={data.riscosMitigacoes?.acoesCorretivasRapidas || ''} />
      </ReviewSection>
    </div>
  );
}
