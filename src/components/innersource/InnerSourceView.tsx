import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { InnerSourceProject } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { InnerSourceForm } from '@/components/innersource/InnerSourceForm';
import { InnerSourceDataTable } from '@/components/innersource/InnerSourceDataTable';

export function InnerSourceView() {
  const { logClick, logEvent, logError } = useLogging('innersource-view');
  const [projects, setProjects] = useState<InnerSourceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<InnerSourceProject | undefined>();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/innersource-projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        toast.error('Erro ao carregar projetos InnerSource');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao carregar projetos'), 'load_projects_error');
      toast.error('Erro ao carregar projetos InnerSource');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    logClick('new-project-button');
    setEditingProject(undefined);
    setShowForm(true);
  };

  const handleEdit = (project: InnerSourceProject) => {
    logClick('edit-project-button', { projectId: project.id });
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto InnerSource?')) {
      return;
    }

    try {
      const response = await fetch(`/api/innersource-projects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Projeto InnerSource excluído com sucesso');
        logClick('delete-project-success');
        loadProjects();
      } else {
        toast.error('Erro ao excluir projeto InnerSource');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao excluir projeto'), 'delete_project_error');
      toast.error('Erro ao excluir projeto InnerSource');
    }
  };

  const handleSave = async (project: InnerSourceProject) => {
    try {
      const method = editingProject ? 'PUT' : 'POST';
      const url = editingProject 
        ? `/api/innersource-projects/${editingProject.id}` 
        : '/api/innersource-projects';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (response.ok) {
        toast.success(`Projeto InnerSource ${editingProject ? 'atualizado' : 'criado'} com sucesso`);
        logClick(editingProject ? 'update-project-success' : 'create-project-success');
        setShowForm(false);
        setEditingProject(undefined);
        loadProjects();
      } else {
        toast.error('Erro ao salvar projeto InnerSource');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Erro ao salvar projeto'), 'save_project_error');
      toast.error('Erro ao salvar projeto InnerSource');
    }
  };

  const handleCancel = () => {
    logClick('cancel-form-button');
    setShowForm(false);
    setEditingProject(undefined);
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="mr-2" size={16} />
          Voltar
        </Button>
        <InnerSourceForm
          project={editingProject}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos InnerSource</h1>
          <p className="text-muted-foreground">
            Gerencie os projetos InnerSource da organização
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2" size={16} />
          Novo Projeto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos InnerSource</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando projetos...</p>
            </div>
          ) : (
            <InnerSourceDataTable
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
