/**
 * Serviço de Parsing de Arquivos de Dependências
 * 
 * Identifica automaticamente o tipo de projeto e extrai as dependências
 * de acordo com o formato do arquivo (pom.xml, package.json, etc.)
 */

export interface Dependencia {
  nome: string;
  versao: string;
  escopo?: string;
}

export interface ResultadoParser {
  tecnologia: string;
  plataforma: string;
  dependencias: Dependencia[];
  arquivoOriginal: string;
}

export type TipoArquivo = 
  | 'pom.xml'
  | 'build.gradle'
  | 'build.gradle.kts'
  | 'go.mod'
  | 'requirements.txt'
  | 'pyproject.toml'
  | 'package.json'
  | 'composer.json'
  | 'Gemfile'
  | 'Cargo.toml'
  | 'unknown';

/**
 * Identifica o tipo de tecnologia com base no nome do arquivo
 */
export function identificarTecnologia(nomeArquivo: string): { tecnologia: string; plataforma: string } {
  const arquivo = nomeArquivo.toLowerCase();
  
  if (arquivo === 'pom.xml') {
    return { tecnologia: 'Java', plataforma: 'Java (Maven)' };
  }
  
  if (arquivo === 'build.gradle' || arquivo === 'build.gradle.kts') {
    return { tecnologia: 'Java', plataforma: 'Java (Gradle)' };
  }
  
  if (arquivo === 'go.mod') {
    return { tecnologia: 'Go', plataforma: 'Go' };
  }
  
  if (arquivo === 'requirements.txt') {
    return { tecnologia: 'Python', plataforma: 'Python (pip)' };
  }
  
  if (arquivo === 'pyproject.toml') {
    return { tecnologia: 'Python', plataforma: 'Python (Poetry)' };
  }
  
  if (arquivo === 'package.json') {
    return { tecnologia: 'JavaScript', plataforma: 'Node.js / TypeScript' };
  }
  
  if (arquivo.endsWith('.csproj')) {
    return { tecnologia: '.NET', plataforma: '.NET' };
  }
  
  if (arquivo === 'composer.json') {
    return { tecnologia: 'PHP', plataforma: 'PHP (Composer)' };
  }
  
  if (arquivo === 'gemfile' || arquivo.endsWith('.gemspec')) {
    return { tecnologia: 'Ruby', plataforma: 'Ruby (Bundler)' };
  }
  
  if (arquivo === 'cargo.toml') {
    return { tecnologia: 'Rust', plataforma: 'Rust (Cargo)' };
  }
  
  return { tecnologia: 'Desconhecida', plataforma: 'Desconhecida' };
}

/**
 * Parser para Maven (pom.xml)
 */
function parsePomXml(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  const parser = new DOMParser();
  
  try {
    const xmlDoc = parser.parseFromString(conteudo, 'text/xml');
    
    // Extrair propriedades (properties) do pom.xml
    const propriedades: Record<string, string> = {};
    const propertiesElement = xmlDoc.getElementsByTagName('properties')[0];
    
    if (propertiesElement) {
      const children = propertiesElement.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const tagName = child.tagName;
        const value = child.textContent || '';
        propriedades[tagName] = value;
      }
    }
    
    // Função para resolver variáveis ${...}
    const resolverVariavel = (valor: string): string => {
      if (!valor) return '';
      
      // Substituir ${property.name} pelo valor da propriedade
      const regex = /\$\{([^}]+)\}/g;
      return valor.replace(regex, (match, propertyName) => {
        return propriedades[propertyName] || match;
      });
    };
    
    const dependencies = xmlDoc.getElementsByTagName('dependency');
    
    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];
      const groupId = dep.getElementsByTagName('groupId')[0]?.textContent || '';
      const artifactId = dep.getElementsByTagName('artifactId')[0]?.textContent || '';
      let version = dep.getElementsByTagName('version')[0]?.textContent || '';
      const scope = dep.getElementsByTagName('scope')[0]?.textContent || 'compile';
      
      // Resolver variáveis na versão
      version = resolverVariavel(version);
      
      if (artifactId) {
        dependencias.push({
          nome: groupId ? `${groupId}:${artifactId}` : artifactId,
          versao: version || 'latest',
          escopo: scope
        });
      }
    }
  } catch (error) {
    console.error('Erro ao parsear pom.xml:', error);
  }
  
  return dependencias;
}

