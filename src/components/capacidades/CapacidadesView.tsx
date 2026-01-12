import { useState } from 'react';
import { CapacidadeNegocio } from '@/lib/types';
import { CapacidadeForm } from './CapacidadeForm';
import { CapacidadesTable } from './CapacidadesTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

interface CapacidadesViewProps {
  capacidades: CapacidadeNegocio[];
  onCapacidadeSave: (capacidade: CapacidadeNegocio) => Promise<void>;
  onCapacidadeDelete: (id: string) => Promise<void>;
}

export function CapacidadesView({ capacidades, onCapacidadeSave, onCapacidadeDelete }: CapacidadesViewProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [editingCapacidade, setEditingCapacidade] = useState<CapacidadeNegocio | undefined>(undefined);

  const handleEdit = (capacidade: CapacidadeNegocio) => {
    setEditingCapacidade(capacidade);
    setShowWizard(true);
  };

  const handleNew = () => {
    setEditingCapacidade(undefined);
    setShowWizard(true);
  };

  const handleCancel = () => {
    setShowWizard(false);
    setEditingCapacidade(undefined);
  };

  const handleSave = async (capacidade: CapacidadeNegocio) => {
    await onCapacidadeSave(capacidade);
    setShowWizard(false);
    setEditingCapacidade(undefined);
  };

  if (showWizard) {
    return (
      <CapacidadeForm
        capacidades={capacidades}
        capacidadeToEdit={editingCapacidade}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Capacidades de Negócio</h1>
          <p className="text-muted-foreground mt-2">
            Gerenciamento de capacidades de negócio e cobertura estratégica
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2" />
          Nova Capacidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Capacidades de Negócio</CardTitle>
          <CardDescription>
            Configure as capacidades de negócio com seus níveis e categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CapacidadesTable
            capacidades={capacidades}
            onEdit={handleEdit}
            onCapacidadeSave={onCapacidadeSave}
            onCapacidadeDelete={onCapacidadeDelete}
          />
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
