import { useState } from 'react';
import { CapacidadeNegocio } from '@/lib/types';
import { CapacidadeForm } from './CapacidadeForm';
import { CapacidadesTable } from './CapacidadesTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

interface CapacidadesViewProps {
  capacidades: CapacidadeNegocio[];
  onCapacidadeSave: (capacidade: CapacidadeNegocio) => Promise<void>;
  onCapacidadeDelete: (id: string) => Promise<void>;
}

export function CapacidadesView({ capacidades, onCapacidadeSave, onCapacidadeDelete }: CapacidadesViewProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Capacidades de Negócio</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciamento de capacidades de negócio e cobertura estratégica
            </p>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Capacidades de Negócio</CardTitle>
                <CardDescription>
                  Configure as capacidades de negócio com seus níveis e categorias
                </CardDescription>
              </div>
              <CapacidadeForm
                capacidades={capacidades}
                onSave={onCapacidadeSave}
              />
            </div>
          </CardHeader>
          <CardContent>
              <CapacidadesTable
                capacidades={capacidades}
                onCapacidadeSave={onCapacidadeSave}
                onCapacidadeDelete={onCapacidadeDelete}
              />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
