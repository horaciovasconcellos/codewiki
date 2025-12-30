import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Script } from '@/lib/types';
import { ScriptWizard } from './ScriptWizard';
import { ScriptsTable } from './ScriptsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ScriptsViewProps {}

export function ScriptsView({}: ScriptsViewProps) {
  const { logEvent, logError } = useLogging('scripts-view');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      console.log('[ScriptsView] loadScripts - Iniciando...');
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch('/api/scripts');
      console.log('[ScriptsView] loadScripts - Response status:', response.status);
      if (!response.ok) throw new Error('Erro ao carregar scripts');
      const data = await response.json();
      console.log('[ScriptsView] loadScripts - Data recebida:', data.length, 'scripts');
      console.log('[ScriptsView] loadScripts - Primeiros 3 scripts:', data.slice(0, 3));
      setScripts(data);
      console.log('[ScriptsView] loadScripts - Estado atualizado!');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar scripts:', error);
      toast.error('Não foi possível carregar os scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleScriptSave = async (script: Script, arquivo?: File) => {
    try {
      const existe = scripts.find(s => s.id === script.id);
      
      // Se há arquivo, fazer upload via FormData
      if (arquivo && arquivo instanceof File) {
        console.log('[ScriptsView] BRANCH: Com arquivo (FormData)');
        const formData = new FormData();
        formData.append('arquivo', arquivo);
        formData.append('data', JSON.stringify(script));

        const url = existe ? `/api/scripts/${script.id}` : '/api/scripts';
        const method = existe ? 'PUT' : 'POST';

        console.log('[ScriptsView] Enviando com arquivo - URL:', url, 'Method:', method);
        logEvent('api_call_start', 'api_call');

        const response = await fetch(url, {
          method,
          body: formData
        });

        console.log('[ScriptsView] Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[ScriptsView] Erro na resposta:', errorData);
          throw new Error('Erro ao salvar script');
        }
      } else {
        console.log('[ScriptsView] BRANCH: Sem arquivo (JSON)');
        // Sem arquivo, enviar apenas JSON
        const url = existe ? `/api/scripts/${script.id}` : '/api/scripts';
        const method = existe ? 'PUT' : 'POST';

        console.log('[ScriptsView] Enviando sem arquivo - URL:', url, 'Method:', method);
        console.log('[ScriptsView] Body JSON:', JSON.stringify(script));
        logEvent('api_call_start', 'api_call');

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(script)
        });

        console.log('[ScriptsView] Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[ScriptsView] Erro na resposta:', errorData);
          throw new Error('Erro ao salvar script');
        }
        
        const result = await response.json();
        console.log('[ScriptsView] Sucesso! Resultado:', result);
      }

      toast.success(`Script ${existe ? 'atualizado' : 'criado'} com sucesso`);
      console.log('[ScriptsView] Fechando formulário e recarregando lista');
      setShowForm(false);
      setEditingScript(null);

      await loadScripts();
      console.log('[ScriptsView] Lista recarregada com sucesso');
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar script:', error);
      toast.error('Não foi possível salvar o script');
    }
  };

  const handleScriptDelete = async (id: string) => {
    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`/api/scripts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar script');

      toast.success('Script deletado com sucesso');

      await loadScripts();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao deletar script:', error);
      toast.error('Não foi possível deletar o script');
    }
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingScript(null);
  };

  const handleNewScript = () => {
    setEditingScript(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <ScriptWizard
        scripts={scripts}
        onSave={handleScriptSave}
        onCancel={handleCancel}
        editingScript={editingScript || undefined}
      />
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scripts</CardTitle>
              <CardDescription>
                Gerencie os scripts de automação, administração e infraestrutura
              </CardDescription>
            </div>
            <Button onClick={handleNewScript}>
              <Plus className="mr-2" weight="bold" />
              Novo Script
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScriptsTable
            scripts={scripts}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleScriptDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
