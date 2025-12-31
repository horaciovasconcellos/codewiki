import { useEffect, useState } from 'react';
import { Colaborador, TipoAfastamento, Tecnologia, ProcessoNegocio, Aplicacao, Runbook, CapacidadeNegocio, SLA, Habilidade, Comunicacao, Integracao } from '@/lib/types';
import { TiposAfastamentoView } from '@/components/tipos-afastamento/TiposAfastamentoView';
import { TecnologiasView } from '@/components/tecnologias/TecnologiasView';
import { ColaboradoresView } from '@/components/colaboradores/ColaboradoresView';
import { ProcessosView } from '@/components/processos/ProcessosView';
import { AplicacoesView } from '@/components/aplicacoes/AplicacoesView';
import { RunbooksView } from '@/components/runbooks/RunbooksView';
import { ScriptsView } from '@/components/scripts/ScriptsView';
import { CapacidadesView } from '@/components/capacidades/CapacidadesView';
import { SLAsView } from '@/components/slas/SLAsView';
import { HabilidadesView } from '@/components/habilidades/HabilidadesView';
import { ServidoresView } from '@/components/servidores/ServidoresView';
import { PayloadsView } from '@/components/payloads/PayloadsView';
import { StagesView } from '@/components/stages/StagesView';
import { PipelinesView } from '@/components/pipelines/PipelinesView';
import { TokensView } from '@/components/tokens/TokensView';
import { ConfiguracaoIntegracoesView } from '@/components/ConfiguracaoIntegracoesView';
import { ComunicacaoView } from '@/components/comunicacao/ComunicacaoView';
import { NotificacoesView } from '@/components/notificacoes/NotificacoesView';
import { DashboardView } from '@/components/DashboardView';
import { LogsAndTracesView } from '@/components/LogsAndTracesView';
import { ADRsView } from '@/components/adr/ADRsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { Users, ListChecks, Code, GitBranch, ChartBar, DeviceMobile, BookOpen, Terminal, Target, ClipboardText, GearSix, FileText, Download, ChartLineUp, Certificate, Key, FolderPlus, ShareNetwork, Database, HardDrives, Gear, Envelope } from '@phosphor-icons/react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';
import { IntegracaoView } from '@/components/integracoes/IntegracaoView';
import { DocumentacaoAPIsView } from '@/components/DocumentacaoAPIsView';
import { GeradorProjetosView } from '@/components/gerador-projetos/GeradorProjetosView';
import { InnerSourceView } from '@/components/innersource/InnerSourceView';
import { CargaDadosView } from '@/components/carga/CargaDadosView';
import { CargaLockfilesView } from '@/components/carga/CargaLockfilesView';
import { AzureWorkItemsView } from '@/components/azure-work-items/AzureWorkItemsView';
import { DoraDashboardView } from '@/components/dora/DoraDashboardView';
import SpaceDashboardView from '@/components/space-dashboard/SpaceDashboardView';
import { ApiCatalogGeneratorView } from '@/components/ApiCatalogGeneratorView';
import { ReportBookView } from '@/components/reportbook/ReportBookView';
import { SimilarityAnalyzer } from '@/components/reportbook/SimilarityAnalyzer';
import { useLogging } from '@/hooks/use-logging';
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/ErrorFallback';
import { toast } from 'sonner';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  sidebar: string;
  sidebarForeground: string;
}

interface CardStyles {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  shadow: string;
  padding: string;
}

type ViewType = 'dashboard' | 'colaboradores' | 'tipos-afastamento' | 'tecnologias' | 'processos-negocio' | 'aplicacoes' | 'runbooks' | 'scripts' | 'capacidades-negocio' | 'slas' | 'habilidades' | 'comunicacao' | 'integracoes' | 'servidores' | 'payloads' | 'stages' | 'pipelines' | 'documentacao-apis' | 'logs-traces' | 'tokens-acesso' | 'configuracoes' | 'gerador-projetos' | 'carga-dados' | 'notificacoes' | 'azure-work-items' | 'adrs';

