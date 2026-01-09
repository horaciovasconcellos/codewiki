import { Colaborador, TipoAfastamento, Habilidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PencilSimple, Trash, Calendar, IdentificationCard, Briefcase, Users, FilePdf } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ColaboradorDetailsProps {
  colaborador: Colaborador;
  tiposAfastamento: TipoAfastamento[];
  habilidades: Habilidade[];
  onEdit: (colaborador: Colaborador) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function ColaboradorDetails({ 
  colaborador, 
  tiposAfastamento,
  habilidades,
  onEdit, 
  onDelete, 
  onBack 
}: ColaboradorDetailsProps) {
  const handleDelete = () => {
    onDelete(colaborador.id);
    toast.success(`Colaborador "${colaborador.nome}" excluído com sucesso`);
    onBack();
  };

  const handleGeneratePDF = () => {
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
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  const getTipoNome = (tipoId: string) => {
    const tipo = tiposAfastamento.find(t => t.id === tipoId);
    return tipo ? `${tipo.sigla} - ${tipo.descricao}` : tipoId;
  };

  const getHabilidadeNome = (habilidadeId: string) => {
    const habilidade = habilidades.find(h => h.id === habilidadeId);
    return habilidade ? habilidade.descricao : habilidadeId;
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Expert':
        return 'default';
      case 'Avançado':
        return 'secondary';
      case 'Intermediário':
        return 'outline';
      case 'Básico':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{colaborador.nome}</h1>
                <p className="text-muted-foreground mt-1">Matrícula: {colaborador.matricula}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleGeneratePDF}>
                <FilePdf className="mr-2" />
                Gerar PDF
              </Button>
              <Button variant="outline" onClick={() => onEdit(colaborador)}>
                <PencilSimple className="mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o colaborador "{colaborador.nome}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="basicos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basicos">Dados Básicos</TabsTrigger>
            <TabsTrigger value="afastamentos">Afastamentos</TabsTrigger>
            <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
          </TabsList>

          <TabsContent value="basicos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users />
                  Informações do Colaborador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <InfoRow 
                    label="Matrícula" 
                    value={colaborador.matricula} 
                    icon={<IdentificationCard className="text-muted-foreground" />}
                  />
                  <InfoRow 
                    label="Nome" 
                    value={colaborador.nome} 
                    icon={<Users className="text-muted-foreground" />}
                  />
                  <InfoRow 
                    label="Setor" 
                    value={colaborador.setor} 
                    icon={<Briefcase className="text-muted-foreground" />}
                  />
                  <InfoRow 
                    label="Data de Admissão" 
                    value={formatarData(colaborador.dataAdmissao)} 
                    icon={<Calendar className="text-muted-foreground" />}
                  />
                  {colaborador.dataDemissao && (
                    <InfoRow 
                      label="Data de Demissão" 
                      value={formatarData(colaborador.dataDemissao)} 
                      icon={<Calendar className="text-muted-foreground" />}
                    />
                  )}
                  <InfoRow 
                    label="Status" 
                    value={
                      colaborador.dataDemissao ? (
                        <Badge variant="destructive">Demitido</Badge>
                      ) : (
                        <Badge variant="default">Ativo</Badge>
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="afastamentos">
            <Card>
              <CardHeader>
                <CardTitle>Afastamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {!colaborador.afastamentos || colaborador.afastamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum afastamento registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Afastamento</TableHead>
                        <TableHead>Inicial Provável</TableHead>
                        <TableHead>Final Provável</TableHead>
                        <TableHead>Inicial Efetivo</TableHead>
                        <TableHead>Final Efetivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaborador.afastamentos.map((afastamento) => (
                        <TableRow key={afastamento.id}>
                          <TableCell>{getTipoNome(afastamento.tipoAfastamentoId)}</TableCell>
                          <TableCell>{formatarData(afastamento.inicialProvavel)}</TableCell>
                          <TableCell>{formatarData(afastamento.finalProvavel)}</TableCell>
                          <TableCell>
                            {afastamento.inicialEfetivo ? formatarData(afastamento.inicialEfetivo) : '-'}
                          </TableCell>
                          <TableCell>
                            {afastamento.finalEfetivo ? formatarData(afastamento.finalEfetivo) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="habilidades">
            <Card>
              <CardHeader>
                <CardTitle>Habilidades do Colaborador</CardTitle>
              </CardHeader>
              <CardContent>
                {!colaborador.habilidades || colaborador.habilidades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma habilidade cadastrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Habilidade</TableHead>
                        <TableHead>Nível Declarado</TableHead>
                        <TableHead>Nível Avaliado</TableHead>
                        <TableHead>Data Início</TableHead>
                        <TableHead>Data Término</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaborador.habilidades.map((hab) => (
                        <TableRow key={hab.id}>
                          <TableCell>{getHabilidadeNome(hab.habilidadeId)}</TableCell>
                          <TableCell>
                            <Badge variant={getNivelColor(hab.nivelDeclarado)}>
                              {hab.nivelDeclarado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getNivelColor(hab.nivelAvaliado)}>
                              {hab.nivelAvaliado}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatarData(hab.dataInicio)}</TableCell>
                          <TableCell>
                            {hab.dataTermino ? formatarData(hab.dataTermino) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
