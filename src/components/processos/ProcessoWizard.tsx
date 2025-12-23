import { useState } from 'react';
import { ProcessoNegocio, NivelMaturidade, Frequencia, Complexidade, NormaProcesso } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { StepBasicInfoProcesso } from './wizard-steps/StepBasicInfoProcesso';
import { StepNormasProcesso } from './wizard-steps/StepNormasProcesso';
import { StepReviewProcesso } from './wizard-steps/StepReviewProcesso';

interface ProcessoWizardProps {
  processo?: ProcessoNegocio;
  processos: ProcessoNegocio[];
  onSave: (processo: ProcessoNegocio) => void;
  onCancel: () => void;
}

export function ProcessoWizard({ processo, processos, onSave, onCancel }: ProcessoWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [identificacao, setIdentificacao] = useState(processo?.identificacao || '');
  const [descricao, setDescricao] = useState(processo?.descricao || '');
  const [nivelMaturidade, setNivelMaturidade] = useState<NivelMaturidade>(processo?.nivelMaturidade || 'Inicial');
  const [areaResponsavel, setAreaResponsavel] = useState(processo?.areaResponsavel || '');
  const [frequencia, setFrequencia] = useState<Frequencia>(processo?.frequencia || 'Mensal');
  const [duracaoMedia, setDuracaoMedia] = useState(processo?.duracaoMedia || 0);
  const [complexidade, setComplexidade] = useState<Complexidade>(processo?.complexidade || 'Média');
  const [normas, setNormas] = useState<NormaProcesso[]>(processo?.normas || []);

  const isEditing = !!processo;
  const totalSteps = 3;

  const steps = [
    { number: 1, title: 'Informações Básicas', description: 'Dados fundamentais do processo' },
    { number: 2, title: 'Normas e Compliance', description: 'Normas aplicáveis ao processo' },
    { number: 3, title: 'Revisão', description: 'Confirme os dados antes de salvar' },
  ];

  const validateIdentificacao = (idValue: string): boolean => {
    const regex = /^[A-Za-z0-9]{6}-\d{5}$/;
    return regex.test(idValue);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!identificacao || !identificacao.trim()) {
          toast.error('Informe a sigla do processo');
          return false;
        }
        if (!validateIdentificacao(identificacao)) {
          toast.error('Sigla deve seguir o formato: 6 caracteres alfanuméricos, hífen, 5 dígitos (ex: ABC123-12345)');
          return false;
        }
        if (!descricao || !descricao.trim()) {
          toast.error('Informe a descrição do processo');
          return false;
        }
        if (descricao.length > 50) {
          toast.error('Descrição deve ter até 50 caracteres');
          return false;
        }
        if (!areaResponsavel || !areaResponsavel.trim()) {
          toast.error('Informe a área responsável');
          return false;
        }
        if (!duracaoMedia || duracaoMedia <= 0) {
          toast.error('Informe a duração média do processo (deve ser maior que 0)');
          return false;
        }
        const idExiste = processos.some(
          p => p.identificacao?.toLowerCase() === identificacao.toLowerCase() && p.id !== processo?.id
        );
        if (idExiste) {
          toast.error('Identificação já cadastrada');
          return false;
        }
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = () => {
    if (!validateStep(1)) return;

    const processoData: ProcessoNegocio = {
      id: processo?.id || crypto.randomUUID(),
      identificacao,
      descricao,
      nivelMaturidade,
      areaResponsavel,
      frequencia,
      duracaoMedia,
      complexidade,
      normas,
    };

    onSave(processoData);
    toast.success(isEditing ? 'Processo atualizado com sucesso' : 'Processo cadastrado com sucesso');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? 'Editar Processo' : 'Novo Processo de Negócio'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {steps[currentStep - 1].description}
              </p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              <X className="mr-2" />
              Cancelar
            </Button>
          </div>

          <div className="mb-6">
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            <div className="flex justify-between mt-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`flex flex-col items-center flex-1 ${
                    step.number === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      step.number < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.number === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {step.number < currentStep ? <Check size={20} /> : step.number}
                  </div>
                  <p className="text-xs font-medium text-center">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <StepBasicInfoProcesso
                identificacao={identificacao}
                setIdentificacao={setIdentificacao}
                descricao={descricao}
                setDescricao={setDescricao}
                nivelMaturidade={nivelMaturidade}
                setNivelMaturidade={setNivelMaturidade}
                areaResponsavel={areaResponsavel}
                setAreaResponsavel={setAreaResponsavel}
                frequencia={frequencia}
                setFrequencia={setFrequencia}
                duracaoMedia={duracaoMedia}
                setDuracaoMedia={setDuracaoMedia}
                complexidade={complexidade}
                setComplexidade={setComplexidade}
              />
            )}
            {currentStep === 2 && (
              <StepNormasProcesso
                normas={normas}
                setNormas={setNormas}
              />
            )}
            {currentStep === 3 && (
              <StepReviewProcesso
                identificacao={identificacao}
                descricao={descricao}
                nivelMaturidade={nivelMaturidade}
                areaResponsavel={areaResponsavel}
                frequencia={frequencia}
                duracaoMedia={duracaoMedia}
                complexidade={complexidade}
                normas={normas}
              />
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2" />
                Anterior
              </Button>
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  <Check className="mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Processo'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
