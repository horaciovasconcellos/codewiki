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
import { PencilSimple, Trash, ArrowsClockwise, CheckCircle, XCircle, Clock, Spinner } from '@phosphor-icons/react';
import { ProjetoAzure } from '@/lib/azure-devops-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AzureDevOpsDataTableProps {
  projetos: ProjetoAzure[];
  loading: boolean;
  onEdit: (projeto: ProjetoAzure) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function AzureDevOpsDataTable({
  projetos,
  loading,
  onEdit,
  onDelete,
  onRefresh
}: AzureDevOpsDataTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Sucesso</Badge>;
      case 'erro':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      case 'criando':
        return <Badge variant="secondary"><Spinner className="h-3 w-3 mr-1 animate-spin" /> Criando</Badge>;
      case 'pendente':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projetos.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Nenhum projeto encontrado</p>
        <p className="text-sm mt-2">Crie um novo projeto para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <ArrowsClockwise className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Data Inicial</TableHead>
              <TableHead>Times</TableHead>
              <TableHead>Iterações</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projetos.map((projeto) => (
              <TableRow key={projeto.id}>
                <TableCell className="font-medium">{projeto.produto}</TableCell>
                <TableCell>
                  {projeto.azureProjectUrl ? (
                    <a 
                      href={projeto.azureProjectUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {projeto.projeto}
                    </a>
                  ) : (
                    projeto.projeto
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{projeto.workItemProcess}</Badge>
                </TableCell>
                <TableCell>{projeto.teamName}</TableCell>
                <TableCell>
                  {projeto.dataInicial ? format(new Date(projeto.dataInicial), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    <span>{projeto.teamName}</span>
                    {projeto.criarTimeSustentacao && (
                      <span className="text-xs text-muted-foreground">+ Sustentação</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{projeto.iterationsCount || 0}</TableCell>
                <TableCell>{getStatusBadge(projeto.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(projeto.dataCriacao)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(projeto)}
                    >
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(projeto.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Total: {projetos.length} {projetos.length === 1 ? 'projeto' : 'projetos'}
      </div>
    </div>
  );
}
