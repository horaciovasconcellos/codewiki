import { Runbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StepAutomacaoProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepAutomacao({ data, updateData }: StepAutomacaoProps) {
  const updateAutomacao = (field: string, value: string) => {
    updateData({
      execucaoAutomatizada: {
        ...data.execucaoAutomatizada!,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Execução Automatizada</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Informações sobre automação e scripts relacionados ao procedimento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scriptsRelacionados">Scripts relacionados</Label>
        <Textarea
          id="scriptsRelacionados"
          value={data.execucaoAutomatizada?.scriptsRelacionados || ''}
          onChange={(e) => updateAutomacao('scriptsRelacionados', e.target.value)}
          placeholder="Liste os scripts relacionados a este procedimento"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Scripts disponíveis para automação do procedimento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobsAssociados">Jobs associados (Scheduler, Cron, Pipelines DevOps)</Label>
        <Textarea
          id="jobsAssociados"
          value={data.execucaoAutomatizada?.jobsAssociados || ''}
          onChange={(e) => updateAutomacao('jobsAssociados', e.target.value)}
          placeholder="Descreva os jobs agendados (cron, scheduler, pipelines CI/CD, etc.)"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Jobs automatizados e configurações de agendamento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="urlLocalizacaoScripts">URL da Localização dos scripts</Label>
        <Textarea
          id="urlLocalizacaoScripts"
          value={data.execucaoAutomatizada?.urlLocalizacaoScripts || ''}
          onChange={(e) => updateAutomacao('urlLocalizacaoScripts', e.target.value)}
          placeholder="Informe URLs ou caminhos onde os scripts estão localizados (repositório Git, servidor, etc.)"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Localização física ou repositório dos scripts
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condicoesAutomacao">Condições para automação</Label>
        <Textarea
          id="condicoesAutomacao"
          value={data.execucaoAutomatizada?.condicoesAutomacao || ''}
          onChange={(e) => updateAutomacao('condicoesAutomacao', e.target.value)}
          placeholder="Descreva as condições e pré-requisitos para automação do procedimento"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Condições necessárias para execução automatizada
        </p>
      </div>
    </div>
  );
}
