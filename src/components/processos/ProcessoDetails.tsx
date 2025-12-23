import { ProcessoNegocio } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, PencilSimple, Trash, Clock, FileText } from '@phosphor-icons/react';
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

interface ProcessoDetailsProps {
  processo: ProcessoNegocio;
  onEdit: (processo: ProcessoNegocio) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function ProcessoDetails({ processo, onEdit, onDelete, onBack }: ProcessoDetailsProps) {
  const handleDelete = () => {
    onDelete(processo.id);
    toast.success(`Processo "${processo.descricao}" excluído com sucesso`);
    onBack();
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

  const InfoRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="mr-2" />
                Voltar
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                    {processo.identificacao}
                  </span>
                  <Badge variant={getMaturidadeVariant(processo.nivelMaturidade)}>
                    {processo.nivelMaturidade}
                  </Badge>
                  <Badge className={getComplexidadeColor(processo.complexidade)} variant="outline">
                    {processo.complexidade}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold">{processo.descricao}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onEdit(processo)}>
                <PencilSimple className="mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2" />
                    Excluir
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
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Área Responsável" value={processo.areaResponsavel} />
                <InfoRow 
                  label="Frequência" 
                  value={<Badge variant="secondary">{processo.frequencia}</Badge>} 
                />
                <InfoRow 
                  label="Duração Média" 
                  value={
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-muted-foreground" />
                      <span>{processo.duracaoMedia} horas</span>
                    </div>
                  } 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Normas Aplicáveis
                  <Badge variant="secondary" className="ml-auto">
                    {processo.normas?.length || 0} {processo.normas?.length === 1 ? 'norma' : 'normas'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processo.normas && processo.normas.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Item da Norma</TableHead>
                          <TableHead>Obrigatoriedade</TableHead>
                          <TableHead>Data Início</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processo.normas.map((norma) => (
                          <TableRow key={norma.id}>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {norma.tipoNorma}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{norma.itemNorma}</TableCell>
                            <TableCell>{norma.obrigatoriedade}</TableCell>
                            <TableCell>{new Date(norma.dataInicio).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant={norma.status === 'Ativo' ? 'default' : 'secondary'}>
                                {norma.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhuma norma cadastrada para este processo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Identificação</p>
                  <p className="font-mono font-medium">{processo.identificacao}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Nível de Maturidade</p>
                  <Badge variant={getMaturidadeVariant(processo.nivelMaturidade)}>
                    {processo.nivelMaturidade}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Complexidade</p>
                  <Badge className={getComplexidadeColor(processo.complexidade)} variant="outline">
                    {processo.complexidade}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Frequência de Execução</p>
                  <p className="font-medium">{processo.frequencia}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tempo Médio</p>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <p className="font-medium">{processo.duracaoMedia} horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Normas Ativas</p>
                  <p className="text-2xl font-bold">
                    {processo.normas?.filter(n => n.status === 'Ativo').length || 0}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Total de Normas</p>
                  <p className="text-2xl font-bold">
                    {processo.normas?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
