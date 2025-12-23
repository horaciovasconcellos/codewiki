import { MaturidadeInterna, NivelSuporteInterno } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Book, GithubLogo, Calendar, ShieldCheck } from '@phosphor-icons/react';

interface StepSupportProps {
  maturidadeInterna: MaturidadeInterna;
  setMaturidadeInterna: (value: MaturidadeInterna) => void;
  nivelSuporteInterno: NivelSuporteInterno;
  setNivelSuporteInterno: (value: NivelSuporteInterno) => void;
  dataFimSuporteEoS: string;
  setDataFimSuporteEoS: (value: string) => void;
  documentacaoOficial: string;
  setDocumentacaoOficial: (value: string) => void;
  repositorioInterno: string;
  setRepositorioInterno: (value: string) => void;
}

const maturidadeOptions: MaturidadeInterna[] = [
  'Experimental',
  'Adotada',
  'Padronizada',
  'Restrita',
];

const nivelSuporteOptions: NivelSuporteInterno[] = [
  'Sem Suporte Interno',
  'Suporte Básico',
  'Suporte Intermediário',
  'Suporte Avançado',
  'Suporte Completo / Especializado',
  'AMS',
];

export function StepSupport({
  maturidadeInterna,
  setMaturidadeInterna,
  nivelSuporteInterno,
  setNivelSuporteInterno,
  dataFimSuporteEoS,
  setDataFimSuporteEoS,
  documentacaoOficial,
  setDocumentacaoOficial,
  repositorioInterno,
  setRepositorioInterno,
}: StepSupportProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="maturidadeInterna" className="flex items-center gap-2">
            <ShieldCheck size={16} />
            Maturidade Interna <span className="text-destructive">*</span>
          </Label>
          <Select value={maturidadeInterna} onValueChange={(value) => setMaturidadeInterna(value as MaturidadeInterna)}>
            <SelectTrigger id="maturidadeInterna">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {maturidadeOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Nível de adoção e conhecimento interno
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nivelSuporteInterno" className="flex items-center gap-2">
            <ShieldCheck size={16} />
            Nível de Suporte Interno <span className="text-destructive">*</span>
          </Label>
          <Select value={nivelSuporteInterno} onValueChange={(value) => setNivelSuporteInterno(value as NivelSuporteInterno)}>
            <SelectTrigger id="nivelSuporteInterno">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nivelSuporteOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Capacidade de suporte da equipe interna
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataFimSuporteEoS" className="flex items-center gap-2">
            <Calendar size={16} />
            Data Fim de Suporte (EoS/EoL)
          </Label>
          <Input
            id="dataFimSuporteEoS"
            type="date"
            value={dataFimSuporteEoS}
            onChange={(e) => setDataFimSuporteEoS(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Quando o suporte oficial termina
          </p>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Recursos e Documentação</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentacaoOficial" className="flex items-center gap-2">
                <Book size={16} />
                Documentação Oficial (URL)
              </Label>
              <Input
                id="documentacaoOficial"
                type="url"
                value={documentacaoOficial}
                onChange={(e) => setDocumentacaoOficial(e.target.value)}
                placeholder="https://react.dev"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repositorioInterno" className="flex items-center gap-2">
                <GithubLogo size={16} />
                Repositório Interno (URL)
              </Label>
              <Input
                id="repositorioInterno"
                type="url"
                value={repositorioInterno}
                onChange={(e) => setRepositorioInterno(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
