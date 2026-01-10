import { useState, useMemo } from 'react';
import { InnerSourceProject } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PencilSimple, Trash, Star, Eye, GitFork, GitBranch, MagnifyingGlass, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react';

type SortField = 'nome' | 'language' | 'stargazers_count';
type SortOrder = 'asc' | 'desc';

interface InnerSourceDataTableProps {
  projects: InnerSourceProject[];
  onEdit: (project: InnerSourceProject) => void;
  onDelete: (id: string) => void;
}

export function InnerSourceDataTable({ projects, onEdit, onDelete }: InnerSourceDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaturity, setFilterMaturity] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getMaturityColor = (maturity?: string) => {
    switch (maturity) {
      case 'emerging': return 'bg-blue-100 text-blue-800';
      case 'growing': return 'bg-green-100 text-green-800';
      case 'mature': return 'bg-purple-100 text-purple-800';
      case 'graduated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const filteredAndSortedProjects = useMemo(() => {
    let result = projects.filter(project => {
      const matchesSearch = 
        searchTerm === '' ||
        project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.full_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.descricao && project.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesMaturity = 
        filterMaturity === 'todos' || 
        project._InnerSourceMetadata?.maturity === filterMaturity;

      return matchesSearch && matchesMaturity;
    });

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome;
          bValue = b.nome;
          break;
        case 'language':
          aValue = a.language || '';
          bValue = b.language || '';
          break;
        case 'stargazers_count':
          aValue = a.stargazers_count || 0;
          bValue = b.stargazers_count || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [projects, searchTerm, filterMaturity, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / pageSize);
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterMaturity('todos');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterMaturity !== 'todos';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={filterMaturity} onValueChange={(value) => {
            setFilterMaturity(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Todas maturidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas maturidades</SelectItem>
              <SelectItem value="emerging">Emerging</SelectItem>
              <SelectItem value="growing">Growing</SelectItem>
              <SelectItem value="mature">Mature</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrando {paginatedProjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredAndSortedProjects.length)} de {filteredAndSortedProjects.length} projeto{filteredAndSortedProjects.length !== 1 ? 's' : ''}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {paginatedProjects.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {projects.length === 0 ? 'Nenhum projeto InnerSource cadastrado' : 'Nenhum projeto encontrado'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('nome')}
                    >
                      Projeto
                      {getSortIcon('nome')}
                    </Button>
                  </th>
                  <th className="text-left p-3 text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('language')}
                    >
                      Linguagem
                      {getSortIcon('language')}
                    </Button>
                  </th>
                  <th className="text-left p-3 text-sm font-medium">Maturidade</th>
                  <th className="text-center p-3 text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('stargazers_count')}
                    >
                      Estatísticas
                      {getSortIcon('stargazers_count')}
                    </Button>
                  </th>
                  <th className="text-left p-3 text-sm font-medium">Proprietário</th>
                  <th className="text-center p-3 text-sm font-medium w-32">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((project) => (
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
    )}

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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    )}
    </div>
  );
}
