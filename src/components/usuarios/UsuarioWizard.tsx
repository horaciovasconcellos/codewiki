import { useState, useEffect } from 'react';
import { Usuario, Colaborador, PermissaoTela, PermissoesPorSetor, TELAS_SISTEMA } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, X } from '@phosphor-icons/react';
import { StepDadosBasicos } from './wizard-steps/StepDadosBasicos';
import { StepControleAcesso } from './wizard-steps/StepControleAcesso';
import { StepResumo } from './wizard-steps/StepResumo';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface UsuarioWizardProps {
  usuario?: Usuario;
  usuarios: Usuario[];
  colaboradores: Colaborador[];
  onSave: (usuario: Usuario) => void;
  onCancel: () => void;
}

type WizardStep = 'dadosBasicos' | 'controleAcesso' | 'resumo';

export function UsuarioWizard({
  usuario,
  usuarios,
  colaboradores,
  onSave,
  onCancel
}: UsuarioWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('dadosBasicos');
  
  // State para dados básicos
  const [colaboradorId, setColaboradorId] = useState(usuario?.colaboradorId || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState(usuario?.role || 'Usuário' as const);
  const [ativo, setAtivo] = useState(usuario?.ativo ?? true);
  
  // State para controle de acesso
  const [permissoesPorSetor, setPermissoesPorSetor] = useState<PermissoesPorSetor[]>(
    usuario?.permissoesPorSetor || []
  );

  const isEditing = !!usuario;
  const colaboradorSelecionado = colaboradores.find(c => c.id === colaboradorId);

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'dadosBasicos', label: 'Dados Básicos' },
    { id: 'controleAcesso', label: 'Controle de Acesso' },
    { id: 'resumo', label: 'Resumo' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Validação de cada step
  const canGoNext = () => {
    if (currentStep === 'dadosBasicos') {
      if (!colaboradorId) {
        toast.error('Selecione um colaborador');
        return false;
      }
      if (!email) {
        toast.error('Informe o email');
        return false;
      }
      if (!isEditing && !senha) {
        toast.error('Informe a senha');
        return false;
      }
      if (senha && senha.length < 6) {
        toast.error('A senha deve ter no mínimo 6 caracteres');
        return false;
      }
      
      // Validar email único
      const emailJaExiste = usuarios.some(
        u => u.email === email && u.id !== usuario?.id
      );
      if (emailJaExiste) {
        toast.error('Email já cadastrado');
        return false;
      }
      
      // Validar colaborador único
      const colaboradorJaVinculado = usuarios.some(
        u => u.colaboradorId === colaboradorId && u.id !== usuario?.id
      );
      if (colaboradorJaVinculado) {
        toast.error('Colaborador já possui usuário cadastrado');
        return false;
      }
      
      return true;
    }
    
    if (currentStep === 'controleAcesso') {
      // Validar que pelo menos um setor tem permissões configuradas
      if (role !== 'Administrador' && permissoesPorSetor.length === 0) {
        toast.error('Configure permissões para pelo menos um setor');
        return false;
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;

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
    if (!canGoNext()) return;

    const novoUsuario: Usuario = {
      id: usuario?.id || generateUUID(),
      colaboradorId,
      colaboradorNome: colaboradorSelecionado?.nome,
      colaboradorMatricula: colaboradorSelecionado?.matricula,
      colaboradorSetor: colaboradorSelecionado?.setor,
      email,
      senha: senha || undefined,
      role,
      ativo,
      permissoesPorSetor: role === 'Administrador' ? [] : permissoesPorSetor,
      dataUltimoAcesso: usuario?.dataUltimoAcesso
    };

    onSave(novoUsuario);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'dadosBasicos':
        return (
          <StepDadosBasicos
            colaboradorId={colaboradorId}
            setColaboradorId={setColaboradorId}
            email={email}
            setEmail={setEmail}
            senha={senha}
            setSenha={setSenha}
            role={role}
            setRole={setRole}
            ativo={ativo}
            setAtivo={setAtivo}
            colaboradores={colaboradores}
            usuarios={usuarios}
            isEditing={isEditing}
          />
        );
      
      case 'controleAcesso':
        return (
          <StepControleAcesso
            role={role}
            colaboradorSetor={colaboradorSelecionado?.setor}
            permissoesPorSetor={permissoesPorSetor}
            setPermissoesPorSetor={setPermissoesPorSetor}
          />
        );
      
      case 'resumo':
        return (
          <StepResumo
            colaboradorNome={colaboradorSelecionado?.nome || ''}
            colaboradorMatricula={colaboradorSelecionado?.matricula || ''}
            colaboradorSetor={colaboradorSelecionado?.setor || ''}
            email={email}
            role={role}
            ativo={ativo}
            permissoesPorSetor={permissoesPorSetor}
          />
        );
      
      default:
        return null;
    }
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
                {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Passo {currentStepIndex + 1} de {steps.length}: {steps[currentStepIndex].label}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Indicador de steps */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        index < currentStepIndex
                          ? 'bg-green-500 text-white'
                          : index === currentStepIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index < currentStepIndex ? <Check weight="bold" /> : index + 1}
                    </div>
                    <span className="text-sm mt-2">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-24 h-1 mx-4 ${
                        index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo do step atual */}
        <Card>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Botões de navegação */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="mr-2" />
              Cancelar
            </Button>

            {currentStepIndex < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                <Check className="mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
