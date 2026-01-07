import { useState } from 'react';
import { ProjetoSDD } from '@/types/sdd';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Eye } from '@phosphor-icons/react';

interface ProjetosSDDDataTableProps {
  projetos: ProjetoSDD[];
  onEdit: (projeto: ProjetoSDD) => void;
  onDelete: (projeto: ProjetoSDD) => void;
  onView: (projeto: ProjetoSDD) => void;
}

export function ProjetosSDDDataTable({
  projetos,
  onEdit,
  onDelete,
  onView,
}: ProjetosSDDDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProjetos = projetos.filter((projeto) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      projeto.nome_projeto.toLowerCase().includes(searchLower) ||
      projeto.aplicacao_sigla?.toLowerCase().includes(searchLower) ||
      projeto.aplicacao_nome?.toLowerCase().includes(searchLower) ||
      projeto.ia_selecionada.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredProjetos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjetos = filteredProjetos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar projetos..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredProjetos.length} projeto(s) encontrado(s)
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>IA Selecionada</TableHead>
              <TableHead>Gerador de Projetos</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProjetos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum projeto encontrado
                </TableCell>
              </TableRow>
            ) : (
              currentProjetos.map((projeto) => (
                <TableRow key={projeto.id}>
                  <TableCell className="font-medium">{projeto.nome_projeto}</TableCell>
                  <TableCell>
                    {projeto.aplicacao_sigla ? (
                      <div>
                        <div className="font-medium">{projeto.aplicacao_sigla}</div>
                        <div className="text-sm text-muted-foreground">
                          {projeto.aplicacao_nome}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{projeto.ia_selecionada}</TableCell>
                  <TableCell>
                    {projeto.gerador_projetos ? (
                      <span className="text-green-600 font-medium">Ativo</span>
                    ) : (
                      <span className="text-muted-foreground">Inativo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(projeto.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(projeto)}
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(projeto)}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(projeto)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
