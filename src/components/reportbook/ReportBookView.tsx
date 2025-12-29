import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Pencil, Trash } from '@phosphor-icons/react';
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

export function ReportBookView() {
  const { logClick, logEvent, logError } = useLogging('reportbook-view');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [selectedReport, setSelectedReport] = useState<Report | undefined>(undefined);

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
                  {reports.length} relatório(s) cadastrado(s)
                </CardDescription>
              </div>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2" />
                Novo Relatório
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando relatórios...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">Nenhum relatório cadastrado</p>
                <p className="text-sm">Clique em "Novo Relatório" para começar</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Colunas</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Atualizado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
