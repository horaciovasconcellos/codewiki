import { Runbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StepProcedimentoProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepProcedimento({ data, updateData }: StepProcedimentoProps) {
  const updateProcedimento = (field: string, value: string) => {
    updateData({
      procedimentoOperacional: {
        ...data.procedimentoOperacional!,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Procedimento Operacional</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Descreva os passos detalhados para execução do procedimento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comandos">Comandos</Label>
        <Textarea
          id="comandos"
          value={data.procedimentoOperacional?.comandos || ''}
          onChange={(e) => updateProcedimento('comandos', e.target.value)}
          placeholder="Liste os comandos a serem executados, na ordem correta"
          rows={8}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Comandos a serem executados, passo a passo
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pontosAtencao">Pontos de atenção</Label>
        <Textarea
          id="pontosAtencao"
          value={data.procedimentoOperacional?.pontosAtencao || ''}
          onChange={(e) => updateProcedimento('pontosAtencao', e.target.value)}
          placeholder="Descreva pontos críticos que requerem atenção especial"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Alertas e cuidados durante a execução
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checksIntermediarios">Checks intermediários</Label>
        <Textarea
          id="checksIntermediarios"
          value={data.procedimentoOperacional?.checksIntermediarios || ''}
          onChange={(e) => updateProcedimento('checksIntermediarios', e.target.value)}
          placeholder="Verificações a serem feitas durante a execução"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Validações intermediárias durante o procedimento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteriosSucesso">Critérios de sucesso</Label>
        <Textarea
          id="criteriosSucesso"
          value={data.procedimentoOperacional?.criteriosSucesso || ''}
          onChange={(e) => updateProcedimento('criteriosSucesso', e.target.value)}
          placeholder="Como identificar que o procedimento foi executado com sucesso"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Indicadores de sucesso da execução
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteriosFalha">Critérios de falha</Label>
        <Textarea
          id="criteriosFalha"
          value={data.procedimentoOperacional?.criteriosFalha || ''}
          onChange={(e) => updateProcedimento('criteriosFalha', e.target.value)}
          placeholder="Como identificar falhas e o que fazer em caso de erro"
          rows={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Indicadores de falha e ações corretivas
        </p>
      </div>
    </div>
  );
}
