import { Runbook } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilSimple, Trash, BookOpen } from '@phosphor-icons/react';
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

interface RunbooksListProps {
  runbooks: Runbook[];
  onSelect: (runbook: Runbook) => void;
  onEdit: (runbook: Runbook) => void;
  onDelete: (id: string) => void;
}

const tipoColors: Record<string, string> = {
  'Procedimento de Rotina': 'bg-blue-500/10 text-blue-700 border-blue-300',
  'Contingência': 'bg-red-500/10 text-red-700 border-red-300',
  'Tratamento de Incidente': 'bg-orange-500/10 text-orange-700 border-orange-300',
  'Startup / Shutdown': 'bg-purple-500/10 text-purple-700 border-purple-300',
  'Deploy': 'bg-green-500/10 text-green-700 border-green-300',
  'Backup': 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
  'Restore': 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
  'Operação Programada': 'bg-pink-500/10 text-pink-700 border-pink-300',
};

export function RunbooksList({ runbooks, onSelect, onEdit, onDelete }: RunbooksListProps) {
  if (runbooks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen size={64} className="text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum runbook encontrado</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Comece criando seu primeiro runbook para documentar procedimentos operacionais.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {runbooks.map((runbook) => (
        <Card key={runbook.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">
                    {runbook.sigla}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2 cursor-pointer" onClick={() => onSelect(runbook)}>
                  {runbook.descricaoResumida}
                </CardTitle>
              </div>
            </div>
            <CardDescription className="line-clamp-2 mt-2">
              {runbook.finalidade}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className={tipoColors[runbook.tipoRunbook] || 'bg-gray-500/10 text-gray-700 border-gray-300'}>
                {runbook.tipoRunbook}
              </Badge>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onSelect(runbook)}
              >
                <BookOpen className="mr-2" size={16} />
                Visualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(runbook)}
              >
                <PencilSimple size={16} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o runbook "{runbook.sigla}"?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(runbook.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
