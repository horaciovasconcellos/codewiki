import { ProcessoNegocio } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PencilSimple, 
  Trash, 
  Eye
} from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';

interface ProcessosListProps {
  processos: ProcessoNegocio[];
  onSelect: (processo: ProcessoNegocio) => void;
  onEdit: (processo: ProcessoNegocio) => void;
  onDelete: (id: string) => void;
}

export function ProcessosList({ processos, onSelect, onEdit, onDelete }: ProcessosListProps) {
  const handleDelete = (id: string, descricao: string) => {
    onDelete(id);
    toast.success(`Processo "${descricao}" excluído com sucesso`);
  };

  const getMaturidadeVariant = (maturidade: string) => {
    switch (maturidade) {
      case 'Inicial':
        return 'outline';
      case 'Repetível':
        return 'secondary';
      case 'Definido':
        return 'default';
      case 'Gerenciado':
        return 'default';
      case 'Otimizado':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getComplexidadeColor = (complexidade: string) => {
    const colors: Record<string, string> = {
      'Muito Baixa': 'bg-green-500/10 text-green-700 border-green-200',
      'Baixa': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Média': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'Alta': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'Muito Alta': 'bg-red-500/10 text-red-700 border-red-200',
    };
    return colors[complexidade] || colors['Média'];
  };

  if (processos.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum processo encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Comece criando um novo processo ou ajuste seus filtros
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Identificação</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[150px]">Área Responsável</TableHead>
              <TableHead className="w-[120px]">Maturidade</TableHead>
              <TableHead className="w-[130px]">Complexidade</TableHead>
              <TableHead className="w-[110px]">Frequência</TableHead>
              <TableHead className="w-[100px]">Duração (h)</TableHead>
              <TableHead className="w-[80px] text-center">Normas</TableHead>
              <TableHead className="w-[140px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processos.map((processo) => (
              <TableRow key={processo.id} className="hover:bg-muted/50">
                <TableCell>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {processo.identificacao}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{processo.descricao}</TableCell>
                <TableCell>{processo.areaResponsavel}</TableCell>
                <TableCell>
                  <Badge variant={getMaturidadeVariant(processo.nivelMaturidade)}>
                    {processo.nivelMaturidade}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getComplexidadeColor(processo.complexidade)} variant="outline">
                    {processo.complexidade}
                  </Badge>
                </TableCell>
                <TableCell>{processo.frequencia}</TableCell>
                <TableCell className="text-center">{processo.duracaoMedia}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">
                    {processo.normas?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onSelect(processo)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onEdit(processo)}
                    >
                      <PencilSimple size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                        >
                          <Trash size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o processo "{processo.descricao}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(processo.id, processo.descricao)}>
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
    </Card>
  );
}
