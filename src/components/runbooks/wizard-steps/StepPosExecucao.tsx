import { Runbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StepPosExecucaoProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepPosExecucao({ data, updateData }: StepPosExecucaoProps) {
  const updatePosExecucao = (field: string, value: string) => {
    updateData({
      posExecucao: {
        ...data.posExecucao!,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pós-Execução</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Defina as validações e verificações necessárias após a execução
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validacoesObrigatorias">Validações obrigatórias</Label>
        <Textarea
          id="validacoesObrigatorias"
          value={data.posExecucao?.validacoesObrigatorias || ''}
          onChange={(e) => updatePosExecucao('validacoesObrigatorias', e.target.value)}
          placeholder="Liste as validações obrigatórias após a execução"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Verificações obrigatórias pós-execução
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="verificacaoLogs">Verificação de logs</Label>
        <Textarea
          id="verificacaoLogs"
          value={data.posExecucao?.verificacaoLogs || ''}
          onChange={(e) => updatePosExecucao('verificacaoLogs', e.target.value)}
          placeholder="Descreva quais logs devem ser verificados e o que observar"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Logs a serem verificados e padrões esperados
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="statusEsperadoAplicacao">Status esperado da aplicação</Label>
        <Textarea
          id="statusEsperadoAplicacao"
          value={data.posExecucao?.statusEsperadoAplicacao || ''}
          onChange={(e) => updatePosExecucao('statusEsperadoAplicacao', e.target.value)}
          placeholder="Descreva o estado esperado da aplicação após a execução"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Estado/status esperado do sistema após execução
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notificacoesNecessarias">Notificações Necessárias</Label>
        <Textarea
          id="notificacoesNecessarias"
          value={data.posExecucao?.notificacoesNecessarias || ''}
          onChange={(e) => updatePosExecucao('notificacoesNecessarias', e.target.value)}
          placeholder="Liste quem deve ser notificado e em quais situações"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Pessoas/equipes a serem notificadas e condições
        </p>
      </div>
    </div>
  );
}