function App() {
  const { logClick, logError } = useLogging('app-root');
  
  // Buscar dados da API
  const { data: tiposAfastamento, loading: loadingTipos, refetch: refetchTipos } = useApi<TipoAfastamento[]>('/tipos-afastamento', []);
  const { data: habilidades, loading: loadingHabilidades, refetch: refetchHabilidades } = useApi<Habilidade[]>('/habilidades', []);
  const { data: tecnologias, refetch: refetchTecnologias } = useApi<Tecnologia[]>('/tecnologias', []);
  const { data: capacidades, refetch: refetchCapacidades } = useApi<CapacidadeNegocio[]>('/capacidades-negocio', []);
  const { data: colaboradores, refetch: refetchColaboradores } = useApi<Colaborador[]>('/colaboradores', []);
  const { data: processos, refetch: refetchProcessos } = useApi<ProcessoNegocio[]>('/processos-negocio', []);
  const { data: aplicacoes, refetch: refetchAplicacoes } = useApi<Aplicacao[]>('/aplicacoes', []);
  const { data: slas, refetch: refetchSlas } = useApi<SLA[]>('/slas', []);
  const { data: comunicacoes, refetch: refetchComunicacoes } = useApi<Comunicacao[]>('/comunicacoes', []);
  const { data: integracoes, refetch: refetchIntegracoes } = useApi<Integracao[]>('/integracoes', []);
  
  const [runbooks] = useState<Runbook[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [systemName, setSystemName] = useState<string>('Sistema de Auditoria');
  const [themeColors, setThemeColors] = useState<ThemeColors>({
    primary: 'oklch(0.264 0.126 276)',
    secondary: 'oklch(0.35 0.08 265)',
    accent: 'oklch(0.30 0.08 265)',
    background: 'oklch(0.988 0.018 105)',
    foreground: 'oklch(0.264 0.126 276)',
    muted: 'oklch(0.92 0.08 95)',
    border: 'oklch(0.85 0.08 95)',
    sidebar: 'oklch(0.970 0.139 106)',
    sidebarForeground: 'oklch(0.264 0.126 276)'
  });
  const [cardStyles, setCardStyles] = useState<CardStyles>({
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#e2e8f0',
    borderWidth: '1px',
    borderRadius: '12px',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    padding: '24px'
  });
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Debug: log quando companyLogo mudar
  useEffect(() => {
    console.log('[App] Estado companyLogo atualizado:', companyLogo ? `Sim (${companyLogo.length} chars)` : 'Não');
  }, [companyLogo]);

  // Carregar configurações da API
  useEffect(() => {
    const loadConfiguracoes = async () => {
      try {
        console.log('[App] Carregando configurações...');
        const response = await fetch('/api/configuracoes');
        if (response.ok) {
          const data = await response.json();
          console.log('[App] Configurações carregadas:', Object.keys(data));
          if (data['system-name']) {
            console.log('[App] System name:', data['system-name']);
            setSystemName(data['system-name']);
          }
          if (data['company-logo']) {
            console.log('[App] Company logo encontrado, tamanho:', data['company-logo'].length);
            console.log('[App] Logo preview:', data['company-logo'].substring(0, 100));
            setCompanyLogo(data['company-logo']);
          } else {
            console.log('[App] Nenhum logo encontrado');
          }
          if (data['theme-colors']) {
            console.log('[App] Theme colors:', data['theme-colors']);
            setThemeColors(data['theme-colors']);
          }
          if (data['card-styles']) {
            console.log('[App] Card styles:', data['card-styles']);
            setCardStyles(data['card-styles']);
          }
        } else {
          console.error('[App] Erro ao carregar configurações:', response.status);
        }
      } catch (error) {
        console.error('[App] Erro ao carregar configurações:', error);
      }
    };
    
    // Carregar configurações inicialmente
    loadConfiguracoes();
    
    // Escutar eventos de atualização de configurações
    const handleConfigUpdate = () => {
      console.log('[App] Evento de atualização de configurações recebido');
      loadConfiguracoes();
    };
    
    window.addEventListener('configuracoes-updated', handleConfigUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('configuracoes-updated', handleConfigUpdate);
    };
  }, []);

  useEffect(() => {
    document.title = systemName || 'Sistema de Auditoria - Gestão de Colaboradores';
  }, [systemName]);

  useEffect(() => {
    if (themeColors) {
      const root = document.documentElement;
      root.style.setProperty('--primary', themeColors.primary);
      root.style.setProperty('--secondary', themeColors.secondary);
      root.style.setProperty('--accent', themeColors.accent);
      root.style.setProperty('--background', themeColors.background);
      root.style.setProperty('--foreground', themeColors.foreground);
      root.style.setProperty('--muted', themeColors.muted);
      root.style.setProperty('--border', themeColors.border);
      root.style.setProperty('--sidebar', themeColors.sidebar);
      root.style.setProperty('--sidebar-foreground', themeColors.sidebarForeground);
    }
  }, [themeColors]);

  useEffect(() => {
    if (cardStyles) {
      const root = document.documentElement;
      root.style.setProperty('--card-bg', cardStyles.backgroundColor);
      root.style.setProperty('--card-text', cardStyles.textColor);
      root.style.setProperty('--card-border-color', cardStyles.borderColor);
      root.style.setProperty('--card-border-width', cardStyles.borderWidth);
      root.style.setProperty('--card-border-radius', cardStyles.borderRadius);
      root.style.setProperty('--card-shadow', cardStyles.shadow);
      root.style.setProperty('--card-padding', cardStyles.padding);
    }
  }, [cardStyles]);

  const handleHabilidadeSave = async (habilidade: Habilidade) => {
    try {
      console.log('[App] handleHabilidadeSave recebeu:', habilidade);
      const existe = habilidades.find(h => h.id === habilidade.id);
      console.log('[App] Habilidade já existe?', existe ? 'SIM - UPDATE' : 'NÃO - CREATE');
      
      if (existe) {
        console.log('[App] Enviando PUT para /habilidades/' + habilidade.id);
        await apiPut(`/habilidades/${habilidade.id}`, habilidade);
        toast.success('Habilidade atualizada');
      } else {
        console.log('[App] Enviando POST para /habilidades');
        const resultado = await apiPost('/habilidades', habilidade);
        console.log('[App] Resposta do POST:', resultado);
        toast.success('Habilidade criada');
      }
      console.log('[App] Recarregando lista de habilidades...');
      await refetchHabilidades();
      console.log('[App] Lista recarregada com sucesso');
    } catch (error) {
      console.error('[App] Erro ao salvar habilidade:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
      logError('save-habilidade', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleHabilidadeDelete = async (id: string) => {
    try {
      await apiDelete(`/habilidades/${id}`);
      toast.success('Habilidade excluída');
      await refetchHabilidades();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
      logError('delete-habilidade', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleTecnologiaSave = async (tecnologia: Tecnologia) => {
    try {
      if (tecnologias.find(t => t.id === tecnologia.id)) {
        await apiPut(`/tecnologias/${tecnologia.id}`, tecnologia);
        toast.success('Tecnologia atualizada');
      } else {
        await apiPost('/tecnologias', tecnologia);
        toast.success('Tecnologia criada');
      }
      await refetchTecnologias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
      logError('save-tecnologia', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleTecnologiaDelete = async (id: string) => {
    try {
      await apiDelete(`/tecnologias/${id}`);
      toast.success('Tecnologia excluída');
      await refetchTecnologias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
      logError('delete-tecnologia', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleCapacidadeSave = async (capacidade: CapacidadeNegocio) => {
    try {
      if (capacidades.find(c => c.id === capacidade.id)) {
        await apiPut(`/capacidades-negocio/${capacidade.id}`, capacidade);
        toast.success('Capacidade atualizada');
      } else {
        await apiPost('/capacidades-negocio', capacidade);
        toast.success('Capacidade criada');
      }
      await refetchCapacidades();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
      logError('save-capacidade', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleCapacidadeDelete = async (id: string) => {
    try {
      await apiDelete(`/capacidades-negocio/${id}`);
      toast.success('Capacidade excluída');
      await refetchCapacidades();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
      logError('delete-capacidade', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleColaboradorSave = async (colaborador: Colaborador) => {
    try {
      if (colaboradores.find(c => c.id === colaborador.id)) {
        await apiPut(`/colaboradores/${colaborador.id}`, colaborador);
        toast.success('Colaborador atualizado');
      } else {
        await apiPost('/colaboradores', colaborador);
        toast.success('Colaborador criado');
      }
      await refetchColaboradores();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
      logError('save-colaborador', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const handleColaboradorDelete = async (id: string) => {
    try {
      await apiDelete(`/colaboradores/${id}`);
      toast.success('Colaborador excluído');
      await refetchColaboradores();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
      logError('delete-colaborador', error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            colaboradores={colaboradores || []}
            tiposAfastamento={tiposAfastamento || []}
            tecnologias={tecnologias || []}
            processos={processos || []}
            aplicacoes={aplicacoes || []}
            runbooks={runbooks || []}
            capacidades={capacidades || []}
            slas={slas || []}
            habilidades={habilidades || []}
            onNavigate={(view) => setCurrentView(view as ViewType)}
          />
        );
      case 'logs-traces':
        return <LogsAndTracesView />;
      case 'tecnologias':
        return (
          <TecnologiasView 
            colaboradores={colaboradores || []} 
          />
        );
      case 'processos-negocio':
        return <ProcessosView />;
      case 'aplicacoes':
        return <AplicacoesView capacidades={capacidades || []} />;
      case 'runbooks':
        return <RunbooksView />;
      case 'scripts':
        return <ScriptsView />;
      case 'capacidades-negocio':
        return (
          <CapacidadesView
            capacidades={capacidades || []}
            onCapacidadeSave={handleCapacidadeSave}
            onCapacidadeDelete={handleCapacidadeDelete}
          />
        );
      case 'slas':
        return <SLAsView />;
      case 'habilidades':
        return (
          <HabilidadesView
            habilidades={habilidades || []}
            onHabilidadeSave={handleHabilidadeSave}
            onHabilidadeDelete={handleHabilidadeDelete}
          />
        );
      case 'comunicacao':
        return (
          <ComunicacaoView
            comunicacoes={comunicacoes || []}
            onRefresh={refetchComunicacoes}
          />
        );
      case 'notificacoes':
        return <NotificacoesView />;
      case 'integracoes':
        return (
          <IntegracaoView
            integracoes={integracoes || []}
            comunicacoes={comunicacoes || []}
            aplicacoes={aplicacoes || []}
            onRefresh={refetchIntegracoes}
          />
        );
      case 'servidores':
        return <ServidoresView />;
      case 'payloads':
        return <PayloadsView />;
      case 'stages':
        return <StagesView />;
      case 'pipelines':
        return <PipelinesView />;
      case 'adrs':
        return <ADRsView />;
      case 'api-catalog-generator':
        return <ApiCatalogGeneratorView />;
      case 'documentacao-apis':
        return <DocumentacaoAPIsView />;
      case 'tokens-acesso':
        return <TokensView />;
      case 'configuracoes':
        return <ConfiguracaoIntegracoesView />;
      case 'gerador-projetos':
        return <GeradorProjetosView />;
      case 'innersource':
        return <InnerSourceView />;
      case 'azure-work-items':
        return <AzureWorkItemsView />;
      case 'dora-dashboard':
        return <DoraDashboardView />;
      case 'space-dashboard':
        return <SpaceDashboardView />;
      case 'reportbook':
        return <ReportBookView />;
      case 'similarity-analyzer':
        return <SimilarityAnalyzer />;
      case 'carga-dados':
        return <CargaDadosView />;
      case 'carga-lockfiles':
        return <CargaLockfilesView />;
      case 'colaboradores':
        return (
          <ColaboradoresView
            colaboradores={colaboradores || []}
            tiposAfastamento={tiposAfastamento || []}
            habilidades={habilidades || []}
          />
        );
      case 'tipos-afastamento':
        return <TiposAfastamentoView tiposAfastamento={tiposAfastamento || []} onRefresh={refetchTipos} />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        logError(error, 'app_error', {
          component_stack: errorInfo.componentStack || ''
        });
      }}
    >
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border px-4 py-4 bg-sidebar">
              {companyLogo ? (
                <div className="flex justify-center mb-3 p-2">
                  <img
                    src={companyLogo}
                    alt="Logo da Empresa"
                    className="max-w-full max-h-20 w-auto h-auto object-contain"
                    style={{ maxWidth: '100%', height: 'auto' }}
                    onError={(e) => {
                      console.error('[App] Erro ao carregar logo');
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('[App] Logo carregado com sucesso');
                    }}
                  />
                </div>
              ) : (
                <div className="flex justify-center mb-3 p-2 h-20 flex items-center justify-center text-muted-foreground text-sm">
                  {/* Placeholder para logo */}
                </div>
              )}
              <h2 className="text-lg font-semibold text-sidebar-foreground text-center">{systemName || 'Sistema de Auditoria'}</h2>
            </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Visão Geral</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'dashboard'}
                      onClick={() => {
                        logClick('nav_dashboard');
                        setCurrentView('dashboard');
                      }}
                    >
                      <ChartBar />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>DevSecOps</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'pipelines'}
                      onClick={() => {
                        logClick('nav_pipelines');
                        setCurrentView('pipelines');
                      }}
                    >
                      <GitBranch />
                      <span>Pipeline Database</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'stages'}
                      onClick={() => {
                        logClick('nav_stages');
                        setCurrentView('stages');
                      }}
                    >
                      <ListChecks />
                      <span>Stages</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Azure</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'dora-dashboard'}
                      onClick={() => {
                        logClick('nav_dora_dashboard');
                        setCurrentView('dora-dashboard');
                      }}
                    >
                      <ChartLineUp />
                      <span>Dashboard DORA</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'space-dashboard'}
                      onClick={() => {
                        logClick('nav_space_dashboard');
                        setCurrentView('space-dashboard');
                      }}
                    >
                      <ChartBar />
                      <span>Dashboard SPACE</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'gerador-projetos'}
                      onClick={() => {
                        logClick('nav_gerador_projetos');
                        setCurrentView('gerador-projetos');
                      }}
                    >
                      <FolderPlus />
                      <span>Gerador de Projetos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'innersource'}
                      onClick={() => {
                        logClick('nav_innersource');
                        setCurrentView('innersource');
                      }}
                    >
                      <ShareNetwork />
                      <span>Projetos InnerSource</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'azure-work-items'}
                      onClick={() => {
                        logClick('nav_azure_work_items');
                        setCurrentView('azure-work-items');
                      }}
                    >
                      <ListChecks />
                      <span>Sincronizar Azure</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>ReportBook</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'similarity-analyzer'}
                      onClick={() => {
                        logClick('nav_similarity_analyzer');
                        setCurrentView('similarity-analyzer');
                      }}
                    >
                      <ChartBar />
                      <span>Analisador de Similaridade</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'reportbook'}
                      onClick={() => {
                        logClick('nav_reportbook');
                        setCurrentView('reportbook');
                      }}
                    >
                      <BookOpen />
                      <span>Relatórios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Integrações Externas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'capacidades-negocio'}
                      onClick={() => setCurrentView('capacidades-negocio')}
                    >
                      <Target />
                      <span>Capacidades de Negócio</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'colaboradores'}
                      onClick={() => setCurrentView('colaboradores')}
                    >
                      <Users />
                      <span>Colaboradores</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'habilidades'}
                      onClick={() => {
                        logClick('nav_habilidades');
                        setCurrentView('habilidades');
                      }}
                    >
                      <Certificate />
                      <span>Habilidades</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'processos-negocio'}
                      onClick={() => setCurrentView('processos-negocio')}
                    >
                      <GitBranch />
                      <span>Processos de Negócio</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'tipos-afastamento'}
                      onClick={() => setCurrentView('tipos-afastamento')}
                    >
                      <ListChecks />
                      <span>Tipos de Afastamento</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Registros</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'aplicacoes'}
                      onClick={() => setCurrentView('aplicacoes')}
                    >
                      <DeviceMobile />
                      <span>Aplicações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'comunicacao'}
                      onClick={() => {
                        logClick('nav_comunicacao');
                        setCurrentView('comunicacao');
                      }}
                    >
                      <ShareNetwork />
                      <span>Comunicação</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'adrs'}
                      onClick={() => {
                        logClick('nav_adrs');
                        setCurrentView('adrs');
                      }}
                    >
                      <FileText />
                      <span>Decisões Arquitetônicas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'integracoes'}
                      onClick={() => setCurrentView('integracoes')}
                    >
                      <GitBranch />
                      <span>Integrações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'notificacoes'}
                      onClick={() => {
                        logClick('nav_notificacoes');
                        setCurrentView('notificacoes');
                      }}
                    >
                      <Envelope />
                      <span>Notificações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'runbooks'}
                      onClick={() => setCurrentView('runbooks')}
                    >
                      <BookOpen />
                      <span>Runbooks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'scripts'}
                      onClick={() => setCurrentView('scripts')}
                    >
                      <Terminal />
                      <span>Scripts</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'servidores'}
                      onClick={() => {
                        logClick('nav_servidores');
                        setCurrentView('servidores');
                      }}
                    >
                      <HardDrives />
                      <span>Servidores</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'slas'}
                      onClick={() => setCurrentView('slas')}
                    >
                      <ClipboardText />
                      <span>SLAs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'tecnologias'}
                      onClick={() => setCurrentView('tecnologias')}
                    >
                      <Code />
                      <span>Tecnologias</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Cargas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'carga-dados'}
                      onClick={() => {
                        logClick('nav_carga_dados');
                        setCurrentView('carga-dados');
                      }}
                    >
                      <Database />
                      <span>Carga de Dados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'carga-lockfiles'}
                      onClick={() => {
                        logClick('nav_carga_lockfiles');
                        setCurrentView('carga-lockfiles');
                      }}
                    >
                      <FileText />
                      <span>Carga Lockfiles</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Documentação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'documentacao-apis'}
                      onClick={() => setCurrentView('documentacao-apis')}
                    >
                      <FileText />
                      <span>Documentação de APIs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'payloads'}
                      onClick={() => {
                        logClick('nav_payloads');
                        setCurrentView('payloads');
                      }}
                    >
                      <FileText />
                      <span>Payloads</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'api-catalog-generator'}
                      onClick={() => {
                        logClick('nav_api_catalog_generator');
                        setCurrentView('api-catalog-generator');
                      }}
                    >
                      <BookOpen />
                      <span>Catálogo de APIs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Configurações e Logs</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'configuracoes'}
                      onClick={() => setCurrentView('configuracoes')}
                    >
                      <Gear />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'tokens-acesso'}
                      onClick={() => setCurrentView('tokens-acesso')}
                    >
                      <Key />
                      <span>Tokens de Acesso</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Observabilidade</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'logs-traces'}
                      onClick={() => {
                        logClick('nav_logs_traces');
                        setCurrentView('logs-traces');
                      }}
                    >
                      <ChartLineUp />
                      <span>Logs e Traces</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
    </ErrorBoundary>
  );
}

export default App;