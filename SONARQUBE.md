# Configuração do SonarQube para CodeWiki

## 📋 Pré-requisitos

1. **SonarQube Server** rodando em `http://localhost:9010`
2. **Node.js** e **npm** instalados
3. **sonar-scanner** instalado (o script instala automaticamente se necessário)

## 🚀 Instalação do SonarQube Server (se necessário)

### Via Docker (Recomendado)

```bash
docker run -d --name sonarqube \
  -p 9010:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:latest
```

### Acesso ao SonarQube

- URL: `http://localhost:9010`
- Login padrão: `admin`
- Senha padrão: `admin` (será solicitada alteração no primeiro acesso)

## 🔧 Configuração

### 1. Criar Token de Autenticação (Recomendado)

1. Acesse: `http://localhost:9010/account/security`
2. Crie um novo token com nome "codewiki-scanner"
3. Copie o token gerado
4. Defina a variável de ambiente:

```bash
export SONAR_TOKEN="seu_token_aqui"
```

### 2. Arquivo de Configuração

O arquivo `sonar-project.properties` já está configurado com:

- **Projeto**: codewiki
- **Fontes**: src/, server/
- **Testes**: src/__tests__, server/__tests__
- **Exclusões**: node_modules, dist, build, coverage, uploads, logs, etc.
- **Cobertura**: coverage/lcov.info

## 📊 Executar Análise

### Opção 1: Script Completo (Recomendado)

```bash
npm run sonar
```

Este comando executa:
- ✅ Verificação de conectividade com SonarQube
- ✅ Verificação/instalação do sonar-scanner
- ✅ Geração de cobertura de testes
- ✅ Limpeza de análises anteriores
- ✅ Execução da análise completa

### Opção 2: Análise Rápida

```bash
npm run sonar:quick
```

Executa apenas a análise sem verificações prévias.

### Opção 3: Diretamente via Script

```bash
./sonar-scan.sh
```

## 🎯 Variáveis de Ambiente

Configure estas variáveis para personalizar a análise:

```bash
# Token de autenticação (recomendado)
export SONAR_TOKEN="seu_token_aqui"

# Ou use usuário/senha (menos seguro)
export SONAR_PASSWORD="sua_senha_aqui"
```

## 📈 Visualizar Resultados

Após a análise, acesse o dashboard em:

```
http://localhost:9010/dashboard?id=codewiki
```

## 🔍 Análises Incluídas

O SonarQube analisará:

### Frontend (src/)
- TypeScript/React components
- Hooks customizados
- Utilitários e helpers
- Tipos e interfaces

### Backend (server/)
- API endpoints
- Middleware
- Configurações
- Scripts de migração

### Métricas Avaliadas
- 🐛 Bugs
- 🔒 Vulnerabilidades de Segurança
- 💡 Code Smells
- 📊 Cobertura de Testes
- 🔄 Duplicação de Código
- 📏 Complexidade Ciclomática
- 📝 Documentação

## ⚙️ Configurações Avançadas

### Personalizar Exclusões

Edite `sonar-project.properties`:

```properties
sonar.exclusions=**/node_modules/**,\
  **/seu_diretorio/**
```

### Configurar Quality Gate

No SonarQube Server:
1. Acesse "Quality Gates"
2. Crie ou edite um Quality Gate
3. Configure métricas mínimas:
   - Coverage: > 80%
   - Duplicated Lines: < 3%
   - Maintainability Rating: A
   - Reliability Rating: A
   - Security Rating: A

### Integração com CI/CD

Adicione ao seu pipeline:

```yaml
# GitHub Actions
- name: SonarQube Scan
  run: |
    npm run sonar
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

# GitLab CI
sonarqube:
  script:
    - npm run sonar
  variables:
    SONAR_TOKEN: $SONAR_TOKEN
```

## 🛠️ Troubleshooting

### SonarQube não acessível

```bash
# Verificar se está rodando
curl http://localhost:9010/api/system/status

# Se não estiver, inicie:
docker start sonarqube
```

### sonar-scanner não encontrado

**macOS:**
```bash
brew install sonar-scanner
```

**Linux:**
```bash
# Download manual
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
unzip sonar-scanner-cli-4.8.0.2856-linux.zip
sudo mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner
sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner
```

### Erro de autenticação

1. Verifique se o token está correto
2. Tente com credenciais padrão: admin/admin
3. Verifique logs do SonarQube:
   ```bash
   docker logs sonarqube
   ```

### Análise muito lenta

1. Exclua mais diretórios em `sonar.exclusions`
2. Aumente memória do sonar-scanner:
   ```bash
   export SONAR_SCANNER_OPTS="-Xmx2048m"
   ```

## 📚 Recursos Adicionais

- [Documentação SonarQube](https://docs.sonarqube.org/latest/)
- [SonarQube Scanner](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/)
- [Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)
- [TypeScript Analysis](https://docs.sonarqube.org/latest/analysis/languages/typescript/)

## 📋 Checklist de Configuração

- [ ] SonarQube Server rodando em localhost:9010
- [ ] Token de autenticação criado
- [ ] sonar-scanner instalado
- [ ] Variável SONAR_TOKEN configurada
- [ ] Primeira análise executada com sucesso
- [ ] Dashboard acessível
- [ ] Quality Gate configurado

## 🎓 Comandos Úteis

```bash
# Executar análise completa
npm run sonar

# Executar análise rápida
npm run sonar:quick

# Gerar apenas cobertura de testes
npm run test:coverage

# Verificar status do SonarQube
curl http://localhost:9010/api/system/status

# Ver logs do container
docker logs -f sonarqube

# Restart do SonarQube
docker restart sonarqube
```
