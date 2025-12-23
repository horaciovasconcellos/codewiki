import { useState } from 'react';
import { Habilidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { Progress } from '@/components/ui/progress';
import { HabilidadeBasicForm } from './HabilidadeBasicForm';
import { CertificacoesDataTable } from './CertificacoesDataTable';

interface HabilidadeWizardProps {
  habilidade?: Habilidade;
  onSave: (habilidade: Habilidade) => void;
  onCancel: () => void;
}

export function HabilidadeWizard({ habilidade, onSave, onCancel }: HabilidadeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [habilidadeData, setHabilidadeData] = useState<Partial<Habilidade>>(
    habilidade || {
      sigla: '',
      descricao: '',
      tipo: 'Hard Skills',
      dominio: 'Desenvolvimento & Engenharia',
      subcategoria: 'Backend',
      certificacoes: []
    }
  );

  const steps = [
    {
      title: 'Informações Básicas',
      description: 'Dados principais da habilidade'
    },
    {
      title: 'Certificações',
      description: 'Certificações relacionadas'
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleBasicFormSave = (data: Partial<Habilidade>) => {
    setHabilidadeData({ ...habilidadeData, ...data });
    setCurrentStep(1);
  };

  const handleCertificacoesSave = (certificacoes: any[]) => {
    const finalData = {
      ...habilidadeData,
      certificacoes
    } as Habilidade;
    onSave(finalData);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {habilidade ? 'Editar Habilidade' : 'Nova Habilidade'}
          </CardTitle>
          <CardDescription>
            Passo {currentStep + 1} de {steps.length}: {steps[currentStep].description}
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" weight="bold" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 ${
                      index < currentStep ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <HabilidadeBasicForm
                habilidade={habilidadeData}
                onSave={handleBasicFormSave}
                onCancel={onCancel}
              />
            )}

            {currentStep === 1 && (
              <CertificacoesDataTable
                certificacoes={habilidadeData.certificacoes || []}
                onSave={handleCertificacoesSave}
                onPrevious={handlePrevious}
                onCancel={onCancel}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
