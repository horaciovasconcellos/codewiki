import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Aplicacao, Tecnologia, ProcessoNegocio, CapacidadeNegocio, Colaborador } from '@/lib/types';
import { AplicacaoWizard } from './AplicacaoWizard';
import { AplicacoesList } from './AplicacoesList';
import { AplicacaoDetails } from './AplicacaoDetails';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
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

      // Carregar colaboradores
      logEvent('api_call_start', 'api_call');

      const resColaboradores = await fetch(`${API_URL}/api/colaboradores`);
      if (resColaboradores.ok) {
        try {
          const data = await resColaboradores.json();
          console.log('Colaboradores carregados:', data.length);
          setColaboradores(data);
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON de colaboradores:', jsonError);
          setColaboradores([]);
        }
      } else {
        console.error('Erro ao carregar colaboradores:', resColaboradores.status);
        setColaboradores([]);
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

  const handlePrintPDF = async (aplicacao: Aplicacao) => {
    try {
      toast.info('Gerando PDF detalhado...');
      
      // Carregar dados completos da aplicação
      const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacao.id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados da aplicação');
      }
      
      const app = await response.json();
      
      // Criar PDF com o mesmo formato do relatório detalhado
      const doc = new jsPDF('p', 'mm', 'a4');
      let yPos = 15;
      
      // Função auxiliar para formatar datas
      const formatDate = (date: any) => {
        if (!date) return 'N/A';
        try {
          return new Date(date).toLocaleDateString('pt-BR');
        } catch {
          return 'N/A';
        }
      };

      // Preparar arrays de dados
      const tecnologiasRes = app.tecnologias || [];
      const ambientesRes = app.ambientes || [];
      const capacidadesRes = app.capacidades || [];
      const processosRes = app.processos || [];
      const integracoesRes = app.integracoes || [];
      const slasRes = app.slas || [];
      const contratosRes = app.contratos || [];
      const adrsRes = app.adrs || [];
      const servidoresRes = app.servidores || [];
      const payloadsRes = app.payloads || [];

      // ========== CARD 1: INFORMAÇÕES BÁSICAS ==========
      // Título do Card
      doc.setFillColor(248, 250, 252); // bg-slate-50
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Informações Básicas', 12, yPos + 5.5);
      yPos += 12;

      // Sigla e Descrição (grid 2 colunas)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // text-muted-foreground
      doc.text('Sigla', 12, yPos);
      doc.text('Descrição', 105, yPos);
      yPos += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(app.sigla, 12, yPos);
      
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(app.descricao, 90);
      doc.text(descLines, 105, yPos);
      yPos += Math.max(5, descLines.length * 5) + 3;

      // URL da Documentação
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('URL da Documentação', 12, yPos);
      yPos += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(37, 99, 235); // text-blue-600
      const urlLines = doc.splitTextToSize(app.urlDocumentacao || 'N/A', 185);
      doc.text(urlLines, 12, yPos);
      yPos += (urlLines.length * 5) + 3;

      // Tipo, Fase e Criticidade (grid 3 colunas)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      
      if (app.tipoAplicacao) {
        doc.text('Tipo de Aplicação', 12, yPos);
      }
      doc.text('Fase do Ciclo de Vida', app.tipoAplicacao ? 75 : 12, yPos);
      doc.text('Criticidade do Negócio', app.tipoAplicacao ? 138 : 105, yPos);
      yPos += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Badge simulado para Tipo
      if (app.tipoAplicacao) {
        doc.setFillColor(226, 232, 240); // badge background
        doc.roundedRect(12, yPos - 3, doc.getTextWidth(app.tipoAplicacao) + 4, 5, 1, 1, 'F');
        doc.text(app.tipoAplicacao, 14, yPos);
      }
      
      // Badge para Fase
      doc.setFillColor(226, 232, 240);
      const faseX = app.tipoAplicacao ? 75 : 12;
      doc.roundedRect(faseX, yPos - 3, doc.getTextWidth(app.faseCicloVida) + 4, 5, 1, 1, 'F');
      doc.text(app.faseCicloVida, faseX + 2, yPos);
      
      // Badge para Criticidade
      const criticX = app.tipoAplicacao ? 138 : 105;
      doc.roundedRect(criticX, yPos - 3, doc.getTextWidth(app.criticidadeNegocio) + 4, 5, 1, 1, 'F');
      doc.text(app.criticidadeNegocio, criticX + 2, yPos);
      
      // Badge para Opt-In/Out se ativo
      if (app.optInOut) {
        yPos += 7;
        doc.setFillColor(240, 240, 245); // badge secondary background
        const optInOutText = 'Opt-In/Out';
        doc.roundedRect(12, yPos - 3, doc.getTextWidth(optInOutText) + 4, 5, 1, 1, 'F');
        doc.text(optInOutText, 14, yPos);
      }
      
      yPos += 8;

      // ========== CARD 2: ASSOCIAÇÕES ==========
      // Título do Card
      doc.setFillColor(248, 250, 252);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Associações', 12, yPos + 5.5);
      yPos += 12;

      // Tecnologias
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Tecnologias (${tecnologiasRes.length})`, 12, yPos);
      yPos += 5;

      if (tecnologiasRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma tecnologia associada', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Exibir cada tecnologia linha a linha
        tecnologiasRes.forEach((tec: any) => {
          const sigla = tec.sigla || 'N/A';
          const nome = tec.nome || '';
          const dataInicio = tec.dataInicio || tec.data_inicio;
          const dataTermino = tec.dataTermino || tec.data_termino;
          const status = tec.status || 'Ativo';
          
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${sigla}`, 12, yPos);
          
          if (nome) {
            doc.setFont('helvetica', 'normal');
            doc.text(`- ${nome}`, 12 + doc.getTextWidth(`• ${sigla} `), yPos);
          }
          yPos += 4;
          
          // Linha adicional com datas e status
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const detalhes = `  Início: ${formatDate(dataInicio)} | Término: ${dataTermino ? formatDate(dataTermino) : 'Em uso'} | Status: ${status}`;
          doc.text(detalhes, 12, yPos);
          yPos += 4;
        });
        yPos += 1;
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // Ambientes
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Ambientes (${ambientesRes.length})`, 12, yPos);
      yPos += 5;

      if (ambientesRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum ambiente configurado', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Exibir cada ambiente com identificador-tipo-localização/região e URL
        ambientesRes.forEach((amb: any) => {
          const identificador = amb.identificadorAplicacao || amb.identificador_aplicacao || 'n/a';
          const tipo = amb.tipoAmbiente || amb.tipo_ambiente || 'n/a';
          const localizacao = amb.localizacaoRegiao || amb.localizacao_regiao || 'n/a';
          const ambiente = `${identificador}-${tipo}-${localizacao}`.toLowerCase();
          const urlAmbiente = amb.urlAmbiente || amb.url_ambiente || '';
          
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(ambiente, 12, yPos);
          
          if (urlAmbiente) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(37, 99, 235); // text-blue-600
            const urlLines = doc.splitTextToSize(` | ${urlAmbiente}`, 165);
            doc.text(urlLines, 12 + doc.getTextWidth(ambiente) + 2, yPos);
            yPos += (urlLines.length * 4);
          } else {
            yPos += 4;
          }
        });
        yPos += 3;
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // Capacidades de Negócio
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Capacidades de Negócio (${capacidadesRes.length})`, 12, yPos);
      yPos += 5;

      if (capacidadesRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma capacidade associada', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const capBadges = capacidadesRes.map((c: any) => c.sigla || c.nome || 'N/A').join(' • ');
        const capLines = doc.splitTextToSize(capBadges, 185);
        doc.text(capLines, 12, yPos);
        yPos += (capLines.length * 4) + 3;
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // Processos de Negócio
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Processos de Negócio (${processosRes.length})`, 12, yPos);
      yPos += 5;

      if (processosRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum processo associado', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const procBadges = processosRes.map((p: any) => p.identificacao || p.nome || 'N/A').join(' • ');
        const procLines = doc.splitTextToSize(procBadges, 185);
        doc.text(procLines, 12, yPos);
        yPos += (procLines.length * 4) + 3;
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // Integrações
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Integrações (${integracoesRes.length})`, 12, yPos);
      yPos += 5;

      if (integracoesRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma integração configurada', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Exibir cada integração em uma linha separada
        integracoesRes.forEach((i: any) => {
          const nomeIntegracao = i.nomeAplicacao || i.nome_aplicacao || i.aplicacaoIntegrada || i.aplicacao_integada || 'N/A';
          const intLines = doc.splitTextToSize(nomeIntegracao, 185);
          doc.text(intLines, 12, yPos);
          yPos += (intLines.length * 4);
        });
        yPos += 3;
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // SLAs
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`SLAs (${slasRes.length})`, 12, yPos);
      yPos += 5;

      if (slasRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum SLA configurado', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const slaBadges = slasRes.map((s: any) => s.descricao || s.nome || 'N/A').join(' • ');
        const slaLines = doc.splitTextToSize(slaBadges, 185);
        doc.text(slaLines, 12, yPos);
        yPos += (slaLines.length * 4) + 3;
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // Contratos
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Contratos (${contratosRes.length})`, 12, yPos);
      yPos += 5;

      if (contratosRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum contrato cadastrado', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        contratosRes.forEach((c: any) => {
          // Box do contrato (simulando border rounded)
          doc.setDrawColor(229, 231, 235);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(12, yPos - 3, 186, 10, 1, 1, 'FD');
          
          // Número do contrato
          doc.setFont('helvetica', 'bold');
          doc.text(c.numeroContrato, 14, yPos + 1);
          
          // Vigência
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const vigenciaText = `Vigência: ${formatDate(c.dataVigenciaInicial)} até ${formatDate(c.dataVigenciaFinal)}`;
          doc.text(vigenciaText, 14, yPos + 5);
          
          // Badge do status
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'Vigente': return { bg: [220, 252, 231], text: [22, 101, 52] }; // green
              case 'Vencido': return { bg: [254, 226, 226], text: [153, 27, 27] }; // red
              case 'Em Renovação': return { bg: [254, 249, 195], text: [133, 77, 14] }; // yellow
              default: return { bg: [243, 244, 246], text: [75, 85, 99] }; // gray
            }
          };
          
          const statusColors = getStatusColor(c.status);
          doc.setFillColor(statusColors.bg[0], statusColors.bg[1], statusColors.bg[2]);
          doc.setTextColor(statusColors.text[0], statusColors.text[1], statusColors.text[2]);
          const statusWidth = doc.getTextWidth(c.status) + 4;
          doc.roundedRect(194 - statusWidth, yPos - 2, statusWidth, 5, 1, 1, 'F');
          doc.text(c.status, 196 - statusWidth, yPos + 1);
          
          doc.setTextColor(0, 0, 0);
          yPos += 13;
        });
      }

      // Separador
      doc.setDrawColor(229, 231, 235);
      doc.line(12, yPos, 198, yPos);
      yPos += 4;

      // Decisões Arquitetônicas (ADRs)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`Decisões Arquitetônicas - ADRs (${adrsRes.length})`, 12, yPos);
      yPos += 5;

      if (adrsRes.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma ADR associada', 12, yPos);
        yPos += 5;
      } else {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        adrsRes.forEach((adr: any) => {
          // Box da ADR (simulando border rounded)
          doc.setDrawColor(229, 231, 235);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(12, yPos - 3, 186, 10, 1, 1, 'FD');
          
          // Sequência da ADR
          doc.setFont('helvetica', 'bold');
          const adrLabel = `ADR-${String(adr.adrSequencia || adr.sequencia || '0000').padStart(4, '0')}`;
          doc.text(adrLabel, 14, yPos + 1);
          
          // Descrição da ADR
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          const descricao = adr.adrDescricao || adr.descricao || 'Sem descrição';
          const descricaoTruncada = descricao.length > 90 ? descricao.substring(0, 87) + '...' : descricao;
          doc.text(descricaoTruncada, 14, yPos + 5);
          
          // Badge do status
          const getADRStatusColor = (status: string) => {
            switch (status) {
              case 'Ativo': return { bg: [220, 252, 231], text: [22, 101, 52] }; // green
              case 'Inativo': return { bg: [254, 226, 226], text: [153, 27, 27] }; // red
              case 'Superado': return { bg: [243, 244, 246], text: [75, 85, 99] }; // gray
              default: return { bg: [254, 249, 195], text: [133, 77, 14] }; // yellow
            }
          };
          
          const adrStatus = adr.adrStatus || adr.status || 'Ativo';
          const statusColors = getADRStatusColor(adrStatus);
          doc.setFillColor(statusColors.bg[0], statusColors.bg[1], statusColors.bg[2]);
          doc.setTextColor(statusColors.text[0], statusColors.text[1], statusColors.text[2]);
          const statusWidth = doc.getTextWidth(adrStatus) + 4;
          doc.roundedRect(194 - statusWidth, yPos - 2, statusWidth, 5, 1, 1, 'F');
          doc.text(adrStatus, 196 - statusWidth, yPos + 1);
          
          doc.setTextColor(0, 0, 0);
          yPos += 13;
        });
      }
      
      // Salvar PDF
      const filename = `Aplicacao_${app.sigla}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('[AplicacoesView] Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF detalhado');
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
        colaboradores={colaboradores || []}
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
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
