import { Runbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StepPreRequisitosProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepPreRequisitos({ data, updateData }: StepPreRequisitosProps) {
  const updatePreRequisitos = (field: string, value: string) => {
    updateData({
      preRequisitos: {
        ...data.preRequisitos!,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pré-Requisitos</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Defina os requisitos necessários antes de iniciar a execução do runbook
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="acessosNecessarios">Acessos Necessários</Label>
        <Textarea
          id="acessosNecessarios"
          value={data.preRequisitos?.acessosNecessarios || ''}
          onChange={(e) => updatePreRequisitos('acessosNecessarios', e.target.value)}
          placeholder="Liste os acessos necessários para execução (VPN, SSH, credenciais, etc.)"
          rows={3}
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Liste todos os acessos necessários, um por linha
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="validacoesAntesIniciar">Validações antes de iniciar</Label>
        <Textarea
          id="validacoesAntesIniciar"
          value={data.preRequisitos?.validacoesAntesIniciar || ''}
          onChange={(e) => updatePreRequisitos('validacoesAntesIniciar', e.target.value)}
          placeholder="Liste as validações que devem ser feitas antes de iniciar o procedimento"
          rows={3}
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Validações e verificações prévias necessárias
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ferramentasNecessarias">Ferramentas necessárias (SSH, console, browser, scripts)</Label>
        <Textarea
          id="ferramentasNecessarias"
          value={data.preRequisitos?.ferramentasNecessarias || ''}
          onChange={(e) => updatePreRequisitos('ferramentasNecessarias', e.target.value)}
          placeholder="Liste as ferramentas necessárias (SSH, console, browser, scripts específicos, etc.)"
          rows={3}
          className="font-mono resize-none overflow-auto"
        />
        <p className="text-xs text-muted-foreground">
          Ferramentas e softwares necessários para execução
        </p>
      </div>
    </div>
  );
}
