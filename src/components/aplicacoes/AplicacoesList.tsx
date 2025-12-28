import { useState, useMemo } from 'react';
import { Aplicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Pencil, Trash, FileXls, FilePdf, FileText, CaretUp, CaretDown } from '@phosphor-icons/react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface AplicacoesListProps {
  aplicacoes: Aplicacao[];
  onCreateNew: () => void;
  onView: (aplicacao: Aplicacao) => void;
  onEdit: (aplicacao: Aplicacao) => void;
  onDelete: (aplicacao: Aplicacao) => void;
}

type SortField = 'sigla' | 'descricao';
type SortDirection = 'asc' | 'desc';

export function AplicacoesList({ aplicacoes, onCreateNew, onView, onEdit, onDelete }: AplicacoesListProps) {
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAplicacoes = useMemo(() => {
    return [...aplicacoes].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'sigla') {
        comparison = a.sigla.localeCompare(b.sigla);
      } else if (sortField === 'descricao') {
        comparison = a.descricao.localeCompare(b.descricao);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [aplicacoes, sortField, sortDirection]);

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
    doc.text(`Total de aplicações: ${sortedAplicacoes.length}`, 14, 27);

    // Preparar dados para a tabela
    const tableData = sortedAplicacoes.map(app => [
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

    try {
      for (let i = 0; i < sortedAplicacoes.length; i++) {
        const app = sortedAplicacoes[i];
        
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
        } catch (err) {
          console.error('Erro ao buscar dados:', err);
        }

        // Nova página para cada aplicação (exceto a primeira)
        if (i > 0) {
          doc.addPage();
        }

        let yPos = 15;

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
          
          // Exibir cada ambiente com tipo e URL
          ambientesRes.forEach((amb: any) => {
            const tipoAmbiente = amb.tipoAmbiente || amb.tipo_ambiente || 'N/A';
            const urlAmbiente = amb.urlAmbiente || amb.url_ambiente || '';
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(tipoAmbiente, 12, yPos);
            
            if (urlAmbiente) {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(37, 99, 235); // text-blue-600
              const urlLines = doc.splitTextToSize(`: ${urlAmbiente}`, 175);
              doc.text(urlLines, 12 + doc.getTextWidth(tipoAmbiente) + 2, yPos);
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
        const capacidadesAtivas = capacidadesRes.filter((c: any) => c.status === 'Ativo');
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

        // ========== CARD 3: SERVIDORES ==========
        // Título do Card
        doc.setFillColor(248, 250, 252); // bg-slate-50
        doc.rect(10, yPos, 190, 8, 'F');
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Servidores', 12, yPos + 5.5);
        yPos += 12;

        // Lista de Servidores
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(`Servidores Associados (${servidoresRes.length})`, 12, yPos);
        yPos += 5;

        if (servidoresRes.length === 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Nenhum servidor associado', 12, yPos);
          yPos += 5;
        } else {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          // Exibir cada servidor em uma linha separada
          servidoresRes.forEach((s: any) => {
            const sigla = s.servidorSigla || 'N/A';
            const hostname = s.servidorHostname || 'N/A';
            
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${sigla}`, 12, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`- ${hostname}`, 12 + doc.getTextWidth(`• ${sigla} `), yPos);
            
            doc.setTextColor(0, 0, 0);
            yPos += 4;
          });
          yPos += 3;
        }

        // ========== CARD 4: PAYLOADS ==========
        // Título do Card
        doc.setFillColor(248, 250, 252); // bg-slate-50
        doc.rect(10, yPos, 190, 8, 'F');
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Payloads / APIs', 12, yPos + 5.5);
        yPos += 12;

        // Lista de Payloads
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(`Payloads Associados (${payloadsRes.length})`, 12, yPos);
        yPos += 5;

        if (payloadsRes.length === 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Nenhum payload associado', 12, yPos);
          yPos += 5;
        } else {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          // Exibir cada payload em uma linha
          payloadsRes.forEach((p: any) => {
            const sigla = p.sigla || 'N/A';
            const descricao = p.descricao || 'Sem descrição';
            const dataInicio = formatDate(p.dataInicio);
            
            // Tudo na mesma linha: • Sigla - Descrição (truncada) - Início: data
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${sigla}`, 12, yPos);
            
            doc.setFont('helvetica', 'normal');
            const siglaWidth = doc.getTextWidth(`• ${sigla} `);
            const descricaoTruncada = descricao.length > 50 ? descricao.substring(0, 47) + '...' : descricao;
            doc.setTextColor(60, 60, 60);
            doc.text(`- ${descricaoTruncada}`, 12 + siglaWidth, yPos);
            
            const descWidth = doc.getTextWidth(`- ${descricaoTruncada} `);
            doc.setTextColor(100, 116, 139);
            doc.text(`- Início: ${dataInicio}`, 12 + siglaWidth + descWidth, yPos);
            
            doc.setTextColor(0, 0, 0);
            yPos += 4;
          });
          yPos += 3;
        }

        // Rodapé
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i + 1} de ${sortedAplicacoes.length}`, 105, 285, { align: 'center' });
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
    const dados = sortedAplicacoes.map(app => ({
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
              {aplicacoes.length} {aplicacoes.length === 1 ? 'aplicação cadastrada' : 'aplicações cadastradas'}
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
        {aplicacoes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Nenhuma aplicação cadastrada</p>
            <p className="text-sm">Clique em "Nova Aplicação" para começar</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <button
                      onClick={() => handleSort('sigla')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Sigla
                      {sortField === 'sigla' && (
                        sortDirection === 'asc' ? <CaretUp size={16} weight="fill" /> : <CaretDown size={16} weight="fill" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('descricao')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Descrição
                      {sortField === 'descricao' && (
                        sortDirection === 'asc' ? <CaretUp size={16} weight="fill" /> : <CaretDown size={16} weight="fill" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAplicacoes.map((aplicacao) => (
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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(aplicacao)}
                          title="Visualizar"
                        >
                          <Eye size={16} />
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
      </CardContent>
    </Card>
  );
}
