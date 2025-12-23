import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, ArrowRight, Database, Plus } from '@phosphor-icons/react';
import { parseArquivoDependencias, Dependencia, ResultadoParser } from '@/lib/dependency-parser';
import { useLogging } from '@/hooks/use-logging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TecnologiaStatus {
  dependencia: Dependencia;
  existe: boolean;
  idTecnologia?: string;
  erro?: string;
  cadastrada?: boolean;
}

interface ProcessamentoLog {
  timestamp: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  mensagem: string;
}

export function IdentificadorTecnologias() {
  const { logEvent } = useLogging('identificador-tecnologias');
  const [nomeAplicacao, setNomeAplicacao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [conteudoArquivo, setConteudoArquivo] = useState('');
  const [resultadoParser, setResultadoParser] = useState<ResultadoParser | null>(null);
  const [tecnologiasStatus, setTecnologiasStatus] = useState<TecnologiaStatus[]>([]);
  const [processando, setProcessando] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'upload' | 'analise' | 'verificacao' | 'cadastro' | 'concluido'>('upload');
  const [logs, setLogs] = useState<ProcessamentoLog[]>([]);
  const [idAplicacaoCriada, setIdAplicacaoCriada] = useState<string | null>(null);

  const adicionarLog = (tipo: ProcessamentoLog['tipo'], mensagem: string) => {
    const log: ProcessamentoLog = {
      timestamp: new Date().toISOString(),
      tipo,
      mensagem
    };
    setLogs(prev => [...prev, log]);
    
    // Log de auditoria
    logEvent(
      'log_processamento',
      tipo === 'error' ? 'error' : 'load',
      {
        mensagem: mensagem,
        aplicacao: nomeAplicacao,
        arquivo: arquivo?.name
      }
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setArquivo(file);
    adicionarLog('info', `Arquivo selecionado: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const conteudo = e.target?.result as string;
      setConteudoArquivo(conteudo);
      adicionarLog('success', 'Arquivo carregado com sucesso');
    };
    reader.onerror = () => {
      adicionarLog('error', 'Erro ao ler arquivo');
    };
    reader.readAsText(file);
  };

  const analisarArquivo = () => {
    if (!arquivo || !conteudoArquivo) {
      adicionarLog('error', 'Nenhum arquivo carregado');
      return;
    }

    adicionarLog('info', 'Iniciando análise do arquivo...');
    setEtapaAtual('analise');

    try {
      const resultado = parseArquivoDependencias(arquivo.name, conteudoArquivo);
      setResultadoParser(resultado);
      
      adicionarLog('success', `Tecnologia identificada: ${resultado.plataforma}`);
      adicionarLog('info', `${resultado.dependencias.length} dependências encontradas`);
      
      setEtapaAtual('verificacao');
      
      logEvent(
        'analise_concluida',
        'load',
        {
          plataforma: resultado.plataforma,
          total_dependencias: resultado.dependencias.length
        }
      );
    } catch (error) {
      adicionarLog('error', `Erro ao analisar arquivo: ${error}`);
    }
  };

  const verificarTecnologiasExistentes = async () => {
    if (!resultadoParser) return;

    setProcessando(true);
    adicionarLog('info', 'Verificando tecnologias na base de dados...');

    const status: TecnologiaStatus[] = [];

    for (const dep of resultadoParser.dependencias) {
      try {
        // RN03 - Verificação de existência
        const response = await fetch(
          `${API_URL}/api/tecnologias?nome=${encodeURIComponent(dep.nome)}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const tecnologias = await response.json();
          const existe = tecnologias && tecnologias.length > 0;
          
          status.push({
            dependencia: dep,
            existe,
            idTecnologia: existe ? tecnologias[0].id : undefined
          });

          if (existe) {
            adicionarLog('info', `✓ ${dep.nome} já existe`);
          } else {
            adicionarLog('warning', `✗ ${dep.nome} não encontrada`);
          }
        } else if (response.status === 404) {
          status.push({
            dependencia: dep,
            existe: false
          });
          adicionarLog('warning', `✗ ${dep.nome} não encontrada (404)`);
        } else {
          status.push({
            dependencia: dep,
            existe: false,
            erro: `HTTP ${response.status}`
          });
          adicionarLog('error', `Erro ao verificar ${dep.nome}: HTTP ${response.status}`);
        }
      } catch (error) {
        status.push({
          dependencia: dep,
          existe: false,
          erro: String(error)
        });
        adicionarLog('error', `Erro ao verificar ${dep.nome}: ${error}`);
      }
    }

    setTecnologiasStatus(status);
    setProcessando(false);
    
    const naoExistentes = status.filter(s => !s.existe).length;
    adicionarLog('info', `Verificação concluída: ${naoExistentes} tecnologias precisam ser cadastradas`);
    
    logEvent(
      'verificacao_concluida',
      'load',
      {
        novas_tecnologias: naoExistentes,
        total_verificadas: status.length
      }
    );
  };

  const cadastrarTecnologiasEAplicacao = async () => {
    if (!resultadoParser || !nomeAplicacao.trim()) {
      adicionarLog('error', 'Nome da aplicação é obrigatório');
      return;
    }

    setProcessando(true);
    setEtapaAtual('cadastro');
    adicionarLog('info', 'Iniciando cadastro de tecnologias e aplicação...');

    const statusAtualizado = [...tecnologiasStatus];
    
    // Contadores para relatório final
    let novasCadastradas = 0;
    let errosCadastro = 0;

    // RN04 - Cadastro de tecnologias inexistentes
    for (let i = 0; i < statusAtualizado.length; i++) {
      const item = statusAtualizado[i];
      
      if (!item.existe && !item.cadastrada) {
        try {
          adicionarLog('info', `Cadastrando ${item.dependencia.nome} v${item.dependencia.versao}...`);
          
          const response = await fetch(`${API_URL}/api/tecnologias`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nome: item.dependencia.nome,
              versaoRelease: item.dependencia.versao,
              categoria: 'Biblioteca',
              status: 'Ativa',
              fornecedorFabricante: resultadoParser.plataforma,
              tipoLicenciamento: 'Open Source',
              maturidadeInterna: 'Adotada',
              nivelSuporteInterno: 'Sem Suporte Interno',
              ambientes: {
                dev: true,
                qa: true,
                prod: true,
                cloud: true,
                onPremise: true
              }
            })
          });

          if (response.ok) {
            const novaTecnologia = await response.json();
            statusAtualizado[i] = {
              ...item,
              cadastrada: true,
              idTecnologia: novaTecnologia.id
            };
            novasCadastradas++;
            adicionarLog('success', `✓ ${item.dependencia.nome} cadastrada (ID: ${novaTecnologia.id})`);
            
            logEvent(
              'tecnologia_cadastrada',
              'api_response',
              {
                nome: item.dependencia.nome,
                versao: item.dependencia.versao,
                plataforma: resultadoParser.plataforma
              }
            );
          } else {
            const errorData = await response.text();
            statusAtualizado[i] = {
              ...item,
              erro: `HTTP ${response.status}: ${errorData}`
            };
            errosCadastro++;
            adicionarLog('error', `✗ Erro ao cadastrar ${item.dependencia.nome}: ${response.status} - ${errorData}`);
          }
        } catch (error) {
          statusAtualizado[i] = {
            ...item,
            erro: String(error)
          };
          errosCadastro++;
          adicionarLog('error', `✗ Erro ao cadastrar ${item.dependencia.nome}: ${error}`);
        }
      }
    }

    setTecnologiasStatus(statusAtualizado);
    
    // Relatório de cadastro de tecnologias
    const jaExistiam = statusAtualizado.filter(s => s.existe).length;
    adicionarLog('info', `📊 Resumo: ${jaExistiam} já existiam, ${novasCadastradas} cadastradas, ${errosCadastro} erros`);

    // RN05 - Cadastro da aplicação
    try {
      adicionarLog('info', `Cadastrando aplicação "${nomeAplicacao}"...`);
      
      const responseApp = await fetch(`${API_URL}/api/aplicacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nomeAplicacao,
          stack: resultadoParser.plataforma,
          descricao: `Aplicação criada via identificador automático de tecnologias`,
          status: 'Ativa',
          criticidade: 'Média'
        })
      });

      if (responseApp.ok) {
        const aplicacao = await responseApp.json();
        setIdAplicacaoCriada(aplicacao.id);
        adicionarLog('success', `✓ Aplicação "${nomeAplicacao}" cadastrada`);
        
        logEvent(
          'aplicacao_cadastrada',
          'api_response',
          {
            nome: nomeAplicacao,
            id: aplicacao.id,
            stack: resultadoParser.plataforma
          }
        );

        // RN06 - Relacionamento Aplicação x Tecnologia
        adicionarLog('info', 'Relacionando tecnologias à aplicação...');
        
        let relacionamentos = 0;
        for (const item of statusAtualizado) {
          // Relacionar tanto tecnologias existentes quanto recém-cadastradas
          const idTecnologia = item.idTecnologia;
          
          if (idTecnologia) {
            try {
              const responseRel = await fetch(
                `${API_URL}/api/aplicacoes/${aplicacao.id}/tecnologias`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    idTecnologia: idTecnologia
                  })
                }
              );

              if (responseRel.ok) {
                relacionamentos++;
                adicionarLog('info', `✓ ${item.dependencia.nome} relacionada`);
              } else {
                const errorText = await responseRel.text();
                adicionarLog('warning', `⚠ Erro ao relacionar ${item.dependencia.nome}: ${errorText}`);
              }
            } catch (error) {
              adicionarLog('error', `✗ Erro ao relacionar ${item.dependencia.nome}: ${error}`);
            }
          } else {
            adicionarLog('warning', `⚠ ${item.dependencia.nome} não possui ID para relacionamento`);
          }
        }

        adicionarLog('success', `✓ ${relacionamentos} tecnologias relacionadas à aplicação`);
        setEtapaAtual('concluido');
        
        logEvent(
          'processo_concluido',
          'api_response',
          {
            aplicacao: nomeAplicacao,
            relacionamentos: relacionamentos
          }
        );
      } else {
        adicionarLog('error', `Erro ao cadastrar aplicação: HTTP ${responseApp.status}`);
      }
    } catch (error) {
      adicionarLog('error', `Erro ao cadastrar aplicação: ${error}`);
    }

    setProcessando(false);
  };

  const resetar = () => {
    setNomeAplicacao('');
    setArquivo(null);
    setConteudoArquivo('');
    setResultadoParser(null);
    setTecnologiasStatus([]);
    setEtapaAtual('upload');
    setLogs([]);
    setIdAplicacaoCriada(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Identificador Automático de Tecnologias</h1>
            <p className="text-muted-foreground mt-2">
              Cadastre aplicações e tecnologias automaticamente a partir de arquivos de dependências
            </p>
          </div>
        </div>

        <Separator />

        {/* Etapas do Processo */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-2 ${etapaAtual === 'upload' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${etapaAtual === 'analise' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <FileText className="w-4 h-4" />
                <span>Análise</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${etapaAtual === 'verificacao' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <Database className="w-4 h-4" />
                <span>Verificação</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${etapaAtual === 'cadastro' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                <Plus className="w-4 h-4" />
                <span>Cadastro</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${etapaAtual === 'concluido' ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                <CheckCircle className="w-4 h-4" />
                <span>Concluído</span>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Aplicação</CardTitle>
            <CardDescription>Informe o nome da aplicação e envie o arquivo de dependências</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome-aplicacao">Nome da Aplicação *</Label>
              <Input
                id="nome-aplicacao"
                type="text"
                value={nomeAplicacao}
                onChange={(e) => setNomeAplicacao(e.target.value)}
                placeholder="Ex: Sistema Financeiro"
                disabled={etapaAtual === 'concluido'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo de Dependências *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".xml,.gradle,.kts,.mod,.txt,.toml,.json,.gemspec"
                  disabled={etapaAtual === 'concluido'}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  {arquivo ? (
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      {arquivo.name}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar um arquivo
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos: pom.xml, package.json, requirements.txt, etc.
                  </p>
                </label>
              </div>
            </div>

          {resultadoParser && (
            <div className="bg-accent rounded-lg p-4">
              <h4 className="font-semibold text-accent-foreground mb-2">
                Resultado da Análise
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-foreground">
                  <strong>Plataforma:</strong> {resultadoParser.plataforma}
                </p>
                <p className="text-foreground">
                  <strong>Dependências:</strong> {resultadoParser.dependencias.length}
                </p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3">
            {etapaAtual === 'upload' && (
              <Button
                onClick={analisarArquivo}
                disabled={!arquivo || !conteudoArquivo}
                className="flex-1"
              >
                Analisar Arquivo
              </Button>
            )}

            {etapaAtual === 'verificacao' && (
              <Button
                onClick={verificarTecnologiasExistentes}
                disabled={processando}
                className="flex-1"
              >
                {processando ? 'Verificando...' : 'Verificar Tecnologias'}
              </Button>
            )}

            {tecnologiasStatus.length > 0 && etapaAtual !== 'concluido' && (
              <Button
                onClick={cadastrarTecnologiasEAplicacao}
                disabled={processando || !nomeAplicacao.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processando ? 'Cadastrando...' : 'Cadastrar Tudo'}
              </Button>
            )}

            {etapaAtual === 'concluido' && (
              <Button
                onClick={resetar}
                variant="secondary"
                className="flex-1"
              >
                Nova Análise
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs e Status */}
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
                  log.tipo === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                  log.tipo === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                  log.tipo === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                  'bg-accent text-accent-foreground'
                }`}
              >
                <div className="flex items-start gap-2">
                  {log.tipo === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                  {log.tipo === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium">{log.mensagem}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum log ainda. Faça upload de um arquivo para começar.
              </p>
            )}
          </div>

          {/* Resumo Final */}
          {etapaAtual === 'concluido' && idAplicacaoCriada && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <h4 className="font-bold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Processamento Concluído!
              </h4>
              <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <p><strong>Aplicação:</strong> {nomeAplicacao}</p>
                <p><strong>ID:</strong> {idAplicacaoCriada}</p>
                <p><strong>Tecnologias:</strong> {tecnologiasStatus.length}</p>
                <p><strong>Novas cadastradas:</strong> {tecnologiasStatus.filter(t => t.cadastrada).length}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Tabela de Tecnologias */}
      {tecnologiasStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tecnologias Identificadas ({tecnologiasStatus.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Versão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Escopo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Observação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tecnologiasStatus.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      {item.cadastrada ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Cadastrada
                        </span>
                      ) : item.existe ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Existe
                        </span>
                      ) : item.erro ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-semibold">
                          <XCircle className="w-4 h-4" />
                          Erro
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold">
                          Nova
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                      {item.dependencia.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.dependencia.versao}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.dependencia.escopo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.erro || (item.idTecnologia ? `ID: ${item.idTecnologia.substring(0, 8)}...` : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
