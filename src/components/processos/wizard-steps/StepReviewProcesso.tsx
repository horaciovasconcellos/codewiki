import { NivelMaturidade, Frequencia, Complexidade, NormaProcesso } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StepReviewProcessoProps {
  identificacao: string;
  descricao: string;
  nivelMaturidade: NivelMaturidade;
  areaResponsavel: string;
  frequencia: Frequencia;
  duracaoMedia: number;
  complexidade: Complexidade;
  normas: NormaProcesso[];
}

export function StepReviewProcesso({
  identificacao,
  descricao,
  nivelMaturidade,
  areaResponsavel,
  frequencia,
  duracaoMedia,
  complexidade,
  normas,
}: StepReviewProcessoProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Revise os dados fundamentais do processo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Identificação</p>
              <p className="font-medium font-mono">{identificacao}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Área Responsável</p>
              <p className="font-medium">{areaResponsavel}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Descrição</p>
            <p className="font-medium">{descricao}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Nível de Maturidade</p>
              <Badge variant="default">{nivelMaturidade}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Frequência</p>
              <Badge variant="secondary">{frequencia}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Complexidade</p>
              <Badge variant="outline">{complexidade}</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground">Duração Média</p>
            <p className="font-medium">{duracaoMedia} horas</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Normas Aplicáveis</CardTitle>
          <CardDescription>
            {normas.length === 0 
              ? 'Nenhuma norma cadastrada' 
              : `${normas.length} norma${normas.length !== 1 ? 's' : ''} cadastrada${normas.length !== 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {normas.length > 0 ? (
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
                  {normas.map((norma) => (
                    <TableRow key={norma.id}>
                      <TableCell>
                        <Badge variant="outline">{norma.tipoNorma}</Badge>
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
            <p className="text-muted-foreground text-center py-8">
              Nenhuma norma foi adicionada a este processo
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
