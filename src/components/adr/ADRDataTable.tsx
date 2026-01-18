import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ADR } from '@/lib/types';
import { PencilSimple, Trash, FilePdf, MagnifyingGlass, Eye } from '@phosphor-icons/react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ADRDataTableProps {
  adrs: ADR[];
  onEdit: (adr: ADR) => void;
  onDelete: (id: string) => void;
  onView: (adr: ADR) => void;
}

const statusColorMap: Record<string, string> = {
  'Proposto': 'bg-blue-100 text-blue-800 border-blue-300',
  'Aceito': 'bg-green-100 text-green-800 border-green-300',
  'Rejeitado': 'bg-red-100 text-red-800 border-red-300',
  'Substituído': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Obsoleto': 'bg-gray-100 text-gray-800 border-gray-300',
  'Adiado/Retirado': 'bg-orange-100 text-orange-800 border-orange-300'
};

export function ADRDataTable({ adrs, onEdit, onDelete, onView }: ADRDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const generateADRPDF = (adr: ADR) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Função auxiliar para adicionar texto com quebra de linha
    const addTextBlock = (label: string, text: string | undefined, isBold = false) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Label
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      yPosition += 6;

      // Conteúdo
      doc.setFontSize(10);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      if (text && text.trim() !== '') {
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('Não informado', margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 5;
      }
      yPosition += 3;
    };

    // Cabeçalho
    doc.setFillColor(37, 99, 235); // bg-blue-600
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`ADR-${adr.sequencia}`, margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Decisão Arquitetônica', margin, 35);
    
    doc.setTextColor(0, 0, 0);
    yPosition = 55;

    // Descrição (título)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const descLines = doc.splitTextToSize(adr.descricao, contentWidth);
    descLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 5;

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Informações Gerais
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações Gerais', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Status
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(adr.status, margin + 25, yPosition);
    yPosition += 6;

    // Datas
    if (adr.dataCriacao) {
      doc.setFont('helvetica', 'bold');
      doc.text('Data de Criação:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(adr.dataCriacao), margin + 35, yPosition);
      yPosition += 6;
    }

    if (adr.dataAtualizacao) {
      doc.setFont('helvetica', 'bold');
      doc.text('Última Atualização:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(adr.dataAtualizacao), margin + 40, yPosition);
      yPosition += 6;
    }

    // ADR Substituta
    if (adr.adrSubstitutaSequencia) {
      doc.setFont('helvetica', 'bold');
      doc.text('Substituída por:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`ADR-${adr.adrSubstitutaSequencia}`, margin + 35, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Linha separadora
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Contexto
    addTextBlock('Contexto', adr.contexto);
    
    // Decisão
    addTextBlock('Decisão', adr.decisao, true);
    
    // Justificativa
    addTextBlock('Justificativa', adr.justificativa);
    
    // Consequências Positivas
    addTextBlock('Consequências Positivas', adr.consequenciasPositivas);
    
    // Consequências Negativas
    addTextBlock('Consequências Negativas', adr.consequenciasNegativas);
    
    // Riscos
    addTextBlock('Riscos', adr.riscos);
    
    // Alternativas Consideradas
    addTextBlock('Alternativas Consideradas', adr.alternativasConsideradas);
    
    // Compliance
    addTextBlock('Compliance/Constitution', adr.complianceConstitution);
    
    // Referências
    addTextBlock('Referências', adr.referencias);

    // Aplicações Associadas
    if (adr.aplicacoesCount && adr.aplicacoesCount > 0) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      
      yPosition += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Aplicações Associadas', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de aplicações: ${adr.aplicacoesCount}`, margin, yPosition);
      yPosition += 8;
    }

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        margin,
        pageHeight - 10
      );
    }

    // Salvar PDF
    doc.save(`ADR-${adr.sequencia}-${adr.descricao.substring(0, 30).replaceAll(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // Filtrar ADRs
  const filteredADRs = adrs.filter(adr => {
    const matchesSearch = 
      searchTerm === '' ||
      adr.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adr.sequencia.toString().includes(searchTerm);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      adr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredADRs.length / pageSize);
  const paginatedADRs = filteredADRs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <Input
            placeholder="Buscar por descrição ou sequência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Proposto">Proposto</SelectItem>
            <SelectItem value="Aceito">Aceito</SelectItem>
            <SelectItem value="Rejeitado">Rejeitado</SelectItem>
            <SelectItem value="Substituído">Substituído</SelectItem>
            <SelectItem value="Obsoleto">Obsoleto</SelectItem>
            <SelectItem value="Adiado/Retirado">Adiado/Retirado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        Mostrando {paginatedADRs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredADRs.length)} de {filteredADRs.length} ADRs
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[100px]">Sequência</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]">Data Criação</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[120px]">Substituta</TableHead>
              <TableHead className="w-[100px] text-center">Aplicações</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedADRs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum ADR encontrado com os filtros aplicados' 
                    : 'Nenhum ADR cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedADRs.map((adr) => (
                <TableRow key={adr.id} className="hover:bg-gray-100 data-[state=selected]:bg-gray-100">
                  <TableCell className="font-mono font-semibold">
                    ADR-{adr.sequencia}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={adr.descricao}>
                      {adr.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(adr.dataCriacao)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={statusColorMap[adr.status] || ''}
                    >
                      {adr.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {adr.adrSubstitutaSequencia ? (
                      <span className="font-mono text-sm">
                        ADR-{adr.adrSubstitutaSequencia}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {adr.aplicacoesCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(adr)}
                        title="Visualizar"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateADRPDF(adr)}
                        title="Gerar PDF"
                      >
                        <FilePdf size={16} className="text-red-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(adr)}
                        title="Editar"
                      >
                        <PencilSimple size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(adr.id)}
                        title="Excluir"
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
    </div>
  );
}
