#!/usr/bin/env node

/**
 * Script para gerar catálogo de APIs com Swagger UI integrado ao MkDocs
 * Utiliza o plugin mkdocs-swagger-ui-tag
 * 
 * Funcionalidades:
 * - Lê payloads da tabela `payloads`
 * - Extrai informações de aplicação
 * - Exporta arquivos JSON/YAML para docs/api-catalog/specs/
 * - Gera página índice com todas as APIs
 * - Gera páginas individuais com tag <swagger-ui>
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'mysql-master',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'senha_admin',
  database: process.env.DB_NAME || 'auditoria_sistemas'
};

// Diretórios
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CATALOG_DIR = path.join(DOCS_DIR, 'api-catalog');
const SPECS_DIR = path.join(CATALOG_DIR, 'specs');

/**
 * Conecta ao banco de dados
 */
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MySQL');
    return connection;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    throw error;
  }
}

/**
 * Busca todos os payloads válidos com informações de aplicação
 */
async function fetchPayloads(connection) {
  const query = `
    SELECT 
      p.id,
      p.sigla,
      p.definicao as descricao_curta,
      p.descricao as descricao_longa,
      p.formato_arquivo,
      p.conteudo_arquivo,
      p.versao_openapi,
      p.data_inicio,
      p.data_termino,
      a.nome as aplicacao_nome,
      a.sigla as aplicacao_sigla
    FROM payloads p
    INNER JOIN aplicacoes a ON p.aplicacao_id = a.id
    WHERE p.arquivo_valido = true
      AND (p.data_termino IS NULL OR p.data_termino > NOW())
    ORDER BY a.nome, p.sigla
  `;

  try {
    const [rows] = await connection.execute(query);
    console.log(`✅ Encontrados ${rows.length} payloads válidos`);
    return rows;
  } catch (error) {
    console.error('❌ Erro ao buscar payloads:', error.message);
    throw error;
  }
}

/**
 * Cria estrutura de diretórios
 */
async function createDirectories() {
  try {
    await fs.mkdir(CATALOG_DIR, { recursive: true });
    await fs.mkdir(SPECS_DIR, { recursive: true });
    console.log('✅ Diretórios criados');
  } catch (error) {
    console.error('❌ Erro ao criar diretórios:', error.message);
    throw error;
  }
}

/**
 * Exporta arquivo de especificação OpenAPI
 */
