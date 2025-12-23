import { SLASeguranca } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface SLASegurancaFormProps {
  data?: SLASeguranca;
  onChange: (data: SLASeguranca) => void;
}

export function SLASegurancaForm({ data, onChange }: SLASegurancaFormProps) {
  const handleChange = (field: keyof SLASeguranca, value: boolean | string) => {
    onChange({
      patchingMensalObrigatorio: data?.patchingMensalObrigatorio || false,
      mfaParaTodosAcessos: data?.mfaParaTodosAcessos || false,
      tempoCorrecaoVulnerabilidadeCritical: data?.tempoCorrecaoVulnerabilidadeCritical || '72h',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA de Segurança</h3>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="patching-mensal"
          checked={data?.patchingMensalObrigatorio || false}
          onCheckedChange={(checked) => handleChange('patchingMensalObrigatorio', checked === true)}
        />
        <Label htmlFor="patching-mensal" className="cursor-pointer">
          Patching Mensal Obrigatório
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="mfa-acessos"
          checked={data?.mfaParaTodosAcessos || false}
          onCheckedChange={(checked) => handleChange('mfaParaTodosAcessos', checked === true)}
        />
        <Label htmlFor="mfa-acessos" className="cursor-pointer">
          MFA para Todos os Acessos
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempo-correcao">Tempo para Correção de Vulnerabilidade Critical</Label>
        <Input
          id="tempo-correcao"
          value={data?.tempoCorrecaoVulnerabilidadeCritical || '72h'}
          onChange={(e) => handleChange('tempoCorrecaoVulnerabilidadeCritical', e.target.value)}
          placeholder="Ex: 72h"
        />
      </div>
    </div>
  );
}
