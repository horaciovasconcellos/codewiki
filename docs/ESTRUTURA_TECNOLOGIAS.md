# Estrutura de Dados: Tecnologias

## Estrutura da Tabela no Banco de Dados

```sql
CREATE TABLE tecnologias (
    id                          VARCHAR(36) PRIMARY KEY,    -- UUID gerado automaticamente
    sigla                       VARCHAR(20) UNIQUE NOT NULL, -- Código/sigla da tecnologia (ex: JAVA-17)
    nome                        VARCHAR(100) NOT NULL,      -- Nome da tecnologia
    versao_release              VARCHAR(50),                -- Versão ou release
    categoria                   VARCHAR(50),                -- Categoria (Linguagem, Framework, BD, etc)
    status                      VARCHAR(20),                -- Status (Ativo, Descontinuado, etc)
    fornecedor_fabricante       VARCHAR(100),               -- Nome do fornecedor/fabricante
    tipo_licenciamento          VARCHAR(50),                -- Tipo de licença
    maturidade_interna          VARCHAR(50),                -- Nível de maturidade interna
    nivel_suporte_interno       VARCHAR(50),                -- Nível de suporte interno
    ambiente_dev                TINYINT(1) DEFAULT 0,       -- Disponível em DEV
    ambiente_qa                 TINYINT(1) DEFAULT 0,       -- Disponível em QA
    ambiente_prod               TINYINT(1) DEFAULT 0,       -- Disponível em PROD
    ambiente_cloud              TINYINT(1) DEFAULT 0,       -- Cloud
    ambiente_on_premise         TINYINT(1) DEFAULT 0,       -- On-Premise
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## JSON Esperado pela API

### POST /api/tecnologias (Criar nova)

```json
{
  "sigla": "JAVA-17",
  "nome": "Java",
  "versaoRelease": "17 LTS",
  "categoria": "Linguagem de Programação",
  "status": "Ativo",
  "fornecedorFabricante": "Oracle",
  "tipoLicenciamento": "GPL v2",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": false
  }
}
```

### PUT /api/tecnologias/:id (Atualizar existente)

```json
{
  "versaoRelease": "21 LTS",
  "status": "Ativo",
  "maturidadeInterna": "Otimizado"
}
```

### Resposta da API (GET/POST/PUT)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sigla": "JAVA-17",
  "nome": "Java",
  "versaoRelease": "17 LTS",
  "categoria": "Linguagem de Programação",
  "status": "Ativo",
  "fornecedorFabricante": "Oracle",
  "tipoLicenciamento": "GPL v2",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": false
  },
  "createdAt": "2025-11-23T12:00:00.000Z",
  "updatedAt": "2025-11-23T12:00:00.000Z"
}
```

## Campos Detalhados

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| **id** | UUID | Auto | Identificador único (gerado pelo sistema) | `"a1b2c3d4-..."` |
| **sigla** | String(20) | ✅ Sim | Código/sigla único da tecnologia | `"JAVA-17"`, `"REACT-18"` |
| **nome** | String(100) | ✅ Sim | Nome da tecnologia | `"Java"`, `"React"` |
| **versaoRelease** | String(50) | Não | Versão ou release | `"17 LTS"`, `"18.2.0"` |
| **categoria** | String(50) | Não | Categoria da tecnologia | `"Linguagem de Programação"` |
| **status** | String(20) | Não | Status atual | `"Ativo"`, `"Descontinuado"` |
| **fornecedorFabricante** | String(100) | Não | Fornecedor ou fabricante | `"Oracle"`, `"Meta"` |
| **tipoLicenciamento** | String(50) | Não | Tipo de licença | `"GPL v2"`, `"MIT"`, `"Proprietário"` |
| **maturidadeInterna** | String(50) | Não | Maturidade interna | `"Inicial"`, `"Gerenciado"`, `"Otimizado"` |
| **nivelSuporteInterno** | String(50) | Não | Nível de suporte | `"Suporte Completo"`, `"Básico"` |
| **ambientes** | Object | Não | Ambientes disponíveis | Ver abaixo |

### Ambientes (Objeto aninhado)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **dev** | Boolean | Disponível em ambiente de desenvolvimento |
| **qa** | Boolean | Disponível em ambiente de testes/QA |
| **prod** | Boolean | Disponível em ambiente de produção |
| **cloud** | Boolean | Implantado em nuvem |
| **onPremise** | Boolean | Implantado on-premise |

## Categorias Disponíveis

- **Linguagem de Programação**: Java, Python, JavaScript, C#, etc.
- **Framework**: React, Angular, Spring Boot, Django, etc.
- **Banco de Dados**: MySQL, PostgreSQL, MongoDB, Oracle, etc.
- **Ferramenta de Build**: Maven, Gradle, Webpack, npm, etc.
- **Servidor de Aplicação**: Tomcat, WildFly, IIS, Nginx, etc.
- **Sistema Operacional**: Linux, Windows Server, macOS, etc.
- **Containerização**: Docker, Kubernetes, OpenShift, etc.
- **Monitoramento**: Prometheus, Grafana, Datadog, New Relic, etc.
- **Versionamento**: Git, SVN, Mercurial, etc.
- **Cloud Provider**: AWS, Azure, GCP, Oracle Cloud, etc.

