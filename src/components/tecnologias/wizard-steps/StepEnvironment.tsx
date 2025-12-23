import { Ambiente } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DeviceMobile, TestTube, RocketLaunch, Cloud, HardDrives } from '@phosphor-icons/react';

interface StepEnvironmentProps {
  ambientes: Ambiente;
  setAmbientes: (value: Ambiente) => void;
}

export function StepEnvironment({ ambientes, setAmbientes }: StepEnvironmentProps) {
  const updateAmbiente = (key: keyof Ambiente, value: boolean) => {
    setAmbientes({ ...ambientes, [key]: value });
  };

  const environments = [
    {
      key: 'dev' as keyof Ambiente,
      label: 'Desenvolvimento',
      description: 'Ambiente de desenvolvimento local ou compartilhado',
      icon: DeviceMobile,
      color: 'text-blue-500',
    },
    {
      key: 'qa' as keyof Ambiente,
      label: 'QA / Testes',
      description: 'Ambiente de testes e garantia de qualidade',
      icon: TestTube,
      color: 'text-purple-500',
    },
    {
      key: 'prod' as keyof Ambiente,
      label: 'Produção',
      description: 'Ambiente de produção com usuários finais',
      icon: RocketLaunch,
      color: 'text-green-500',
    },
    {
      key: 'cloud' as keyof Ambiente,
      label: 'Cloud',
      description: 'Hospedado em infraestrutura de nuvem',
      icon: Cloud,
      color: 'text-cyan-500',
    },
    {
      key: 'onPremise' as keyof Ambiente,
      label: 'On-Premise',
      description: 'Hospedado em infraestrutura própria',
      icon: HardDrives,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base">
          Selecione os ambientes <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Indique onde esta tecnologia está implantada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {environments.map((env) => {
          const Icon = env.icon;
          return (
            <Card
              key={env.key}
              className={`cursor-pointer transition-all ${
                ambientes[env.key]
                  ? 'border-primary shadow-sm bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              }`}
              onClick={() => updateAmbiente(env.key, !ambientes[env.key])}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={env.key}
                    checked={ambientes[env.key]}
                    onCheckedChange={(checked) => updateAmbiente(env.key, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={env.color} size={20} />
                      <label
                        htmlFor={env.key}
                        className="font-medium leading-none cursor-pointer"
                      >
                        {env.label}
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {env.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!Object.values(ambientes).some(v => v) && (
        <p className="text-sm text-destructive">
          Selecione pelo menos um ambiente para continuar
        </p>
      )}
    </div>
  );
}