async function exportSpecFile(payload) {
  const extension = payload.formato_arquivo.toLowerCase();
  // Substituir # por - para evitar problemas com URLs
  const sanitizedSigla = payload.sigla.replace(/#/g, '-');
  const filename = `${sanitizedSigla}.${extension}`;
  const filepath = path.join(SPECS_DIR, filename);

  try {
    // Valida se o conteúdo é JSON válido
    if (extension === 'json') {
      JSON.parse(payload.conteudo_arquivo);
    }

    await fs.writeFile(filepath, payload.conteudo_arquivo, 'utf8');
    console.log(`  ✅ Exportado: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`  ❌ Erro ao exportar ${filename}:`, error.message);
    return null;
  }
}

/**
 * Gera página individual da API com Swagger UI
 */
function generateApiPage(payload, specFilename) {
  const specPath = `specs/${specFilename}`;
  
  return `# ${payload.aplicacao_nome} - ${payload.sigla}

## Informações da API

| Campo | Valor |
|-------|-------|
| **Aplicação** | ${payload.aplicacao_nome} (${payload.aplicacao_sigla}) |
| **Sigla** | ${payload.sigla} |
| **Descrição Curta** | ${payload.descricao_curta || 'N/A'} |
| **Versão OpenAPI** | ${payload.versao_openapi || 'N/A'} |
| **Data de Início** | ${payload.data_inicio ? new Date(payload.data_inicio).toLocaleDateString('pt-BR') : 'N/A'} |
| **Status** | 🟢 Ativo |

## Descrição Detalhada

${payload.descricao_longa || '*Nenhuma descrição detalhada disponível.*'}

---

## 📋 Documentação Interativa da API

Utilize o visualizador abaixo para explorar e testar os endpoints da API:

<swagger-ui src="${specPath}"/>

---

## 📥 Download da Especificação

Você pode baixar a especificação OpenAPI completa:

- [📄 Download ${payload.formato_arquivo}](${specPath})

## 🔧 Como Usar

### Importar em Ferramentas

#### Postman
1. Abra o Postman
2. Clique em "Import"
3. Cole a URL: \`http://localhost:8000/api-catalog/${specPath}\`
4. Clique em "Import"

#### Insomnia
1. Abra o Insomnia
2. Clique em "Import/Export"
3. Selecione "Import Data" → "From URL"
4. Cole a URL: \`http://localhost:8000/api-catalog/${specPath}\`

#### Swagger Editor
1. Acesse https://editor.swagger.io/
2. File → Import URL
3. Cole a URL: \`http://localhost:8000/api-catalog/${specPath}\`

### Testar com cURL

Exemplo de como testar endpoints usando cURL:

\`\`\`bash
# Exemplo GET
curl -X GET "https://api.example.com/endpoint" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SEU_TOKEN"

# Exemplo POST
curl -X POST "https://api.example.com/endpoint" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -d '{"key": "value"}'
\`\`\`

---

[← Voltar ao Catálogo](index.md)
`;
}

/**
 * Gera página índice com todas as APIs
 */
function generateIndexPage(payloads, apiPages) {
  const totalApis = payloads.length;
  const aplicacoes = [...new Set(payloads.map(p => p.aplicacao_nome))];
  const totalAplicacoes = aplicacoes.length;

  let content = `# 📚 Catálogo de APIs

Bem-vindo ao **Catálogo de APIs** do Sistema de Auditoria.

Este catálogo contém a documentação completa e interativa de todas as APIs disponíveis no sistema.

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| **Total de Aplicações** | ${totalAplicacoes} |
| **Total de APIs** | ${totalApis} |
| **Última Atualização** | ${new Date().toLocaleString('pt-BR')} |

---

## 🗂️ Índice de APIs

A tabela abaixo lista todas as APIs disponíveis. Clique na sigla para acessar a documentação completa e o visualizador interativo Swagger UI.

| Aplicação | Sigla | Descrição | Versão OpenAPI | Status |
|-----------|-------|-----------|----------------|--------|
`;

  // Adiciona cada API à tabela
  payloads.forEach(payload => {
    const pageLink = apiPages[payload.id];
    const status = '🟢 Ativo';
    const descricao = payload.descricao_curta || 'N/A';
    const versao = payload.versao_openapi || 'N/A';
    
    content += `| ${payload.aplicacao_nome} | [${payload.sigla}](${pageLink}) | ${descricao} | ${versao} | ${status} |\n`;
  });

  content += `
---

## 🚀 Como Usar Este Catálogo

### 1. Explorar APIs
Navegue pela tabela acima e clique na sigla da API desejada.

### 2. Visualizar Documentação
Cada página de API contém:
- ✅ Informações gerais da aplicação
- ✅ Descrição detalhada da API
- ✅ Visualizador interativo Swagger UI
- ✅ Download da especificação OpenAPI
- ✅ Exemplos de uso com cURL, Postman, etc.

### 3. Testar Endpoints
O Swagger UI integrado permite:
- 📋 Visualizar todos os endpoints disponíveis
- 🔍 Ver parâmetros de entrada e saída
- ⚡ Testar requisições diretamente no navegador
- 📝 Gerar código cliente em várias linguagens

### 4. Importar em Ferramentas
Você pode importar as especificações OpenAPI em:
- Postman
- Insomnia
- Swagger Editor
- Qualquer ferramenta compatível com OpenAPI 3.0

---

## 📖 Documentação Adicional

- [Guia de Design de APIs](../DESIGN_API.md)
- [Boas Práticas de APIs RESTful](../BOAS_PRATICAS_API.md)
- [Governança de APIs](../GOVERNANCA_API.md)

---

## 🔄 Atualização

Este catálogo é gerado automaticamente a partir dos payloads cadastrados no sistema.

**Para regenerar o catálogo:**

1. Acesse a interface web em http://localhost:5173
2. Navegue até "Catálogo de APIs"
3. Clique em "Gerar Catálogo de APIs"

---

*Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;

  return content;
}

/**
 * Atualiza mkdocs.yml com as novas páginas
 */
async function updateMkdocsConfig(apiPages) {
  const mkdocsPath = path.join(__dirname, '..', 'mkdocs.yml');
  
  try {
    let content = await fs.readFile(mkdocsPath, 'utf8');

    // Remove seção antiga do catálogo de APIs se existir
    content = content.replace(/\s+- "Catálogo de APIs":[\s\S]*?(?=\n\s+- "|$)/m, '');

    // Cria nova seção do catálogo
    let catalogSection = '\n  - "Catálogo de APIs":\n';
    catalogSection += '      - "Índice": "api-catalog/index.md"\n';

    // Agrupa por aplicação
    const grouped = {};
    Object.entries(apiPages).forEach(([id, page]) => {
      const payload = apiPages._payloads?.find(p => p.id === id);
      if (payload) {
        if (!grouped[payload.aplicacao_nome]) {
          grouped[payload.aplicacao_nome] = [];
        }
        grouped[payload.aplicacao_nome].push({
          sigla: payload.sigla,
          page: page
        });
      }
    });

    // Adiciona páginas agrupadas
    Object.entries(grouped).forEach(([app, apis]) => {
      apis.forEach(api => {
        catalogSection += `      - "${api.sigla}": "api-catalog/${api.page}"\n`;
      });
    });

    // Insere antes da última linha
    const lines = content.split('\n');
    lines.splice(lines.length - 1, 0, catalogSection);
    content = lines.join('\n');

    await fs.writeFile(mkdocsPath, content, 'utf8');
    console.log('✅ mkdocs.yml atualizado');
  } catch (error) {
    console.error('❌ Erro ao atualizar mkdocs.yml:', error.message);
    // Não é crítico, continua
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando geração do catálogo de APIs com Swagger UI\n');

  let connection;

  try {
    // 1. Conecta ao banco
    connection = await connectToDatabase();

    // 2. Busca payloads
    const payloads = await fetchPayloads(connection);

    if (payloads.length === 0) {
      console.log('⚠️  Nenhum payload válido encontrado');
      return;
    }

    // 3. Cria diretórios
    await createDirectories();

    // 4. Exporta especificações e gera páginas
    console.log('\n📝 Exportando especificações e gerando páginas...');
    const apiPages = {};
    apiPages._payloads = payloads; // Guarda para uso posterior

    for (const payload of payloads) {
      console.log(`\n📄 Processando: ${payload.aplicacao_nome} - ${payload.sigla}`);
      
      // Exporta arquivo de spec
      const specFilename = await exportSpecFile(payload);
      
      if (specFilename) {
        // Gera página da API
        // Substituir # por - para evitar problemas com URLs
        const sanitizedSigla = payload.sigla.replace(/#/g, '-');
        const pageFilename = `${sanitizedSigla}.md`;
        const pageContent = generateApiPage(payload, specFilename);
        const pagePath = path.join(CATALOG_DIR, pageFilename);
        
        await fs.writeFile(pagePath, pageContent, 'utf8');
        console.log(`  ✅ Página criada: ${pageFilename}`);
        
        apiPages[payload.id] = pageFilename;
      }
    }

    // 5. Gera página índice
    console.log('\n📋 Gerando página índice...');
    const indexContent = generateIndexPage(payloads, apiPages);
    await fs.writeFile(path.join(CATALOG_DIR, 'index.md'), indexContent, 'utf8');
    console.log('✅ Página índice criada');

    // 6. Atualiza mkdocs.yml
    console.log('\n⚙️  Atualizando mkdocs.yml...');
    await updateMkdocsConfig(apiPages);

    // 7. Estatísticas finais
    console.log('\n✅ Catálogo gerado com sucesso!\n');
    console.log('📊 Estatísticas:');
    console.log(`   - Aplicações: ${[...new Set(payloads.map(p => p.aplicacao_nome))].length}`);
    console.log(`   - APIs: ${payloads.length}`);
    console.log(`   - Páginas geradas: ${Object.keys(apiPages).length - 1}`);
    console.log(`   - Especificações exportadas: ${Object.keys(apiPages).length - 1}`);
    console.log('\n📍 Acesse em: http://localhost:8000/api-catalog/');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão com banco encerrada');
    }
  }
}

// Executa
main();
