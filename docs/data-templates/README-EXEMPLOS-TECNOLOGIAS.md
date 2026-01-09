# Arquivos de Exemplo para Carga de Tecnologias

Este diretório contém arquivos de exemplo de diferentes tipos de projetos para demonstrar como o sistema identifica e cataloga tecnologias automaticamente.

## 📁 Arquivos Disponíveis

### 1. **exemplo-pom.xml**
Projeto Java/Spring Boot com Maven

**Tecnologias identificadas:**
- **Framework Backend**: Spring Boot 3.2.0
- **Linguagem**: Java 17
- **Build Tool**: Maven
- **Database**: MySQL 8.2.0
- **ORM**: Spring Data JPA, Hibernate
- **Cache**: Redis
- **Security**: Spring Security, JWT (io.jsonwebtoken)
- **Migration**: Flyway
- **API Documentation**: SpringDoc OpenAPI
- **Logging**: Logback, Logstash
- **Monitoring**: Micrometer, Prometheus
- **Testing**: JUnit, Testcontainers
- **Code Quality**: Jacoco

**Categoria**: Backend
**Stack Tecnológica**: Java/Spring Boot/MySQL/Redis

---

### 2. **exemplo-package.json**
Projeto Frontend React/TypeScript com Vite

**Tecnologias identificadas:**
- **Framework Frontend**: React 18.2.0
- **Linguagem**: TypeScript 5.3.3
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router 6.20.1
- **State Management**: Zustand, TanStack Query
- **UI Components**: Radix UI, Shadcn/ui
- **Styling**: Tailwind CSS, PostCSS
- **Icons**: Phosphor Icons, Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form (implícito)
- **Date Handling**: date-fns, React Day Picker
- **Testing**: Vitest, Testing Library
- **Code Quality**: ESLint, Prettier
- **Notifications**: Sonner

**Categoria**: Frontend
**Stack Tecnológica**: React/TypeScript/Vite/TailwindCSS

---

### 3. **exemplo-requirements.txt**
Projeto Python para Data Science e Machine Learning

**Tecnologias identificadas:**
- **Framework Web**: FastAPI 0.108.0
- **Linguagem**: Python 3.11+
- **Server**: Uvicorn
- **Database**: SQLAlchemy, MySQL, PostgreSQL
- **ORM**: SQLAlchemy 2.0.23
- **Migration**: Alembic
- **Cache**: Redis, Aiocache
- **Task Queue**: Celery, Flower
- **Machine Learning**: 
  - Scikit-learn
  - XGBoost
  - LightGBM
  - CatBoost
  - TensorFlow
  - PyTorch
  - Transformers (Hugging Face)
- **Data Processing**: Pandas, NumPy, SciPy
- **Visualization**: Matplotlib, Seaborn, Plotly, Bokeh
- **NLP**: NLTK, spaCy, TextBlob
- **Cloud**: AWS (Boto3)
- **Monitoring**: Sentry, Prometheus, OpenTelemetry
- **Testing**: pytest, pytest-cov, Faker
- **Code Quality**: Black, isort, flake8, pylint, mypy
- **Documentation**: MkDocs Material

**Categoria**: Backend, Data Science, Machine Learning
**Stack Tecnológica**: Python/FastAPI/ML/AWS

---

## 🚀 Como Usar

### Opção 1: Carga Manual via Interface

1. Acesse a tela **Tecnologias**
2. Clique em **"+ Tecnologia"**
3. Preencha os dados básicos
4. Na aba **"Arquivos de Dependência"**, faça upload dos arquivos:
   - `exemplo-pom.xml` para projetos Java
   - `exemplo-package.json` para projetos Node.js/React
   - `exemplo-requirements.txt` para projetos Python

### Opção 2: Upload via API

