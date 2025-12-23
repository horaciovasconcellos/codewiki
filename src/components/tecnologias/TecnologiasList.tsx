import { Tecnologia } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PencilSimple, 
  Trash, 
  Eye, 
  DeviceMobile, 
  TestTube, 
  RocketLaunch, 
  Cloud, 
  HardDrives 
} from '@phosphor-icons/react';
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

interface TecnologiasListProps {
  tecnologias: Tecnologia[];
  onSelect: (tecnologia: Tecnologia) => void;
  onEdit: (tecnologia: Tecnologia) => void;
  onDelete: (id: string) => void;
}

export function TecnologiasList({ tecnologias, onSelect, onEdit, onDelete }: TecnologiasListProps) {
  const handleDelete = (id: string, nome: string) => {
    onDelete(id);
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

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Frontend': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Backend': 'bg-green-500/10 text-green-700 border-green-200',
      'Banco de Dados': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'Infraestrutura': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'Devops': 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
      'Segurança': 'bg-red-500/10 text-red-700 border-red-200',
      'Analytics': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'Integração': 'bg-pink-500/10 text-pink-700 border-pink-200',
      'Inteligencia Artificial': 'bg-violet-500/10 text-violet-700 border-violet-200',
      'Aplicação Terceira': 'bg-gray-500/10 text-gray-700 border-gray-200',
      'Outras': 'bg-slate-500/10 text-slate-700 border-slate-200',
    };
    return colors[categoria] || colors['Outras'];
  };

  if (tecnologias.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma tecnologia encontrada</p>
          <p className="text-sm text-muted-foreground mt-2">
            Comece criando uma nova tecnologia ou ajuste seus filtros
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tecnologias.map((tecnologia) => (
        <Card 
          key={tecnologia.id} 
          className="hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate">{tecnologia.nome}</h3>
                  <Badge variant={getStatusVariant(tecnologia.status)}>
                    {tecnologia.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{tecnologia.sigla}</p>
                <Badge className={getCategoriaColor(tecnologia.categoria)} variant="outline">
                  {tecnologia.categoria}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium">{tecnologia.versaoRelease}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fornecedor</span>
                <span className="font-medium truncate ml-2">{tecnologia.fornecedorFabricante}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Licença</span>
                <span className="font-medium">{tecnologia.tipoLicenciamento}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Maturidade</span>
                <span className="font-medium">{tecnologia.maturidadeInterna}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Ambientes</p>
              <div className="flex gap-2 flex-wrap">
                {tecnologia.ambientes.dev && (
                  <Badge variant="secondary" className="text-xs">
                    <DeviceMobile size={12} className="mr-1" />
                    Dev
                  </Badge>
                )}
                {tecnologia.ambientes.qa && (
                  <Badge variant="secondary" className="text-xs">
                    <TestTube size={12} className="mr-1" />
                    QA
                  </Badge>
                )}
                {tecnologia.ambientes.prod && (
                  <Badge variant="secondary" className="text-xs">
                    <RocketLaunch size={12} className="mr-1" />
                    Prod
                  </Badge>
                )}
                {tecnologia.ambientes.cloud && (
                  <Badge variant="secondary" className="text-xs">
                    <Cloud size={12} className="mr-1" />
                    Cloud
                  </Badge>
                )}
                {tecnologia.ambientes.onPremise && (
                  <Badge variant="secondary" className="text-xs">
                    <HardDrives size={12} className="mr-1" />
                    On-Premise
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => onSelect(tecnologia)}
              >
                <Eye size={16} className="mr-2" />
                Detalhes
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(tecnologia);
                }}
              >
                <PencilSimple size={16} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash size={16} />
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
