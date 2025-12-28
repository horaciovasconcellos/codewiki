import { useState } from 'react';
import { Habilidade } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash, Eye, PencilSimple, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { CertificacoesTable } from './CertificacoesTable';
import { toast } from 'sonner';
import { useLogging } from '@/hooks/use-logging';

interface HabilidadesTableProps {
  habilidades: Habilidade[];
  onEdit: (habilidade: Habilidade) => void;
  onHabilidadeDelete: (id: string) => void;
}

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

export function HabilidadesTable({ habilidades, onEdit, onHabilidadeDelete }: HabilidadesTableProps) {
  const { logClick } = useLogging('habilidades-table');
  const [viewingHabilidade, setViewingHabilidade] = useState<Habilidade | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleView = (habilidade: Habilidade) => {
    setViewingHabilidade(habilidade);
    setDetailsOpen(true);
    logClick('habilidade_viewed', { habilidade_id: habilidade.id });
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta habilidade?')) {
      onHabilidadeDelete(id);
      logClick('habilidade_deleted', { habilidade_id: id });
      toast.success('Habilidade excluída com sucesso');
    }
  };

  // Paginação
  const totalPages = Math.ceil(habilidades.length / pageSize);
  const paginatedHabilidades = habilidades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (habilidades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
        Nenhuma habilidade cadastrada
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <div>
          Mostrando {paginatedHabilidades.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, habilidades.length)} de {habilidades.length} habilidades
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sigla</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Domínio</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead className="text-center">Certificações</TableHead>
              <TableHead className="w-[150px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHabilidades.map((habilidade) => (
              <TableRow key={habilidade.id}>
                <TableCell className="font-mono font-semibold">{habilidade.sigla}</TableCell>
                <TableCell className="max-w-md truncate">{habilidade.descricao}</TableCell>
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
                <TableCell>{habilidade.subcategoria}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{habilidade.certificacoes.length}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(habilidade)}
                    >
                      <Eye />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(habilidade)}
                    >
                      <PencilSimple />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(habilidade.id)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono">{viewingHabilidade?.sigla}</span>
              <Badge variant={getDominioBadgeVariant(viewingHabilidade?.dominio || '')}>
                {viewingHabilidade?.dominio}
              </Badge>
            </DialogTitle>
            <DialogDescription>{viewingHabilidade?.descricao}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Domínio</h4>
                <p className="text-sm">{viewingHabilidade?.dominio}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Subcategoria</h4>
                <p className="text-sm">{viewingHabilidade?.subcategoria}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Certificações</h4>
              {viewingHabilidade && viewingHabilidade.certificacoes.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {viewingHabilidade.certificacoes.map((cert) => (
                    <li key={cert.id} className="text-sm">
                      {cert.nome} - {cert.instituicao}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma certificação associada</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
