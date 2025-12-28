import { useEffect, useState } from 'react';
import { Payload } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, FileText, CheckCircle, WarningCircle } from '@phosphor-icons/react';

interface StepPayloadsProps {
  aplicacaoId?: string;
  aplicacaoSigla: string;
}

export function StepPayloads({ aplicacaoId, aplicacaoSigla }: StepPayloadsProps) {
  const [payloads, setPayloads] = useState<Payload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const loadPayloads = async () => {
      if (!aplicacaoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacaoId}/payloads`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar payloads');
        }

        const data = await response.json();
        setPayloads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar payloads:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setPayloads([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayloads();
  }, [aplicacaoId]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando payloads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!aplicacaoId) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Salve a aplicação primeiro para visualizar seus payloads.
        </AlertDescription>
      </Alert>
    );
  }

  if (payloads.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Nenhum payload encontrado para esta aplicação. Você pode adicionar payloads na tela de Payloads.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Payloads associados à aplicação <strong>{aplicacaoSigla}</strong>. 
          Para adicionar ou editar payloads, acesse a tela de Payloads no menu lateral.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sigla</TableHead>
              <TableHead>Definição</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Válido</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Término</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payloads.map((payload) => (
              <TableRow key={payload.id}>
                <TableCell className="font-medium">{payload.sigla}</TableCell>
                <TableCell className="max-w-md truncate">{payload.definicao}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {payload.formatoArquivo}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payload.arquivoValido ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Válido
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <WarningCircle className="h-3 w-3" />
                      Inválido
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(payload.dataInicio)}</TableCell>
                <TableCell>{formatDate(payload.dataTermino)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Total de payloads: <strong>{payloads.length}</strong>
        {' • '}
        Válidos: <strong>{payloads.filter(p => p.arquivoValido).length}</strong>
      </div>
    </div>
  );
}
