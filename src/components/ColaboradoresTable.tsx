import { Colaborador, TipoAfastamento } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PencilSimple, UserCircle } from '@phosphor-icons/react';
import { ColaboradorForm } from './ColaboradorForm';

interface ColaboradoresTableProps {
  colaboradores: Colaborador[];
  tiposAfastamento: TipoAfastamento[];
  onColaboradorSave: (colaborador: Colaborador) => void;
}

export function ColaboradoresTable({ colaboradores, tiposAfastamento, onColaboradorSave }: ColaboradoresTableProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isDemitido = (colaborador: Colaborador) => {
    return !!colaborador.dataDemissao;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-36 font-semibold text-base h-12">Matrícula</TableHead>
            <TableHead className="font-semibold text-base h-12">Nome</TableHead>
            <TableHead className="font-semibold text-base h-12">Setor</TableHead>
            <TableHead className="font-semibold text-base h-12">Admissão</TableHead>
            <TableHead className="font-semibold text-base h-12">Demissão</TableHead>
            <TableHead className="font-semibold text-base h-12">Status</TableHead>
            <TableHead className="w-28 font-semibold text-base h-12">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colaboradores.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                <div className="flex flex-col items-center gap-4">
                  <UserCircle size={64} className="text-muted-foreground/50" />
                  <div>
                    <div className="font-medium text-lg">Nenhum colaborador cadastrado</div>
                    <div className="text-base mt-1">Clique em "Novo Colaborador" para começar</div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            colaboradores.map((colaborador) => (
              <TableRow
                key={colaborador.id}
                className={`h-16 ${isDemitido(colaborador) ? 'opacity-60' : ''}`}
              >
                <TableCell className="font-mono font-medium text-base">
                  {colaborador.matricula}
                </TableCell>
                <TableCell className="font-medium text-base">
                  {colaborador.nome}
                </TableCell>
                <TableCell className="text-base">{colaborador.setor}</TableCell>
                <TableCell className="text-base">{formatDate(colaborador.dataAdmissao)}</TableCell>
                <TableCell className="text-base">
                  {colaborador.dataDemissao ? (
                    formatDate(colaborador.dataDemissao)
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {isDemitido(colaborador) ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1">
                      Demitido
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1">
                      Ativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <ColaboradorForm
                    colaborador={colaborador}
                    colaboradores={colaboradores}
                    tiposAfastamento={tiposAfastamento}
                    onSave={onColaboradorSave}
                    trigger={
                      <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
