import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PencilSimple, 
  Trash, 
  Plus, 
  FilePdf, 
  MagnifyingGlass,
  CaretUp,
  CaretDown,
  CaretUpDown
} from '@phosphor-icons/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PipelinesDataTableProps {
  pipelines: Pipeline[];
  loading: boolean;
  onNew: () => void;
  onEdit: (pipeline: Pipeline) => void;
  onDelete: (id: string) => void;
}

type SortField = 'nome' | 'status' | 'dataInicio' | 'dataTermino';
type SortOrder = 'asc' | 'desc';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <CaretUpDown size={16} className="ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <CaretUp size={16} className="ml-1" />
      : <CaretDown size={16} className="ml-1" />;
  };

  const filteredAndSortedPipelines = useMemo(() => {
    let result = pipelines.filter(pipeline => {
      const matchesSearch = 
        searchTerm === '' ||
        pipeline.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pipeline.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'todos' || 
        pipeline.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // Ordenação
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome;
          bValue = b.nome;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'dataInicio':
          aValue = a.dataInicio ? new Date(a.dataInicio).getTime() : 0;
          bValue = b.dataInicio ? new Date(b.dataInicio).getTime() : 0;
          break;
        case 'dataTermino':
          aValue = a.dataTermino ? new Date(a.dataTermino).getTime() : 0;
          bValue = b.dataTermino ? new Date(b.dataTermino).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [pipelines, searchTerm, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedPipelines.length / pageSize);
  const paginatedPipelines = filteredAndSortedPipelines.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'todos';

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
        <div className="space-y-4">
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

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por nome ou status..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Em avaliação">Em avaliação</SelectItem>
                  <SelectItem value="Obsoleta">Obsoleta</SelectItem>
                  <SelectItem value="Descontinuada">Descontinuada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedPipelines.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedPipelines.length)} de {filteredAndSortedPipelines.length} pipeline{filteredAndSortedPipelines.length !== 1 ? 's' : ''}
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedPipelines.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">
              {pipelines.length === 0 ? 'Nenhuma pipeline cadastrada' : 'Nenhuma pipeline encontrada'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('nome')}
                    >
                      Nome
                      {getSortIcon('nome')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('dataInicio')}
                    >
                      Data Início
                      {getSortIcon('dataInicio')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('dataTermino')}
                    >
                      Data Término
                      {getSortIcon('dataTermino')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPipelines.map((pipeline) => (
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

        {totalPages > 1 && (
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
