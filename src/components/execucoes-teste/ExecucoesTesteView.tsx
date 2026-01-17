import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { ExecucaoTeste, CasoTeste, Colaborador, Aplicacao } from '@/lib/types';
import { ExecucaoTesteWizard } from './ExecucaoTesteWizard';
import { ExecucoesTesteDataTable } from './ExecucoesTesteDataTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface ExecucoesTesteViewProps {
  colaboradores: Colaborador[];
  aplicacoes: Aplicacao[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ExecucoesTesteView({ colaboradores, aplicacoes }: ExecucoesTesteViewProps) {
  const { logEvent, logError } = useLogging('ExecucoesTesteView');
  
  const [execucoes, setExecucoes] = useState<ExecucaoTeste[]>([]);
  const [casosTeste, setCasosTeste] = useState<CasoTeste[]>([]);
  const [selectedAplicacaoId, setSelectedAplicacaoId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingExecucao, setEditingExecucao] = useState<ExecucaoTeste | undefined>();

  // Carregar casos de teste quando uma aplicação for selecionada
  useEffect(() => {
    if (selectedAplicacaoId) {
      loadCasosTeste();
      loadExecucoes();
    } else {
      setCasosTeste([]);
      setExecucoes([]);
    }
  }, [selectedAplicacaoId]);

  const loadCasosTeste = async () => {
    try {
      const response = await fetch(`${API_URL}/api/casos-teste?aplicacaoId=${selectedAplicacaoId}`);
      if (!response.ok) throw new Error('Erro ao carregar casos de teste');
      const data = await response.json();
      setCasosTeste(data);
      logEvent('Casos de teste carregados', 'view', { count: data.length });
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao carregar casos de teste'), 'loadCasosTeste');
      toast.error('Erro ao carregar casos de teste');
    }
  };

  const loadExecucoes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/execucoes-teste?aplicacaoId=${selectedAplicacaoId}`);
      if (!response.ok) throw new Error('Erro ao carregar execuções');
      const data = await response.json();
      setExecucoes(data);
      logEvent('Execuções carregadas', 'view', { count: data.length });
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao carregar execuções'), 'loadExecucoes');
      toast.error('Erro ao carregar execuções de teste');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    if (!selectedAplicacaoId) {
      toast.error('Selecione uma aplicação primeiro');
      return;
    }
    setEditingExecucao(undefined);
    setShowWizard(true);
  };

  const handleEdit = (execucao: ExecucaoTeste) => {
    setEditingExecucao(execucao);
    setShowWizard(true);
  };

  const handleSave = async (execucaoData: Partial<ExecucaoTeste>, arquivo?: File) => {
    try {
      const formData = new FormData();
      
      // Adicionar campos da execução
      Object.entries(execucaoData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Adicionar arquivo se existir
      if (arquivo) {
        formData.append('arquivo', arquivo);
      }

      const url = editingExecucao 
        ? `${API_URL}/api/execucoes-teste/${editingExecucao.id}`
        : `${API_URL}/api/execucoes-teste`;
      
      const method = editingExecucao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar execução');
      }

      const savedExecucao = await response.json();

      if (editingExecucao) {
        setExecucoes(execucoes.map(e => e.id === savedExecucao.id ? savedExecucao : e));
        logEvent('Execução atualizada', 'update', { id: savedExecucao.id });
        toast.success('Execução atualizada com sucesso');
      } else {
        setExecucoes([savedExecucao, ...execucoes]);
        logEvent('Execução criada', 'create', { id: savedExecucao.id });
        toast.success('Execução registrada com sucesso');
      }

      setShowWizard(false);
      setEditingExecucao(undefined);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao salvar execução'), 'handleSave');
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar execução');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/execucoes-teste/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir execução');
      }

      setExecucoes(execucoes.filter(e => e.id !== id));
      logDelete('Execução excluída', { id });
      toast.success('Execução excluída com sucesso');
    } catch (error) {
      logError('Erro ao excluir execução', error);
      toast.error('Erro ao excluir execução');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/execucoes-teste/${id}/download`);
      
      if (!response.ok) {
        throw new Error('Erro ao fazer download do arquivo');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'evidencia.pdf';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();

      logEvent('Arquivo baixado', 'action', { id, filename });
      toast.success('Download concluído');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao fazer download'), 'handleDownload');
      toast.error('Erro ao fazer download do arquivo');
    }
  };

  const selectedApp = aplicacoes.find(app => app.id === selectedAplicacaoId);

  // Se estiver mostrando o wizard, renderizar apenas ele
  if (showWizard) {
    return (
      <ExecucaoTesteWizard
        onClose={() => {
          setShowWizard(false);
          setEditingExecucao(undefined);
        }}
        onSave={handleSave}
        execucao={editingExecucao}
        casosTeste={casosTeste}
        colaboradores={colaboradores}
        aplicacaoId={selectedAplicacaoId}
        aplicacaoNome={selectedApp?.sigla}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Execução de Testes</h1>
          <p className="text-muted-foreground mt-2">
            Registro e rastreabilidade de execuções de teste
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md">
            <Label htmlFor="aplicacao-select">Selecione a Aplicação</Label>
            <Select
              value={selectedAplicacaoId}
              onValueChange={setSelectedAplicacaoId}
            >
              <SelectTrigger id="aplicacao-select" className="mt-2">
                <SelectValue placeholder="Selecione uma aplicação..." />
              </SelectTrigger>
              <SelectContent>
                {aplicacoes.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedAplicacaoId && (
        <>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando execuções de teste...
            </div>
          ) : (
            <ExecucoesTesteDataTable
              execucoes={execucoes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNew={handleNew}
              onDownload={handleDownload}
            />
          )}
        </>
      )}
    </div>
  );
}
