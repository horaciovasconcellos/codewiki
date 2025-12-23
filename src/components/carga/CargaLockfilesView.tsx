import { useState, useEffect } from 'react';
import { Upload, FileCode, CheckCircle, XCircle, Cpu } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLogging } from '@/hooks/use-logging';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mapeamento de lockfiles para linguagens e tecnologias
const LOCKFILE_MAPPING = {
  'conan.lock': { language: 'C/C++', tech: 'Conan' },
  'pubspec.lock': { language: 'Dart', tech: 'Dart' },
  'mix.lock': { language: 'Elixir', tech: 'Elixir' },
  'go.mod': { language: 'Go', tech: 'Go' },
  'cabal.project.freeze': { language: 'Haskell', tech: 'Cabal' },
  'stack.yaml.lock': { language: 'Haskell', tech: 'Stack' },
  'buildscript-gradle.lockfile': { language: 'Java', tech: 'Gradle' },
  'gradle.lockfile': { language: 'Java', tech: 'Gradle' },
  'gradle/verification-metadata.xml': { language: 'Java', tech: 'Gradle' },
  'pom.xml': { language: 'Java', tech: 'Maven' },
  'package-lock.json': { language: 'Javascript', tech: 'npm' },
  'pnpm-lock.yaml': { language: 'Javascript', tech: 'pnpm' },
  'yarn.lock': { language: 'Javascript', tech: 'Yarn' },
  'deps.json': { language: '.NET', tech: '.NET' },
  'packages.config': { language: '.NET', tech: 'NuGet' },
  'packages.lock.json': { language: '.NET', tech: 'NuGet' },
  'composer.lock': { language: 'PHP', tech: 'Composer' },
  'Pipfile.lock': { language: 'Python', tech: 'Pipenv' },
  'poetry.lock': { language: 'Python', tech: 'Poetry' },
  'requirements.txt': { language: 'Python', tech: 'pip' },
  'pdm.lock': { language: 'Python', tech: 'PDM' },
  'uv.lock': { language: 'Python', tech: 'uv' },
  'renv.lock': { language: 'R', tech: 'renv' },
  'Gemfile.lock': { language: 'Ruby', tech: 'Bundler' },
  'gems.locked': { language: 'Ruby', tech: 'Bundler' },
  'Cargo.lock': { language: 'Rust', tech: 'Cargo' },
};

interface Aplicacao {
  id: string;
  sigla: string;
  descricao: string;
}

interface ProcessamentoResultado {
  arquivo: string;
  dependencia: string;
  versao: string;
  tecnologia: string;
  linguagem: string;
  tecExistente: boolean;
  tecCriada: boolean;
  associada: boolean;
  erro?: string;
}

