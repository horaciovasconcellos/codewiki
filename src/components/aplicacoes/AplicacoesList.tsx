import { useState, useMemo } from 'react';
import { Aplicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash, FileXls, FileText, CaretUp, CaretDown, CaretUpDown, MagnifyingGlass, FileArrowDown } from '@phosphor-icons/react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface AplicacoesListProps {
  aplicacoes: Aplicacao[];
  onCreateNew: () => void;
  onEdit: (aplicacao: Aplicacao) => void;
  onDelete: (aplicacao: Aplicacao) => void;
}

type SortField = 'sigla' | 'descricao';
type SortDirection = 'asc' | 'desc';

export function AplicacoesList({ aplicacoes, onCreateNew, onEdit, onDelete }: AplicacoesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <CaretUpDown size={16} className="ml-1 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <CaretUp size={16} className="ml-1" />
      : <CaretDown size={16} className="ml-1" />;
  };

  const filteredAndSortedAplicacoes = useMemo(() => {
    let result = aplicacoes.filter(app => {
      const matchesSearch = 
        app.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.tipoAplicacao && app.tipoAplicacao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.cloudProvider && app.cloudProvider.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });

    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'sigla') {
        comparison = a.sigla.localeCompare(b.sigla);
      } else if (sortField === 'descricao') {
        comparison = a.descricao.localeCompare(b.descricao);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [aplicacoes, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedAplicacoes.length / pageSize);
  const paginatedAplicacoes = filteredAndSortedAplicacoes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportDetailedReport = async (aplicacoesParaExportar?: Aplicacao[]) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Se nenhuma aplicação foi passada, usa todas as filtradas
    const aplicacoesExportar = aplicacoesParaExportar || filteredAndSortedAplicacoes;
    
    // Validar se há aplicações para exportar
    if (!aplicacoesExportar || aplicacoesExportar.length === 0) {
      toast.error('Nenhuma aplicação disponível para gerar relatório');
      return;
    }
    
    toast.info('Gerando relatório detalhado... Por favor aguarde.');

    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    };

    // Função para adicionar tabela formatada
    const addFormattedTable = (
      doc: jsPDF,
      yPos: number,
      title: string,
      headers: string[],
      data: string[][]
    ) => {
      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: data,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: 12, right: 12 },
      });
      return (doc as any).lastAutoTable.finalY + 6;
    };

    try {
      console.log('Iniciando exportação de', aplicacoesExportar.length, 'aplicações');
      for (let i = 0; i < aplicacoesExportar.length; i++) {
        const app = aplicacoesExportar[i];
        console.log(`Processando aplicação ${i + 1}/${aplicacoesExportar.length}: ${app.sigla}`);
        
        console.log('Processando aplicação:', app.sigla, app.id);
        
        // Buscar dados completos da aplicação (inclui todas as associações)
        let appCompleta: any = app;
        let tecnologiasRes: any[] = [];
        let ambientesRes: any[] = [];
        let capacidadesRes: any[] = [];
        let processosRes: any[] = [];
        let integracoesRes: any[] = [];
        let slasRes: any[] = [];
        let contratosRes: any[] = [];
        let adrsRes: any[] = [];
        let servidoresRes: any[] = [];
        let payloadsRes: any[] = [];
        let squadsRes: any[] = [];
        let runbooksRes: any[] = [];
        let checkpointsRes: any[] = [];

        try {
          const response = await fetch(`${API_URL}/api/aplicacoes/${app.id}`);
          if (response.ok) {
            appCompleta = await response.json();
            
            // Os dados vêm como JSON ou arrays da API
            tecnologiasRes = appCompleta.tecnologias || [];
            ambientesRes = appCompleta.ambientes || [];
            capacidadesRes = appCompleta.capacidades || [];
            processosRes = appCompleta.processos || [];
            integracoesRes = appCompleta.integracoes || [];
            slasRes = appCompleta.slas || [];
            
            // Se vierem como string JSON, fazer parse
            if (typeof tecnologiasRes === 'string') tecnologiasRes = JSON.parse(tecnologiasRes || '[]');
            if (typeof ambientesRes === 'string') ambientesRes = JSON.parse(ambientesRes || '[]');
            if (typeof capacidadesRes === 'string') capacidadesRes = JSON.parse(capacidadesRes || '[]');
            if (typeof processosRes === 'string') processosRes = JSON.parse(processosRes || '[]');
            if (typeof integracoesRes === 'string') integracoesRes = JSON.parse(integracoesRes || '[]');
            if (typeof slasRes === 'string') slasRes = JSON.parse(slasRes || '[]');
          }

          // Buscar contratos separadamente
          const contratosResponse = await fetch(`${API_URL}/api/aplicacoes/${app.id}/contratos`);
          if (contratosResponse.ok) {
            contratosRes = await contratosResponse.json();
          }

          // Buscar ADRs separadamente
          try {
            const adrsResponse = await fetch(`${API_URL}/api/aplicacoes/${app.id}/adrs`);
            console.log(`Buscando ADRs da aplicação ${app.id} (${app.sigla}):`, adrsResponse.status);
            if (adrsResponse.ok) {
              adrsRes = await adrsResponse.json();
              console.log(`ADRs encontradas para ${app.sigla}:`, adrsRes);
            } else {
              console.error(`Erro ao buscar ADRs (status ${adrsResponse.status}):`, await adrsResponse.text());
            }
          } catch (errADRs) {
            console.error(`Erro ao buscar ADRs da aplicação ${app.sigla}:`, errADRs);
          }

          // Buscar servidores separadamente
          try {
            const servidoresResponse = await fetch(`${API_URL}/api/aplicacoes/${app.id}/servidores`);
            console.log(`Buscando servidores da aplicação ${app.id} (${app.sigla}):`, servidoresResponse.status);
            if (servidoresResponse.ok) {
              servidoresRes = await servidoresResponse.json();
              console.log(`Servidores encontrados para ${app.sigla}:`, servidoresRes);
            } else {
              console.error(`Erro ao buscar servidores (status ${servidoresResponse.status}):`, await servidoresResponse.text());
            }
          } catch (errServidores) {
            console.error(`Erro ao buscar servidores da aplicação ${app.sigla}:`, errServidores);
          }

          // Buscar payloads separadamente
          try {
            const payloadsResponse = await fetch(`${API_URL}/api/aplicacoes/${app.id}/payloads`);
            console.log(`Buscando payloads da aplicação ${app.id} (${app.sigla}):`, payloadsResponse.status);
            if (payloadsResponse.ok) {
              payloadsRes = await payloadsResponse.json();
              console.log(`Payloads encontrados para ${app.sigla}:`, payloadsRes);
            } else {
              console.error(`Erro ao buscar payloads (status ${payloadsResponse.status}):`, await payloadsResponse.text());
            }
          } catch (errPayloads) {
            console.error(`Erro ao buscar payloads da aplicação ${app.sigla}:`, errPayloads);
          }

          // Buscar squads separadamente
          try {
            const squadsResponse = await fetch(`${API_URL}/api/aplicacoes/${app.id}/squads`);
            console.log(`Buscando squads da aplicação ${app.id} (${app.sigla}):`, squadsResponse.status);
            if (squadsResponse.ok) {
              squadsRes = await squadsResponse.json();
              console.log(`Squads encontrados para ${app.sigla}:`, squadsRes);
            } else {
              console.error(`Erro ao buscar squads (status ${squadsResponse.status}):`, await squadsResponse.text());
            }
          } catch (errSquads) {
            console.error(`Erro ao buscar squads da aplicação ${app.sigla}:`, errSquads);
          }

          // Buscar runbooks separadamente
          try {
            const runbooksResponse = await fetch(`${API_URL}/api/aplicacoes/${app.id}/runbooks`);
            console.log(`Buscando runbooks da aplicação ${app.id} (${app.sigla}):`, runbooksResponse.status);
            if (runbooksResponse.ok) {
              runbooksRes = await runbooksResponse.json();
              console.log(`Runbooks encontrados para ${app.sigla}:`, runbooksRes);
            } else {
              console.error(`Erro ao buscar runbooks (status ${runbooksResponse.status}):`, await runbooksResponse.text());
            }
          } catch (errRunbooks) {
            console.error(`Erro ao buscar runbooks da aplicação ${app.sigla}:`, errRunbooks);
          }

          // Buscar checkpoints separadamente
          try {
            const checkpointsResponse = await fetch(`${API_URL}/api/checkpoints?aplicacao_id=${app.id}`);
            console.log(`Buscando checkpoints da aplicação ${app.id} (${app.sigla}):`, checkpointsResponse.status);
            if (checkpointsResponse.ok) {
              checkpointsRes = await checkpointsResponse.json();
              console.log(`Checkpoints encontrados para ${app.sigla}:`, checkpointsRes);
            } else {
              console.error(`Erro ao buscar checkpoints (status ${checkpointsResponse.status}):`, await checkpointsResponse.text());
            }
          } catch (errCheckpoints) {
            console.error(`Erro ao buscar checkpoints da aplicação ${app.sigla}:`, errCheckpoints);
          }
          
          console.log(`=== APLICAÇÃO: ${app.sigla} ===`);
          console.log('Tecnologias:', tecnologiasRes);
          console.log('Ambientes:', ambientesRes);
          console.log('Capacidades:', capacidadesRes);
          console.log('Processos:', processosRes);
          console.log('Integrações:', integracoesRes);
          console.log('SLAs:', slasRes);
          console.log('Contratos:', contratosRes);
          console.log('ADRs:', adrsRes);
          console.log('Servidores:', servidoresRes);
          console.log('Payloads:', payloadsRes);
          console.log('Squads:', squadsRes);
          console.log('Runbooks:', runbooksRes);
          console.log('Checkpoints:', checkpointsRes);
        } catch (err) {
          console.error('Erro ao buscar dados:', err);
        }

        // Nova página para cada aplicação (exceto a primeira)
        if (i > 0) {
          doc.addPage();
        }

        console.log('Iniciando renderização do PDF para aplicação:', app.sigla);
        let yPos = 12;

        // ========== CABECALHO DO RELATORIO ==========
        // Nome do Sistema
        doc.setFillColor(15, 23, 42); // bg-slate-900
        doc.rect(10, yPos, 190, 12, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('CODEWIKI - Sistema de Auditoria', 105, yPos + 8, { align: 'center' });
        yPos += 14;

        // Titulo do Relatorio
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Relatorio de Aplicacao', 105, yPos, { align: 'center' });
        yPos += 6;

        // Subtitulo com sigla
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105); // text-slate-600
        doc.text(app.sigla, 105, yPos, { align: 'center' });
        yPos += 8;

        // Data e Hora de Emissao
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        const dataHoraEmissao = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        doc.text(`Data/Hora de Emissao: ${dataHoraEmissao}`, 105, yPos, { align: 'center' });
        yPos += 8;

        // Separador
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 1. INFORMAÇÕES BÁSICAS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Informacoes Basicas', 12, yPos);
        yPos += 6;

        const infosBasicas = [
          ['Sigla', app.sigla || 'N/A'],
          ['Descricao', app.descricao || 'N/A'],
          ['URL Documentacao', app.urlDocumentacao || 'N/A'],
          ['Tipo de Aplicacao', app.tipoAplicacao || 'N/A'],
          ['Fase do Ciclo de Vida', app.faseCicloVida || 'N/A'],
          ['Criticidade do Negocio', app.criticidadeNegocio || 'N/A'],
          ['Opt-In/Out', app.optInOut ? 'Opt-In' : 'N/A']
        ];

        yPos = addFormattedTable(doc, yPos, '', ['Campo', 'Valor'], infosBasicas);

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 2. TECNOLOGIAS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('2. Tecnologias', 12, yPos);
        yPos += 6;

        if (tecnologiasRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhuma tecnologia associada', 12, yPos);
          yPos += 10;
        } else {
          const tecnologiasData = tecnologiasRes.map((tec: any) => [
            tec.sigla || 'N/A',
            tec.nome || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', ['Sigla', 'Nome da Tecnologia'], tecnologiasData);
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 3. SQUADS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('3. Squads', 12, yPos);
        yPos += 6;

        if (squadsRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum squad associado', 12, yPos);
          yPos += 10;
        } else {
          const squadsData = squadsRes.map((sq: any) => [
            sq.colaborador_nome || sq.colaboradorNome || 'N/A',
            sq.perfil || sq.papel || 'N/A',
            sq.nome_squad || sq.nomeSquad || sq.squad || 'N/A',
            formatDate(sq.data_inicio || sq.dataInicio),
            sq.data_termino || sq.dataTermino ? formatDate(sq.data_termino || sq.dataTermino) : 'Atual'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Colaborador', 'Perfil', 'Squad', 'Inicio', 'Termino'], 
            squadsData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 4. AMBIENTES TECNOLOGICOS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('4. Ambientes Tecnologicos', 12, yPos);
        yPos += 6;

        if (ambientesRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum ambiente configurado', 12, yPos);
          yPos += 10;
        } else {
          const ambientesData = ambientesRes.map((amb: any) => [
            amb.identificadorAplicacao || amb.identificador_aplicacao || 'N/A',
            amb.tipoAmbiente || amb.tipo_ambiente || 'N/A',
            amb.localizacaoRegiao || amb.localizacao_regiao || 'N/A',
            amb.urlAmbiente || amb.url_ambiente || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Identificador', 'Tipo', 'Localizacao/Regiao', 'URL'], 
            ambientesData
          );
        }

        // Verificar se precisa de nova página
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 5. ADRs ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('6. Architectural Decision Records (ADRs)', 12, yPos);
        yPos += 6;

        if (adrsRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhuma ADR associada', 12, yPos);
          yPos += 10;
        } else {
          const adrsData = adrsRes.map((adr: any) => [
            `ADR-${String(adr.adrSequencia || adr.sequencia || '0000').padStart(3, '0')}`,
            adr.adrDescricao || adr.descricao || 'N/A',
            formatDate(adr.adrDataInicio || adr.dataInicio),
            adr.adrStatus || adr.status || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Sequencia', 'Descricao', 'Data de Inicio', 'Status'], 
            adrsData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 5. CAPACIDADES DO NEGOCIO ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('5. Capacidade do Negocio', 12, yPos);
        yPos += 6;

        if (capacidadesRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhuma capacidade associada', 12, yPos);
          yPos += 10;
        } else {
          const capacidadesData = capacidadesRes.map((cap: any) => [
            cap.nome || cap.sigla || 'N/A',
            cap.nivel || 'N/A',
            cap.categoria || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Nome', 'Nível', 'Categoria'], 
            capacidadesData
          );
        }

        // Verificar se precisa de nova página
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 6. PROCESSOS DE NEGOCIO ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('7. Processo de Negocio', 12, yPos);
        yPos += 6;

        if (processosRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum processo associado', 12, yPos);
          yPos += 10;
        } else {
          console.log('Dados dos processos para PDF:', processosRes);
          const processosData = processosRes.map((proc: any) => {
            console.log('Processo individual:', proc);
            return [
              proc.identificacao || proc.nome || proc.nome_processo || 'N/A',
              proc.area_responsavel || proc.areaResponsavel || 'N/A',
              proc.nivel_maturidade || proc.nivelMaturidade || proc.maturidade || 'N/A',
              proc.complexidade || 'N/A'
            ];
          });
          yPos = addFormattedTable(doc, yPos, '', 
            ['Nome', 'Área Responsável', 'Maturidade', 'Complexidade'], 
            processosData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 7. PAYLOADS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('8. Payloads', 12, yPos);
        yPos += 6;

        if (payloadsRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum payload associado', 12, yPos);
          yPos += 10;
        } else {
          const payloadsData = payloadsRes.map((payload: any) => [
            payload.sigla || 'N/A',
            payload.descricao || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Sigla', 'Descricao Curta'], 
            payloadsData
          );
        }

        // Verificar se precisa de nova página
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 8. INTEGRACOES ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('9. Integracoes', 12, yPos);
        yPos += 6;

        if (integracoesRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhuma integracao configurada', 12, yPos);
          yPos += 10;
        } else {
          const integracoesData = integracoesRes.map((integ: any) => [
            integ.nomeAplicacao || integ.nome_aplicacao || integ.aplicacaoIntegrada || 'N/A',
            integ.estiloIntegracao || integ.estilo_integracao || 'N/A',
            integ.padraoUso || integ.padrao_uso || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Nome', 'Estilo', 'Padrão de Uso'], 
            integracoesData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 10. SLA ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('10. SLA', 12, yPos);
        yPos += 6;

        if (slasRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum SLA configurado', 12, yPos);
          yPos += 10;
        } else {
          const slasData = slasRes.map((sla: any) => [
            sla.descricao || 'N/A',
            sla.tipo || 'N/A',
            formatDate(sla.dataInicio)
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Descricao', 'Tipo', 'Data de Inicio'], 
            slasData
          );
        }

        // Verificar se precisa de nova página
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 11. RUNBOOKS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('11. Runbooks', 12, yPos);
        yPos += 6;

        if (runbooksRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum runbook associado', 12, yPos);
          yPos += 10;
        } else {
          const runbooksData = runbooksRes.map((rb: any) => [
            rb.runbookDescricao || rb.descricao || 'N/A',
            rb.runbookFinalidade || rb.finalidade || 'N/A',
            rb.runbookTipo || rb.tipo || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Descricao', 'Finalidade', 'Tipo'], 
            runbooksData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 12. CONTRATOS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('12. Contratos', 12, yPos);
        yPos += 6;

        if (contratosRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum contrato cadastrado', 12, yPos);
          yPos += 10;
        } else {
          const contratosData = contratosRes.map((c: any) => [
            c.numeroContrato || 'N/A',
            formatDate(c.dataVigenciaInicial),
            formatDate(c.dataVigenciaFinal)
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Numero', 'Vigencia Inicial', 'Vigencia Final'], 
            contratosData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 13. CHECKPOINTS DE APLICACOES ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('13. Checkpoints de Aplicacoes', 12, yPos);
        yPos += 6;

        // Filtrar apenas checkpoints com status diferente de OK
        const checkpointsNaoOk = checkpointsRes.filter((cp: any) => cp.status !== 'OK');

        if (checkpointsNaoOk.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum checkpoint pendente', 12, yPos);
          yPos += 10;
        } else {
          // Para cada checkpoint não OK
          for (const checkpoint of checkpointsNaoOk) {
            // Verificar se precisa de nova página
            if (yPos > 240) {
              doc.addPage();
              yPos = 20;
            }

            // Tabela principal do checkpoint
            const checkpointData = [[
              checkpoint.descricao || 'N/A',
              checkpoint.categoria || 'N/A',
              formatDate(checkpoint.dataPrevista)
            ]];
            
            yPos = addFormattedTable(doc, yPos, '', 
              ['Descricao', 'Categoria', 'Data Prevista'], 
              checkpointData
            );

            // Buscar detalhes do checkpoint
            try {
              const detalhesResponse = await fetch(`${API_URL}/api/checkpoints/${checkpoint.id}/detalhes`);
              if (detalhesResponse.ok) {
                const detalhes = await detalhesResponse.json();
                
                if (detalhes && detalhes.length > 0) {
                  // Sub-tabela com detalhes
                  const detalhesData = detalhes.map((det: any) => [
                    det.responsavel_nome || det.responsavelNome || 'N/A',
                    det.descricao_detalhada || det.descricaoDetalhada || 'N/A'
                  ]);
                  
                  yPos = addFormattedTable(doc, yPos, '', 
                    ['Responsavel', 'Descricao Detalhada'], 
                    detalhesData
                  );
                }
              }
            } catch (errDetalhes) {
              console.error(`Erro ao buscar detalhes do checkpoint ${checkpoint.id}:`, errDetalhes);
            }

            yPos += 4; // Espaço entre checkpoints
          }
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 4;
      }

      // ========== ADICIONAR NUMERACAO DE PAGINAS ==========
      const totalPages = doc.getNumberOfPages();
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        
        // Rodape - linha separadora
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(12, 282, 198, 282);
        
        // Rodape - informacoes
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        
        // Esquerda: Sistema
        doc.text('CodeWiki - Sistema de Auditoria', 12, 287);
        
        // Centro: Data
        const dataRodape = new Date().toLocaleDateString('pt-BR');
        doc.text(dataRodape, 105, 287, { align: 'center' });
        
        // Direita: Numeracao de pagina
        doc.text(`Pagina ${pageNum} de ${totalPages}`, 198, 287, { align: 'right' });
      }

      // Salvar PDF
      console.log('Finalizando PDF - Total de páginas:', doc.getNumberOfPages());
      const data = new Date();
      const nomeArquivo = `relatorio_aplicacoes_detalhado_${data.toISOString().split('T')[0]}.pdf`;
      console.log('Salvando PDF:', nomeArquivo);
      doc.save(nomeArquivo);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório detalhado');
    }
  };

  const exportToExcel = () => {
    // Preparar dados para exportação - apenas os 7 campos solicitados
    const dados = filteredAndSortedAplicacoes.map(app => ({
      'Sigla': app.sigla,
      'Descrição': app.descricao,
      'URL Documentação': app.urlDocumentacao,
      'Tipo Aplicação': app.tipoAplicacao || '',
      'Cloud Provider': app.cloudProvider || '',
      'Fase Ciclo Vida': app.faseCicloVida,
      'Criticidade Negócio': app.criticidadeNegocio,
    }));

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aplicações');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // Sigla
      { wch: 40 }, // Descrição
      { wch: 50 }, // URL Documentação
      { wch: 15 }, // Tipo Aplicação
      { wch: 20 }, // Cloud Provider
      { wch: 18 }, // Fase Ciclo Vida
      { wch: 20 }, // Criticidade Negócio
    ];
    ws['!cols'] = colWidths;

    // Gerar arquivo
    const data = new Date();
    const nomeArquivo = `aplicacoes_${data.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  };
  
  const getBadgeColor = (fase: string) => {
    switch (fase) {
      case 'Planejamento':
        return 'bg-blue-500/10 text-blue-700';
      case 'Desenvolvimento':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'Produção':
        return 'bg-green-500/10 text-green-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getCriticidadeColor = (criticidade: string) => {
    switch (criticidade) {
      case 'Muito Alta':
        return 'bg-red-500/10 text-red-700';
      case 'Alta':
        return 'bg-orange-500/10 text-orange-700';
      case 'Média':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'Baixa':
        return 'bg-blue-500/10 text-blue-700';
      case 'Muito Baixa':
        return 'bg-gray-500/10 text-gray-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Aplicações Cadastradas</CardTitle>
            <CardDescription>
              {filteredAndSortedAplicacoes.length} {filteredAndSortedAplicacoes.length === 1 ? 'aplicação encontrada' : 'aplicações encontradas'}
              {searchTerm && ` (filtrado de ${aplicacoes.length} total)`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={exportDetailedReport} 
              variant="outline"
              disabled={aplicacoes.length === 0}
            >
              <FileText className="mr-2" weight="fill" />
              Relatorio PDF
            </Button>
            <Button 
              onClick={exportToExcel} 
              variant="outline"
              disabled={aplicacoes.length === 0}
            >
              <FileXls className="mr-2" weight="fill" />
              Exportar Excel
            </Button>
            <Button onClick={onCreateNew}>
              <Plus className="mr-2" />
              Nova Aplicação
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por sigla, descrição, tipo ou provider..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                Limpar busca
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {paginatedAplicacoes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedAplicacoes.length)} de {filteredAndSortedAplicacoes.length} aplicações
            </div>
          </div>
        </div>

        {filteredAndSortedAplicacoes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground mt-4">
            <p className="text-lg mb-2">{searchTerm ? 'Nenhuma aplicação encontrada' : 'Nenhuma aplicação cadastrada'}</p>
            <p className="text-sm">{searchTerm ? 'Tente ajustar os termos de busca' : 'Clique em "Nova Aplicação" para começar'}</p>
          </div>
        ) : (
          <div className="border rounded-lg mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('sigla')}
                    >
                      Sigla
                      {getSortIcon('sigla')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('descricao')}
                    >
                      Descrição
                      {getSortIcon('descricao')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAplicacoes.map((aplicacao) => (
                  <TableRow key={aplicacao.id}>
                    <TableCell className="font-semibold align-top">{aplicacao.sigla}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <p className="text-sm line-clamp-2">
                          {aplicacao.descricao.length > 200 
                            ? aplicacao.descricao.substring(0, 200) + '...' 
                            : aplicacao.descricao}
                        </p>
                        <div className="flex flex-wrap gap-2 items-center text-xs">
                          <span className="font-medium text-muted-foreground">Tipo:</span>
                          <Badge variant="outline" className="text-xs">
                            {aplicacao.tipoAplicacao || 'N/A'}
                          </Badge>
                          <span className="font-medium text-muted-foreground">Provider:</span>
                          <Badge variant="outline" className="text-xs">
                            {aplicacao.cloudProvider || 'N/A'}
                          </Badge>
                          <span className="font-medium text-muted-foreground">Fase:</span>
                          <Badge className={`text-xs ${getBadgeColor(aplicacao.faseCicloVida)}`}>
                            {aplicacao.faseCicloVida}
                          </Badge>
                          <span className="font-medium text-muted-foreground">Criticidade:</span>
                          <Badge className={`text-xs ${getCriticidadeColor(aplicacao.criticidadeNegocio)}`}>
                            {aplicacao.criticidadeNegocio}
                          </Badge>
                          {aplicacao.optInOut && (
                            <>
                              <span className="font-medium text-muted-foreground">•</span>
                              <Badge variant="secondary" className="text-xs">
                                Opt-In/Out
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportDetailedReport([aplicacao])}
                          title="Relatorio PDF Detalhado"
                        >
                          <FileArrowDown size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(aplicacao)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(aplicacao)}
                          title="Excluir"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && filteredAndSortedAplicacoes.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