## Status Disponíveis

- **Ativo**: Tecnologia em uso ativo
- **Descontinuado**: Tecnologia sendo removida
- **Planejado**: Tecnologia planejada para adoção
- **Avaliação**: Tecnologia em fase de avaliação
- **EOL**: End of Life (fim de vida)

## Maturidade Interna

- **Inicial**: Conhecimento básico, poucos especialistas
- **Repetível**: Processos definidos, conhecimento em crescimento
- **Definido**: Processos padronizados, boa cobertura de conhecimento
- **Gerenciado**: Métricas estabelecidas, conhecimento consolidado
- **Otimizado**: Melhoria contínua, centros de excelência

## Nível de Suporte Interno

- **Suporte Completo**: Equipe dedicada, SLA definido, 24x7
- **Suporte Regular**: Horário comercial, SLA definido
- **Suporte Básico**: Melhor esforço, sem SLA
- **Sem Suporte**: Sem suporte interno estruturado
- **Suporte Externo**: Apenas fornecedor externo

## Exemplos Completos

### 1. Java 17 LTS
```json
{
  "sigla": "JAVA-17",
  "nome": "Java",
  "versaoRelease": "17 LTS",
  "categoria": "Linguagem de Programação",
  "status": "Ativo",
  "fornecedorFabricante": "Oracle",
  "tipoLicenciamento": "GPL v2 + Classpath Exception",
  "maturidadeInterna": "Otimizado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": true
  }
}
```

### 2. React 18
```json
{
  "sigla": "REACT-18",
  "nome": "React",
  "versaoRelease": "18.2.0",
  "categoria": "Framework Frontend",
  "status": "Ativo",
  "fornecedorFabricante": "Meta (Facebook)",
  "tipoLicenciamento": "MIT",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": false
  }
}
```

### 3. MySQL 8.0
```json
{
  "sigla": "MYSQL-8",
  "nome": "MySQL",
  "versaoRelease": "8.0.35",
  "categoria": "Banco de Dados Relacional",
  "status": "Ativo",
  "fornecedorFabricante": "Oracle",
  "tipoLicenciamento": "GPL v2",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Regular",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": true
  }
}
```

### 4. Docker
```json
{
  "sigla": "DOCKER",
  "nome": "Docker",
  "versaoRelease": "24.0.7",
  "categoria": "Containerização",
  "status": "Ativo",
  "fornecedorFabricante": "Docker Inc",
  "tipoLicenciamento": "Apache 2.0",
  "maturidadeInterna": "Definido",
  "nivelSuporteInterno": "Suporte Regular",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": true
  }
}
```

### 5. AWS
```json
{
  "sigla": "AWS",
  "nome": "Amazon Web Services",
  "versaoRelease": "2024",
  "categoria": "Cloud Provider",
  "status": "Ativo",
  "fornecedorFabricante": "Amazon",
  "tipoLicenciamento": "SaaS",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": false
  }
}
```

### 6. Spring Boot
```json
{
  "sigla": "SPRING-BOOT-3",
  "nome": "Spring Boot",
  "versaoRelease": "3.2.0",
  "categoria": "Framework Backend",
  "status": "Ativo",
  "fornecedorFabricante": "VMware (Pivotal)",
  "tipoLicenciamento": "Apache 2.0",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": true
  }
}
```

### 7. PostgreSQL
```json
{
  "sigla": "POSTGRES-15",
  "nome": "PostgreSQL",
  "versaoRelease": "15.5",
  "categoria": "Banco de Dados Relacional",
  "status": "Ativo",
  "fornecedorFabricante": "PostgreSQL Global Development Group",
  "tipoLicenciamento": "PostgreSQL License",
  "maturidadeInterna": "Definido",
  "nivelSuporteInterno": "Suporte Regular",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": false
  }
}
```

### 8. Node.js
```json
{
  "sigla": "NODEJS-20",
  "nome": "Node.js",
  "versaoRelease": "20.10.0 LTS",
  "categoria": "Runtime JavaScript",
  "status": "Ativo",
  "fornecedorFabricante": "OpenJS Foundation",
  "tipoLicenciamento": "MIT",
  "maturidadeInterna": "Gerenciado",
  "nivelSuporteInterno": "Suporte Completo",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": true
  }
}
```

## Validações

### Regras de Negócio:
- ✅ **sigla**: Deve ser única, máximo 20 caracteres
- ✅ **nome**: Obrigatório, mínimo 2 caracteres, máximo 100 caracteres
- ✅ **categoria**: Recomendado para organização
- ✅ **status**: Valores permitidos: "Ativo", "Descontinuado", "Planejado", "Avaliação", "EOL"

### Códigos de Erro:

