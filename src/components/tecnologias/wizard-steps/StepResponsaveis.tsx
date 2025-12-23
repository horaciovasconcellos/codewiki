import { ResponsavelTecnologia, Colaborador } from '@/lib/types';
import { ResponsaveisTable } from '@/components/ResponsaveisTable';

interface StepResponsaveisProps {
  responsaveis: ResponsavelTecnologia[];
  setResponsaveis: (value: ResponsavelTecnologia[]) => void;
  colaboradores: Colaborador[];
}

export function StepResponsaveis({ responsaveis, setResponsaveis, colaboradores }: StepResponsaveisProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium mb-1">Equipe Responsável</h3>
        <p className="text-sm text-muted-foreground">
          Adicione os colaboradores responsáveis por esta tecnologia
        </p>
      </div>
      <ResponsaveisTable
        responsaveis={responsaveis}
        colaboradores={colaboradores}
        onChange={setResponsaveis}
      />
    </div>
  );
}
