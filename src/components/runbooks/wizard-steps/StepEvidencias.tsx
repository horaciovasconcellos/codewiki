import { Runbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StepEvidenciasProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepEvidencias({ data, updateData }: StepEvidenciasProps) {
  const updateEvidencias = (field: string, value: string) => {
    updateData({
      evidencias: {
        ...data.evidencias!,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Evidências</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Defina quais evidências devem ser coletadas durante a execução
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="printsLogsNecessarios">Prints / Logs necessários</Label>
        <Textarea
          id="printsLogsNecessarios"
          value={data.evidencias?.printsLogsNecessarios || ''}
          onChange={(e) => updateEvidencias('printsLogsNecessarios', e.target.value)}
          placeholder="Descreva quais prints de tela e logs devem ser capturados como evidência"
          rows={3}
          className="resize-none overflow-auto"
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Screenshots e logs que devem ser salvos
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="arquivosGerados">Arquivos gerados</Label>
        <Textarea
          id="arquivosGerados"
          value={data.evidencias?.arquivosGerados || ''}
          onChange={(e) => updateEvidencias('arquivosGerados', e.target.value)}
          placeholder="Liste os arquivos de saída ou relatórios gerados pelo procedimento"
          rows={3}
          className="resize-none overflow-auto"
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Arquivos de output, relatórios e documentos gerados
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempoMedioExecucao">Tempo médio de execução</Label>
        <Textarea
          id="tempoMedioExecucao"
          value={data.evidencias?.tempoMedioExecucao || ''}
          onChange={(e) => updateEvidencias('tempoMedioExecucao', e.target.value)}
          placeholder="Informe o tempo médio de execução e variações esperadas (Ex: 15-20 minutos em ambiente de produção)"
          rows={3}
          className="resize-none overflow-auto"
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Duração estimada e tempo médio de execução
        </p>
      </div>
    </div>
  );
}