```json
// Campos obrigatórios faltando
{
  "error": "Campos obrigatórios faltando",
  "code": "MISSING_FIELDS",
  "missing": ["nome"]
}

// Sigla duplicada
{
  "error": "Tecnologia já existe",
  "code": "DUPLICATE"
}

// Registro não encontrado
{
  "error": "Tecnologia não encontrada",
  "code": "NOT_FOUND"
}
```

## Arquivo de Carga em Lote (JSON Array)

Para carga em lote usando o script `load-tecnologias.sh`:

```json
[
  {
    "sigla": "JAVA-17",
    "nome": "Java",
    "versaoRelease": "17 LTS",
    "categoria": "Linguagem de Programação",
    "status": "Ativo",
    "fornecedorFabricante": "Oracle",
    "tipoLicenciamento": "GPL v2",
    "maturidadeInterna": "Otimizado",
    "nivelSuporteInterno": "Suporte Completo",
    "ambientes": {
      "dev": true,
      "qa": true,
      "prod": true,
      "cloud": true,
      "onPremise": true
    }
  },
  {
    "sigla": "REACT-18",
    "nome": "React",
    "versaoRelease": "18.2.0",
    "categoria": "Framework Frontend",
    "status": "Ativo",
    "fornecedorFabricante": "Meta",
    "tipoLicenciamento": "MIT",
    "maturidadeInterna": "Gerenciado",
    "nivelSuporteInterno": "Suporte Completo",
    "ambientes": {
      "dev": true,
      "qa": true,
      "prod": true,
      "cloud": true,
      "onPremise": false
    }
  }
]
```

## Exemplos de Uso da API

### cURL - Criar nova tecnologia
```bash
curl -X POST http://localhost:3000/api/tecnologias \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "JAVA-17",
    "nome": "Java",
    "versaoRelease": "17 LTS",
    "categoria": "Linguagem de Programação",
    "status": "Ativo",
    "fornecedorFabricante": "Oracle",
    "tipoLicenciamento": "GPL v2",
    "maturidadeInterna": "Otimizado",
    "nivelSuporteInterno": "Suporte Completo",
    "ambientes": {
      "dev": true,
      "qa": true,
      "prod": true,
      "cloud": true,
      "onPremise": true
    }
  }'
```

### cURL - Atualizar existente
```bash
curl -X PUT http://localhost:3000/api/tecnologias/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "versaoRelease": "21 LTS",
    "status": "Ativo"
  }'
```

### JavaScript/Fetch - Criar nova tecnologia
```javascript
const novaTecnologia = {
  sigla: "JAVA-17",
  nome: "Java",
  versaoRelease: "17 LTS",
  categoria: "Linguagem de Programação",
  status: "Ativo",
  fornecedorFabricante: "Oracle",
  tipoLicenciamento: "GPL v2",
  maturidadeInterna: "Otimizado",
  nivelSuporteInterno: "Suporte Completo",
  ambientes: {
    dev: true,
    qa: true,
    prod: true,
    cloud: true,
    onPremise: true
  }
};

const response = await fetch('http://localhost:3000/api/tecnologias', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novaTecnologia)
});

const resultado = await response.json();
console.log(resultado);
```

## Mapeamento de Dados: Frontend ↔ Backend

### Frontend → Backend (POST/PUT)
```javascript
// Frontend (camelCase)
{
  versaoRelease: "17 LTS",
  fornecedorFabricante: "Oracle",
  tipoLicenciamento: "GPL v2",
  maturidadeInterna: "Otimizado",
  nivelSuporteInterno: "Suporte Completo",
  ambientes: {
    dev: true,
    qa: true,
    prod: true,
    cloud: true,
    onPremise: true
  }
}

// Backend converte para (snake_case)
{
  versao_release: "17 LTS",
  fornecedor_fabricante: "Oracle",
  tipo_licenciamento: "GPL v2",
  maturidade_interna: "Otimizado",
  nivel_suporte_interno: "Suporte Completo",
  ambiente_dev: 1,
  ambiente_qa: 1,
  ambiente_prod: 1,
  ambiente_cloud: 1,
  ambiente_on_premise: 1
}
```

### Backend → Frontend (GET)
```javascript
// Backend (snake_case + booleanos como TINYINT)
{
  versao_release: "17 LTS",
  fornecedor_fabricante: "Oracle",
  tipo_licenciamento: "GPL v2",
  maturidade_interna: "Otimizado",
  nivel_suporte_interno: "Suporte Completo",
  ambiente_dev: 1,
  ambiente_qa: 1,
  ambiente_prod: 1,
  ambiente_cloud: 1,
  ambiente_on_premise: 1
}

// Frontend converte para (camelCase + objeto ambientes)
{
  versaoRelease: "17 LTS",
  fornecedorFabricante: "Oracle",
  tipoLicenciamento: "GPL v2",
  maturidadeInterna: "Otimizado",
  nivelSuporteInterno: "Suporte Completo",
  ambientes: {
    dev: true,
    qa: true,
    prod: true,
    cloud: true,
    onPremise: true
  }
}
```
