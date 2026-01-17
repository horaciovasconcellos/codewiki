import { useState, useMemo } from 'react';
import { Aplicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash, FileXls, FilePdf, FileText, CaretUp, CaretDown, CaretUpDown, MagnifyingGlass, FileArrowDown } from '@phosphor-icons/react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface AplicacoesListProps {
  aplicacoes: Aplicacao[];
  onCreateNew: () => void;
  onEdit: (aplicacao: Aplicacao) => void;
  onDelete: (aplicacao: Aplicacao) => void;
  onPrintPDF: (aplicacao: Aplicacao) => void;
}

type SortField = 'sigla' | 'descricao';
type SortDirection = 'asc' | 'desc';

export function AplicacoesList({ aplicacoes, onCreateNew, onEdit, onDelete, onPrintPDF }: AplicacoesListProps) {
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

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Aplicações', 14, 15);
    
    // Data de geração
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Gerado em: ${dataAtual}`, 14, 22);
    doc.text(`Total de aplicações: ${filteredAndSortedAplicacoes.length}`, 14, 27);

    // Preparar dados para a tabela
    const tableData = filteredAndSortedAplicacoes.map(app => [
      app.sigla,
      app.descricao.length > 80 ? app.descricao.substring(0, 80) + '...' : app.descricao,
      app.urlDocumentacao || 'N/A',
      app.tipoAplicacao || 'N/A',
      app.cloudProvider || 'N/A',
      app.faseCicloVida,
      app.criticidadeNegocio
    ]);

    // Gerar tabela
    autoTable(doc, {
      head: [[
        'Sigla',
        'Descrição',
        'URL Documentação',
        'Tipo Aplicação',
        'Cloud Provider',
        'Fase Ciclo Vida',
        'Criticidade Negócio'
      ]],
      body: tableData,
      startY: 32,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Sigla
        1: { cellWidth: 65 }, // Descrição
        2: { cellWidth: 50 }, // URL
        3: { cellWidth: 30 }, // Tipo
        4: { cellWidth: 30 }, // Cloud
        5: { cellWidth: 35 }, // Fase
        6: { cellWidth: 35 }  // Criticidade
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { top: 32, left: 14, right: 14 }
    });

    // Rodapé com número de páginas
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Salvar PDF
    const data = new Date();
    const nomeArquivo = `aplicacoes_${data.toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
  };

  const exportDetailedReport = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const doc = new jsPDF('p', 'mm', 'a4');
    
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
      for (let i = 0; i < filteredAndSortedAplicacoes.length; i++) {
        const app = filteredAndSortedAplicacoes[i];
        
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
        } catch (err) {
          console.error('Erro ao buscar dados:', err);
        }

        // Nova página para cada aplicação (exceto a primeira)
        if (i > 0) {
          doc.addPage();
        }

        let yPos = 15;

        // ========== TÍTULO DO RELATÓRIO ==========
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${app.sigla} - Relatório de Aplicação (Formato Tabular)`, 105, yPos, { align: 'center' });
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const dataAtual = new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        doc.text(`Gerado em: ${dataAtual}`, 105, yPos, { align: 'center' });
        yPos += 10;

        // Separador
        doc.setDrawColor(200, 200, 200);
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 📋 INFORMAÇÕES BÁSICAS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('📋 Informações Básicas', 12, yPos);
        yPos += 6;

        const infosBasicas = [
          ['Sigla', app.sigla || 'N/A'],
          ['Descrição', app.descricao || 'N/A'],
          ['URL Documentação', app.urlDocumentacao || 'N/A'],
          ['Tipo de Aplicação', app.tipoAplicacao || 'N/A'],
          ['Fase do Ciclo de Vida', app.faseCicloVida || 'N/A'],
          ['Criticidade do Negócio', app.criticidadeNegocio || 'N/A'],
          ['Opt-In/Out', app.optInOut ? 'Opt-In' : 'N/A']
        ];

        yPos = addFormattedTable(doc, yPos, '', ['Campo', 'Valor'], infosBasicas);

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 💻 TECNOLOGIAS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('💻 Tecnologias', 12, yPos);
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

        // ========== 👥 SQUADS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('👥 Squads', 12, yPos);
        yPos += 6;

        if (squadsRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum squad associado', 12, yPos);
          yPos += 10;
        } else {
          const squadsData = squadsRes.map((sq: any) => [
            sq.colaboradorNome || 'N/A',
            sq.papel || 'N/A',
            sq.nomeSquad || 'N/A',
            formatDate(sq.dataInicio),
            sq.dataTermino ? formatDate(sq.dataTermino) : 'Atual'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Colaborador', 'Perfil', 'Squad', 'Início', 'Término'], 
            squadsData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 🌐 AMBIENTES TECNOLÓGICOS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('🌐 Ambientes Tecnológicos', 12, yPos);
        yPos += 6;

        if (ambientesRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum ambiente configurado', 12, yPos);
          yPos += 10;
        } else {
          const ambientesData = ambientesRes.map((amb: any) => [
            amb.tipoAmbiente || amb.tipo_ambiente || 'N/A',
            amb.localizacaoRegiao || amb.localizacao_regiao || 'N/A',
            amb.urlAmbiente || amb.url_ambiente || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Tipo', 'Localização/Região', 'URL'], 
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

        // ========== 📝 ADRs ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('📝 Architectural Decision Records (ADRs)', 12, yPos);
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
            ['Sequência', 'Descrição', 'Data de Início', 'Status'], 
            adrsData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 🎯 CAPACIDADES DO NEGÓCIO ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('🎯 Capacidade do Negócio', 12, yPos);
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

        // ========== 📊 PROCESSOS DE NEGÓCIO ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('📊 Processo de Negócio', 12, yPos);
        yPos += 6;

        if (processosRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum processo associado', 12, yPos);
          yPos += 10;
        } else {
          const processosData = processosRes.map((proc: any) => [
            proc.identificacao || proc.nome || 'N/A',
            proc.areaResponsavel || 'N/A',
            proc.maturidade || 'N/A',
            proc.complexidade || 'N/A'
          ]);
          yPos = addFormattedTable(doc, yPos, '', 
            ['Nome', 'Área Responsável', 'Maturidade', 'Complexidade'], 
            processosData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 📦 PAYLOADS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('📦 Payloads', 12, yPos);
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
            ['Sigla', 'Descrição Curta'], 
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

        // ========== 🔗 INTEGRAÇÕES ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('🔗 Integrações', 12, yPos);
        yPos += 6;

        if (integracoesRes.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhuma integração configurada', 12, yPos);
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

        // ========== ⏱️ SLA ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('⏱️ SLA', 12, yPos);
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
            ['Descrição', 'Tipo', 'Data de Início'], 
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

        // ========== 📖 RUNBOOKS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('📖 Runbooks', 12, yPos);
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
            ['Descrição', 'Finalidade', 'Tipo'], 
            runbooksData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 8;

        // ========== 📄 CONTRATOS ==========
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('📄 Contratos', 12, yPos);
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
            ['Número', 'Vigência Inicial', 'Vigência Final'], 
            contratosData
          );
        }

        // Separador
        doc.line(12, yPos, 198, yPos);
        yPos += 4;

        // Rodapé com informações adicionais
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Documento gerado automaticamente', 105, 282, { align: 'center' });
        doc.text(`Última atualização: ${new Date().toLocaleDateString('pt-BR')}`, 105, 287, { align: 'center' });
      }

      // Salvar PDF
      const data = new Date();
      const nomeArquivo = `relatorio_aplicacoes_detalhado_${data.toISOString().split('T')[0]}.pdf`;
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
              Relatório Detalhado
            </Button>
            <Button 
              onClick={exportToPDF} 
              variant="outline"
              disabled={aplicacoes.length === 0}
            >
              <FilePdf className="mr-2" weight="fill" />
              Exportar PDF
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
                          onClick={() => onPrintPDF(aplicacao)}
                          title="Imprimir Relatório PDF"
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
