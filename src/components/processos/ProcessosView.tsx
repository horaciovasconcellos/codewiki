import { useState } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { ProcessoNegocio } from '@/lib/types';
import { ProcessoWizard } from './ProcessoWizard';
import { ProcessosList } from './ProcessosList';
import { ProcessoDetails } from './ProcessoDetails';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { toast } from 'sonner';

interface ProcessosViewProps {}

export function ProcessosView({}: ProcessosViewProps) {
  const { data: processos, refetch } = useApi<ProcessoNegocio[]>('/processos-negocio', []);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoNegocio | null>(null);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoNegocio | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaturidade, setFilterMaturidade] = useState<string>('all');
  const [filterComplexidade, setFilterComplexidade] = useState<string>('all');

  const handleSave = async (processo: ProcessoNegocio) => {
    try {
      if (editingProcesso) {
        await apiPut(`/processos-negocio/${processo.id}`, processo);
        toast.success('Processo atualizado com sucesso!');
      } else {
        await apiPost('/processos-negocio', processo);
        toast.success('Processo criado com sucesso!');
      }
      setShowWizard(false);
      setEditingProcesso(undefined);
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar processo');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/processos-negocio/${id}`);
      toast.success('Processo excluído com sucesso!');
      setSelectedProcesso(null);
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir processo');
      console.error(error);
    }
  };

  const handleEdit = (processo: ProcessoNegocio) => {
    setEditingProcesso(processo);
    setShowWizard(true);
    setSelectedProcesso(null);
  };

  const handleNewProcesso = () => {
    setEditingProcesso(undefined);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingProcesso(undefined);
  };

  const filteredProcessos = (processos || []).filter(proc => {
    const matchesSearch = 
      proc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.identificacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.areaResponsavel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMaturidade = filterMaturidade === 'all' || proc.nivelMaturidade === filterMaturidade;
    const matchesComplexidade = filterComplexidade === 'all' || proc.complexidade === filterComplexidade;

    return matchesSearch && matchesMaturidade && matchesComplexidade;
  });

  if (showWizard) {
    return (
      <ProcessoWizard
        processo={editingProcesso}
        processos={processos || []}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  if (selectedProcesso) {
    return (
      <ProcessoDetails
        processo={selectedProcesso}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={() => setSelectedProcesso(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Processos de Negócio</h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie todos os processos de negócio da instituição
                </p>
              </div>
            </div>
            <Button onClick={handleNewProcesso} size="lg">
              <Plus className="mr-2" />
              Novo Processo
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por identificação, descrição ou área responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterMaturidade} onValueChange={setFilterMaturidade}>
                <SelectTrigger className="w-[200px]">
                  <Funnel className="mr-2" size={16} />
                  <SelectValue placeholder="Maturidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Repetível">Repetível</SelectItem>
                  <SelectItem value="Definido">Definido</SelectItem>
                  <SelectItem value="Gerenciado">Gerenciado</SelectItem>
                  <SelectItem value="Otimizado">Otimizado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterComplexidade} onValueChange={setFilterComplexidade}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Complexidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Muito Baixa">Muito Baixa</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Muito Alta">Muito Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total:</span>
              <Badge variant="secondary">{filteredProcessos.length}</Badge>
            </div>
            {(searchTerm || filterMaturidade !== 'all' || filterComplexidade !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
        logClick('button_clicked');
                  setSearchTerm('');
                  setFilterMaturidade('all');
                  setFilterComplexidade('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <ProcessosList
          processos={filteredProcessos}
          onSelect={setSelectedProcesso}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
