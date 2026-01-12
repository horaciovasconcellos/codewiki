import { Runbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StepRiscosProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepRiscos({ data, updateData }: StepRiscosProps) {
  const updateRiscos = (field: string, value: string) => {
    console.log('[StepRiscos] Atualizando campo:', field, 'valor:', value);
    console.log('[StepRiscos] Riscos atuais:', data.riscosMitigacoes);
    
    const novosRiscos = {
      ...data.riscosMitigacoes!,
      [field]: value,
    };
    
    console.log('[StepRiscos] Novos riscos:', novosRiscos);
    
    updateData({
      riscosMitigacoes: novosRiscos,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Riscos e Mitigações</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Identifique riscos potenciais e defina ações preventivas e corretivas
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="principaisRiscos">Principais riscos</Label>
        <Textarea
          id="principaisRiscos"
          value={data.riscosMitigacoes?.principaisRiscos || ''}
          onChange={(e) => updateRiscos('principaisRiscos', e.target.value)}
          placeholder="Liste os principais riscos associados à execução deste procedimento"
          rows={3}
          className="resize-none overflow-auto"
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Riscos identificados e seu impacto potencial
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="acoesPreventivas">Ações preventivas</Label>
        <Textarea
          id="acoesPreventivas"
          value={data.riscosMitigacoes?.acoesPreventivas || ''}
          onChange={(e) => updateRiscos('acoesPreventivas', e.target.value)}
          placeholder="Descreva as ações preventivas para minimizar os riscos"
          rows={3}
          className="resize-none overflow-auto"
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Medidas preventivas para evitar problemas
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="acoesCorretivasRapidas">Ações corretivas rápidas</Label>
        <Textarea
          id="acoesCorretivasRapidas"
          value={data.riscosMitigacoes?.acoesCorretivasRapidas || ''}
          onChange={(e) => updateRiscos('acoesCorretivasRapidas', e.target.value)}
          placeholder="Defina ações corretivas rápidas em caso de falha ou problema durante a execução"
          rows={3}
          className="resize-none overflow-auto"
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Planos de contingência e rollback
        </p>
      </div>
    </div>
  );
}
