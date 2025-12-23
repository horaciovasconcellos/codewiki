import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Database, List, ArrowRight, DownloadSimple } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useLogging } from '@/hooks/use-logging';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type TipoEntidade = 
  | 'tipos-afastamento'
  | 'colaboradores'
  | 'tecnologias'
  | 'processos-negocio'
  | 'aplicacoes'
  | 'capacidades-negocio'
  | 'slas'
  | 'runbooks'
  | 'estruturas-projeto';

interface ArquivoCarga {
  id: string;
  nome: string;
  tipo: TipoEntidade;
  formato: 'csv' | 'json';
  conteudo: string;
  tamanho: number;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  registros?: number;
  importados?: number;
  erros?: string[];
}

interface LogCarga {
  timestamp: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  mensagem: string;
}

const ENTIDADES_CONFIG = {
  'tipos-afastamento': {
    label: 'Tipos de Afastamento',
    endpoint: '/api/tipos-afastamento',
    exemplo: 'tipos-afastamento.csv / tipos-afastamento.json',
    campos: ['sigla', 'descricao', 'argumentacaoLegal', 'numeroDias', 'tipoTempo']
  },
  'colaboradores': {
    label: 'Colaboradores',
    endpoint: '/api/colaboradores',
    exemplo: 'colaboradores.csv / colaboradores.json',
    campos: ['matricula', 'nome', 'setor', 'dataAdmissao']
  },
  'tecnologias': {
    label: 'Tecnologias',
    endpoint: '/api/tecnologias',
    exemplo: 'tecnologias.csv / tecnologias.json',
    campos: ['sigla', 'nome', 'versaoRelease', 'categoria', 'status', 'fornecedorFabricante', 'tipoLicenciamento', 'maturidadeInterna', 'nivelSuporteInterno']
  },
  'processos-negocio': {
    label: 'Processos de Negócio',
    endpoint: '/api/processos-negocio',
    exemplo: 'processos-negocio.csv',
    campos: ['sigla', 'areaResponsavel', 'descricao', 'nivelMaturidade', 'frequencia', 'complexidade', 'duracaoMediaHoras']
  },
  'aplicacoes': {
    label: 'Aplicações',
    endpoint: '/api/aplicacoes',
    exemplo: 'aplicacoes.csv / aplicacoes.json',
    campos: ['sigla', 'descricao', 'urlDocumentacao', 'tipoAplicacao', 'cloudProvider', 'faseCicloVida', 'criticidadeNegocio']
  },
  'capacidades-negocio': {
    label: 'Capacidades de Negócio',
    endpoint: '/api/capacidades-negocio',
    exemplo: 'capacidades-negocio.csv / capacidades-negocio.json',
    campos: ['nome', 'descricao', 'nivel', 'tipo']
  },
  'slas': {
    label: 'SLAs',
    endpoint: '/api/slas',
    exemplo: 'slas.csv',
    campos: ['nome', 'descricao', 'metrica', 'meta']
  },
  'runbooks': {
    label: 'Runbooks',
    endpoint: '/api/runbooks',
    exemplo: 'runbooks.csv / runbooks.json',
    campos: ['sigla', 'descricaoResumida', 'finalidade', 'tipoRunbook']
  },
  'estruturas-projeto': {
    label: 'Estruturas de Projeto',
    endpoint: '/api/estruturas-projeto',
    exemplo: 'estruturas-projeto.csv / estruturas-projeto.json',
    campos: ['produto', 'workItemProcess', 'projeto', 'dataInicial', 'iteracao', 'nomeTime', 'numeroSemanas']
  }
};

