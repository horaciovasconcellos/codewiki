import { useState } from 'react';
import { TipoAfastamento } from '@/lib/types';
import { TiposAfastamentoDataTable } from './TiposAfastamentoDataTable';
import { TiposAfastamentoForm } from './TiposAfastamentoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, FilePdf } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TiposAfastamentoViewProps {
  tiposAfastamento: TipoAfastamento[];
  onRefresh: () => void;
}

export function TiposAfastamentoView({ tiposAfastamento, onRefresh }: TiposAfastamentoViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAfastamento | undefined>(undefined);

  const handleSave = async (tipo: TipoAfastamento) => {
    try {
      if (editingTipo) {
        await apiPut(`/tipos-afastamento/${tipo.id}`, tipo);
        toast.success('Tipo de afastamento atualizado com sucesso!');
      } else {
        await apiPost('/tipos-afastamento', tipo);
        toast.success('Tipo de afastamento criado com sucesso!');
      }
      setShowForm(false);
      setEditingTipo(undefined);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao salvar tipo de afastamento');
      console.error(error);
    }
  };

  const handleEdit = (tipo: TipoAfastamento) => {
    setEditingTipo(tipo);
    setShowForm(true);
  };

  const handleDelete = async (tipo: TipoAfastamento) => {
    if (confirm(`Tem certeza que deseja excluir o tipo "${tipo.descricao}"?`)) {
      try {
        await apiDelete(`/tipos-afastamento/${tipo.id}`);
        toast.success('Tipo de afastamento excluído com sucesso!');
        onRefresh();
      } catch (error) {
        toast.error('Erro ao excluir tipo de afastamento');
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTipo(undefined);
  };

  const handleNew = () => {
    setEditingTipo(undefined);
    setShowForm(true);
  };

  const handleGeneratePDF = () => {
    try {
      toast.info('Gerando PDF...');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      let yPosition = margin;

      // Cabeçalho
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Tipos de Afastamento', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Lista completa de tipos de afastamento cadastrados no sistema', margin, yPosition);
      yPosition += 15;

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Preparar dados para a tabela
      const tableData = tiposAfastamento.map(tipo => [
        tipo.sigla,
        tipo.descricao,
        tipo.remunerado ? 'Sim' : 'Não',
        tipo.afetaFerias ? 'Sim' : 'Não',
        tipo.prazoMaximoDias ? `${tipo.prazoMaximoDias} dias` : 'Sem limite',
        tipo.exigeAtestado ? 'Sim' : 'Não'
      ]);

      // Gerar tabela
      autoTable(doc, {
        startY: yPosition,
        head: [['Sigla', 'Descrição', 'Remunerado', 'Afeta Férias', 'Prazo Máximo', 'Exige Atestado']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [71, 85, 105], 
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: margin, right: margin },
        styles: { 
          cellPadding: 4,
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 25 },  // Sigla
          1: { cellWidth: 'auto' }, // Descrição
          2: { cellWidth: 25 },  // Remunerado
          3: { cellWidth: 25 },  // Afeta Férias
          4: { cellWidth: 30 },  // Prazo Máximo
          5: { cellWidth: 30 }   // Exige Atestado
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Adicionar informações detalhadas de cada tipo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhes dos Tipos de Afastamento', margin, yPosition);
      yPosition += 10;

      tiposAfastamento.forEach((tipo, index) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Número e Sigla
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${tipo.sigla} - ${tipo.descricao}`, margin, yPosition);
        yPosition += 8;

        // Detalhes
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const details = [
          `Remunerado: ${tipo.remunerado ? 'Sim' : 'Não'}`,
          `Afeta Férias: ${tipo.afetaFerias ? 'Sim' : 'Não'}`,
          `Prazo Máximo: ${tipo.prazoMaximoDias ? `${tipo.prazoMaximoDias} dias` : 'Sem limite'}`,
          `Exige Atestado: ${tipo.exigeAtestado ? 'Sim' : 'Não'}`,
          `Permite Parcelamento: ${tipo.permiteParcelamento ? 'Sim' : 'Não'}`
        ];

        details.forEach(detail => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(`  • ${detail}`, margin + 5, yPosition);
          yPosition += 5;
        });

        // Observações
        if (tipo.observacoes) {
          yPosition += 2;
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setFont('helvetica', 'italic');
          doc.text('  Observações:', margin + 5, yPosition);
          yPosition += 5;
          
          const splitObs = doc.splitTextToSize(tipo.observacoes, pageWidth - (2 * margin) - 10);
          splitObs.forEach((line: string) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(`    ${line}`, margin + 5, yPosition);
            yPosition += 4;
          });
          doc.setFont('helvetica', 'normal');
        }

        yPosition += 8;
      });

      // Estatísticas no final
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Estatísticas', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const stats = [
        `Total de Tipos: ${tiposAfastamento.length}`,
        `Remunerados: ${tiposAfastamento.filter(t => t.remunerado).length}`,
        `Que Afetam Férias: ${tiposAfastamento.filter(t => t.afetaFerias).length}`,
        `Que Exigem Atestado: ${tiposAfastamento.filter(t => t.exigeAtestado).length}`,
        `Com Prazo Máximo Definido: ${tiposAfastamento.filter(t => t.prazoMaximoDias).length}`
      ];

      stats.forEach(stat => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`• ${stat}`, margin, yPosition);
        yPosition += 6;
      });

      // Rodapé em todas as páginas
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
      const fileName = `Tipos-Afastamento-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Afastamento</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de tipos de afastamento de colaboradores
            </p>
          </div>
        </div>

        <Separator />

        {showForm ? (
          <TiposAfastamentoForm
            tipo={editingTipo}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Tipos de Afastamento</CardTitle>
                  <CardDescription>
                    Configure os tipos de afastamento disponíveis no sistema
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleGeneratePDF}
                    disabled={tiposAfastamento.length === 0}
                  >
                    <FilePdf className="mr-2" size={16} />
                    Gerar PDF
                  </Button>
                  <Button onClick={handleNew}>
                    <Plus className="mr-2" size={16} />
                    Novo Tipo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TiposAfastamentoDataTable
                tiposAfastamento={tiposAfastamento}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
