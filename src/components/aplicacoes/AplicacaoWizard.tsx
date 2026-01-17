import { useState, useEffect } from 'react';
import { 
  Aplicacao, 
  FaseCicloVida, 
  CriticidadeNegocio,
  TipoAplicacao,
  CloudProvider,
  AssociacaoTecnologiaAplicacao,
  AmbienteTecnologico,
  AssociacaoCapacidadeNegocio,
  AssociacaoProcessoNegocio,
  IntegracaoAplicacao,
  AssociacaoSLAAplicacao,
  AssociacaoRunbookAplicacao,
  AssociacaoSquadAplicacao,
  Contrato,
  Tecnologia,
  ProcessoNegocio,
  CapacidadeNegocio,
  Colaborador,
  ADRAplicacao
} from '@/lib/types';
import { generateUUID } from '@/utils/uuid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { StepBasicInfo } from './wizard-steps/StepBasicInfo';
import { StepTecnologias } from './wizard-steps/StepTecnologias';
import { StepADRs } from './wizard-steps/StepADRs';
import { StepAmbientes } from './wizard-steps/StepAmbientes';
import { StepCapacidades } from './wizard-steps/StepCapacidades';
import { StepProcessos } from './wizard-steps/StepProcessos';
import { StepPayloads } from './wizard-steps/StepPayloads';
import { StepIntegracoes } from './wizard-steps/StepIntegracoes';
import { StepSLAs } from './wizard-steps/StepSLAs';
import { StepRunbooks } from './wizard-steps/StepRunbooks';
import { StepSquads } from './wizard-steps/StepSquads';
import { StepContratos } from './wizard-steps/StepContratos';
import { StepProjetos } from './wizard-steps/StepProjetos';
import { StepReview } from './wizard-steps/StepReview';

interface AplicacaoWizardProps {
  aplicacao?: Aplicacao;
  aplicacoes: Aplicacao[];
  tecnologias: Tecnologia[];
  processos: ProcessoNegocio[];
  capacidades: CapacidadeNegocio[];
  colaboradores: Colaborador[];
  onSave: (aplicacao: Aplicacao) => void;
  onCancel: () => void;
}

