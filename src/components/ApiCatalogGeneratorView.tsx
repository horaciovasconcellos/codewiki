import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Rocket, 
  CheckCircle, 
  WarningCircle, 
  Clock,
  Book,
  Download,
  ArrowClockwise
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ApiCatalogGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      totalAplicacoes: number;
      totalApis: number;
      pagesGenerated: string[];
    };
  } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    toast.info('Iniciando geração do catálogo de APIs...');

    try {
      const response = await fetch(`${API_URL}/api/catalog/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats,
        });
        toast.success('Catálogo gerado com sucesso!');
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro ao gerar catálogo',
        });
        toast.error(data.error || 'Erro ao gerar catálogo');
      }
    } catch (error) {
      console.error('Erro ao gerar catálogo:', error);
      setResult({
        success: false,
        message: 'Erro de conexão com o servidor',
      });
      toast.error('Erro de conexão com o servidor');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gerador de Catálogo de APIs</h1>
        <p className="text-muted-foreground">
          Gere automaticamente a documentação das APIs a partir dos payloads cadastrados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Card: O que é */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              O que este gerador faz?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Lê todos os payloads válidos do banco de dados</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Agrupa as APIs por aplicação</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Gera páginas em Markdown para o MkDocs</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Exporta arquivos OpenAPI (JSON/YAML)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Atualiza a navegação do MkDocs automaticamente</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Reinicia o container MkDocs para disponibilizar os arquivos</span>
            </div>
          </CardContent>
        </Card>

        {/* Card: Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Geradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Status:</span>
              <span>Ativo, Em Teste, Depreciado</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Metadados:</span>
              <span>Sigla, versão, datas, criticidade</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Documentação:</span>
              <span>Descrição curta e longa</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">OpenAPI:</span>
              <span>Especificação completa para testes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Links:</span>
              <span>Download e ferramentas de teste</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card Principal: Geração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Gerar Catálogo
          </CardTitle>
          <CardDescription>
            Clique no botão abaixo para iniciar a geração do catálogo de APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> O processo pode levar alguns segundos dependendo da quantidade de payloads cadastrados.
              Apenas payloads válidos serão incluídos. Ao final, o container MkDocs será reiniciado automaticamente para disponibilizar a documentação atualizada.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1"
            >
              {generating ? (
                <>
                  <ArrowClockwise className="h-5 w-5 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Gerar Catálogo de APIs
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open('http://localhost:8000', '_blank')}
            >
              <Book className="h-5 w-5 mr-2" />
              Abrir MkDocs
            </Button>
          </div>

          {/* Resultado */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'} className="mt-4">
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <WarningCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">
                  {result.success ? '✅ Catálogo gerado com sucesso!' : result.message}
                </div>
                
                {result.success && (
                  <div className="text-sm text-muted-foreground mb-3">
                    O container MkDocs foi reiniciado automaticamente. A documentação já está disponível para consulta.
                  </div>
                )}
                
                {result.success && result.stats && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">Aplicações:</span>
                        <span className="font-bold">{result.stats.totalAplicacoes}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">APIs Totais:</span>
                        <span className="font-bold">{result.stats.totalApis}</span>
                      </div>
                    </div>

                    {result.stats.pagesGenerated.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium mb-1">Páginas geradas:</div>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {result.stats.pagesGenerated.map((page, index) => (
                            <li key={index}>{page}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('http://localhost:8000/api-catalog/', '_blank')}
                      >
                        <Book className="h-4 w-4 mr-2" />
                        Ver Catálogo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('http://localhost:8000/api-catalog/openapi/', '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Ver Arquivos OpenAPI
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Card: Como usar após gerar */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <div>
              <div className="font-semibold">Visualize o Catálogo</div>
              <div className="text-muted-foreground">
                Acesse http://localhost:8000 e navegue até "Catálogo de APIs". A documentação já está disponível (o container foi reiniciado automaticamente).
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <div className="font-semibold">Baixe as Especificações OpenAPI</div>
              <div className="text-muted-foreground">
                Cada API tem um link para download do arquivo JSON/YAML
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <div className="font-semibold">Teste as APIs</div>
              <div className="text-muted-foreground">
                Use Swagger Editor, Postman ou Insomnia para testar as APIs
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">
              4
            </div>
            <div>
              <div className="font-semibold">Atualize Conforme Necessário</div>
              <div className="text-muted-foreground">
                Sempre que adicionar/editar payloads, volte aqui e gere o catálogo novamente
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