export function CargaLockfilesView() {
  const { logEvent } = useLogging('carga-lockfiles');
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [aplicacaoId, setAplicacaoId] = useState<string>('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [processando, setProcessando] = useState(false);
  const [resultados, setResultados] = useState<ProcessamentoResultado[]>([]);

  const carregarAplicacoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/aplicacoes`);
      if (!response.ok) throw new Error('Erro ao carregar aplicações');
      const data = await response.json();
      setAplicacoes(data);
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
      toast.error('Erro ao carregar lista de aplicações');
    }
  };

  useEffect(() => {
    carregarAplicacoes();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setArquivos(files);
      logEvent('arquivos_selecionados', 'input', { quantidade: files.length });
    }
  };

  const identificarTecnologia = (nomeArquivo: string): { language: string; tech: string } | null => {
    // Busca exata
    if (LOCKFILE_MAPPING[nomeArquivo as keyof typeof LOCKFILE_MAPPING]) {
      return LOCKFILE_MAPPING[nomeArquivo as keyof typeof LOCKFILE_MAPPING];
    }

    // Busca por padrão (para casos como gradle/verification-metadata.xml)
    for (const [pattern, info] of Object.entries(LOCKFILE_MAPPING)) {
      if (nomeArquivo.includes(pattern) || pattern.includes(nomeArquivo)) {
        return info;
      }
    }

    return null;
  };

  const extrairDependencias = async (arquivo: File): Promise<Array<{ nome: string; versao: string }>> => {
    const texto = await arquivo.text();
    const dependencias: Array<{ nome: string; versao: string }> = [];

    try {
      // package-lock.json ou package.json (npm)
      if (arquivo.name.includes('package')) {
        const json = JSON.parse(texto);
        const deps = json.dependencies || json.packages || {};
        for (const [nome, info] of Object.entries(deps)) {
          if (nome && nome !== '' && !nome.startsWith('node_modules/')) {
            const versao = typeof info === 'object' && info !== null ? (info as any).version || 'latest' : String(info);
            dependencias.push({ nome, versao });
          }
        }
      }
      // pom.xml (Maven)
      else if (arquivo.name.includes('pom.xml')) {
        // Primeiro, extrair as propriedades
        const propriedades: Record<string, string> = {};
        const propsMatch = texto.match(/<properties>([\s\S]*?)<\/properties>/);
        if (propsMatch) {
          const propsMatches = propsMatch[1].matchAll(/<([^>]+)>(.*?)<\/\1>/g);
          for (const match of propsMatches) {
            propriedades[match[1]] = match[2];
          }
        }

        // Função para resolver referências ${...}
        const resolverVersao = (versao: string): string => {
          // Se contém ${...}, buscar referência
          if (versao.includes('${')) {
            const propNameMatch = versao.match(/\$\{([^}]+)\}/);
            if (propNameMatch) {
              const propName = propNameMatch[1];
              return propriedades[propName] || versao;
            }
          }
          
          // Verificar se é uma versão válida com o padrão especificado
          const versionPattern = /\d+(?:\.\d+){1,3}(?:-[A-Za-z0-9._-]+)?/;
          if (versionPattern.test(versao)) {
            return versao;
          }
          
          return versao;
        };

        // Extrair dependências - usando regex mais específica para capturar versão
        const dependencyPattern = /<dependency>([\s\S]*?)<\/dependency>/g;
        const dependencyMatches = texto.matchAll(dependencyPattern);
        
        for (const depMatch of dependencyMatches) {
          const depContent = depMatch[1];
          
          // Extrair groupId
          const groupIdMatch = depContent.match(/<groupId>(.*?)<\/groupId>/);
          const groupId = groupIdMatch ? groupIdMatch[1].trim() : '';
          
          // Extrair artifactId
          const artifactIdMatch = depContent.match(/<artifactId>(.*?)<\/artifactId>/);
          const artifactId = artifactIdMatch ? artifactIdMatch[1].trim() : '';
          
          // Extrair version
          const versionMatch = depContent.match(/<version>(.*?)<\/version>/);
          const versaoRaw = versionMatch ? versionMatch[1].trim() : null;
          
          console.log('POM.xml - Extraindo:', { groupId, artifactId, versaoRaw });
          
          const versao = versaoRaw ? resolverVersao(versaoRaw) : 'managed';
          console.log('POM.xml - Versão resolvida:', versao);
          
          if (groupId && artifactId) {
            dependencias.push({ 
              nome: `${groupId}:${artifactId}:${versao}`,
              versao,
              groupId,
              artifactId
            });
          }
        }
      }
      // Gemfile.lock (Ruby)
      else if (arquivo.name === 'Gemfile.lock') {
        const matches = texto.matchAll(/^\s{4}(\S+)\s+\(([^)]+)\)/gm);
        for (const match of matches) {
          dependencias.push({ nome: match[1], versao: match[2] });
        }
      }
      // Cargo.lock (Rust)
      else if (arquivo.name === 'Cargo.lock') {
        const matches = texto.matchAll(/name = "([^"]+)"[\s\S]*?version = "([^"]+)"/g);
        for (const match of matches) {
          dependencias.push({ nome: match[1], versao: match[2] });
        }
      }
      // requirements.txt (Python)
      else if (arquivo.name.includes('requirements')) {
        const linhas = texto.split('\n');
        for (const linha of linhas) {
          const match = linha.trim().match(/^([a-zA-Z0-9_-]+)([=><~!]+(.+))?/);
          if (match && match[1]) {
            dependencias.push({ nome: match[1], versao: match[3] || 'latest' });
          }
        }
      }
      // yarn.lock
      else if (arquivo.name === 'yarn.lock') {
        const matches = texto.matchAll(/^"?([^@"\s]+)@.+:\s+version\s+"([^"]+)"/gm);
        for (const match of matches) {
          dependencias.push({ nome: match[1], versao: match[2] });
        }
      }
      // Pipfile.lock (Python)
      else if (arquivo.name === 'Pipfile.lock') {
        const json = JSON.parse(texto);
        const deps = { ...json.default, ...json.develop };
        for (const [nome, info] of Object.entries(deps)) {
          dependencias.push({ nome, versao: (info as any).version || 'latest' });
        }
      }
      // go.sum (Go)
      else if (arquivo.name === 'go.sum') {
        const linhas = texto.split('\n');
        const seen = new Set<string>();
        for (const linha of linhas) {
          const match = linha.trim().match(/^(\S+)\s+v([^\s]+)/);
          if (match && !seen.has(match[1])) {
            dependencias.push({ nome: match[1], versao: match[2] });
            seen.add(match[1]);
          }
        }
      }
      // build.gradle / build.gradle.kts (Gradle)
      else if (arquivo.name.includes('build.gradle')) {
        const linhas = texto.split('\n');
        for (const linha of linhas) {
          // implementation 'group:artifact:version'
          const match1 = linha.match(/implementation\s+['"]([^:]+):([^:]+):([^'"]+)['"]/);
          if (match1) {
            dependencias.push({ nome: `${match1[1]}:${match1[2]}`, versao: match1[3] });
            continue;
          }
          // implementation("group:artifact:version")
          const match2 = linha.match(/implementation\s*\(\s*['"]([^:]+):([^:]+):([^'"]+)['"]\s*\)/);
          if (match2) {
            dependencias.push({ nome: `${match2[1]}:${match2[2]}`, versao: match2[3] });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao parsear arquivo:', error);
    }

    return dependencias;
  };

  const verificarTecnologiaExiste = async (nomeTech: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias?nome=${encodeURIComponent(nomeTech)}`);
      if (!response.ok) return null;
      const tecnologias = await response.json();
      const encontrada = tecnologias.find((t: any) => 
        t.nome.toLowerCase() === nomeTech.toLowerCase()
      );
      return encontrada ? encontrada.id : null;
    } catch (error) {
      console.error('Erro ao verificar tecnologia:', error);
      return null;
    }
  };

  const criarTecnologia = async (nomeTech: string, linguagem: string, versao?: string, artifactId?: string): Promise<string | null> => {
    try {
      // Gerar sigla: para POM.xml usa apenas artifactId, caso contrário usa nome+timestamp
      let sigla: string;
      if (artifactId) {
        sigla = artifactId.substring(0, 50);
      } else {
        const nomeClean = nomeTech.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const timestamp = Date.now().toString().slice(-5);
        sigla = (nomeClean.substring(0, 14).padEnd(14, '0') + '-' + timestamp).substring(0, 50);
      }
      
      const tecnologia = {
        sigla,
        nome: nomeTech,
        versaoRelease: versao || 'latest',
        categoria: 'Biblioteca',
        status: 'Ativa',
        fornecedorFabricante: 'Open Source Community',
        tipoLicenciamento: 'Open Source',
        maturidadeInterna: 'Padronizada',
        nivelSuporteInterno: 'Sem Suporte Interno',
        ambientes: {
          dev: true,
          qa: true,
          prod: true,
          cloud: true,
          onPremise: true
        }
      };

      const response = await fetch(`${API_URL}/api/tecnologias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tecnologia)
      });

      if (response.ok) {
        const criada = await response.json();
        return criada.id;
      }

      // Se retornar 409 (Conflict), a tecnologia já existe - buscar o ID
      if (response.status === 409) {
        console.log(`Tecnologia ${nomeTech} já existe, buscando ID...`);
        return await verificarTecnologiaExiste(nomeTech);
      }

      throw new Error(`Erro ao criar tecnologia: ${response.status}`);
    } catch (error) {
      console.error('Erro ao criar tecnologia:', error);
      return null;
    }
  };

  const associarAplicacaoTecnologia = async (aplicacaoId: string, tecnologiaId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacaoId}/tecnologias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idTecnologia: tecnologiaId })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao associar aplicação e tecnologia:', error);
      return false;
    }
  };

  const processarArquivos = async () => {
    if (!aplicacaoId) {
      toast.error('Selecione uma aplicação');
      return;
    }

    if (arquivos.length === 0) {
      toast.error('Selecione ao menos um arquivo');
      return;
    }

    setProcessando(true);
    setResultados([]);
    logEvent('processamento_iniciado', 'click', { 
      aplicacao_id: aplicacaoId, 
      total_arquivos: arquivos.length 
    });

    const novosResultados: ProcessamentoResultado[] = [];

    for (const arquivo of arquivos) {
      const info = identificarTecnologia(arquivo.name);

      if (!info) {
        novosResultados.push({
          arquivo: arquivo.name,
          dependencia: arquivo.name,
          versao: '-',
          tecnologia: 'Desconhecida',
          linguagem: 'Desconhecida',
          tecExistente: false,
          tecCriada: false,
          associada: false,
          erro: 'Formato de arquivo não reconhecido'
        });
        continue;
      }

      // Extrair dependências do arquivo
      const dependencias = await extrairDependencias(arquivo);

      if (dependencias.length === 0) {
        novosResultados.push({
          arquivo: arquivo.name,
          dependencia: '(vazio)',
          versao: '-',
          tecnologia: info.tech,
          linguagem: info.language,
          tecExistente: false,
          tecCriada: false,
          associada: false,
          erro: 'Nenhuma dependência encontrada'
        });
        continue;
      }

      // Processar cada dependência
      for (const dep of dependencias) {
        try {
          // Verificar se tecnologia existe
          let tecId = await verificarTecnologiaExiste(dep.nome);
          const tecExistia = !!tecId;

          // Se não existe, criar
          if (!tecId) {
            tecId = await criarTecnologia(
              dep.nome, 
              info.language, 
              dep.versao, 
              (dep as any).artifactId
            );
          }

          if (!tecId) {
            novosResultados.push({
              arquivo: arquivo.name,
              dependencia: dep.nome,
              versao: dep.versao,
              tecnologia: dep.nome,
              linguagem: info.language,
              tecExistente: tecExistia,
              tecCriada: false,
              associada: false,
              erro: 'Erro ao criar tecnologia'
            });
            continue;
          }

          // Associar aplicação e tecnologia
          const associada = await associarAplicacaoTecnologia(aplicacaoId, tecId);

          novosResultados.push({
            arquivo: arquivo.name,
            dependencia: dep.nome,
            versao: dep.versao,
            tecnologia: dep.nome,
            linguagem: info.language,
            tecExistente: tecExistia,
            tecCriada: !tecExistia,
            associada
          });
        } catch (error) {
          novosResultados.push({
            arquivo: arquivo.name,
            dependencia: dep.nome,
            versao: dep.versao,
            tecnologia: dep.nome,
            linguagem: info.language,
            tecExistente: false,
            tecCriada: false,
            associada: false,
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
    }

    setResultados(novosResultados);
    setProcessando(false);

    const sucesso = novosResultados.filter(r => r.associada).length;
    const erros = novosResultados.filter(r => r.erro).length;

    logEvent('processamento_concluido', 'load', { 
      sucesso, 
      erros, 
      total: novosResultados.length 
    });

    if (sucesso > 0) {
      toast.success(`${sucesso} arquivo(s) processado(s) com sucesso`);
    }
    if (erros > 0) {
      toast.error(`${erros} arquivo(s) com erro`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Carga de Lockfiles/Manifests</h1>
            <p className="text-muted-foreground mt-2">
              Identifique e associe tecnologias a partir de arquivos de dependências
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload />
                Upload de Arquivos
              </CardTitle>
              <CardDescription>
                Selecione a aplicação e os arquivos lockfiles/manifests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aplicacao">Aplicação *</Label>
                <Select value={aplicacaoId} onValueChange={setAplicacaoId}>
                  <SelectTrigger id="aplicacao">
                    <SelectValue placeholder="Selecione a aplicação" />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.sigla} - {app.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arquivos">Arquivos Lockfiles/Manifests *</Label>
                <Input
                  id="arquivos"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".lock,.json,.xml,.txt,.yaml,.yml,.toml"
                />
                {arquivos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {arquivos.length} arquivo(s) selecionado(s)
                  </p>
                )}
              </div>

              <Button 
                onClick={processarArquivos} 
                disabled={processando || !aplicacaoId || arquivos.length === 0}
                className="w-full"
              >
                {processando ? (
                  <>
                    <Cpu className="mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileCode className="mr-2" />
                    Processar Arquivos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formatos Suportados</CardTitle>
              <CardDescription>
                Arquivos de lockfile/manifest reconhecidos pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(LOCKFILE_MAPPING).map(([file, info]) => (
                  <div key={file} className="flex items-center justify-between p-2 border rounded text-sm">
                    <code className="font-mono">{file}</code>
                    <div className="flex gap-2">
                      <Badge variant="outline">{info.language}</Badge>
                      <Badge variant="secondary">{info.tech}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {resultados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados do Processamento</CardTitle>
              <CardDescription>
                Status de cada dependência processada ({resultados.length} dependências)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Dependência</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Linguagem</TableHead>
                      <TableHead>Status Tecnologia</TableHead>
                      <TableHead>Associação</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultados.map((resultado, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{resultado.arquivo}</TableCell>
                        <TableCell className="font-semibold">{resultado.dependencia}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{resultado.versao}</TableCell>
                        <TableCell>{resultado.linguagem}</TableCell>
                        <TableCell>
                          {resultado.tecExistente && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Existente</Badge>
                          )}
                          {resultado.tecCriada && (
                            <Badge variant="default" className="bg-green-600">Criada</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {resultado.associada ? (
                            <Badge variant="default">Associada</Badge>
                          ) : (
                            <Badge variant="secondary">Não associada</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {resultado.erro ? (
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle weight="fill" />
                              <span className="text-sm">{resultado.erro}</span>
                            </div>
                          ) : resultado.associada ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle weight="fill" />
                              <span className="text-sm">Sucesso</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <XCircle weight="fill" />
                              <span className="text-sm">Erro ao associar</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
