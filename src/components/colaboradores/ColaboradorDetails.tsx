import { Colaborador, TipoAfastamento, Habilidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PencilSimple, Trash, Calendar, IdentificationCard, Briefcase, Users } from '@phosphor-icons/react';
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
import { formatarData } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColaboradorDetailsProps {
  colaborador: Colaborador;
  tiposAfastamento: TipoAfastamento[];
  habilidades: Habilidade[];
  onEdit: (colaborador: Colaborador) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function ColaboradorDetails({ 
  colaborador, 
  tiposAfastamento,
  habilidades,
  onEdit, 
  onDelete, 
  onBack 
}: ColaboradorDetailsProps) {
  const handleDelete = () => {
    onDelete(colaborador.id);
    toast.success(`Colaborador "${colaborador.nome}" excluído com sucesso`);
    onBack();
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

  const getTipoNome = (tipoId: string) => {
    const tipo = tiposAfastamento.find(t => t.id === tipoId);
    return tipo ? `${tipo.sigla} - ${tipo.descricao}` : tipoId;
  };

  const getHabilidadeNome = (habilidadeId: string) => {
    const habilidade = habilidades.find(h => h.id === habilidadeId);
    return habilidade ? habilidade.descricao : habilidadeId;
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Expert':
        return 'default';
      case 'Avançado':
        return 'secondary';
      case 'Intermediário':
        return 'outline';
      case 'Básico':
        return 'outline';
      default:
        return 'secondary';
    }
  };

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
                <h1 className="text-3xl font-bold">{colaborador.nome}</h1>
                <p className="text-muted-foreground mt-1">Matrícula: {colaborador.matricula}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onEdit(colaborador)}>
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
                      Tem certeza que deseja excluir o colaborador "{colaborador.nome}"? Esta ação não pode ser desfeita.
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

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="basicos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basicos">Dados Básicos</TabsTrigger>
            <TabsTrigger value="afastamentos">Afastamentos</TabsTrigger>
            <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
          </TabsList>

          <TabsContent value="basicos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users />
                  Informações do Colaborador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <InfoRow 
                    label="Matrícula" 
                    value={colaborador.matricula} 
                    icon={<IdentificationCard className="text-muted-foreground" />}
                  />
                  <InfoRow 
                    label="Nome" 
                    value={colaborador.nome} 
                    icon={<Users className="text-muted-foreground" />}
                  />
                  <InfoRow 
                    label="Setor" 
                    value={colaborador.setor} 
                    icon={<Briefcase className="text-muted-foreground" />}
                  />
                  <InfoRow 
                    label="Data de Admissão" 
                    value={formatarData(colaborador.dataAdmissao)} 
                    icon={<Calendar className="text-muted-foreground" />}
                  />
                  {colaborador.dataDemissao && (
                    <InfoRow 
                      label="Data de Demissão" 
                      value={formatarData(colaborador.dataDemissao)} 
                      icon={<Calendar className="text-muted-foreground" />}
                    />
                  )}
                  <InfoRow 
                    label="Status" 
                    value={
                      colaborador.dataDemissao ? (
                        <Badge variant="destructive">Demitido</Badge>
                      ) : (
                        <Badge variant="default">Ativo</Badge>
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="afastamentos">
            <Card>
              <CardHeader>
                <CardTitle>Afastamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {!colaborador.afastamentos || colaborador.afastamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum afastamento registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Afastamento</TableHead>
                        <TableHead>Inicial Provável</TableHead>
                        <TableHead>Final Provável</TableHead>
                        <TableHead>Inicial Efetivo</TableHead>
                        <TableHead>Final Efetivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaborador.afastamentos.map((afastamento) => (
                        <TableRow key={afastamento.id}>
                          <TableCell>{getTipoNome(afastamento.tipoAfastamentoId)}</TableCell>
                          <TableCell>{formatarData(afastamento.inicialProvavel)}</TableCell>
                          <TableCell>{formatarData(afastamento.finalProvavel)}</TableCell>
                          <TableCell>
                            {afastamento.inicialEfetivo ? formatarData(afastamento.inicialEfetivo) : '-'}
                          </TableCell>
                          <TableCell>
                            {afastamento.finalEfetivo ? formatarData(afastamento.finalEfetivo) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="habilidades">
            <Card>
              <CardHeader>
                <CardTitle>Habilidades do Colaborador</CardTitle>
              </CardHeader>
              <CardContent>
                {!colaborador.habilidades || colaborador.habilidades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma habilidade cadastrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Habilidade</TableHead>
                        <TableHead>Nível Declarado</TableHead>
                        <TableHead>Nível Avaliado</TableHead>
                        <TableHead>Data Início</TableHead>
                        <TableHead>Data Término</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaborador.habilidades.map((hab) => (
                        <TableRow key={hab.id}>
                          <TableCell>{getHabilidadeNome(hab.habilidadeId)}</TableCell>
                          <TableCell>
                            <Badge variant={getNivelColor(hab.nivelDeclarado)}>
                              {hab.nivelDeclarado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getNivelColor(hab.nivelAvaliado)}>
                              {hab.nivelAvaliado}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatarData(hab.dataInicio)}</TableCell>
                          <TableCell>
                            {hab.dataTermino ? formatarData(hab.dataTermino) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
