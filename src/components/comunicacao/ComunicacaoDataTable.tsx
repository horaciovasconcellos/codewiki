import { useState } from 'react';
import { Comunicacao } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MagnifyingGlass, Pencil, Trash } from '@phosphor-icons/react';

interface ComunicacaoDataTableProps {
  comunicacoes: Comunicacao[];
  onEdit: (comunicacao: Comunicacao) => void;
  onDelete: (id: string) => void;
}

export function ComunicacaoDataTable({
  comunicacoes,
  onEdit,
  onDelete,
}: ComunicacaoDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComunicacoes = comunicacoes.filter((com) =>
    com.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    com.usoTipico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    com.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    com.tecnologias.some(tec => tec.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Sincrono':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Assincrono':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Ambos':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por sigla, tipo, tecnologia ou uso típico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Sigla</TableHead>
              <TableHead className="w-[120px]">Tipo</TableHead>
              <TableHead className="min-w-[250px]">Tecnologias</TableHead>
              <TableHead>Uso Típico</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filteredComunicacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma comunicação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredComunicacoes.map((com) => (
                  <TableRow key={com.id}>
                    <TableCell className="font-medium">{com.sigla}</TableCell>
                    <TableCell>
                      <Badge className={getTipoBadgeColor(com.tipo)}>
                        {com.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {com.tecnologias.map((tec) => (
                          <Badge key={tec} variant="outline" className="text-xs">
                            {tec}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="line-clamp-2 text-sm">{com.usoTipico}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(com)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(com.id)}
                          title="Excluir"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredComunicacoes.length} comunicação(ões) encontrada(s)
          {searchTerm && ` de ${comunicacoes.length} total(is)`}
        </div>
      </div>
    );
  }
