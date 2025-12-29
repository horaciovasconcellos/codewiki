import { ProjetoGerado } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Trash, Eye, CloudArrowUp, GitBranch } from '@phosphor-icons/react';

interface GeradorProjetosDataTableProps {
  projetos: ProjetoGerado[];
  onEdit: (projeto: ProjetoGerado) => void;
  onDelete: (projeto: ProjetoGerado) => void;
  onView: (projeto: ProjetoGerado) => void;
  onIntegrarAzure: (projeto: ProjetoGerado) => void;
  onCriarRepositorios: (projeto: ProjetoGerado) => void;
}

export function GeradorProjetosDataTable({ 
  projetos, 
  onEdit, 
  onDelete, 
  onView, 
  onIntegrarAzure, 
  onCriarRepositorios
}: GeradorProjetosDataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aplicação Base</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Processo</TableHead>
            <TableHead>Data Inicial</TableHead>
            <TableHead>Semanas</TableHead>
            <TableHead>Iteração</TableHead>
            <TableHead>Repositórios</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projetos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                Nenhum projeto cadastrado
              </TableCell>
            </TableRow>
          ) : (
            projetos.slice().reverse().map((projeto) => (
              <TableRow key={projeto.id}>
                <TableCell className="font-medium">{projeto.produto}</TableCell>
                <TableCell>
                  {projeto.urlProjeto ? (
                    <a 
                      href={projeto.urlProjeto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
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
                <TableCell>{new Date(projeto.dataInicial).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{projeto.numeroSemanas || '-'}</TableCell>
                <TableCell>{projeto.iteracao}</TableCell>
                <TableCell>
                  <Badge>{projeto.repositorios.length}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={(projeto.status || 'Pendente') === 'Processado' ? 'default' : 'secondary'}>
                    {projeto.status || 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(projeto.dataCriacao).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(projeto)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Visualizar</TooltipContent>
                      </Tooltip>
                      
                      {(projeto.status || 'Pendente') === 'Pendente' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(projeto)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onIntegrarAzure(projeto)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CloudArrowUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Integrar com Azure DevOps</TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      {projeto.status === 'Processado' && projeto.repositorios && projeto.repositorios.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onCriarRepositorios(projeto)}
                              disabled={projeto.statusRepositorio === 'Y'}
                              className={projeto.statusRepositorio === 'Y' 
                                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                                : "bg-green-600 hover:bg-green-700"
                              }
                            >
                              <GitBranch className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {projeto.statusRepositorio === 'Y' 
                              ? 'Repositórios já criados' 
                              : 'Criar Repositórios Git'
                            }
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(projeto)}
                            disabled={projeto.status === 'Processado'}
                            className={projeto.status === 'Processado' ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {projeto.status === 'Processado' 
                            ? 'Não é possível excluir projetos integrados ao Azure DevOps' 
                            : 'Excluir'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
