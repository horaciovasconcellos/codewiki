import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ADR } from '@/lib/types';
import { PencilSimple, Trash, DotsThree, Eye, MagnifyingGlass } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ADRDataTableProps {
  adrs: ADR[];
  onEdit: (adr: ADR) => void;
  onDelete: (id: string) => void;
  onView: (adr: ADR) => void;
}

const statusColorMap: Record<string, string> = {
  'Proposto': 'bg-blue-100 text-blue-800 border-blue-300',
  'Aceito': 'bg-green-100 text-green-800 border-green-300',
  'Rejeitado': 'bg-red-100 text-red-800 border-red-300',
  'Substituído': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Obsoleto': 'bg-gray-100 text-gray-800 border-gray-300',
  'Adiado/Retirado': 'bg-orange-100 text-orange-800 border-orange-300'
};

export function ADRDataTable({ adrs, onEdit, onDelete, onView }: ADRDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrar ADRs
  const filteredADRs = adrs.filter(adr => {
    const matchesSearch = 
      searchTerm === '' ||
      adr.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adr.sequencia.toString().includes(searchTerm);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      adr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <Input
            placeholder="Buscar por descrição ou sequência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('Proposto')}>
              Proposto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Aceito')}>
              Aceito
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Rejeitado')}>
              Rejeitado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Substituído')}>
              Substituído
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Obsoleto')}>
              Obsoleto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('Adiado/Retirado')}>
              Adiado/Retirado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        Exibindo {filteredADRs.length} de {adrs.length} ADRs
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Sequência</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]">Data Criação</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[120px]">Substituta</TableHead>
              <TableHead className="w-[100px] text-center">Aplicações</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredADRs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum ADR encontrado com os filtros aplicados' 
                    : 'Nenhum ADR cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredADRs.map((adr) => (
                <TableRow key={adr.id}>
                  <TableCell className="font-mono font-semibold">
                    ADR-{adr.sequencia}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={adr.descricao}>
                      {adr.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(adr.dataCriacao)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={statusColorMap[adr.status] || ''}
                    >
                      {adr.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {adr.adrSubstitutaSequencia ? (
                      <span className="font-mono text-sm">
                        ADR-{adr.adrSubstitutaSequencia}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {adr.aplicacoesCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <DotsThree size={20} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(adr)}>
                          <Eye size={16} className="mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(adr)}>
                          <PencilSimple size={16} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(adr.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash size={16} className="mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
