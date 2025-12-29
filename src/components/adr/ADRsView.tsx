import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ADRWizard } from './ADRWizard';
import { ADRDataTable } from './ADRDataTable';
import { ADRView } from './ADRView';
import { ADR } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, FileText, FilePdf } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ADRsView() {
  const { logClick, logEvent, logError } = useLogging('adrs-view');
  const [adrs, setAdrs] = useState<ADR[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingADR, setEditingADR] = useState<ADR | undefined>(undefined);
  const [viewingADR, setViewingADR] = useState<ADR | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adrToDelete, setAdrToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchADRs();
  }, []);

  const fetchADRs = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/adrs`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar ADRs');
      }

      const data = await response.json();
      setAdrs(data);
    } catch (error: any) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar ADRs:', error);
      toast.error(error.message || 'Erro ao carregar ADRs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = async (adr?: ADR) => {
    if (adr) {
      // Buscar ADR completo com aplicações
      try {
        logEvent('api_call_start', 'api_call');

        const response = await fetch(`${API_URL}/api/adrs/${adr.id}`);
        if (response.ok) {
          const adrCompleto = await response.json();
          setEditingADR(adrCompleto);
        } else {
          setEditingADR(adr);
        }
      } catch (error) {
        logError(error as Error, 'error_caught');
      console.error('Erro ao carregar ADR completo:', error);
        setEditingADR(adr);
      }
    } else {
      setEditingADR(undefined);
    }
    setWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setEditingADR(undefined);
  };

  const handleWizardSuccess = () => {
    fetchADRs();
  };

  const handleView = async (adr: ADR) => {
    // Buscar ADR completo com aplicações
    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/adrs/${adr.id}`);
      if (response.ok) {
        const adrCompleto = await response.json();
        setViewingADR(adrCompleto);
      } else {
        setViewingADR(adr);
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar ADR completo:', error);
      setViewingADR(adr);
    }
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setViewingADR(null);
  };

  const handleDeleteClick = (id: string) => {
    setAdrToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adrToDelete) return;

    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/adrs/${adrToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir ADR');
      }

      toast.success('ADR excluído com sucesso');
      fetchADRs();
    } catch (error: any) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao excluir ADR:', error);
      toast.error(error.message || 'Erro ao excluir ADR');
    } finally {
      setDeleteDialogOpen(false);
      setAdrToDelete(null);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      toast.info('Gerando PDF...');

      // Buscar todos os ADRs completos com aplicações
      const adrsCompletos = await Promise.all(
        adrs.map(async (adr) => {
          try {
            logEvent('api_call_start', 'api_call');

            const response = await fetch(`${API_URL}/api/adrs/${adr.id}`);
            if (response.ok) {
              return await response.json();
            }
            return adr;
          } catch (error) {
            return adr;
          }
        })
      );

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);

      adrsCompletos.forEach((adr, index) => {
        if (index > 0) {
          doc.addPage();
        }

        let yPosition = margin;

        // Título
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`ADR-${adr.sequencia}`, margin, yPosition);
        yPosition += 10;

        // Descrição
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(adr.descricao || '', contentWidth);
        doc.text(splitDesc, margin, yPosition);
        yPosition += (splitDesc.length * 7) + 5;

        // Status e Data
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Status: `, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(adr.status, margin + 20, yPosition);
        yPosition += 6;

        if (adr.dataCriacao) {
          doc.setFont('helvetica', 'bold');
          doc.text(`Data: `, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(new Date(adr.dataCriacao).toLocaleDateString('pt-BR'), margin + 20, yPosition);
          yPosition += 10;
        }

        // Função auxiliar para adicionar seção
        const addSection = (title: string, content?: string) => {
          if (!content || !content.trim()) return;
          
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(title, margin, yPosition);
          yPosition += 7;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const splitContent = doc.splitTextToSize(content, contentWidth);
          
          splitContent.forEach((line: string) => {
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          
          yPosition += 5;
        };

        // Adicionar seções
        addSection('Contexto', adr.contexto);
        addSection('Decisão', adr.decisao);
        addSection('Justificativa', adr.justificativa);
        addSection('Consequências Positivas', adr.consequenciasPositivas);
        addSection('Consequências Negativas', adr.consequenciasNegativas);
        addSection('Riscos', adr.riscos);
        addSection('Alternativas Consideradas', adr.alternativasConsideradas);
        addSection('Compliance/Constitution', adr.complianceConstitution);
        addSection('Referências', adr.referencias);

        // Aplicações Associadas
        if (adr.aplicacoes && adr.aplicacoes.length > 0) {
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Aplicações Associadas', margin, yPosition);
          yPosition += 7;

          doc.setFontSize(9);
          adr.aplicacoes.forEach((app: any) => {
            if (yPosition > pageHeight - 25) {
              doc.addPage();
              yPosition = margin;
            }
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${app.aplicacaoSigla || 'N/A'}`, margin + 5, yPosition);
            doc.setFont('helvetica', 'normal');
            if (app.dataInicio) {
              doc.text(` - Início: ${new Date(app.dataInicio).toLocaleDateString('pt-BR')}`, margin + 35, yPosition);
            }
            yPosition += 5;
          });
        }

        // ADR Substituta
        if (adr.adrSubstitutaSequencia) {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          yPosition += 5;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`Substituído por: ADR-${adr.adrSubstitutaSequencia}`, margin, yPosition);
        }

        // Rodapé
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Gerado em ${new Date().toLocaleString('pt-BR')}`,
          margin,
          pageHeight - 10
        );
        doc.setTextColor(0, 0, 0);
      });

      // Salvar PDF
      doc.save(`ADRs-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle>Decisões Arquitetônicas (ADR)</CardTitle>
                <CardDescription>
                  Gerencie as decisões arquitetônicas e suas associações com aplicações
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGeneratePDF}
                disabled={adrs.length === 0}
              >
                <FilePdf size={20} className="mr-2" />
                Gerar PDF
              </Button>
              <Button onClick={() => handleOpenWizard()}>
                <Plus size={20} className="mr-2" />
                Novo ADR
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando ADRs...
            </div>
          ) : (
            <ADRDataTable
              adrs={adrs}
              onEdit={handleOpenWizard}
              onDelete={handleDeleteClick}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      <ADRWizard
        open={wizardOpen}
        onClose={handleCloseWizard}
        onSuccess={handleWizardSuccess}
        editingADR={editingADR}
      />

      <ADRView
        open={viewDialogOpen}
        onClose={handleCloseView}
        adr={viewingADR}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este ADR? Esta ação não pode ser desfeita e todas as associações com aplicações serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdrToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