```bash
# Upload de pom.xml
curl -X POST http://localhost:3000/api/tecnologias/parse-dependencies \
  -H "Content-Type: multipart/form-data" \
  -F "file=@data-templates/exemplo-pom.xml" \
  -F "type=maven"

# Upload de package.json
curl -X POST http://localhost:3000/api/tecnologias/parse-dependencies \
  -H "Content-Type: multipart/form-data" \
  -F "file=@data-templates/exemplo-package.json" \
  -F "type=npm"

# Upload de requirements.txt
curl -X POST http://localhost:3000/api/tecnologias/parse-dependencies \
  -H "Content-Type: multipart/form-data" \
  -F "file=@data-templates/exemplo-requirements.txt" \
  -F "type=pip"
```

### Opção 3: Script Automatizado

```bash
# Criar script de análise
./scripts/analisar-dependencias.sh data-templates/exemplo-pom.xml
./scripts/analisar-dependencias.sh data-templates/exemplo-package.json
./scripts/analisar-dependencias.sh data-templates/exemplo-requirements.txt
```

---

## 📊 Análise Automática

O sistema detecta automaticamente:

### De **pom.xml**:
- Versões de bibliotecas
- Plugins Maven
- Perfis de build
- Repositórios configurados
- Tipo de empacotamento (jar, war, ear)

### De **package.json**:
- Dependências de produção
- Dependências de desenvolvimento
- Scripts disponíveis
- Engines (Node.js, npm)
- Tipo de módulo (CommonJS, ESM)

### De **requirements.txt**:
- Bibliotecas Python
- Versões exatas ou intervalos
- Extras opcionais
- Comentários de seções

---

## 🎯 Benefícios

1. **Catalogação Automática**: Identifica todas as tecnologias usadas
2. **Gestão de Versões**: Rastreia versões de cada dependência
3. **Análise de Vulnerabilidades**: Cruza com bases de CVE
4. **Gestão de Licenças**: Identifica licenças de cada biblioteca
5. **Análise de Obsolescência**: Detecta versões desatualizadas
6. **Mapeamento de Skills**: Relaciona com habilidades necessárias
7. **Estimativa de Custos**: Calcula custos de licenciamento

---

## 🔍 Exemplos de Uso Real

### Cenário 1: Auditoria de Aplicação
```bash
# Fazer upload dos arquivos de dependência de uma aplicação real
# O sistema irá:
# 1. Catalogar todas as tecnologias
# 2. Verificar versões desatualizadas
# 3. Identificar vulnerabilidades conhecidas
# 4. Sugerir atualizações
```

### Cenário 2: Inventário de Stack
```bash
# Analisar múltiplos projetos
# O sistema irá:
# 1. Consolidar uso de tecnologias
# 2. Identificar redundâncias
# 3. Mapear diferentes versões da mesma biblioteca
# 4. Gerar relatório de padronização
```

### Cenário 3: Planejamento de Capacitação
```bash
# Com base nas tecnologias identificadas
# O sistema irá:
# 1. Listar habilidades necessárias
# 2. Mapear colaboradores com essas habilidades
# 3. Identificar gaps de conhecimento
# 4. Sugerir treinamentos
```

---

## 📝 Formatos Suportados

| Formato | Linguagem/Framework | Extensão |
|---------|-------------------|----------|
| Maven | Java | pom.xml |
| Gradle | Java/Kotlin | build.gradle, build.gradle.kts |
| npm | JavaScript/TypeScript | package.json |
| pip | Python | requirements.txt |
| Poetry | Python | pyproject.toml |
| Composer | PHP | composer.json |
| NuGet | .NET | packages.config, *.csproj |
| Bundler | Ruby | Gemfile |
| Go Modules | Go | go.mod |
| Cargo | Rust | Cargo.toml |

---

## 🔧 Customização

Para adicionar novos tipos de arquivos ou melhorar a análise:

1. Edite `/src/lib/parsers/dependency-parser.ts`
2. Adicione novo parser para o formato desejado
3. Registre o parser no `DependencyParserFactory`
4. Adicione testes em `/tests/parsers/`

---

## 📚 Referências

- [Maven POM Reference](https://maven.apache.org/pom.html)
- [package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [pip requirements.txt Format](https://pip.pypa.io/en/stable/reference/requirements-file-format/)
