import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProjetoSDD } from '@/types/sdd';
import { ProjetoSDDForm } from './ProjetoSDDForm';
import { ProjetoSDDDetail } from './ProjetoSDDDetail';
import { ProjetosSDDDataTable } from './ProjetosSDDDataTable';

export function DocumentacaoSDDView() {
  const [projetos, setProjetos] = useState<ProjetoSDD[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<ProjetoSDD | undefined>(undefined);
  const [selectedProjeto, setSelectedProjeto] = useState<ProjetoSDD | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    loadProjetos();
  }, []);

  const loadProjetos = async () => {
    try {
      const response = await fetch('/api/sdd/projetos');
      if (!response.ok) throw new Error('Erro ao carregar projetos');
      const data = await response.json();
      setProjetos(data);
    } catch (error) {
      toast.error('Erro ao carregar projetos SDD');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadProjetos();
    setShowForm(false);
    setEditingProjeto(undefined);
  };

  const handleEdit = (projeto: ProjetoSDD) => {
    setEditingProjeto(projeto);
    setShowForm(true);
  };

  const handleDelete = async (projeto: ProjetoSDD) => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${projeto.nome_projeto}"?`)) {
      try {
        const response = await fetch(`/api/sdd/projetos/${projeto.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir projeto');
        toast.success('Projeto excluído com sucesso!');
        loadProjetos();
      } catch (error) {
        toast.error('Erro ao excluir projeto');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProjeto(undefined);
  };

  const handleNew = () => {
    setEditingProjeto(undefined);
    setShowForm(true);
  };

  const handleViewDetail = (projeto: ProjetoSDD) => {
    setSelectedProjeto(projeto);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProjeto(null);
    loadProjetos();
  };

  if (viewMode === 'detail' && selectedProjeto) {
    return <ProjetoSDDDetail projeto={selectedProjeto} onBack={handleBackToList} />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Documentação SDD</h1>
            <p className="text-muted-foreground mt-2">
              Spec-Driven Development - Documentação estruturada e rastreável dos seus projetos
            </p>
          </div>
        </div>

        <Separator />

        {showForm ? (
          <ProjetoSDDForm
            projeto={editingProjeto}
            onClose={handleCancel}
            onSave={handleSave}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Projetos SDD</CardTitle>
                  <CardDescription>
                    Gerencie a documentação dos seus projetos com integração a ferramentas de IA.
                    <br />
                    <strong>Dica:</strong> Clique no ícone do olho 👁️ para acessar Requisitos, Tarefas e ADRs do projeto.
                  </CardDescription>
                </div>
                <Button onClick={handleNew}>
                  <Plus className="mr-2" size={16} />
                  Novo Projeto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProjetosSDDDataTable
                projetos={projetos}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleViewDetail}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