export function AplicacaoWizard({ 
  aplicacao, 
  aplicacoes, 
  tecnologias, 
  processos, 
  capacidades,
  colaboradores,
  onSave, 
  onCancel 
}: AplicacaoWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sigla, setSigla] = useState(aplicacao?.sigla || '');
  const [descricao, setDescricao] = useState(aplicacao?.descricao || '');
  const [urlDocumentacao, setUrlDocumentacao] = useState(aplicacao?.urlDocumentacao || '');
  const [tipoAplicacao, setTipoAplicacao] = useState<TipoAplicacao | undefined>(aplicacao?.tipoAplicacao);
  const [cloudProvider, setCloudProvider] = useState<CloudProvider | undefined>(aplicacao?.cloudProvider);
  const [faseCicloVida, setFaseCicloVida] = useState<FaseCicloVida>(aplicacao?.faseCicloVida || 'Planejamento');
  const [criticidadeNegocio, setCriticidadeNegocio] = useState<CriticidadeNegocio>(aplicacao?.criticidadeNegocio || 'Média');
  const [optInOut, setOptInOut] = useState<boolean>(aplicacao?.optInOut || false);
  const [tecnologiasAssociadas, setTecnologiasAssociadas] = useState<AssociacaoTecnologiaAplicacao[]>(aplicacao?.tecnologias || []);
  const [adrsAssociadas, setAdrsAssociadas] = useState<ADRAplicacao[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteTecnologico[]>(aplicacao?.ambientes || []);
  const [capacidadesAssociadas, setCapacidadesAssociadas] = useState<AssociacaoCapacidadeNegocio[]>(aplicacao?.capacidades || []);
  const [processosAssociados, setProcessosAssociados] = useState<AssociacaoProcessoNegocio[]>(aplicacao?.processos || []);
  const [integracoes, setIntegracoes] = useState<IntegracaoAplicacao[]>(aplicacao?.integracoes || []);
  const [slas, setSlas] = useState<AssociacaoSLAAplicacao[]>(aplicacao?.slas || []);
  const [runbooks, setRunbooks] = useState<AssociacaoRunbookAplicacao[]>(aplicacao?.runbooks || []);
  const [squadsAssociadas, setSquadsAssociadas] = useState<AssociacaoSquadAplicacao[]>(aplicacao?.squads || []);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [adrs, setAdrs] = useState<any[]>([]);
  const [payloads, setPayloads] = useState<any[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Carregar ADRs quando aplicacao for carregada
  useEffect(() => {
    if (aplicacao?.id) {
      const loadADRsData = async () => {
        try {
          const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.adrs) {
              setAdrsAssociadas(data.adrs);
              // Extrair lista única de ADRs
              const uniqueAdrs = data.adrs.map((a: any) => ({
                id: a.adrId,
                sequencia: a.adrSequencia,
                descricao: a.adrDescricao,
                contexto: a.adrContexto,
                decisao: a.adrDecisao,
                status: a.adrStatus
              }));
              setAdrs(uniqueAdrs);
            }
          }
        } catch (error) {
          console.error('[AplicacaoWizard] Erro ao carregar ADRs:', error);
        }
      };
      loadADRsData();
    }
  }, [aplicacao?.id]);

  // Carregar Payloads quando aplicacao for carregada
  useEffect(() => {
    if (aplicacao?.id) {
      const loadPayloads = async () => {
        try {
          const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.payloads) {
              setPayloads(data.payloads);
            }
          }
        } catch (error) {
          console.error('[AplicacaoWizard] Erro ao carregar payloads:', error);
        }
      };
      loadPayloads();
    }
  }, [aplicacao?.id]);

  // Carregar contratos quando aplicacao for carregada
  useEffect(() => {
    if (aplicacao?.id) {
      const loadContratos = async () => {
        try {
          const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}/contratos`);
          if (response.ok) {
            const data = await response.json();
            setContratos(data);
          }
        } catch (error) {
          console.error('[AplicacaoWizard] Erro ao carregar contratos:', error);
        }
      };
      loadContratos();
    }
  }, [aplicacao?.id]);

  // Carregar ADRs associadas quando aplicacao for carregada
  useEffect(() => {
    if (aplicacao?.id) {
      const loadADRs = async () => {
        try {
          console.log('[AplicacaoWizard] Carregando ADRs para aplicação:', aplicacao.id);
          const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}/adrs`);
          console.log('[AplicacaoWizard] Response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('[AplicacaoWizard] ADRs carregadas:', data);
            setAdrsAssociadas(data);
          } else {
            console.error('[AplicacaoWizard] Erro ao carregar ADRs - status:', response.status);
          }
        } catch (error) {
          console.error('[AplicacaoWizard] Erro ao carregar ADRs:', error);
        }
      };
      loadADRs();
    }
  }, [aplicacao?.id]);

  // Atualiza estados quando aplicacao mudar (carregamento assíncrono)
  useEffect(() => {
    if (aplicacao) {
      console.log('[AplicacaoWizard] Aplicacao carregada:', aplicacao);
      setSigla(aplicacao.sigla || '');
      setDescricao(aplicacao.descricao || '');
      setUrlDocumentacao(aplicacao.urlDocumentacao || '');
      setTipoAplicacao(aplicacao.tipoAplicacao);
      setCloudProvider(aplicacao.cloudProvider);
      setFaseCicloVida(aplicacao.faseCicloVida || 'Planejamento');
      setCriticidadeNegocio(aplicacao.criticidadeNegocio || 'Média');
      setOptInOut(aplicacao.optInOut || false);
      setTecnologiasAssociadas(aplicacao.tecnologias || []);
      setAmbientes(aplicacao.ambientes || []);
      setCapacidadesAssociadas(aplicacao.capacidades || []);
      setProcessosAssociados(aplicacao.processos || []);
      setIntegracoes(aplicacao.integracoes || []);
      setSlas(aplicacao.slas || []);
      setRunbooks(aplicacao.runbooks || []);
      setSquadsAssociadas(aplicacao.squads || []);
      
      console.log('[AplicacaoWizard] Estados atualizados:', {
        tecnologias: (aplicacao.tecnologias || []).length,
        ambientes: (aplicacao.ambientes || []).length,
        capacidades: (aplicacao.capacidades || []).length,
        processos: (aplicacao.processos || []).length,
        integracoes: (aplicacao.integracoes || []).length,
        slas: (aplicacao.slas || []).length,
        runbooks: (aplicacao.runbooks || []).length
      });
    }
  }, [aplicacao]);

  const isEditing = !!aplicacao;
  const totalSteps = 14;

  const steps = [
    { number: 1, title: 'Informações Básicas', description: 'Dados fundamentais da aplicação' },
    { number: 2, title: 'Tecnologias', description: 'Associação de tecnologias' },
    { number: 3, title: 'Squads', description: 'Equipes e colaboradores' },
    { number: 4, title: 'ADRs', description: 'Decisões Arquitetônicas' },
    { number: 5, title: 'Ambientes', description: 'Ambientes tecnológicos' },
    { number: 6, title: 'Capacidades', description: 'Capacidades de negócio' },
    { number: 7, title: 'Processos', description: 'Processos de negócio' },
    { number: 8, title: 'Payloads', description: 'Payloads e APIs da aplicação' },
    { number: 9, title: 'Integrações', description: 'Integrações com outras aplicações' },
    { number: 10, title: 'SLAs', description: 'Service Level Agreements' },
    { number: 11, title: 'Runbooks', description: 'SLAs e Contratos - Runbooks operacionais' },
    { number: 12, title: 'Contratos', description: 'Contratos da aplicação' },
    { number: 13, title: 'Projetos', description: 'Projetos relacionados à aplicação' },
    { number: 14, title: 'Revisão', description: 'Confirme os dados antes de salvar' },
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!sigla || !sigla.trim()) {
          toast.error('Informe a sigla da aplicação');
          return false;
        }
        if (sigla.length > 20) {
          toast.error('Sigla deve ter até 20 caracteres alfanuméricos');
          return false;
        }
        if (!descricao || !descricao.trim()) {
          toast.error('Informe a descrição da aplicação');
          return false;
        }
        if (descricao.length > 200) {
          toast.error('Descrição deve ter até 200 caracteres');
          return false;
        }
        if (!urlDocumentacao || !urlDocumentacao.trim()) {
          toast.error('Informe a URL da documentação');
          return false;
        }
        if (!tipoAplicacao) {
          toast.error('Selecione o tipo de aplicação');
          return false;
        }
        const siglaExiste = aplicacoes.some(
          a => a.sigla?.toLowerCase() === sigla.toLowerCase() && a.id !== aplicacao?.id
        );
        if (siglaExiste) {
          toast.error('Sigla já cadastrada');
          return false;
        }
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

  const handleSave = async () => {
    if (!validateStep(1)) return;

    const aplicacaoData: Aplicacao = {
      id: aplicacao?.id || generateUUID(),
      sigla,
      descricao,
      urlDocumentacao,
      tipoAplicacao,
      cloudProvider: cloudProvider || undefined,
      faseCicloVida,
      criticidadeNegocio,
      optInOut,
      tecnologias: tecnologiasAssociadas,
      squads: squadsAssociadas,
      ambientes,
      capacidades: capacidadesAssociadas,
      processos: processosAssociados,
      integracoes,
      slas,
      runbooks,
      adrs: adrsAssociadas,
    };

    console.log('[AplicacaoWizard] ========== SALVANDO ==========');
    console.log('[AplicacaoWizard] Dados completos:', aplicacaoData);
    console.log('[AplicacaoWizard] Tecnologias detalhadas:', aplicacaoData.tecnologias);
    console.log('[AplicacaoWizard] Squads detalhados:', aplicacaoData.squads);
    console.log('[AplicacaoWizard] Contadores:', {
      tecnologias: aplicacaoData.tecnologias?.length || 0,
      squads: aplicacaoData.squads?.length || 0,
      ambientes: aplicacaoData.ambientes?.length || 0,
      capacidades: aplicacaoData.capacidades?.length || 0,
      processos: aplicacaoData.processos?.length || 0,
      integracoes: aplicacaoData.integracoes?.length || 0,
      slas: aplicacaoData.slas?.length || 0,
      runbooks: aplicacaoData.runbooks?.length || 0,
      adrs: aplicacaoData.adrs?.length || 0,
      contratos: contratos.length
    });

    // Salvar aplicação
    onSave(aplicacaoData);

    toast.success(isEditing ? 'Aplicação atualizada com sucesso' : 'Aplicação cadastrada com sucesso');

    // Nota: Contratos são gerenciados apenas em edição (quando aplicacao.id já existe)
    // Para novas aplicações, contratos devem ser adicionados após criação
  };

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
              {isEditing ? 'Editar Aplicação' : 'Nova Aplicação'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b px-6 py-4">
        <div className="mb-4">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>
        <div className="flex justify-between overflow-x-auto">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex flex-col items-center flex-1 min-w-[100px] ${
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

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <Card className="border-black">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            {currentStep === 1 && (
              <StepBasicInfo
                sigla={sigla}
                setSigla={setSigla}
                descricao={descricao}
                setDescricao={setDescricao}
                urlDocumentacao={urlDocumentacao}
                setUrlDocumentacao={setUrlDocumentacao}
                tipoAplicacao={tipoAplicacao}
                setTipoAplicacao={setTipoAplicacao}
                cloudProvider={cloudProvider}
                setCloudProvider={setCloudProvider}
                faseCicloVida={faseCicloVida}
                setFaseCicloVida={setFaseCicloVida}
                criticidadeNegocio={criticidadeNegocio}
                setCriticidadeNegocio={setCriticidadeNegocio}
                optInOut={optInOut}
                setOptInOut={setOptInOut}
              />
            )}
            {currentStep === 2 && (
              <StepTecnologias
                tecnologias={tecnologias}
                tecnologiasAssociadas={tecnologiasAssociadas}
                setTecnologiasAssociadas={setTecnologiasAssociadas}
              />
            )}
            {currentStep === 3 && (
              <StepSquads
                colaboradores={colaboradores}
                squadsAssociadas={squadsAssociadas}
                setSquadsAssociadas={setSquadsAssociadas}
              />
            )}
            {currentStep === 4 && (
              <StepADRs
                adrsAssociadas={adrsAssociadas}
                setAdrsAssociadas={setAdrsAssociadas}
              />
            )}
            {currentStep === 5 && (
              <StepAmbientes
                ambientes={ambientes}
                setAmbientes={setAmbientes}
              />
            )}
            {currentStep === 6 && (
              <StepCapacidades
                capacidades={capacidades}
                capacidadesAssociadas={capacidadesAssociadas}
                setCapacidadesAssociadas={setCapacidadesAssociadas}
              />
            )}
            {currentStep === 7 && (
              <StepProcessos
                processos={processos}
                processosAssociados={processosAssociados}
                setProcessosAssociados={setProcessosAssociados}
              />
            )}
            {currentStep === 8 && (
              <StepPayloads
                aplicacaoId={aplicacao?.id}
                aplicacaoSigla={sigla}
              />
            )}
            {currentStep === 9 && (
              <StepIntegracoes
                aplicacoes={aplicacoes.filter(a => a.id !== aplicacao?.id)}
                integracoes={integracoes}
                setIntegracoes={setIntegracoes}
              />
            )}
            {currentStep === 10 && (
              <StepSLAs
                slas={slas}
                setSlas={setSlas}
              />
            )}
            {currentStep === 11 && (
              <StepRunbooks
                runbooks={runbooks}
                setRunbooks={setRunbooks}
              />
            )}
            {currentStep === 12 && (
              <StepContratos
                aplicacaoId={aplicacao?.id || ''}
                contratos={contratos}
                setContratos={setContratos}
              />
            )}
            {currentStep === 13 && (
              <StepProjetos
                aplicacaoSigla={sigla}
              />
            )}
            {currentStep === 14 && (
              <StepReview
                sigla={sigla}
                descricao={descricao}
                urlDocumentacao={urlDocumentacao}
                tipoAplicacao={tipoAplicacao}
                faseCicloVida={faseCicloVida}
                criticidadeNegocio={criticidadeNegocio}
                optInOut={optInOut}
                tecnologias={tecnologias}
                tecnologiasAssociadas={tecnologiasAssociadas}
                ambientes={ambientes}
                capacidades={capacidades}
                capacidadesAssociadas={capacidadesAssociadas}
                processos={processos}
                processosAssociados={processosAssociados}
                aplicacoes={aplicacoes}
                integracoes={integracoes}
                slas={slas}
                runbooks={runbooks}
                contratos={contratos}
                squadsAssociadas={squadsAssociadas}
                colaboradores={colaboradores}
                aplicacaoId={aplicacao?.id}
                adrs={adrs}
                adrsAssociados={adrsAssociadas}
                payloads={payloads}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer with Navigation */}
      <div className="border-t px-6 py-4">
        <div className="flex justify-between">
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
              {isEditing ? 'Salvar Alterações' : 'Criar Aplicação'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
