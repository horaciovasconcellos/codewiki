import { useState, useMemo, useEffect } from 'react';
import { Habilidade } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PencilSimple, 
  Trash,
  CaretUp,
  CaretDown,
  CaretUpDown,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface HabilidadesDataTableProps {
  habilidades: Habilidade[];
  onEdit: (habilidade: Habilidade) => void;
  onDelete: (id: string) => void;
}

type SortField = 'sigla' | 'descricao';
type SortOrder = 'asc' | 'desc';

const getDominioBadgeVariant = (dominio: string) => {
  switch (dominio) {
    case 'Arquitetura & Integração de Sistemas':
      return 'default';
    case 'Comunicação & Relacionamento':
      return 'secondary';
    case 'Dados & Informação':
      return 'outline';
    case 'Desenvolvimento & Engenharia':
      return 'default';
    case 'DevOps & DevSecOps':
      return 'secondary';
    case 'ERP & Plataformas Corporativas':
      return 'outline';
    case 'Ética & Postura Profissional':
      return 'secondary';
    case 'Gestão & Organização':
      return 'outline';
    case 'Liderança & Influência':
      return 'secondary';
    case 'Pensamento Estratégico':
      return 'default';
    case 'Segurança & Compliance':
      return 'destructive';
    default:
      return 'default';
  }
};

export function HabilidadesDataTable({ habilidades, onEdit, onDelete }: HabilidadesDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterDominio, setFilterDominio] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('sigla');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDelete = (id: string, descricao: string) => {
    onDelete(id);
    toast.success(`Habilidade "${descricao}" excluída com sucesso`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <CaretUpDown size={16} className="ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <CaretUp size={16} className="ml-1" />
      : <CaretDown size={16} className="ml-1" />;
  };

  // Obter listas únicas de tipos e domínios
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(habilidades.map(h => h.tipo));
    return Array.from(tipos).sort();
  }, [habilidades]);

  const dominiosUnicos = useMemo(() => {
    const dominios = new Set(habilidades.map(h => h.dominio));
    return Array.from(dominios).sort();
  }, [habilidades]);

  const filteredAndSortedHabilidades = useMemo(() => {
    let result = habilidades.filter(hab => {
      const matchesSearch = 
        hab.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hab.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hab.dominio.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = filterTipo === 'todos' || hab.tipo === filterTipo;
      const matchesDominio = filterDominio === 'todos' || hab.dominio === filterDominio;
      
      return matchesSearch && matchesTipo && matchesDominio;
    });

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    return result;
  }, [habilidades, searchTerm, filterTipo, filterDominio, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedHabilidades.length / pageSize);
  const paginatedHabilidades = filteredAndSortedHabilidades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipo, filterDominio]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterTipo('todos');
    setFilterDominio('todos');
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>Lista de Habilidades</CardTitle>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por sigla, descrição ou domínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                {tiposUnicos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDominio} onValueChange={setFilterDominio}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Filtrar por domínio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Domínios</SelectItem>
                {dominiosUnicos.map(dominio => (
                  <SelectItem key={dominio} value={dominio}>{dominio}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || filterTipo !== 'todos' || filterDominio !== 'todos') && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filteredAndSortedHabilidades.length} resultado(s) encontrado(s)
              </span>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('sigla')}
                  >
                    Sigla
                    {getSortIcon('sigla')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('descricao')}
                  >
                    Descrição
                    {getSortIcon('descricao')}
                  </Button>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHabilidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma habilidade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHabilidades.map((habilidade) => (
                  <TableRow key={habilidade.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium font-mono">{habilidade.sigla}</TableCell>
                    <TableCell>{habilidade.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={habilidade.tipo === 'Soft Skills' ? 'secondary' : 'default'}>
                        {habilidade.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDominioBadgeVariant(habilidade.dominio)}>
                        {habilidade.dominio}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onEdit(habilidade)}
                          title="Editar"
                        >
                          <PencilSimple size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              title="Excluir"
                            >
                              <Trash size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a habilidade "{habilidade.descricao}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(habilidade.id, habilidade.descricao)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
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

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Mostrando {paginatedHabilidades.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedHabilidades.length)} de {filteredAndSortedHabilidades.length} habilidades
            </div>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
