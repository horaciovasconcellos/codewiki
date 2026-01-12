import { useState, useEffect } from 'react';
import { Colaborador, TipoAfastamento, Habilidade, Afastamento, HabilidadeColaborador, AvaliacaoColaborador, OptInOut } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, X } from '@phosphor-icons/react';
import { DadosBasicosStep } from './wizard-steps/DadosBasicosStep';
import { AfastamentosStep } from './wizard-steps/AfastamentosStep';
import { HabilidadesStep } from './wizard-steps/HabilidadesStep';
import { StepAvaliacoes } from './wizard-steps/StepAvaliacoes';
import { OptInOutStep } from './wizard-steps/OptInOutStep';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { apiGet } from '@/hooks/use-api';

interface ColaboradorWizardProps {
  colaborador?: Colaborador;
  colaboradores: Colaborador[];
  tiposAfastamento: TipoAfastamento[];
  habilidades: Habilidade[];
  onSave: (colaborador: Colaborador) => void;
  onCancel: () => void;
}

type WizardStep = 'basicos' | 'afastamentos' | 'habilidades' | 'avaliacoes' | 'optinout';

export function ColaboradorWizard({
  colaborador,
  colaboradores,
  tiposAfastamento,
  habilidades,
  onSave,
  onCancel
}: ColaboradorWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basicos');
  
  const [matricula, setMatricula] = useState(colaborador?.matricula || '');
  const [nome, setNome] = useState(colaborador?.nome || '');
  const [setor, setSetor] = useState(colaborador?.setor || '');
  const [dataAdmissao, setDataAdmissao] = useState(colaborador?.dataAdmissao || '');
  const [dataDemissao, setDataDemissao] = useState(colaborador?.dataDemissao || '');
  
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>(colaborador?.afastamentos || []);
  const [habilidadesColaborador, setHabilidadesColaborador] = useState<HabilidadeColaborador[]>(
    colaborador?.habilidades || []
  );
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoColaborador[]>(colaborador?.avaliacoes || []);
  const [optInOuts, setOptInOuts] = useState<OptInOut[]>(colaborador?.optInOuts || []);
  const [aplicacoes, setAplicacoes] = useState<Array<{ id: string; nome: string }>>([]);

  const isEditing = !!colaborador;

  useEffect(() => {
    const fetchAplicacoes = async () => {
      try {
        console.log('[ColaboradorWizard] Iniciando busca de aplicações...');
        const response = await apiGet('/aplicacoes');
        console.log('[ColaboradorWizard] Resposta da API:', response);
        console.log('[ColaboradorWizard] Total de aplicações:', response.length);
        const mapped = response.map((app: any) => ({ id: app.id, nome: app.sigla }));
        console.log('[ColaboradorWizard] Aplicações mapeadas:', mapped.slice(0, 3));
        setAplicacoes(mapped);
        console.log('[ColaboradorWizard] Estado atualizado com', mapped.length, 'aplicações');
      } catch (error) {
        console.error('Erro ao buscar aplicações:', error);
        toast.error('Erro ao carregar aplicações');
      }
    };
    fetchAplicacoes();
  }, []);

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'basicos', label: 'Dados Básicos' },
    { id: 'afastamentos', label: 'Afastamentos' },
    { id: 'habilidades', label: 'Habilidades' },
    { id: 'avaliacoes', label: 'Avaliações' },
    { id: 'optinout', label: 'Opt-In/Out' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canGoNext = () => {
    if (currentStep === 'basicos') {
      return matricula && nome && setor && dataAdmissao;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (currentStep === 'basicos') {
      const matriculaExiste = colaboradores.some(
        c => c.matricula === matricula && c.id !== colaborador?.id
      );
      if (matriculaExiste) {
        toast.error('Matrícula já cadastrada');
        return;
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSave = () => {
    if (!canGoNext()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novoColaborador: Colaborador = {
      id: colaborador?.id || generateUUID(),
      matricula,
      nome,
      setor,
      dataAdmissao,
      dataDemissao: dataDemissao || undefined,
      afastamentos,
      habilidades: habilidadesColaborador,
      avaliacoes,
      optInOuts
    };

    onSave(novoColaborador);
    toast.success(isEditing ? 'Colaborador atualizado com sucesso' : 'Colaborador cadastrado com sucesso');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Passo {currentStepIndex + 1} de {steps.length}: {steps[currentStepIndex].label}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStepIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : currentStepIndex > index
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs mt-2 text-center max-w-[100px]">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-16 h-0.5 bg-muted mx-2 mt-[-20px]" />
              )}
            </div>
          ))}
        </div>

        <Card>
            <CardHeader>
              <CardTitle>{steps[currentStepIndex].label}</CardTitle>
              <CardDescription>
                {currentStep === 'basicos' && 'Preencha os dados básicos do colaborador'}
                {currentStep === 'afastamentos' && 'Registre os afastamentos do colaborador (opcional)'}
                {currentStep === 'habilidades' && 'Cadastre as habilidades do colaborador (opcional)'}
                {currentStep === 'avaliacoes' && 'Registre as avaliações de desempenho do colaborador (opcional)'}
                {currentStep === 'optinout' && 'Gerencie os consentimentos de acesso às aplicações (opcional)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 'basicos' && (
                <DadosBasicosStep
                  matricula={matricula}
                  setMatricula={setMatricula}
                  nome={nome}
                  setNome={setNome}
                  setor={setor}
                  setSetor={setSetor}
                  dataAdmissao={dataAdmissao}
                  setDataAdmissao={setDataAdmissao}
                  dataDemissao={dataDemissao}
                  setDataDemissao={setDataDemissao}
                />
              )}

              {currentStep === 'afastamentos' && (
                <AfastamentosStep
                  afastamentos={afastamentos}
                  setAfastamentos={setAfastamentos}
                  tiposAfastamento={tiposAfastamento}
                />
              )}

              {currentStep === 'habilidades' && (
                <HabilidadesStep
                  habilidades={habilidadesColaborador}
                  setHabilidades={setHabilidadesColaborador}
                  habilidadesDisponiveis={habilidades}
                />
              )}

              {currentStep === 'avaliacoes' && (
                <StepAvaliacoes
                  avaliacoes={avaliacoes}
                  setAvaliacoes={setAvaliacoes}
                />
              )}

              {currentStep === 'optinout' && (
                <OptInOutStep
                  optInOuts={optInOuts}
                  setOptInOuts={setOptInOuts}
                  aplicacoes={aplicacoes}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              Anterior
            </Button>
            <div className="flex gap-2">
              {currentStepIndex < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={!canGoNext()}>
                  Próximo
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  Salvar Colaborador
                </Button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
