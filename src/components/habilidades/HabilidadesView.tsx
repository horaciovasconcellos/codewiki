import { useState } from 'react';
import { Habilidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Plus } from '@phosphor-icons/react';
import { HabilidadeWizard } from './HabilidadeWizard';
import { HabilidadesTable } from './HabilidadesTable';

interface HabilidadesViewProps {
  habilidades: Habilidade[];
  onHabilidadeSave: (habilidade: Habilidade) => void;
  onHabilidadeDelete: (id: string) => void;
}

export function HabilidadesView({ habilidades, onHabilidadeSave, onHabilidadeDelete }: HabilidadesViewProps) {
  const [editingHabilidade, setEditingHabilidade] = useState<Habilidade | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const handleSave = (habilidade: Habilidade) => {
    onHabilidadeSave(habilidade);
    setShowWizard(false);
    setEditingHabilidade(null);
  };

  const handleEdit = (habilidade: Habilidade) => {
    setEditingHabilidade(habilidade);
    setShowWizard(true);
  };

  const handleCancel = () => {
    setShowWizard(false);
    setEditingHabilidade(null);
  };

  if (showWizard) {
    return (
      <HabilidadeWizard
        habilidade={editingHabilidade || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Habilidades</h1>
            <p className="text-muted-foreground mt-2">
              Cadastro e gerenciamento de habilidades técnicas e comportamentais
            </p>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Habilidades</CardTitle>
                <CardDescription>
                  Gerencie as habilidades por domínio, subcategoria e certificações relacionadas
                </CardDescription>
              </div>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="mr-2" />
                Nova Habilidade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <HabilidadesTable
              habilidades={habilidades}
              onEdit={handleEdit}
              onHabilidadeDelete={onHabilidadeDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