/**
 * Parser para Gradle (build.gradle / build.gradle.kts)
 */
function parseGradle(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  // Extrair variáveis do tipo: def slf4jVersion = '2.0.7'
  const variaveis: Record<string, string> = {};
  const regexVar = /(?:def|val)\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
  
  let matchVar;
  while ((matchVar = regexVar.exec(conteudo)) !== null) {
    variaveis[matchVar[1]] = matchVar[2];
  }
  
  // Função para resolver variáveis ${...} ou $varName
  const resolverVariavel = (valor: string): string => {
    if (!valor) return '';
    
    // Substituir ${varName} ou $varName
    return valor.replace(/\$\{?(\w+)\}?/g, (match, varName) => {
      return variaveis[varName] || match;
    });
  };
  
  // Regex para capturar dependências do tipo: implementation 'group:artifact:version'
  const regexImplementation = /(?:implementation|api|testImplementation|runtimeOnly|compileOnly)\s*['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = regexImplementation.exec(conteudo)) !== null) {
    const dep = match[1];
    const parts = dep.split(':');
    
    if (parts.length >= 2) {
      let versao = parts[2] || 'latest';
      versao = resolverVariavel(versao);
      
      dependencias.push({
        nome: `${parts[0]}:${parts[1]}`,
        versao: versao
      });
    }
  }
  
  return dependencias;
}

/**
 * Parser para Go (go.mod)
 */
function parseGoMod(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  // Regex para capturar require (nome versão)
  const regexRequire = /require\s+([^\s]+)\s+v?([^\s]+)/g;
  
  let match;
  while ((match = regexRequire.exec(conteudo)) !== null) {
    dependencias.push({
      nome: match[1],
      versao: match[2]
    });
  }
  
  return dependencias;
}

/**
 * Parser para Python (requirements.txt)
 */
function parseRequirementsTxt(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  const linhas = conteudo.split('\n');
  
  for (const linha of linhas) {
    const trimmed = linha.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Regex para capturar: package==version ou package>=version
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*([><=~!]+)\s*([^\s;]+)/);
    
    if (match) {
      dependencias.push({
        nome: match[1],
        versao: match[3]
      });
    } else {
      // Apenas nome do pacote
      const nomePacote = trimmed.split(/\s+/)[0];
      if (nomePacote) {
        dependencias.push({
          nome: nomePacote,
          versao: 'latest'
        });
      }
    }
  }
  
  return dependencias;
}

/**
 * Parser para Python (pyproject.toml)
 */
