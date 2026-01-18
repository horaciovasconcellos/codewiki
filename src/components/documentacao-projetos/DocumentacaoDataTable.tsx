import { useState } from 'react';
import { DocumentacaoProjeto } from '@/lib/types';
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
import { MagnifyingGlass, Pencil, Trash, Eye, CaretLeft, CaretRight, Printer } from '@phosphor-icons/react';
import { formatarData } from '@/lib/utils';

interface DocumentacaoDataTableProps {
  documentacoes: DocumentacaoProjeto[];
  onView: (doc: DocumentacaoProjeto) => void;
  onEdit: (doc: DocumentacaoProjeto) => void;
  onDelete: (doc: DocumentacaoProjeto) => void;
  onPrint?: (doc: DocumentacaoProjeto) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function DocumentacaoDataTable({
  documentacoes,
  onView,
  onEdit,
  onDelete,
  onPrint,
  canUpdate = true,
  canDelete = true,
}: DocumentacaoDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredDocs = documentacoes.filter((doc) => {
    const matchesSearch =
      doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategoria = categoriaFilter === 'all' || doc.categoria === categoriaFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredDocs.length / pageSize);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'Em Revisão':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Publicado':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'Arquivado':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return '';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Arquitetura':
        return 'bg-blue-500';
      case 'Desenvolvimento':
        return 'bg-purple-500';
      case 'Infraestrutura':
        return 'bg-green-500';
      case 'Segurança':
        return 'bg-red-500';
      case 'Processos':
        return 'bg-yellow-500';
      case 'API':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por título, descrição, autor ou tags..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select 
          value={categoriaFilter} 
          onValueChange={(value) => {
            setCategoriaFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="Arquitetura">Arquitetura</SelectItem>
            <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
            <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
            <SelectItem value="Segurança">Segurança</SelectItem>
            <SelectItem value="Processos">Processos</SelectItem>
            <SelectItem value="API">API</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={statusFilter} 
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="Rascunho">Rascunho</SelectItem>
            <SelectItem value="Em Revisão">Em Revisão</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
            <SelectItem value="Arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {paginatedDocs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredDocs.length)} de {filteredDocs.length} documentações
          {searchTerm && ` (filtradas de ${documentacoes.length} total)`}
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma documentação encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.titulo}</div>
                      {doc.descricao && (
                        <div className="text-sm text-muted-foreground truncate max-w-md">
                          {doc.descricao}
                        </div>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {doc.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoriaColor(doc.categoria)}>
                      {doc.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.aplicacaoNome || <span className="text-muted-foreground italic">Sem aplicação</span>}
                  </TableCell>
                  <TableCell className="text-sm">{doc.autor}</TableCell>
                  <TableCell className="text-sm font-mono">{doc.versao}</TableCell>
                  <TableCell className="text-sm">
                    {formatarData(doc.dataUltimaAtualizacao)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(doc)}
                        title="Visualizar"
                      >
                        <Eye weight="bold" />
                      </Button>
                      {onPrint && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrint(doc)}
                          title="Imprimir"
                        >
                          <Printer weight="bold" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(doc)}
                        title="Editar"
                        disabled={!canUpdate}
                      >
                        <Pencil weight="bold" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(doc)}
                        title="Excluir"
                        disabled={!canDelete}
                      >
                        <Trash weight="bold" />
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
        <div className="flex items-center justify-between">
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
