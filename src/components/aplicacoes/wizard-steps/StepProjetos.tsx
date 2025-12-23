import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface Projeto {
  id: string;
  produto: string;
  projeto: string;
  workItemProcess: string;
  dataInicial: string;
  status: 'Pendente' | 'Processado';
  urlProjeto?: string;
  nomeTime?: string;
  iteracao?: number;
}

interface StepProjetosProps {
  aplicacaoSigla: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Processado': return 'bg-green-100 text-green-800';
    case 'Pendente': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Processado': return 'Processado';
    case 'Pendente': return 'Pendente';
    default: return status;
  }
};

export function StepProjetos({ aplicacaoSigla }: StepProjetosProps) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const loadProjetos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/projetos?produto=${encodeURIComponent(aplicacaoSigla)}`);
        if (response.ok) {
          const data = await response.json();
          setProjetos(data);
        }
      } catch (error) {
        console.error('[StepProjetos] Erro ao carregar projetos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (aplicacaoSigla) {
      loadProjetos();
    }
  }, [aplicacaoSigla, API_URL]);

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando projetos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Estruturas de projeto geradas para <strong>{aplicacaoSigla}</strong>
        </p>
      </div>

      {projetos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Esta aplicação ainda não possui estruturas de projeto geradas
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead>Data Inicial</TableHead>
                <TableHead>Iteração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetos.map((projeto) => (
                <TableRow key={projeto.id}>
                  <TableCell className="font-medium">{projeto.projeto}</TableCell>
                  <TableCell>{projeto.nomeTime || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{projeto.workItemProcess}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(projeto.dataInicial)}</TableCell>
                  <TableCell className="text-center">{projeto.iteracao ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(projeto.status)}>
                      {getStatusLabel(projeto.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {projeto.urlProjeto && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a 
                          href={projeto.urlProjeto} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Abrir projeto"
                        >
                          <ArrowSquareOut className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Estruturas de projeto geradas pelo sistema para a aplicação.
        </p>
      </div>
    </div>
  );
}
