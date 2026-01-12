import { useState } from 'react';
import { Runbook } from '@/lib/types';
import { StepBasicInfo } from './wizard-steps/StepBasicInfo';
import { StepPreRequisitos } from './wizard-steps/StepPreRequisitos';
import { StepProcedimento } from './wizard-steps/StepProcedimento';
import { StepPosExecucao } from './wizard-steps/StepPosExecucao';
import { StepAutomacao } from './wizard-steps/StepAutomacao';
import { StepEvidencias } from './wizard-steps/StepEvidencias';
import { StepRiscos } from './wizard-steps/StepRiscos';
import { StepReview } from './wizard-steps/StepReview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface RunbookWizardProps {
  runbook?: Runbook;
  runbooks: Runbook[];
  onSave: (runbook: Runbook) => void;
  onCancel: () => void;
}

const steps = [
  { id: 1, name: 'Informações Básicas', component: StepBasicInfo },
  { id: 2, name: 'Pré-Requisitos', component: StepPreRequisitos },
  { id: 3, name: 'Procedimento Operacional', component: StepProcedimento },
  { id: 4, name: 'Pós-Execução', component: StepPosExecucao },
  { id: 5, name: 'Execução Automatizada', component: StepAutomacao },
  { id: 6, name: 'Evidências', component: StepEvidencias },
  { id: 7, name: 'Riscos e Mitigações', component: StepRiscos },
  { id: 8, name: 'Revisão', component: StepReview },
];

export function RunbookWizard({ runbook, runbooks, onSave, onCancel }: RunbookWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Garantir que o runbook tenha todos os campos necessários
  const initialFormData: Partial<Runbook> = runbook ? {
    ...runbook,
    preRequisitos: {
      acessosNecessarios: runbook.preRequisitos?.acessosNecessarios || '',
      validacoesAntesIniciar: runbook.preRequisitos?.validacoesAntesIniciar || '',
      ferramentasNecessarias: runbook.preRequisitos?.ferramentasNecessarias || '',
    },
    procedimentoOperacional: {
      comandos: runbook.procedimentoOperacional?.comandos || '',
      pontosAtencao: runbook.procedimentoOperacional?.pontosAtencao || '',
      checksIntermediarios: runbook.procedimentoOperacional?.checksIntermediarios || '',
      criteriosSucesso: runbook.procedimentoOperacional?.criteriosSucesso || '',
      criteriosFalha: runbook.procedimentoOperacional?.criteriosFalha || '',
    },
    posExecucao: {
      validacoesObrigatorias: runbook.posExecucao?.validacoesObrigatorias || '',
      verificacaoLogs: runbook.posExecucao?.verificacaoLogs || '',
      statusEsperadoAplicacao: runbook.posExecucao?.statusEsperadoAplicacao || '',
      notificacoesNecessarias: runbook.posExecucao?.notificacoesNecessarias || '',
    },
    execucaoAutomatizada: {
      scriptsRelacionados: runbook.execucaoAutomatizada?.scriptsRelacionados || '',
      jobsAssociados: runbook.execucaoAutomatizada?.jobsAssociados || '',
      urlLocalizacaoScripts: runbook.execucaoAutomatizada?.urlLocalizacaoScripts || '',
      condicoesAutomacao: runbook.execucaoAutomatizada?.condicoesAutomacao || '',
    },
    evidencias: {
      printsLogsNecessarios: runbook.evidencias?.printsLogsNecessarios || '',
      arquivosGerados: runbook.evidencias?.arquivosGerados || '',
      tempoMedioExecucao: runbook.evidencias?.tempoMedioExecucao || '',
    },
    riscosMitigacoes: {
      principaisRiscos: runbook.riscosMitigacoes?.principaisRiscos || '',
      acoesPreventivas: runbook.riscosMitigacoes?.acoesPreventivas || '',
      acoesCorretivasRapidas: runbook.riscosMitigacoes?.acoesCorretivasRapidas || '',
    },
  } : {
    id: uuidv4(),
    sigla: '',
    descricaoResumida: '',
    finalidade: '',
    tipoRunbook: 'Procedimento de Rotina',
    preRequisitos: {
      acessosNecessarios: '',
      validacoesAntesIniciar: '',
      ferramentasNecessarias: '',
    },
    procedimentoOperacional: {
      comandos: '',
      pontosAtencao: '',
      checksIntermediarios: '',
      criteriosSucesso: '',
      criteriosFalha: '',
    },
    posExecucao: {
      validacoesObrigatorias: '',
      verificacaoLogs: '',
      statusEsperadoAplicacao: '',
      notificacoesNecessarias: '',
    },
    execucaoAutomatizada: {
      scriptsRelacionados: '',
      jobsAssociados: '',
      urlLocalizacaoScripts: '',
      condicoesAutomacao: '',
    },
    evidencias: {
      printsLogsNecessarios: '',
      arquivosGerados: '',
      tempoMedioExecucao: '',
    },
    riscosMitigacoes: {
      principaisRiscos: '',
      acoesPreventivas: '',
      acoesCorretivasRapidas: '',
    },
  };
  
  const [formData, setFormData] = useState<Partial<Runbook>>(initialFormData);

  const updateFormData = (data: Partial<Runbook>) => {
    console.log('[RunbookWizard] Atualizando formData:', data);
    setFormData((prev) => {
      const updated = { ...prev, ...data };
      console.log('[RunbookWizard] FormData atualizado:', updated);
      return updated;
    });
  };

  const isStep1Valid = () => {
    return !!(
      formData.sigla &&
      formData.sigla.trim() !== '' &&
      formData.descricaoResumida &&
      formData.descricaoResumida.trim() !== '' &&
      formData.finalidade &&
      formData.finalidade.trim() !== '' &&
      formData.tipoRunbook &&
      formData.tipoRunbook.trim() !== ''
    );
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return isStep1Valid();
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      if (!canProceedToNextStep()) {
        const camposFaltantes: string[] = [];
        if (!formData.sigla || formData.sigla.trim() === '') camposFaltantes.push('Sigla');
        if (!formData.descricaoResumida || formData.descricaoResumida.trim() === '') camposFaltantes.push('Descrição Resumida');
        if (!formData.finalidade || formData.finalidade.trim() === '') camposFaltantes.push('Finalidade');
        if (!formData.tipoRunbook || formData.tipoRunbook.trim() === '') camposFaltantes.push('Tipo de Runbook');
        
        toast.error(`Campos obrigatórios não preenchidos: ${camposFaltantes.join(', ')}`);
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    console.log('[RunbookWizard] Salvando runbook:', formData);
    console.log('[RunbookWizard] Riscos e Mitigações:', formData.riscosMitigacoes);
    onSave(formData as Runbook);
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {runbook ? 'Editar Runbook' : 'Novo Runbook'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep} de {steps.length}: {steps[currentStep - 1].name}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b px-6 py-4">
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step) => (
              <span
                key={step.id}
                className={`hidden md:inline ${currentStep === step.id ? 'text-primary font-semibold' : ''}`}
              >
                {step.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <Card className="border-black">
          <CardContent className="bg-white pt-6">
            <CurrentStepComponent
              data={formData}
              updateData={updateFormData}
              runbooks={runbooks}
            />

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2" size={16} />
                Anterior
              </Button>

              {currentStep === steps.length ? (
                <Button onClick={handleSave}>
                  <Check className="mr-2" size={16} />
                  Salvar Runbook
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                >
                  Próximo
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
