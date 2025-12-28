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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MagnifyingGlass, Pencil, Trash, CaretLeft, CaretRight } from '@phosphor-icons/react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredComunicacoes = comunicacoes.filter((com) =>
    com.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    com.usoTipico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    com.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    com.tecnologias.some(tec => tec.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginação
  const totalPages = Math.ceil(filteredComunicacoes.length / pageSize);
  const paginatedComunicacoes = filteredComunicacoes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {paginatedComunicacoes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredComunicacoes.length)} de {filteredComunicacoes.length} comunicações
          {searchTerm && ` (filtradas de ${comunicacoes.length} total)`}
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
              {paginatedComunicacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma comunicação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedComunicacoes.map((com) => (
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <CaretLeft size={16} />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <CaretRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
