import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Colaborador, TipoAfastamento, Habilidade } from '@/lib/types';
import { ColaboradorDetails } from './ColaboradorDetails';
import { ColaboradorWizard } from './ColaboradorWizard';
import { ColaboradoresDataTable } from './ColaboradoresDataTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatarData } from '@/lib/utils';

interface ColaboradoresViewProps {
  colaboradores: Colaborador[];
  tiposAfastamento: TipoAfastamento[];
  habilidades: Habilidade[];
}

export function ColaboradoresView({ 
  colaboradores: initialColaboradores,
  tiposAfastamento,
  habilidades
}: ColaboradoresViewProps) {
  const { logEvent, logError } = useLogging('colaboradores-view');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(initialColaboradores);
  
  // Atualizar quando os props mudarem
  useEffect(() => {
    setColaboradores(initialColaboradores);
  }, [initialColaboradores]);
  
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | undefined>(undefined);
  const [showWizard, setShowWizard] = useState(false);

  const handleSave = async (colaborador: Colaborador) => {
    try {
      const payload = {
        nome: colaborador.nome,
        matricula: colaborador.matricula,
        setor: colaborador.setor,
        dataAdmissao: colaborador.dataAdmissao,
        dataDemissao: colaborador.dataDemissao || null
      };

      let savedColaborador;
      if (colaborador.id && colaboradores?.some(c => c.id === colaborador.id)) {
        // Atualizar existente
        savedColaborador = await apiPut(`/colaboradores/${colaborador.id}`, payload);
        
        // Salvar afastamentos - apenas os novos (IDs temporários gerados com crypto.randomUUID no frontend)
        if (colaborador.afastamentos && colaborador.afastamentos.length > 0) {
          const afastamentosExistentes = initialColaboradores.find(c => c.id === colaborador.id)?.afastamentos || [];
          const existingIds = new Set(afastamentosExistentes.map(a => a.id));
          
          for (const afastamento of colaborador.afastamentos) {
            if (!existingIds.has(afastamento.id)) {
              // Novo afastamento
              await apiPost(`/colaboradores/${savedColaborador.id}/afastamentos`, {
                tipoAfastamentoId: afastamento.tipoAfastamentoId,
                inicialProvavel: afastamento.inicialProvavel,
                finalProvavel: afastamento.finalProvavel,
                inicialEfetivo: afastamento.inicialEfetivo,
                finalEfetivo: afastamento.finalEfetivo
              });
            }
          }
        }
        
        // Salvar habilidades - apenas as novas
        if (colaborador.habilidades && colaborador.habilidades.length > 0) {
          const habilidadesExistentes = initialColaboradores.find(c => c.id === colaborador.id)?.habilidades || [];
          const existingIds = new Set(habilidadesExistentes.map(h => h.id));
          
          for (const habilidade of colaborador.habilidades) {
            if (!existingIds.has(habilidade.id)) {
              // Nova habilidade
              await apiPost(`/colaboradores/${savedColaborador.id}/habilidades`, {
                habilidadeId: habilidade.habilidadeId,
                nivelDeclarado: habilidade.nivelDeclarado,
                nivelAvaliado: habilidade.nivelAvaliado,
                dataInicio: habilidade.dataInicio,
                dataTermino: habilidade.dataTermino
              });
            }
          }
        }
        
        // Salvar avaliações - apenas as novas
        if (colaborador.avaliacoes && colaborador.avaliacoes.length > 0) {
          const avaliacoesExistentes = initialColaboradores.find(c => c.id === colaborador.id)?.avaliacoes || [];
          const existingIds = new Set(avaliacoesExistentes.map(a => a.id));
          
          for (const avaliacao of colaborador.avaliacoes) {
            if (!existingIds.has(avaliacao.id)) {
              // Nova avaliação
              await apiPost(`/colaboradores/${savedColaborador.id}/avaliacoes`, {
                dataAvaliacao: avaliacao.dataAvaliacao,
                resultadosEntregas: avaliacao.resultadosEntregas,
                competenciasTecnicas: avaliacao.competenciasTecnicas,
                qualidadeSeguranca: avaliacao.qualidadeSeguranca,
                comportamentoCultura: avaliacao.comportamentoCultura,
                evolucaoAprendizado: avaliacao.evolucaoAprendizado,
                motivo: avaliacao.motivo,
                dataConversa: avaliacao.dataConversa
              });
            }
          }
        }
        
        setColaboradores((current) => {
          const currentList = current || [];
          return currentList.map(c => c.id === colaborador.id ? {...savedColaborador, afastamentos: colaborador.afastamentos, habilidades: colaborador.habilidades, avaliacoes: colaborador.avaliacoes} : c);
        });
        toast.success('Colaborador atualizado com sucesso!');
      } else {
        // Criar novo
        savedColaborador = await apiPost('/colaboradores', payload);
        
        // Salvar afastamentos
        if (colaborador.afastamentos && colaborador.afastamentos.length > 0) {
          for (const afastamento of colaborador.afastamentos) {
            await apiPost(`/colaboradores/${savedColaborador.id}/afastamentos`, {
              tipoAfastamentoId: afastamento.tipoAfastamentoId,
              inicialProvavel: afastamento.inicialProvavel,
              finalProvavel: afastamento.finalProvavel,
              inicialEfetivo: afastamento.inicialEfetivo,
              finalEfetivo: afastamento.finalEfetivo
            });
          }
        }
        
        // Salvar habilidades
        if (colaborador.habilidades && colaborador.habilidades.length > 0) {
          for (const habilidade of colaborador.habilidades) {
            await apiPost(`/colaboradores/${savedColaborador.id}/habilidades`, {
              habilidadeId: habilidade.habilidadeId,
              nivelDeclarado: habilidade.nivelDeclarado,
              nivelAvaliado: habilidade.nivelAvaliado,
              dataInicio: habilidade.dataInicio,
              dataTermino: habilidade.dataTermino
            });
          }
        }
        
        // Salvar avaliações
        if (colaborador.avaliacoes && colaborador.avaliacoes.length > 0) {
          for (const avaliacao of colaborador.avaliacoes) {
            await apiPost(`/colaboradores/${savedColaborador.id}/avaliacoes`, {
              dataAvaliacao: avaliacao.dataAvaliacao,
              resultadosEntregas: avaliacao.resultadosEntregas,
              competenciasTecnicas: avaliacao.competenciasTecnicas,
              qualidadeSeguranca: avaliacao.qualidadeSeguranca,
              comportamentoCultura: avaliacao.comportamentoCultura,
              evolucaoAprendizado: avaliacao.evolucaoAprendizado,
              motivo: avaliacao.motivo,
              dataConversa: avaliacao.dataConversa
            });
          }
        }
        
        setColaboradores((current) => {
          const currentList = current || [];
          return [...currentList, {...savedColaborador, afastamentos: colaborador.afastamentos, habilidades: colaborador.habilidades, avaliacoes: colaborador.avaliacoes}];
        });
        toast.success('Colaborador cadastrado com sucesso!');
      }
      
      setShowWizard(false);
      setIsEditing(false);
      setEditingColaborador(undefined);
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar colaborador:', error);
      toast.error('Erro ao salvar colaborador');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      try {
        await apiDelete(`/colaboradores/${id}`);
        setColaboradores((current) => {
          const currentList = current || [];
          return currentList.filter(c => c.id !== id);
        });
        toast.success('Colaborador excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir colaborador');
        console.error(error);
      }
    }
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setIsEditing(true);
    setShowWizard(true);
    setSelectedColaborador(null);
  };

  const handleView = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
  };

  const handleBack = () => {
    setSelectedColaborador(null);
  };

  const handleNewColaborador = () => {
    setEditingColaborador(undefined);
    setIsEditing(false);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setIsEditing(false);
    setEditingColaborador(undefined);
  };

  const getTipoNome = (tipoId: string) => {
    const tipo = tiposAfastamento.find(t => t.id === tipoId);
    return tipo ? `${tipo.sigla} - ${tipo.descricao}` : tipoId;
  };

  const getHabilidadeNome = (habilidadeId: string) => {
    const habilidade = habilidades.find(h => h.id === habilidadeId);
    return habilidade ? habilidade.descricao : habilidadeId;
  };

  const handleGeneratePDF = (colaborador: Colaborador) => {
    try {
      toast.info('Gerando PDF...');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Cabeçalho
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Ficha do Colaborador', margin, yPosition);
      yPosition += 15;

      // Nome e Matrícula
      doc.setFontSize(16);
      doc.text(colaborador.nome, margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Matrícula: ${colaborador.matricula}`, margin, yPosition);
      yPosition += 12;

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Dados Básicos
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Dados Básicos', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const addField = (label: string, value: string) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 45, yPosition);
        yPosition += 6;
      };

      addField('Setor', colaborador.setor || 'N/A');
      addField('Data Admissão', colaborador.dataAdmissao ? formatarData(colaborador.dataAdmissao) : 'N/A');
      if (colaborador.dataDemissao) {
        addField('Data Demissão', formatarData(colaborador.dataDemissao));
      }
      yPosition += 8;

      // Afastamentos
      if (colaborador.afastamentos && colaborador.afastamentos.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Afastamentos', margin, yPosition);
        yPosition += 10;

        const afastamentosData = colaborador.afastamentos.map(afastamento => [
          getTipoNome(afastamento.tipoAfastamentoId),
          formatarData(afastamento.inicialProvavel),
          formatarData(afastamento.finalProvavel),
          afastamento.inicialEfetivo ? formatarData(afastamento.inicialEfetivo) : '-',
          afastamento.finalEfetivo ? formatarData(afastamento.finalEfetivo) : '-'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Tipo', 'Início Prev.', 'Fim Prev.', 'Início Efet.', 'Fim Efet.']],
          body: afastamentosData,
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          margin: { left: margin, right: margin },
          styles: { cellPadding: 3 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // Habilidades
      if (colaborador.habilidades && colaborador.habilidades.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Habilidades', margin, yPosition);
        yPosition += 10;

        const habilidadesData = colaborador.habilidades.map(hab => [
          getHabilidadeNome(hab.habilidadeId),
          hab.nivelDeclarado || '-',
          hab.nivelAvaliado || '-',
          hab.dataInicio ? formatarData(hab.dataInicio) : '-',
          hab.dataTermino ? formatarData(hab.dataTermino) : 'Atual'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Habilidade', 'Nível Declarado', 'Nível Avaliado', 'Data Início', 'Data Término']],
          body: habilidadesData,
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          margin: { left: margin, right: margin },
          styles: { cellPadding: 3 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // Avaliações
      if (colaborador.avaliacoes && colaborador.avaliacoes.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Avaliações de Desempenho', margin, yPosition);
        yPosition += 10;

        // Preparar dados da tabela
        const tableData = colaborador.avaliacoes.map((avaliacao, index) => [
          `${index + 1}`,
          formatarData(avaliacao.dataAvaliacao),
          avaliacao.resultadosEntregas?.toFixed(1) || 'N/A',
          avaliacao.competenciasTecnicas?.toFixed(1) || 'N/A',
          avaliacao.qualidadeSeguranca?.toFixed(1) || 'N/A',
          avaliacao.comportamentoCultura?.toFixed(1) || 'N/A',
          avaliacao.evolucaoAprendizado?.toFixed(1) || 'N/A',
          avaliacao.notaFinal?.toFixed(2) || 'N/A'
        ]);

        // Criar tabela
        (doc as any).autoTable({
          startY: yPosition,
          head: [[
            '#',
            'Data',
            'Result.',
            'Comp. Téc.',
            'Qual.',
            'Comport.',
            'Evol.',
            'Nota Final'
          ]],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [79, 70, 229],
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 8,
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
            7: { cellWidth: 30, fontStyle: 'bold' }
          },
          margin: { left: margin, right: margin },
          didDrawPage: (data: any) => {
            yPosition = data.cursor.y + 5;
          }
        });

        // Adicionar observações se existirem
        colaborador.avaliacoes.forEach((avaliacao, index) => {
          if (avaliacao.observacoes) {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = margin;
            }
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`Obs. Avaliação ${index + 1}:`, margin, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            const obsLines = doc.splitTextToSize(avaliacao.observacoes, pageWidth - 2 * margin);
            doc.text(obsLines, margin, yPosition);
            yPosition += obsLines.length * 5 + 5;
          }
        });

        yPosition += 5;
      }

      // Histórico de Alocação
      if (colaborador.historicoAlocacao && colaborador.historicoAlocacao.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico de Alocação em Projetos', margin, yPosition);
        yPosition += 10;

        const historicoData = colaborador.historicoAlocacao.map(hist => [
          hist.nomeProjeto || 'N/A',
          hist.papel || 'N/A',
          hist.dataInicio ? formatarData(hist.dataInicio) : '-',
          hist.dataTermino ? formatarData(hist.dataTermino) : 'Em andamento',
          `${hist.percentualAlocacao || 0}%`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Projeto', 'Papel', 'Data Início', 'Data Término', 'Alocação']],
          body: historicoData,
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          margin: { left: margin, right: margin },
          styles: { cellPadding: 3 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${totalPages}`,
          margin,
          pageHeight - 10
        );
        doc.setTextColor(0, 0, 0);
      }

      // Salvar PDF
      const fileName = `Colaborador-${colaborador.matricula}-${colaborador.nome.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  if (selectedColaborador) {
    return (
      <ColaboradorDetails
        colaborador={selectedColaborador}
        tiposAfastamento={tiposAfastamento}
        habilidades={habilidades}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />
    );
  }

  if (showWizard) {
    return (
      <ColaboradorWizard
        colaborador={editingColaborador}
        tiposAfastamento={tiposAfastamento}
        habilidades={habilidades}
        colaboradores={colaboradores || []}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground mt-2">
            Gestão de colaboradores, afastamentos e habilidades
          </p>
        </div>
      </div>

      <ColaboradoresDataTable
        colaboradores={colaboradores || []}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={handleNewColaborador}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
}
