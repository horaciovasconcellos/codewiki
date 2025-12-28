import { Pipeline } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilSimple, Trash, Plus, FilePdf } from '@phosphor-icons/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PipelinesDataTableProps {
  pipelines: Pipeline[];
  loading: boolean;
  onNew: () => void;
  onEdit: (pipeline: Pipeline) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'Ativa': 'bg-green-100 text-green-800',
  'Em avaliação': 'bg-yellow-100 text-yellow-800',
  'Obsoleta': 'bg-gray-100 text-gray-800',
  'Descontinuada': 'bg-red-100 text-red-800',
};

export function PipelinesDataTable({
  pipelines,
  loading,
  onNew,
  onEdit,
  onDelete,
}: PipelinesDataTableProps) {
  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Pipelines', 14, 20);
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    
    // Tabela
    const tableData = pipelines.map(p => [
      p.nome,
      p.status,
      formatDate(p.dataInicio),
      formatDate(p.dataTermino),
    ]);
    
    autoTable(doc, {
      startY: 35,
      head: [['Nome', 'Status', 'Data Início', 'Data Término']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    doc.save(`pipelines-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipelines</CardTitle>
          <CardDescription>Gerenciamento de pipelines de CI/CD</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pipelines</CardTitle>
            <CardDescription>Gerenciamento de pipelines de CI/CD</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} variant="outline" disabled={pipelines.length === 0}>
              <FilePdf className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button onClick={onNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pipeline
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pipelines.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Nenhuma pipeline cadastrada</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelines.map((pipeline) => (
                  <TableRow key={pipeline.id}>
                    <TableCell className="font-medium">{pipeline.nome}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[pipeline.status] || 'bg-gray-100 text-gray-800'}>
                        {pipeline.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(pipeline.dataInicio)}</TableCell>
                    <TableCell>{formatDate(pipeline.dataTermino)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(pipeline)}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(pipeline.id)}
                        >
                          <Trash className="h-4 w-4" />
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
