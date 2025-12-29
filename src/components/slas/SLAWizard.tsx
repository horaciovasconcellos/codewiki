import { useState } from 'react';
import { SLA, TipoSLA } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Check, Plus, Trash, Star } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { SLASuporteForm } from './forms/SLASuporteForm';
import { SLASegurancaForm } from './forms/SLASegurancaForm';
import { SLACapacidadeForm } from './forms/SLACapacidadeForm';
import { SLADisponibilidadeForm } from './forms/SLADisponibilidadeForm';
import { SLAPerformanceForm } from './forms/SLAPerformanceForm';
import { SLAPrioridadeForm } from './forms/SLAPrioridadeForm';
import { SLAApoioForm } from './forms/SLAApoioForm';
import { SLAOperacionalForm } from './forms/SLAOperacionalForm';
import { SLAComponentesForm } from './forms/SLAComponentesForm';
import { SLAUsuarioForm } from './forms/SLAUsuarioForm';
import { SLAClienteForm } from './forms/SLAClienteForm';
import { SLAServicoForm } from './forms/SLAServicoForm';

interface SLAWizardProps {
  slas: SLA[];
  onSave: (sla: SLA) => void;
  onCancel: () => void;
  editingSLA?: SLA;
}

const tiposSLADisponiveis: TipoSLA[] = [
  'SLA por Serviço',
  'SLA por Cliente',
  'SLA por Usuário',
  'SLA Baseado em Componentes',
  'SLA Operacional',
  'SLA de Apoio',
  'SLA por Nível de Prioridade / Severidade',
  'SLA de Performance',
  'SLA de Disponibilidade',
  'SLA de Capacidade',
  'SLA de Segurança',
  'SLA de Suporte / Atendimento',
];

interface TipoSLAState {
  tipo: TipoSLA;
  ativo: boolean;
  principal: boolean;
  data: any;
}