function parsePyprojectToml(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  // Regex simples para capturar dependências no formato: package = "^version"
  const regexDep = /([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/g;
  
  let match;
  let inDependencies = false;
  
  const linhas = conteudo.split('\n');
  for (const linha of linhas) {
    if (linha.includes('[tool.poetry.dependencies]') || linha.includes('[project.dependencies]')) {
      inDependencies = true;
      continue;
    }
    
    if (inDependencies && linha.trim().startsWith('[')) {
      inDependencies = false;
    }
    
    if (inDependencies) {
      const m = linha.match(/([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/);
      if (m && m[1] !== 'python') {
        dependencias.push({
          nome: m[1],
          versao: m[2].replace('^', '').replace('~', '')
        });
      }
    }
  }
  
  return dependencias;
}

/**
 * Parser para Node.js (package.json)
 */
function parsePackageJson(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  try {
    const pkg = JSON.parse(conteudo);
    
    // Dependencies regulares
    if (pkg.dependencies) {
      Object.entries(pkg.dependencies).forEach(([nome, versao]) => {
        dependencias.push({
          nome,
          versao: (versao as string).replace('^', '').replace('~', ''),
          escopo: 'production'
        });
      });
    }
    
    // Dev dependencies
    if (pkg.devDependencies) {
      Object.entries(pkg.devDependencies).forEach(([nome, versao]) => {
        dependencias.push({
          nome,
          versao: (versao as string).replace('^', '').replace('~', ''),
          escopo: 'development'
        });
      });
    }
  } catch (error) {
    console.error('Erro ao parsear package.json:', error);
  }
  
  return dependencias;
}

/**
 * Parser para PHP (composer.json)
 */
function parseComposerJson(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  try {
    const composer = JSON.parse(conteudo);
    
    if (composer.require) {
      Object.entries(composer.require).forEach(([nome, versao]) => {
        if (nome !== 'php') {
          dependencias.push({
            nome,
            versao: (versao as string).replace('^', '').replace('~', ''),
            escopo: 'production'
          });
        }
      });
    }
    
    if (composer['require-dev']) {
      Object.entries(composer['require-dev']).forEach(([nome, versao]) => {
        dependencias.push({
          nome,
          versao: (versao as string).replace('^', '').replace('~', ''),
          escopo: 'development'
        });
      });
    }
  } catch (error) {
    console.error('Erro ao parsear composer.json:', error);
  }
  
  return dependencias;
}

/**
 * Parser para Ruby (Gemfile)
 */
function parseGemfile(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  // Regex para capturar gem 'nome', 'versao'
  const regexGem = /gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/g;
  
  let match;
  while ((match = regexGem.exec(conteudo)) !== null) {
    dependencias.push({
      nome: match[1],
      versao: match[2] || 'latest'
    });
  }
  
  return dependencias;
}

/**
 * Parser para Rust (Cargo.toml)
 */
function parseCargoToml(conteudo: string): Dependencia[] {
  const dependencias: Dependencia[] = [];
  
  let inDependencies = false;
  const linhas = conteudo.split('\n');
  
  for (const linha of linhas) {
    if (linha.trim() === '[dependencies]') {
      inDependencies = true;
      continue;
    }
    
    if (inDependencies && linha.trim().startsWith('[')) {
      inDependencies = false;
    }
    
    if (inDependencies) {
      const match = linha.match(/([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/);
      if (match) {
        dependencias.push({
          nome: match[1],
          versao: match[2]
        });
      }
    }
  }
  
  return dependencias;
}

/**
 * Função principal de parsing
 */
export function parseArquivoDependencias(
  nomeArquivo: string,
  conteudo: string
): ResultadoParser {
  const { tecnologia, plataforma } = identificarTecnologia(nomeArquivo);
  let dependencias: Dependencia[] = [];
  
  const arquivo = nomeArquivo.toLowerCase();
  
  if (arquivo === 'pom.xml') {
    dependencias = parsePomXml(conteudo);
  } else if (arquivo === 'build.gradle' || arquivo === 'build.gradle.kts') {
    dependencias = parseGradle(conteudo);
  } else if (arquivo === 'go.mod') {
    dependencias = parseGoMod(conteudo);
  } else if (arquivo === 'requirements.txt') {
    dependencias = parseRequirementsTxt(conteudo);
  } else if (arquivo === 'pyproject.toml') {
    dependencias = parsePyprojectToml(conteudo);
  } else if (arquivo === 'package.json') {
    dependencias = parsePackageJson(conteudo);
  } else if (arquivo === 'composer.json') {
    dependencias = parseComposerJson(conteudo);
  } else if (arquivo === 'gemfile' || arquivo.endsWith('.gemspec')) {
    dependencias = parseGemfile(conteudo);
  } else if (arquivo === 'cargo.toml') {
    dependencias = parseCargoToml(conteudo);
  }
  
  return {
    tecnologia,
    plataforma,
    dependencias,
    arquivoOriginal: nomeArquivo
  };
}
