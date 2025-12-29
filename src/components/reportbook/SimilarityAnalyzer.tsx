import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, ChartBar } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useLogging } from '@/hooks/use-logging';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SimilarityResult {
  report: {
    id: string;
    nome: string;
    descricao: string;
    status: string;
    totalColunas: number;
  };
  similarity: {
    columns: number;
    filtros: number;
    agrupamentos: number;
    text: number;
    weighted: number;
  };
}

export function SimilarityAnalyzer() {
  const { logClick, logEvent, logError } = useLogging('similarity-analyzer');
  const [columns, setColumns] = useState<string>('');
  const [filtros, setFiltros] = useState<string>('');
  const [agrupamentos, setAgrupamentos] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [analyzed, setAnalyzed] = useState(0);

  const handleAnalyze = async () => {
    const columnList = columns.split(',').map(c => c.trim()).filter(c => c);

    if (columnList.length === 0) {
      toast.error('Informe ao menos uma coluna para análise');
      return;
    }

    logClick('analyze_similarity_button', { columns_count: columnList.length });
    setLoading(true);
    try {
      logEvent('similarity_analysis_start', 'api_call', { columns_count: columnList.length });
      const response = await fetch(`${API_URL}/api/reports/analyze-similarity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: columnList,
          filtros,
          agrupamentos
        })
      });

      if (!response.ok) throw new Error('Erro ao analisar similaridade');

      const data = await response.json();
      setResults(data.results);
      setAnalyzed(data.totalAnalyzed);
      
      logEvent('similarity_analysis_success', 'api_call', { 
        results_count: data.results.length,
        total_analyzed: data.totalAnalyzed 
      });
      toast.success(`Análise concluída! ${data.results.length} relatórios similares encontrados.`);
    } catch (error) {
      console.error('Erro ao analisar similaridade:', error);
      logError(error as Error, 'similarity_analysis_error', { columns_count: columnList.length });
      toast.error('Erro ao analisar similaridade');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length === 0) {
        toast.error('Arquivo CSV vazio');
        return;
      }

      // Primeira linha é o cabeçalho
      const headers = lines[0].split(',').map(h => h.trim());
      setColumns(headers.join(', '));
      
      toast.success(`${headers.length} colunas detectadas do CSV`);
    };
    reader.readAsText(file);
  };

  const getSimilarityColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-50';
    if (value >= 60) return 'text-blue-600 bg-blue-50';
    if (value >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analisador de Similaridade</h1>
            <p className="text-muted-foreground mt-2">
              Encontre relatórios similares usando algoritmos de Jaccard, Cosine e Score Ponderado
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Análise</CardTitle>
            <CardDescription>
              Informe as características do relatório para encontrar similares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Colunas (separadas por vírgula) *</Label>
              <div className="flex gap-2">
                <Textarea
                  value={columns}
                  onChange={(e) => setColumns(e.target.value)}
                  placeholder="id, nome, descricao, data_criacao, status"
                  rows={3}
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-center text-muted-foreground">Upload CSV</p>
                    </div>
                  </Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filtros</Label>
                <Textarea
                  value={filtros}
                  onChange={(e) => setFiltros(e.target.value)}
                  placeholder="WHERE status = 'ativo' AND data > '2024-01-01'"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Agrupamentos</Label>
                <Textarea
                  value={agrupamentos}
                  onChange={(e) => setAgrupamentos(e.target.value)}
                  placeholder="GROUP BY categoria, tipo"
                  rows={3}
                />
              </div>
            </div>

            <Button onClick={handleAnalyze} disabled={loading}>
              <ChartBar className="mr-2" />
              {loading ? 'Analisando...' : 'Analisar Similaridade'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Análise</CardTitle>
              <CardDescription>
                {results.length} relatório(s) similar(es) encontrado(s) de {analyzed} analisado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Relatório</TableHead>
                      <TableHead className="text-center">Colunas</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Score Geral</TableHead>
                      <TableHead>Similaridade Detalhada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={result.report.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{result.report.nome}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {result.report.descricao}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{result.report.totalColunas}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{result.report.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={`font-bold ${getSimilarityColor(result.similarity.weighted)}`}
                            >
                              {result.similarity.weighted}%
                            </Badge>
                            <Progress value={result.similarity.weighted} className="h-1" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Colunas (40%):</span>
                              <Badge variant="outline" className={getSimilarityColor(result.similarity.columns)}>
                                {result.similarity.columns}%
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Filtros (30%):</span>
                              <Badge variant="outline" className={getSimilarityColor(result.similarity.filtros)}>
                                {result.similarity.filtros}%
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Agrupamentos (20%):</span>
                              <Badge variant="outline" className={getSimilarityColor(result.similarity.agrupamentos)}>
                                {result.similarity.agrupamentos}%
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Texto (10%):</span>
                              <Badge variant="outline" className={getSimilarityColor(result.similarity.text)}>
                                {result.similarity.text}%
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">Algoritmos Utilizados:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li><strong>Jaccard:</strong> Interseção/União entre conjuntos (Colunas, Filtros, Agrupamentos)</li>
                  <li><strong>Cosine:</strong> Similaridade textual entre nomes e descrições (TF-IDF)</li>
                  <li><strong>Weighted:</strong> Score ponderado final (40% + 30% + 20% + 10%)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