export function SLAWizard({ slas, onSave, onCancel, editingSLA }: SLAWizardProps) {
  const formatDateForInput = (date?: string) => {
    if (!date) return '';
    return date.split('T')[0];
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [sigla, setSigla] = useState(editingSLA?.sigla || '');
  const [descricao, setDescricao] = useState(editingSLA?.descricao || '');
  const [dataInicio, setDataInicio] = useState(
    editingSLA?.dataInicio ? formatDateForInput(editingSLA.dataInicio) : getTodayDate()
  );
  const [dataTermino, setDataTermino] = useState(
    editingSLA?.dataTermino ? formatDateForInput(editingSLA.dataTermino) : ''
  );

  // Estado para gerenciar os tipos de SLA selecionados
  const [tiposSLA, setTiposSLA] = useState<TipoSLAState[]>(() => {
    if (editingSLA) {
      // Se estiver editando, inicializa com os tipos existentes
      return tiposSLADisponiveis.map(tipo => ({
        tipo,
        ativo: tipo === editingSLA.tipoSLA,
        principal: tipo === editingSLA.tipoSLA,
        data: getDataForTipo(tipo, editingSLA)
      }));
    }
    return tiposSLADisponiveis.map(tipo => ({
      tipo,
      ativo: false,
      principal: false,
      data: undefined
    }));
  });

  function getDataForTipo(tipo: TipoSLA, sla: SLA): any {
    switch (tipo) {
      case 'SLA de Suporte / Atendimento':
        return sla.suporteAtendimento;
      case 'SLA de Segurança':
        return sla.seguranca;
      case 'SLA de Capacidade':
        return sla.capacidade;
      case 'SLA de Disponibilidade':
        return sla.disponibilidade;
      case 'SLA de Performance':
        return sla.performance;
      case 'SLA por Nível de Prioridade / Severidade':
        return sla.prioridade;
      case 'SLA de Apoio':
        return sla.apoio;
      case 'SLA Operacional':
        return sla.operacional;
      case 'SLA Baseado em Componentes':
        return sla.componentes;
      case 'SLA por Usuário':
        return sla.usuario;
      case 'SLA por Cliente':
        return sla.usuario;
      case 'SLA por Serviço':
        return sla.servico;
      default:
        return undefined;
    }
  }

  const tiposAtivos = tiposSLA.filter(t => t.ativo);
  const tipoPrincipal = tiposSLA.find(t => t.principal);

  const steps = [
    { id: 'basico', title: 'Informações Básicas' },
    { id: 'tipos', title: 'Selecionar Tipos de SLA' },
    ...tiposAtivos.map(t => ({
      id: t.tipo,
      title: t.tipo
    }))
  ];

  const handleToggleTipo = (tipo: TipoSLA) => {
    setTiposSLA(prev => {
      const updated = prev.map(t => {
        if (t.tipo === tipo) {
          const novoAtivo = !t.ativo;
          // Se desativar e era principal, remove principal
          if (!novoAtivo && t.principal) {
            return { ...t, ativo: false, principal: false };
          }
          return { ...t, ativo: novoAtivo };
        }
        return t;
      });

      // Se não houver nenhum principal e há tipos ativos, marca o primeiro como principal
      const temPrincipal = updated.some(t => t.principal && t.ativo);
      const ativosAtualizados = updated.filter(t => t.ativo);
      
      if (!temPrincipal && ativosAtualizados.length > 0) {
        return updated.map((t, idx) => {
          if (t.tipo === ativosAtualizados[0].tipo) {
            return { ...t, principal: true };
          }
          return t;
        });
      }

      return updated;
    });
  };

  const handleSetPrincipal = (tipo: TipoSLA) => {
    setTiposSLA(prev =>
      prev.map(t => ({
        ...t,
        principal: t.tipo === tipo && t.ativo
      }))
    );
  };

  const handleUpdateData = (tipo: TipoSLA, data: any) => {
    setTiposSLA(prev =>
      prev.map(t => (t.tipo === tipo ? { ...t, data } : t))
    );
  };

  const handleNext = () => {
    // Validação do step básico
    if (currentStep === 0) {
      if (!sigla.trim() || !descricao.trim() || !dataInicio) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
    }

    // Validação da seleção de tipos
    if (currentStep === 1) {
      if (tiposAtivos.length === 0) {
        toast.error('Selecione pelo menos um tipo de SLA');
        return;
      }
      if (!tipoPrincipal) {
        toast.error('Defina um tipo de SLA como principal');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!tipoPrincipal) {
      toast.error('Defina um tipo de SLA como principal');
      return;
    }

    const sla: SLA = {
      id: editingSLA?.id || crypto.randomUUID(),
      sigla: sigla.trim(),
      descricao: descricao.trim(),
      tipoSLA: tipoPrincipal.tipo,
      dataInicio,
      dataTermino: dataTermino || undefined,
      status: editingSLA?.status || 'Ativo',
    };

    // Adiciona os dados de cada tipo ativo
    tiposAtivos.forEach(t => {
      switch (t.tipo) {
        case 'SLA de Suporte / Atendimento':
          sla.suporteAtendimento = t.data;
          break;
        case 'SLA de Segurança':
          sla.seguranca = t.data;
          break;
        case 'SLA de Capacidade':
          sla.capacidade = t.data;
          break;
        case 'SLA de Disponibilidade':
          sla.disponibilidade = t.data;
          break;
        case 'SLA de Performance':
          sla.performance = t.data;
          break;
        case 'SLA por Nível de Prioridade / Severidade':
          sla.prioridade = t.data;
          break;
        case 'SLA de Apoio':
          sla.apoio = t.data;
          break;
        case 'SLA Operacional':
          sla.operacional = t.data;
          break;
        case 'SLA Baseado em Componentes':
          sla.componentes = t.data;
          break;
        case 'SLA por Usuário':
          sla.usuario = t.data;
          break;
        case 'SLA por Cliente':
          sla.usuario = t.data;
          break;
        case 'SLA por Serviço':
          sla.servico = t.data;
          break;
      }
    });

    onSave(sla);
    toast.success(editingSLA ? 'SLA atualizado com sucesso' : 'SLA cadastrado com sucesso');
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep];

    // Step 1: Informações Básicas
    if (step.id === 'basico') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla *</Label>
            <Input
              id="sigla"
              value={sigla}
              onChange={(e) => setSigla(e.target.value)}
              placeholder="Ex: SLA-001"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do SLA"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataTermino">Data de Término</Label>
              <Input
                id="dataTermino"
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
              />
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Seleção de Tipos
    if (step.id === 'tipos') {
      return (
        <div className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Selecione os tipos de SLA que deseja configurar. Pelo menos um deve ser marcado como <strong>principal</strong>.
            </p>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {tiposSLA.map((tipoState) => (
                <Card
                  key={tipoState.tipo}
                  className={`${
                    tipoState.ativo ? 'border-primary' : ''
                  } ${tipoState.principal ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={tipoState.tipo}
                          checked={tipoState.ativo}
                          onCheckedChange={() => handleToggleTipo(tipoState.tipo)}
                        />
                        <Label
                          htmlFor={tipoState.tipo}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {tipoState.tipo}
                        </Label>
                      </div>

                      {tipoState.ativo && (
                        <Button
                          variant={tipoState.principal ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSetPrincipal(tipoState.tipo)}
                          className="gap-2"
                        >
                          <Star weight={tipoState.principal ? 'fill' : 'regular'} />
                          {tipoState.principal ? 'Principal' : 'Definir como principal'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Tipos selecionados:</strong> {tiposAtivos.length}
            </p>
            {tipoPrincipal && (
              <p className="text-sm mt-1">
                <strong>Principal:</strong> {tipoPrincipal.tipo}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Steps 3+: Formulários específicos de cada tipo
    const tipoAtual = tiposAtivos.find(t => t.tipo === step.id);
    if (!tipoAtual) return null;

    const renderTipoForm = () => {
      switch (tipoAtual.tipo) {
        case 'SLA de Suporte / Atendimento':
          return (
            <SLASuporteForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA de Segurança':
          return (
            <SLASegurancaForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA de Capacidade':
          return (
            <SLACapacidadeForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA de Disponibilidade':
          return (
            <SLADisponibilidadeForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA de Performance':
          return (
            <SLAPerformanceForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA por Nível de Prioridade / Severidade':
          return (
            <SLAPrioridadeForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA de Apoio':
          return (
            <SLAApoioForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA Operacional':
          return (
            <SLAOperacionalForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA Baseado em Componentes':
          return (
            <SLAComponentesForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA por Usuário':
          return (
            <SLAUsuarioForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA por Cliente':
          return (
            <SLAClienteForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        case 'SLA por Serviço':
          return (
            <SLAServicoForm
              data={tipoAtual.data}
              onChange={(data) => handleUpdateData(tipoAtual.tipo, data)}
            />
          );
        default:
          return <div>Formulário não implementado</div>;
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{tipoAtual.tipo}</h3>
            {tipoAtual.principal && (
              <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Star weight="fill" className="text-yellow-500" size={16} />
                Tipo Principal
              </span>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              handleToggleTipo(tipoAtual.tipo);
              setCurrentStep(1); // Volta para seleção de tipos
            }}
            className="gap-2"
          >
            <Trash />
            Remover este tipo
          </Button>
        </div>

        {renderTipoForm()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {editingSLA ? 'Editar SLA' : 'Novo SLA'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Etapa {currentStep + 1} de {steps.length}: {steps[currentStep].title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={`h-2 w-full rounded ${
                      index <= currentStep
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                  {index < steps.length - 1 && (
                    <div className="w-2" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <span
                  key={step.id}
                  className={`text-xs ${
                    index <= currentStep
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                  style={{ flex: 1 }}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderCurrentStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft />
                  Anterior
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button onClick={handleSubmit} className="gap-2">
                    <Check />
                    Salvar SLA
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="gap-2">
                    Próximo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
