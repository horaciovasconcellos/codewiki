import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Eye, Pencil, Trash, MagnifyingGlass, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ReportBookWizard } from './ReportBookWizard';
import { useLogging } from '@/hooks/use-logging';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Report {
  id: string;
  nome: string;
  descricao: string;
  filtros: string;
  agrupamentos: string;
  status: 'Especificacao' | 'Aceito' | 'Rejeitado' | 'Obsoleto' | 'Substituido' | 'Producao';
  query: string;
  createdAt: string;
  updatedAt: string;
  totalColunas: number;
}

type SortField = 'nome' | 'status' | 'updatedAt' | 'totalColunas';
type SortOrder = 'asc' | 'desc';

export function ReportBookView() {
  const { logClick, logEvent, logError } = useLogging('reportbook-view');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [selectedReport, setSelectedReport] = useState<Report | undefined>(undefined);
  
  // Pagination and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      logEvent('fetch_reports_start', 'api_call');
      const response = await fetch(`${API_URL}/api/reports`);
      const data = await response.json();
      setReports(data);
      logEvent('fetch_reports_success', 'api_call', { count: data.length });
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      logError(error as Error, 'fetch_reports_error');
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    logClick('new_report_button');
    setSelectedReport(undefined);
    setView('wizard');
  };

  const handleEdit = async (report: Report) => {
    try {
      setLoading(true);
      logClick('edit_report', { report_id: report.id, report_name: report.nome });
      // Buscar o relatório completo com as colunas
      const response = await fetch(`${API_URL}/api/reports/${report.id}`);
      if (!response.ok) throw new Error('Erro ao buscar relatório');
      
      const fullReport = await response.json();
      console.log('Relatório completo carregado:', fullReport);
      
      setSelectedReport(fullReport);
      setView('wizard');
      logEvent('report_loaded_for_edit', 'navigation', { report_id: report.id });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      logError(error as Error, 'load_report_for_edit_error', { report_id: report.id });
      toast.error('Erro ao carregar relatório para edição');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este relatório?')) return;

    logClick('delete_report_confirm', { report_id: id });
    try {
      const response = await fetch(`${API_URL}/api/reports/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar relatório');

      toast.success('Relatório deletado com sucesso');
      logEvent('report_deleted', 'api_response', { report_id: id });
      loadReports();
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      logError(error as Error, 'delete_report_error', { report_id: id });
      toast.error('Erro ao deletar relatório');
    }
  };

  const handleSave = async (report: any) => {
    try {
      const method = report.id ? 'PUT' : 'POST';
      const url = report.id 
        ? `${API_URL}/api/reports/${report.id}` 
        : `${API_URL}/api/reports`;

      logEvent('save_report_start', 'api_call', { report_id: report.id || 'new', method });
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      if (!response.ok) throw new Error('Erro ao salvar relatório');

      const savedReport = await response.json();
      toast.success(`Relatório ${report.id ? 'atualizado' : 'criado'} com sucesso`);
      logEvent('report_saved', 'api_response', { 
        report_id: savedReport.id, 
        is_new: !report.id,
        columns_count: report.columns?.length 
      });
      setView('list');
      loadReports();
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      logError(error as Error, 'save_report_error', { report_id: report.id });
      toast.error('Erro ao salvar relatório');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Producao':
        return 'default';
      case 'Aceito':
        return 'secondary';
      case 'Especificacao':
        return 'outline';
      case 'Rejeitado':
        return 'destructive';
      case 'Obsoleto':
      case 'Substituido':
        return 'outline';
      default:
        return 'secondary';
    }
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

  const filteredAndSortedReports = useMemo(() => {
    let result = reports.filter(report => {
      const matchesSearch = 
        report.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'todos' || report.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'updatedAt') {
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return result;
  }, [reports, searchTerm, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedReports.length / pageSize);
  const paginatedReports = filteredAndSortedReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  if (view === 'wizard') {
    return (
      <ReportBookWizard
        report={selectedReport}
        onSave={handleSave}
        onCancel={() => setView('list')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ReportBook</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de relatórios e análise de similaridade
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>
                  {filteredAndSortedReports.length} de {reports.length} relatório(s)
                </CardDescription>
              </div>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2" />
                Novo Relatório
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Especificacao">Especificação</SelectItem>
                  <SelectItem value="Aceito">Aceito</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="Obsoleto">Obsoleto</SelectItem>
                  <SelectItem value="Substituido">Substituído</SelectItem>
                  <SelectItem value="Producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Counter and Clear */}
            {(searchTerm || filterStatus !== 'todos') && (
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span>
                  {filteredAndSortedReports.length} resultado(s) encontrado(s)
                </span>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando relatórios...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">Nenhum relatório cadastrado</p>
                <p className="text-sm">Clique em "Novo Relatório" para começar</p>
              </div>
            ) : filteredAndSortedReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">Nenhum relatório encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleSort('nome')}
                        >
                          <div className="flex items-center">
                            Nome
                            {getSortIcon('nome')}
                          </div>
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead 
                          className="text-center cursor-pointer select-none"
                          onClick={() => handleSort('totalColunas')}
                        >
                          <div className="flex items-center justify-center">
                            Colunas
                            {getSortIcon('totalColunas')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-center cursor-pointer select-none"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center justify-center">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-center cursor-pointer select-none"
                          onClick={() => handleSort('updatedAt')}
                        >
                          <div className="flex items-center justify-center">
                            Atualizado
                            {getSortIcon('updatedAt')}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReports.map((report) => (
                        <TableRow key={report.id} className="hover:bg-gray-100 data-[state=selected]:bg-gray-100">
                          <TableCell className="font-medium">{report.nome}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {report.descricao}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{report.totalColunas}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getStatusBadgeVariant(report.status)}>
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {new Date(report.updatedAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(report)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(report.id)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Itens por página:
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
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
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        Primeira
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Última
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
