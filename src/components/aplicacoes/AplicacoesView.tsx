import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Aplicacao, Tecnologia, ProcessoNegocio, CapacidadeNegocio } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from '@phosphor-icons/react';
import { AplicacaoWizard } from './AplicacaoWizard';
import { AplicacoesList } from './AplicacoesList';
import { AplicacaoDetails } from './AplicacaoDetails';
import { toast } from 'sonner';

interface AplicacoesViewProps {
  capacidades?: CapacidadeNegocio[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AplicacoesView({ capacidades: capacidadesProps }: AplicacoesViewProps) {
  const { logClick, logEvent, logError } = useLogging('aplicacoes-view');
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [tecnologias, setTecnologias] = useState<Tecnologia[]>([]);
  const [processos, setProcessos] = useState<ProcessoNegocio[]>([]);
  const [capacidades, setCapacidades] = useState<CapacidadeNegocio[]>(capacidadesProps || []);
  const [view, setView] = useState<'list' | 'wizard' | 'details'>('list');
  const [selectedAplicacao, setSelectedAplicacao] = useState<Aplicacao | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar aplicações
      console.log('Carregando aplicações de:', `${API_URL}/api/aplicacoes`);
      logEvent('api_call_start', 'api_call');

      const resAplicacoes = await fetch(`${API_URL}/api/aplicacoes`);
      if (resAplicacoes.ok) {
        try {
          const data = await resAplicacoes.json();
          console.log('Aplicações carregadas:', data.length, data);
          setAplicacoes(data);
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON de aplicações:', jsonError);
          const text = await resAplicacoes.text();
          console.error('Resposta recebida:', text.substring(0, 200));
          toast.error('Erro ao processar dados das aplicações');
        }
      } else {
        console.error('Erro ao carregar aplicações:', resAplicacoes.status, resAplicacoes.statusText);
        toast.error(`Erro ao carregar aplicações: ${resAplicacoes.statusText}`);
      }

      // Carregar tecnologias
      console.log('Carregando tecnologias de:', `${API_URL}/api/tecnologias`);
      logEvent('api_call_start', 'api_call');

      const resTecnologias = await fetch(`${API_URL}/api/tecnologias`);
      if (resTecnologias.ok) {
        try {
          const data = await resTecnologias.json();
          console.log('Tecnologias carregadas:', data.length, data);
          setTecnologias(data);
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON de tecnologias:', jsonError);
          setTecnologias([]); // Array vazio em caso de erro
        }
      } else {
        console.error('Erro ao carregar tecnologias:', resTecnologias.status, resTecnologias.statusText);
        setTecnologias([]); // Array vazio em caso de erro
      }

      // Carregar processos
      logEvent('api_call_start', 'api_call');

      const resProcessos = await fetch(`${API_URL}/api/processos-negocio`);
      if (resProcessos.ok) {
        try {
          const data = await resProcessos.json();
          setProcessos(data);
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON de processos:', jsonError);
          setProcessos([]);
        }
      }

      // Carregar capacidades se não foram passadas por props
      if (!capacidadesProps) {
        logEvent('api_call_start', 'api_call');

        const resCapacidades = await fetch(`${API_URL}/api/capacidades-negocio`);
        if (resCapacidades.ok) {
          try {
            const data = await resCapacidades.json();
            setCapacidades(data);
          } catch (jsonError) {
            console.error('Erro ao fazer parse do JSON de capacidades:', jsonError);
            setCapacidades([]);
          }
        }
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAplicacao(undefined);
    setView('wizard');
  };

  const handleEdit = async (aplicacao: Aplicacao) => {
    try {
      // Carregar dados completos da aplicação incluindo relacionamentos
      console.log('[AplicacoesView] Carregando dados completos da aplicação:', aplicacao.id);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AplicacoesView] Erro na resposta:', response.status, errorText.substring(0, 200));
        throw new Error(`Erro ao carregar dados da aplicação: ${response.statusText}`);
      }
      
      let aplicacaoCompleta;
      try {
        aplicacaoCompleta = await response.json();
      } catch (jsonError) {
        console.error('[AplicacoesView] Erro ao fazer parse do JSON:', jsonError);
        const text = await response.text();
        console.error('[AplicacoesView] Resposta recebida:', text.substring(0, 200));
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      console.log('[AplicacoesView] Aplicação completa carregada:', aplicacaoCompleta);
      console.log('[AplicacoesView] Dados relacionados:', {
        tecnologias: aplicacaoCompleta.tecnologias?.length || 0,
        ambientes: aplicacaoCompleta.ambientes?.length || 0,
        capacidades: aplicacaoCompleta.capacidades?.length || 0,
        processos: aplicacaoCompleta.processos?.length || 0,
        integracoes: aplicacaoCompleta.integracoes?.length || 0,
        slas: aplicacaoCompleta.slas?.length || 0
      });
      
      setSelectedAplicacao(aplicacaoCompleta);
      setView('wizard');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[AplicacoesView] Erro ao carregar aplicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar dados da aplicação');
    }
  };

  const handleView = async (aplicacao: Aplicacao) => {
    try {
      // Carregar dados completos da aplicação incluindo relacionamentos
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados da aplicação: ${response.statusText}`);
      }
      
      let aplicacaoCompleta;
      try {
        aplicacaoCompleta = await response.json();
      } catch (jsonError) {
        console.error('[AplicacoesView] Erro ao fazer parse do JSON:', jsonError);
        const text = await response.text();
        console.error('[AplicacoesView] Resposta recebida:', text.substring(0, 200));
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      setSelectedAplicacao(aplicacaoCompleta);
      setView('details');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[AplicacoesView] Erro ao visualizar aplicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar dados da aplicação');
    }
  };

  const handleSave = async (aplicacao: Aplicacao) => {
    try {
      console.log('[AplicacoesView] Salvando aplicação:', aplicacao);
      console.log('[AplicacoesView] tipoAplicacao:', aplicacao.tipoAplicacao);
      console.log('[AplicacoesView] cloudProvider:', aplicacao.cloudProvider);
      console.log('[AplicacoesView] Tecnologias:', aplicacao.tecnologias?.length, aplicacao.tecnologias);
      console.log('[AplicacoesView] Ambientes:', aplicacao.ambientes?.length);
      console.log('[AplicacoesView] Capacidades:', aplicacao.capacidades?.length);
      console.log('[AplicacoesView] Processos:', aplicacao.processos?.length);
      console.log('[AplicacoesView] Integrações:', aplicacao.integracoes?.length);
      console.log('[AplicacoesView] SLAs:', aplicacao.slas?.length);
      
      const isEditing = !!aplicacao.id && aplicacoes.some(a => a.id === aplicacao.id);
      
      console.log('[AplicacoesView] Modo:', isEditing ? 'PUT' : 'POST');
      console.log('[AplicacoesView] URL:', isEditing ? `${API_URL}/api/aplicacoes/${aplicacao.id}` : `${API_URL}/api/aplicacoes`);
      console.log('[AplicacoesView] Body:', JSON.stringify(aplicacao, null, 2));
      
      logEvent('api_call_start', 'api_call');

      
      const response = await fetch(
        isEditing ? `${API_URL}/api/aplicacoes/${aplicacao.id}` : `${API_URL}/api/aplicacoes`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aplicacao)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('[AplicacoesView] Erro na resposta:', error);
        throw new Error(error.error || 'Erro ao salvar aplicação');
      }

      const resultado = await response.json();
      console.log('[AplicacoesView] Resultado do salvamento:', resultado);

      await loadData();
      setView('list');
      toast.success(isEditing ? 'Aplicação atualizada com sucesso' : 'Aplicação cadastrada com sucesso');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar aplicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar aplicação');
    }
  };

  const handleCancel = () => {
    setSelectedAplicacao(undefined);
    setView('list');
  };

  const handleDelete = async (aplicacao: Aplicacao) => {
    if (!confirm(`Tem certeza que deseja excluir a aplicação "${aplicacao.sigla} - ${aplicacao.descricao}"?`)) {
      return;
    }

    try {
      console.log('[AplicacoesView] Excluindo aplicação:', aplicacao.id);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro ao excluir aplicação' }));
        throw new Error(error.error || 'Erro ao excluir aplicação');
      }

      await loadData();
      toast.success('Aplicação excluída com sucesso');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[AplicacoesView] Erro ao excluir aplicação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir aplicação');
    }
  };

  if (view === 'wizard') {
    return (
      <AplicacaoWizard
        aplicacao={selectedAplicacao}
        aplicacoes={aplicacoes || []}
        tecnologias={tecnologias || []}
        processos={processos || []}
        capacidades={capacidades || []}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  if (view === 'details' && selectedAplicacao) {
    return (
      <AplicacaoDetails
        aplicacao={selectedAplicacao}
        tecnologias={tecnologias || []}
        processos={processos || []}
        capacidades={capacidades || []}
        aplicacoes={aplicacoes || []}
        onBack={() => setView('list')}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Aplicações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie o portfólio de aplicações da organização
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando aplicações...</p>
          </div>
        ) : (
          <AplicacoesList
            aplicacoes={aplicacoes || []}
            onCreateNew={handleCreateNew}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
