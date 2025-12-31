import { InnerSourceProject } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PencilSimple, Trash, Star, Eye, GitFork, GitBranch } from '@phosphor-icons/react';

interface InnerSourceDataTableProps {
  projects: InnerSourceProject[];
  onEdit: (project: InnerSourceProject) => void;
  onDelete: (id: string) => void;
}

export function InnerSourceDataTable({ projects, onEdit, onDelete }: InnerSourceDataTableProps) {
  const getMaturityColor = (maturity?: string) => {
    switch (maturity) {
      case 'emerging': return 'bg-blue-100 text-blue-800';
      case 'growing': return 'bg-green-100 text-green-800';
      case 'mature': return 'bg-purple-100 text-purple-800';
      case 'graduated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">Nenhum projeto InnerSource cadastrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Projeto</th>
              <th className="text-left p-3 text-sm font-medium">Linguagem</th>
              <th className="text-left p-3 text-sm font-medium">Maturidade</th>
              <th className="text-center p-3 text-sm font-medium">Estatísticas</th>
              <th className="text-left p-3 text-sm font-medium">Proprietário</th>
              <th className="text-center p-3 text-sm font-medium w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {project._InnerSourceMetadata?.logo && (
                        <img 
                          src={project._InnerSourceMetadata.logo} 
                          alt={project.nome}
                          className="w-6 h-6 object-contain rounded"
                        />
                      )}
                      <div>
                        <a 
                          href={project.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-blue-600"
                        >
                          {project.nome}
                        </a>
                        <p className="text-xs text-muted-foreground">{project.full_nome}</p>
                      </div>
                    </div>
                    {project.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.descricao}</p>
                    )}
                    {project._InnerSourceMetadata?.topics && project._InnerSourceMetadata.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project._InnerSourceMetadata.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {project._InnerSourceMetadata.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project._InnerSourceMetadata.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  {project.language && (
                    <Badge variant="secondary">{project.language}</Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge className={getMaturityColor(project._InnerSourceMetadata?.maturity)}>
                    {project._InnerSourceMetadata?.maturity || 'N/A'}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-600" />
                      <span>{project.stargazers_count}</span>
                      <Eye size={14} className="text-blue-600 ml-2" />
                      <span>{project.watchers_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork size={14} className="text-gray-600" />
                      <span>{project.forks_count}</span>
                      <GitBranch size={14} className="text-green-600 ml-2" />
                      <span>{project.open_issues_count}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {project.owner?.avatar_url && (
                      <img 
                        src={project.owner.avatar_url} 
                        alt={project.owner.login}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <a 
                      href={project.owner?.html_url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      {project.owner?.login || 'N/A'}
                    </a>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(project)}
                      title="Editar"
                    >
                      <PencilSimple size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(project.id)}
                      title="Excluir"
                    >
                      <Trash size={16} className="text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
