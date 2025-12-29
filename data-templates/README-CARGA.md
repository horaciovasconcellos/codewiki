# Guia de Carga de Dados

## 📁 Arquivos de Exemplo

Este diretório contém arquivos de exemplo para facilitar a carga de dados no sistema.

### Arquivos Disponíveis

1. **exemplo-tipos-afastamento.csv**
   - Tipos de afastamento de colaboradores
   - Campos: nome, descricao, remunerado, afastaINSS

2. **exemplo-tecnologias.csv**
   - Catálogo de tecnologias
   - Campos: nome, versao, plataforma, categoria, fabricante, tipo, status

3. **exemplo-habilidades.csv**
   - Habilidades técnicas e comportamentais
   - Campos: nome, descricao, categoria, nivel

4. **exemplo-aplicacoes.csv**
   - Aplicações/Sistemas corporativos (formato simplificado)
   - Campos: nome, descricao, stack, status, criticidade, url
   - **Limitação**: CSV não suporta relacionamentos complexos
   - **Para relacionamentos**: Use `aplicacoes-carga.json` ou a interface web

5. **aplicacoes-carga.json**
   - Aplicações completas com todos os relacionamentos
   - Suporta: tecnologias, ambientes, capacidades, processos, integrações, SLAs
   - Formato JSON com objetos completos
   - **Recomendado**: Para carga completa de aplicações

6. **exemplo-capacidades-negocio.json**
   - Capacidades estratégicas de negócio
   - Formato JSON com objetos completos

7. **exemplo-scripts.csv**
   - Scripts de automação, administração e infraestrutura (formato simplificado)
   - Campos: sigla, descricao, dataInicio, dataTermino, tipoScript
   - **Limitação**: CSV não suporta upload de arquivos
   - **Para upload de arquivos**: Use `scripts-carga.json` ou a interface web

8. **scripts-carga.json**
   - Scripts completos com metadados de arquivo
   - Suporta: sigla, descrição, datas, tipo, nome do arquivo
   - Formato JSON com objetos completos
   - **Recomendado**: Para carga completa de scripts

## 🚀 Como Usar

### 1. Via Interface Web

1. Acesse: **Ferramentas → Carga de Dados**
2. Faça upload dos arquivos desejados
3. O sistema detecta automaticamente o tipo de entidade
4. Clique em "Processar Todos"
5. Acompanhe os logs de importação

### 2. Via Scripts Shell

```bash
# Importar tipos de afastamento
./scripts/load-data.sh tipos-afastamento data-templates/exemplo-tipos-afastamento.csv

# Importar tecnologias
./scripts/load-data.sh tecnologias data-templates/exemplo-tecnologias.csv

# Importar habilidades
./scripts/load-data.sh habilidades data-templates/exemplo-habilidades.csv

# Importar aplicações (simples - sem relacionamentos)
./scripts/load-data.sh aplicacoes data-templates/exemplo-aplicacoes.csv

# Importar aplicações (completas - com relacionamentos)
./scripts/load-aplicacoes.sh data-templates/aplicacoes-carga.json

# Importar capacidades (JSON)
curl -X POST http://localhost:3000/api/capacidades-negocio \
  -H "Content-Type: application/json" \
  -d @data-templates/exemplo-capacidades-negocio.json
```

### 3. Via Interface Web - Carga de Lockfiles

Para aplicações com tecnologias detectáveis automaticamente:

1. Acesse: **Ferramentas → Carga de Lockfiles**
2. Selecione a aplicação
3. Faça upload de arquivos de dependências:
   - Node.js: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - Java: `pom.xml`, `build.gradle`, `gradle.properties`
   - Python: `requirements.txt`, `Pipfile`, `pyproject.toml`
   - E mais 29 formatos suportados
4. O sistema automaticamente:
   - Extrai dependências e versões
   - Cria tecnologias não existentes
   - Associa à aplicação
   - Resolve variáveis (ex: `${jackson.version}` no Maven)

## 📋 Formatos Aceitos

### CSV
- Primeira linha: cabeçalho com nomes dos campos
- Demais linhas: dados separados por vírgula
- Encoding: UTF-8

**Exemplo**:
```csv
nome,descricao,status
Item 1,Descrição do item 1,Ativo
Item 2,Descrição do item 2,Inativo
```

### JSON
- Array de objetos ou objeto único
- Campos devem corresponder aos esperados pela API

**Exemplo**:
```json
[
  {
    "nome": "Item 1",
    "descricao": "Descrição do item 1",
    "status": "Ativo"
  }
]
```

## 🔍 Detecção Automática

O sistema detecta automaticamente o tipo de entidade pelo **nome do arquivo**:

| Palavra-chave no nome | Entidade | Formato Recomendado |
|----------------------|----------|---------------------|
| `tipo`, `afastamento` | Tipos de Afastamento | CSV ou JSON |
| `colaborador` | Colaboradores | CSV ou JSON |
| `tecnologia` | Tecnologias | CSV ou JSON |
| `processo` | Processos de Negócio | JSON |
| `aplicac` | Aplicações | **JSON** (para relacionamentos) |
| `capacidade` | Capacidades de Negócio | JSON |
| `habilidade` | Habilidades | CSV ou JSON |
| `sla` | SLAs | CSV ou JSON |
| `lockfile`, `manifest` | Dependências de Aplicação | Via interface web |

### Detecção de Lockfiles/Manifests

Formatos automaticamente detectados (29 tipos):
- **JavaScript/Node.js**: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `npm-shrinkwrap.json`, `.yarnrc.yml`, `bun.lockb`
- **Java**: `pom.xml`, `build.gradle`, `build.gradle.kts`, `gradle.properties`, `settings.gradle`
- **Python**: `requirements.txt`, `Pipfile`, `Pipfile.lock`, `pyproject.toml`, `poetry.lock`, `setup.py`
- **Ruby**: `Gemfile`, `Gemfile.lock`
- **PHP**: `composer.json`, `composer.lock`
- **.NET**: `*.csproj`, `packages.config`, `*.nuspec`
- **Go**: `go.mod`, `go.sum`
- **Rust**: `Cargo.toml`, `Cargo.lock`

## ⚠️ Validações

- Campos obrigatórios devem estar presentes
- Formatos de data: ISO 8601 (YYYY-MM-DD)
- Booleanos: `true`/`false` ou `sim`/`não`
- Valores vazios são aceitos para campos opcionais

## 📊 Logs e Auditoria

Todas as operações de carga são auditadas:
- Timestamp de cada operação
- Quantidade de registros processados
- Registros importados com sucesso
- Erros detalhados por registro

## 🔧 Troubleshooting

### Arquivo não é reconhecido
**Solução**: Verifique se o nome do arquivo contém a palavra-chave correta

### Erro ao processar CSV
**Solução**: Verifique se:
- Arquivo está em UTF-8
- Separador é vírgula (,)
- Primeira linha é o cabeçalho

### Erro ao processar JSON
**Solução**: Valide o JSON em https://jsonlint.com

### Registros não são importados
**Solução**: Verifique os logs de erro para identificar campos faltantes ou inválidos

## 📞 Suporte

Para mais informações, consulte:
- **Interface de Carga**: Ferramentas → Carga de Dados
- **API**: http://localhost:3000/api/[entidade]
- **Documentação**: docs/DOCUMENTACAO_API.md