export function CargaDadosView() {
  const { logEvent } = useLogging('carga-dados');
  
  // Função para gerar e baixar CSV de exemplo
  const baixarCsvExemplo = (tipo: TipoEntidade) => {
    const config = ENTIDADES_CONFIG[tipo];
    if (!config) return;
    
    // Cabeçalho CSV
    const header = config.campos.join(',');
    
    // Dados de exemplo baseados no tipo
    let exemplos: string[] = [];
    
    switch (tipo) {
      case 'tipos-afastamento':
        exemplos = [
          'FERIAS,Férias anuais remuneradas,Art. 129 da CLT - Todo empregado terá direito anualmente ao gozo de um período de férias,30,Dias',
          'LIC-MED,Licença médica,Art. 60 da Lei 8.213/91 - Auxílio-doença será devido ao segurado empregado,15,Dias',
          'LIC-MAT,Licença maternidade,Art. 392 da CLT - A empregada gestante tem direito à licença-maternidade,4,Meses'
        ];
        break;
      case 'colaboradores':
        exemplos = [
          '001234,João Silva Santos,Tecnologia da Informação,2023-01-15',
          '001235,Maria Santos Oliveira,Recursos Humanos,2022-06-10',
          '001236,Pedro Costa Ferreira,Comercial,2021-03-20'
        ];
        break;
      case 'tecnologias':
        exemplos = [
          'ORACLE-DB,Oracle Database,19c,Banco de Dados,Ativa,Oracle Corporation,Proprietária,Padronizada,Suporte Avançado',
          'MYSQL,MySQL Database,8.0,Banco de Dados,Ativa,Oracle Corporation,Open Source,Padronizada,Suporte Básico',
          'POSTGRES,PostgreSQL,15.0,Banco de Dados,Ativa,PostgreSQL Global Development Group,Open Source,Adotada,Suporte Intermediário'
        ];
        break;
      case 'processos-negocio':
        exemplos = [
          'PN-001,Comercial,Processo de vendas e relacionamento com clientes,Inicial,Ad-Hoc,Baixa,1',
          'PN-002,Recursos Humanos,Processo de recrutamento e seleção de talentos,Gerenciado,Mensal,Média,4',
          'PN-003,TI,Processo de atendimento e suporte ao usuário,Definido,Diária,Alta,2'
        ];
        break;
      case 'aplicacoes':
        exemplos = [
          'CRM-WEB,Sistema de gestão de relacionamento com clientes,https://docs.empresa.com/crm,INTERNO,ON-PREMISE,Produção,Média',
          'PORTAL-RH,Portal de recursos humanos e autoatendimento,-,INTERNO,AWS,Produção,Alta',
          'APP-VENDAS,Aplicativo mobile para força de vendas,https://docs.empresa.com/vendas,EXTERNO,AZURE,Desenvolvimento,Baixa'
        ];
        break;
      case 'capacidades-negocio':
        exemplos = [
          'Gestão Comercial,Capacidade de gerir operações comerciais,1,Primária',
          'Gestão Financeira,Capacidade de gerir finanças,1,Primária',
          'Gestão de Pessoas,Capacidade de gerir recursos humanos,2,Suporte'
        ];
        break;
      case 'slas':
        exemplos = [
          'Disponibilidade Sistema,SLA de disponibilidade,Uptime,99.9%',
          'Tempo Resposta,SLA de performance,Response Time,< 2s',
          'Resolução Incidentes,SLA de suporte,MTTR,< 4h'
        ];
        break;
      case 'runbooks':
        exemplos = [
          'RB-001,Deploy de aplicação,Procedimento para deploy em produção,Operacional',
          'RB-002,Backup de banco,Procedimento para backup diário,Manutenção',
          'RB-003,Rollback de versão,Procedimento para reverter deploy,Emergencial'
        ];
        break;
      case 'estruturas-projeto':
        exemplos = [
          'Azure DevOps,Scrum,Portal Colaboradores,2025-01-15,1,Time Portal,2',
          'Azure DevOps,Agile,Sistema Financeiro V2,2025-02-01,1,Time Financeiro,3',
          'Azure DevOps,Basic,Mobile App Cliente,2025-03-01,1,Time Mobile,2'
        ];
        break;
    }
    
    // Montar CSV completo
    const csvContent = [header, ...exemplos].join('\n');
    
    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `exemplo-${tipo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logEvent('download_exemplo_csv', 'click', { tipo });
  };
  const [arquivos, setArquivos] = useState<ArquivoCarga[]>([]);
  const [processando, setProcessando] = useState(false);
  const [logs, setLogs] = useState<LogCarga[]>([]);

  const adicionarLog = (tipo: LogCarga['tipo'], mensagem: string) => {
    const log: LogCarga = {
      timestamp: new Date().toISOString(),
      tipo,
      mensagem
    };
    setLogs(prev => [...prev, log]);
    
    logEvent(
      'log_adicionado',
      tipo === 'error' ? 'error' : 'load',
      { mensagem }
    );
  };

  const detectarTipoEntidade = (nomeArquivo: string): TipoEntidade | null => {
    const nome = nomeArquivo.toLowerCase();
    
    if (nome.includes('tipo') && nome.includes('afastamento')) return 'tipos-afastamento';
    if (nome.includes('colaborador')) return 'colaboradores';
    if (nome.includes('tecnologia')) return 'tecnologias';
    if (nome.includes('processo')) return 'processos-negocio';
    if (nome.includes('aplicac')) return 'aplicacoes';
    if (nome.includes('capacidade')) return 'capacidades-negocio';
    if (nome.includes('habilidade')) return 'habilidades';
    if (nome.includes('sla')) return 'slas';
    if (nome.includes('runbook')) return 'runbooks';
    
    return null;
  };

  const detectarFormato = (nomeArquivo: string): 'csv' | 'json' => {
    return nomeArquivo.toLowerCase().endsWith('.json') ? 'json' : 'csv';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const novosArquivos: ArquivoCarga[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tipo = detectarTipoEntidade(file.name);
      
      if (!tipo) {
        adicionarLog('warning', `Não foi possível detectar o tipo de entidade para: ${file.name}`);
        continue;
      }

      try {
        const conteudo = await file.text();
        const arquivo: ArquivoCarga = {
          id: `${Date.now()}-${i}`,
          nome: file.name,
          tipo,
          formato: detectarFormato(file.name),
          conteudo,
          tamanho: file.size,
          status: 'pendente'
        };

        novosArquivos.push(arquivo);
        adicionarLog('info', `Arquivo carregado: ${file.name} (${tipo})`);
      } catch (error) {
        adicionarLog('error', `Erro ao ler arquivo ${file.name}: ${error}`);
      }
    }

    setArquivos(prev => [...prev, ...novosArquivos]);
    
    logEvent(
      'arquivos_carregados',
      'input',
      { quantidade: novosArquivos.length }
    );
  };

  const parseCSV = (conteudo: string): any[] => {
    const linhas = conteudo.split('\n').filter(l => l.trim());
    if (linhas.length < 2) {
      throw new Error('Arquivo CSV vazio ou sem dados');
    }

    const cabecalho = linhas[0].split(',').map(c => c.trim());
    const registros: any[] = [];

    if (import.meta.env.DEV) {
      console.log('CSV Cabeçalho:', cabecalho);
    }

    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(',').map(v => v.trim());
      const registro: any = {};
      
      cabecalho.forEach((campo, idx) => {
        registro[campo] = valores[idx] || '';
      });
      
      registros.push(registro);
    }

    if (import.meta.env.DEV) {
      console.log(`CSV parseado: ${registros.length} registros`);
      console.log('Primeiro registro:', registros[0]);
    }

    return registros;
  };

  const parseJSON = (conteudo: string): any[] => {
    try {
      const dados = JSON.parse(conteudo);
      const resultado = Array.isArray(dados) ? dados : [dados];
      
      if (import.meta.env.DEV) {
        console.log(`JSON parseado: ${resultado.length} registros`);
        console.log('Primeiro registro:', resultado[0]);
      }
      
      return resultado;
    } catch (error) {
      throw new Error(`JSON inválido: ${error}`);
    }
  };

  const processarArquivo = async (arquivo: ArquivoCarga) => {
    adicionarLog('info', `Processando: ${arquivo.nome}...`);
    
    setArquivos(prev => prev.map(a => 
      a.id === arquivo.id ? { ...a, status: 'processando' } : a
    ));

    try {
      const config = ENTIDADES_CONFIG[arquivo.tipo];
      if (!config) {
        throw new Error(`Tipo de entidade '${arquivo.tipo}' não é mais suportado`);
      }

      // Parse do conteúdo
      const registros = arquivo.formato === 'csv' 
        ? parseCSV(arquivo.conteudo)
        : parseJSON(arquivo.conteudo);

      adicionarLog('info', `${registros.length} registros encontrados`);

      let importados = 0;
      const erros: string[] = [];

      // Importar cada registro
      for (let i = 0; i < registros.length; i++) {
        const registro = registros[i];
        const linha = i + 1;
        
        // Log de progresso em tempo real
        adicionarLog('info', `📝 Processando linha ${linha}/${registros.length}...`);
        
        // Log do registro sendo enviado (apenas em desenvolvimento)
        if (import.meta.env.DEV) {
          console.log(`[Linha ${linha}] Enviando:`, registro);
        }
        
        try {
          const response = await fetch(`${API_URL}${config.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(registro)
          });

          // Log da resposta
          if (import.meta.env.DEV) {
            console.log(`[Linha ${linha}] Status: ${response.status}`);
          }

          if (response.ok) {
            importados++;
            adicionarLog('success', `✓ Linha ${linha}: Importada com sucesso`);
          } else {
            const errorText = await response.text();
            let mensagemErro = errorText;
            
            // Log do erro completo
            if (import.meta.env.DEV) {
              console.error(`[Linha ${linha}] Erro:`, errorText);
            }
            
            // Tentar extrair mensagem de erro do JSON
            try {
              const errorJson = JSON.parse(errorText);
              mensagemErro = errorJson.error || errorJson.message || errorText;
              
              // Se houver detalhes, incluir
              if (errorJson.details) {
                mensagemErro += ` | Detalhes: ${JSON.stringify(errorJson.details)}`;
              }
              if (errorJson.missing) {
                mensagemErro += ` | Campos faltando: ${errorJson.missing.join(', ')}`;
              }
            } catch {
              // Manter errorText se não for JSON
            }
            
            erros.push(`Linha ${linha}: ${mensagemErro}`);
            adicionarLog('error', `✗ Linha ${linha}: ${mensagemErro}`);
          }
        } catch (error) {
          const mensagemErro = error instanceof Error ? error.message : String(error);
          
          if (import.meta.env.DEV) {
            console.error(`[Linha ${linha}] Exception:`, error);
          }
          
          erros.push(`Linha ${linha}: ${mensagemErro}`);
          adicionarLog('error', `✗ Linha ${linha}: ${mensagemErro}`);
        }
      }

      // Atualizar status
      setArquivos(prev => prev.map(a => 
        a.id === arquivo.id ? {
          ...a,
          status: erros.length === 0 ? 'concluido' : 'erro',
          registros: registros.length,
          importados,
          erros
        } : a
      ));

      if (erros.length === 0) {
        adicionarLog('success', `✓ ${arquivo.nome}: ${importados}/${registros.length} registros importados`);
      } else {
        adicionarLog('warning', `⚠ ${arquivo.nome}: ${importados}/${registros.length} importados, ${erros.length} erros`);
      }

      logEvent(
        'arquivo_processado',
        'api_response',
        {
          tipo: arquivo.tipo,
          importados: importados,
          arquivo: arquivo.nome,
          total: registros.length,
          erros: erros.length
        }
      );

    } catch (error) {
      setArquivos(prev => prev.map(a => 
        a.id === arquivo.id ? {
          ...a,
          status: 'erro',
          erros: [String(error)]
        } : a
      ));
      
      adicionarLog('error', `✗ Erro ao processar ${arquivo.nome}: ${error}`);
    }
  };

  const processarTodos = async () => {
    setProcessando(true);
    adicionarLog('info', 'Iniciando processamento em lote...');

    const pendentes = arquivos.filter(a => a.status === 'pendente' && ENTIDADES_CONFIG[a.tipo]);

    for (const arquivo of pendentes) {
      await processarArquivo(arquivo);
    }

    setProcessando(false);
    adicionarLog('success', '✓ Processamento em lote concluído');
    
    logEvent(
      'lote_concluido',
      'api_response',
      { quantidade_arquivos: pendentes.length }
    );
  };

  const removerArquivo = (id: string) => {
    setArquivos(prev => prev.filter(a => a.id !== id));
    adicionarLog('info', 'Arquivo removido da fila');
  };

  const limparTodos = () => {
    setArquivos([]);
    setLogs([]);
    adicionarLog('info', 'Fila de carga limpa');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Carga de Dados</h1>
            <p className="text-muted-foreground mt-2">
              Importe dados em massa via arquivos CSV ou JSON
            </p>
          </div>
        </div>

        <Separator />

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivos</CardTitle>
            <CardDescription>
              Selecione um ou mais arquivos CSV/JSON para importação. O sistema detectará automaticamente o tipo de entidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".csv,.json"
                multiple
                className="hidden"
                id="file-upload-carga"
              />
              <label htmlFor="file-upload-carga" className="cursor-pointer">
                <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">
                  Clique para selecionar arquivos ou arraste aqui
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: CSV, JSON | Múltiplos arquivos permitidos
                </p>
              </label>
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <Button
                onClick={processarTodos}
                disabled={processando || arquivos.filter(a => a.status === 'pendente').length === 0}
                className="flex-1"
              >
                {processando ? 'Processando...' : 'Processar Todos'}
              </Button>
              <Button
                onClick={limparTodos}
                disabled={processando || arquivos.length === 0}
                variant="secondary"
              >
                Limpar Fila
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid: Fila de Arquivos + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fila de Arquivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Fila de Importação ({arquivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {arquivos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum arquivo na fila. Faça upload para começar.
                  </p>
                ) : (
              arquivos.filter(arquivo => ENTIDADES_CONFIG[arquivo.tipo]).map((arquivo) => (
                <div
                  key={arquivo.id}
                  className="border rounded-lg p-4 hover:bg-accent"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {arquivo.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                          {ENTIDADES_CONFIG[arquivo.tipo]?.label || arquivo.tipo}
                        </span>
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded uppercase">
                          {arquivo.formato}
                        </span>
                      </div>
                      
                      {/* Status */}
                      <div className="mt-2">
                        {arquivo.status === 'pendente' && (
                          <span className="text-xs text-muted-foreground">Aguardando processamento</span>
                        )}
                        {arquivo.status === 'processando' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                            Processando...
                          </span>
                        )}
                        {arquivo.status === 'concluido' && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {arquivo.importados}/{arquivo.registros} importados
                            </span>
                          </div>
                        )}
                        {arquivo.status === 'erro' && (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {arquivo.importados || 0}/{arquivo.registros} - {arquivo.erros?.length} erros
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Erros */}
                      {arquivo.erros && arquivo.erros.length > 0 && (
                        <details className="mt-3 open:mt-3">
                          <summary className="text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer hover:underline flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Ver erros ({arquivo.erros.length})
                          </summary>
                          <div className="mt-2 border border-red-200 dark:border-red-900/30 rounded-md bg-red-50/50 dark:bg-red-950/20 p-2 max-h-60 overflow-y-auto">
                            <div className="space-y-1">
                              {arquivo.erros.map((erro, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs font-mono text-red-800 dark:text-red-300 bg-white dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-900/50"
                                >
                                  {erro}
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      {arquivo.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => processarArquivo(arquivo)}
                            disabled={processando}
                            className="p-1 text-primary hover:bg-accent rounded"
                            title="Processar agora"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removerArquivo(arquivo.id)}
                            disabled={processando}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="Remover"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Log de Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm ${
                  log.tipo === 'success' ? 'bg-blue-600 border border-blue-700 text-white' :
                  log.tipo === 'error' ? 'bg-blue-600 border border-blue-700 text-white' :
                  log.tipo === 'warning' ? 'bg-blue-600 border border-blue-700 text-white' :
                  'bg-blue-600 border border-blue-700 text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  {log.tipo === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />}
                  {log.tipo === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />}
                  <div className="flex-1">
                    <p className={`font-medium ${log.tipo === 'error' ? 'text-red-400' : 'text-white'}`}>{log.mensagem}</p>
                    <p className="text-xs text-white/70 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum log ainda. Processe arquivos para ver os logs.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Guia de Uso */}
      <Card className="bg-primary border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-foreground">
            <DownloadSimple className="w-5 h-5" />
            Guia de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-primary-foreground">
          <div>
            <h4 className="font-semibold mb-2 text-primary-foreground">Formatos de Arquivo</h4>
            <ul className="space-y-1 pl-4 text-primary-foreground">
              <li className="list-disc"><strong>CSV</strong>: Primeira linha = cabeçalho, demais = dados</li>
              <li className="list-disc"><strong>JSON</strong>: Array de objetos ou objeto único</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-primary-foreground">Nomenclatura de Arquivos</h4>
            <p className="mb-2 text-primary-foreground">O sistema detecta automaticamente pelo nome. Clique para baixar exemplo:</p>
            <ul className="space-y-1 pl-4 text-xs text-primary-foreground">
              {Object.entries(ENTIDADES_CONFIG).map(([key, config]) => (
                <li key={key} className="list-disc">
                  <button
                    onClick={() => baixarCsvExemplo(key as TipoEntidade)}
                    className="hover:underline cursor-pointer text-left text-primary-foreground hover:text-primary-foreground/80"
                  >
                    <strong>{config.label}</strong>: {config.exemplo}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-primary-foreground">Campos Obrigatórios (Exemplos)</h4>
            <ul className="space-y-1 pl-4 text-xs text-primary-foreground">
              <li className="list-disc">Tecnologias: nome, versao, plataforma</li>
              <li className="list-disc">Colaboradores: nome, email, cargo</li>
              <li className="list-disc">Aplicações: nome, stack, status</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-primary-foreground">Dicas</h4>
            <ul className="space-y-1 pl-4 text-xs text-primary-foreground">
              <li className="list-disc">Valide os arquivos antes do upload</li>
              <li className="list-disc">Múltiplos arquivos podem ser carregados juntos</li>
              <li className="list-disc">Processamento em lote para eficiência</li>
              <li className="list-disc">Logs detalhados de cada operação</li>
            </ul>
          </div>
        </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
