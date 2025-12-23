import { Tecnologia, Colaborador } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { TecnologiaForm } from './TecnologiaForm';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TecnologiasTableProps {
  tecnologias: Tecnologia[];
  colaboradores: Colaborador[];
  onTecnologiaSave: (tecnologia: Tecnologia) => void;
  onTecnologiaDelete: (id: string) => void;
}

export function TecnologiasTable({ tecnologias, colaboradores, onTecnologiaSave, onTecnologiaDelete }: TecnologiasTableProps) {
  const handleDelete = (id: string, nome: string) => {
    onTecnologiaDelete(id);
    toast.success(`Tecnologia "${nome}" excluída com sucesso`);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'default';
      case 'Em avaliação':
        return 'secondary';
      case 'Obsoleta':
        return 'outline';
      case 'Descontinuada':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getAmbientesText = (tecnologia: Tecnologia): string => {
    const ambientesAtivos: string[] = [];
    if (tecnologia.ambientes.dev) ambientesAtivos.push('Dev');
    if (tecnologia.ambientes.qa) ambientesAtivos.push('QA');
    if (tecnologia.ambientes.prod) ambientesAtivos.push('Prod');
    if (tecnologia.ambientes.cloud) ambientesAtivos.push('Cloud');
    if (tecnologia.ambientes.onPremise) ambientesAtivos.push('On-Premise');
    return ambientesAtivos.join(', ') || 'Nenhum';
  };

  if (tecnologias.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Nenhuma tecnologia cadastrada</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sigla</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Versão</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Licenciamento</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Ambientes</TableHead>
            <TableHead>Maturidade</TableHead>
            <TableHead>Suporte</TableHead>
            <TableHead className="w-32">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tecnologias.map((tecnologia) => (
            <TableRow key={tecnologia.id}>
              <TableCell className="font-medium">{tecnologia.sigla}</TableCell>
              <TableCell>{tecnologia.nome}</TableCell>
              <TableCell>{tecnologia.versaoRelease}</TableCell>
              <TableCell>{tecnologia.categoria}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(tecnologia.status)}>
                  {tecnologia.status}
                </Badge>
              </TableCell>
              <TableCell>{tecnologia.tipoLicenciamento}</TableCell>
              <TableCell>{tecnologia.fornecedorFabricante}</TableCell>
              <TableCell className="text-sm">{getAmbientesText(tecnologia)}</TableCell>
              <TableCell>{tecnologia.maturidadeInterna}</TableCell>
              <TableCell className="text-sm">{tecnologia.nivelSuporteInterno}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <TecnologiaForm
                    tecnologia={tecnologia}
                    tecnologias={tecnologias}
                    colaboradores={colaboradores}
                    onSave={onTecnologiaSave}
                    trigger={
                      <Button size="sm" variant="ghost">
                        <PencilSimple />
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a tecnologia "{tecnologia.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(tecnologia.id, tecnologia.nome)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}