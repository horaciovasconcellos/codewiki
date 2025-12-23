#!/bin/bash

# Build Production Script
# Sistema de Auditoria - Build e Empacotamento

set -e

echo "🚀 Sistema de Auditoria - Build para Produção"
echo "=============================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variáveis
BUILD_DIR="dist"
PACKAGE_DIR="package-production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}[1/7]${NC} Limpando builds anteriores..."
rm -rf $BUILD_DIR
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

echo -e "${BLUE}[2/7]${NC} Instalando dependências..."
npm ci --production=false

echo -e "${BLUE}[3/7]${NC} Executando build do frontend..."
npm run build

echo -e "${BLUE}[4/7]${NC} Preparando estrutura de produção..."
mkdir -p $PACKAGE_DIR/dist
mkdir -p $PACKAGE_DIR/server
mkdir -p $PACKAGE_DIR/database
mkdir -p $PACKAGE_DIR/scripts

# Copiar arquivos essenciais
echo -e "${BLUE}[5/7]${NC} Copiando arquivos..."
cp -r $BUILD_DIR/* $PACKAGE_DIR/dist/
cp -r server/* $PACKAGE_DIR/server/
cp -r database/*.sql $PACKAGE_DIR/database/
cp package.json $PACKAGE_DIR/
cp package-lock.json $PACKAGE_DIR/
cp .env.example $PACKAGE_DIR/
cp docker-compose.yml $PACKAGE_DIR/
cp Dockerfile $PACKAGE_DIR/
cp README.md $PACKAGE_DIR/
cp QUICKSTART.md $PACKAGE_DIR/

# Copiar scripts úteis
cp docker-manager.sh $PACKAGE_DIR/scripts/
chmod +x $PACKAGE_DIR/scripts/docker-manager.sh

echo -e "${BLUE}[6/7]${NC} Criando arquivo de versão..."
cat > $PACKAGE_DIR/VERSION.txt << EOF
Sistema de Auditoria
Versão: ${VERSION}
Build: ${TIMESTAMP}
Data: $(date '+%Y-%m-%d %H:%M:%S')
EOF

# Criar README de deploy
cat > $PACKAGE_DIR/DEPLOY.md << 'EOF'
# Deploy do Sistema de Auditoria

## Requisitos
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- Porta 3000 disponível

## Instalação Rápida

1. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

2. **Inicie os containers:**
```bash
./scripts/docker-manager.sh start
```

3. **Acesse a aplicação:**
```
http://localhost:3000
```

## Estrutura de Diretórios

```
.
├── dist/               # Frontend (build)
├── server/            # Backend (Node.js)
├── database/          # Scripts SQL
├── scripts/           # Scripts auxiliares
├── docker-compose.yml # Orquestração Docker
└── Dockerfile         # Imagem da aplicação
```

## Comandos Úteis

```bash
# Iniciar aplicação
./scripts/docker-manager.sh start

# Parar aplicação
./scripts/docker-manager.sh stop

# Ver logs
./scripts/docker-manager.sh logs

# Restart completo
./scripts/docker-manager.sh restart

# Status dos containers
./scripts/docker-manager.sh status
```

## Backup do Banco de Dados

```bash
docker exec mysql-master mysqldump -u root -prootpass auditoria_db > backup.sql
```

## Restaurar Backup

```bash
docker exec -i mysql-master mysql -u root -prootpass auditoria_db < backup.sql
```

## Portas

- **3000**: Aplicação Web
- **3306**: MySQL (apenas interno)
- **3307**: MySQL Master (acesso externo)
- **3308**: MySQL Slave (acesso externo)

## Variáveis de Ambiente Importantes

```env
# Banco de Dados
MYSQL_HOST=mysql-master
MYSQL_PORT=3306
MYSQL_USER=app_user
MYSQL_PASSWORD=apppass123
MYSQL_DATABASE=auditoria_db

# API
API_PORT=3000
NODE_ENV=production
```

## Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
./scripts/docker-manager.sh logs

# Reiniciar containers
./scripts/docker-manager.sh restart
```

### Erro de conexão com banco
```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Restart do MySQL
docker restart mysql-master
```

### Limpar e reiniciar tudo
```bash
./scripts/docker-manager.sh clean
./scripts/docker-manager.sh start
```

## Suporte

Para mais informações, consulte:
- README.md
- QUICKSTART.md
- docs/
EOF

echo -e "${BLUE}[7/7]${NC} Criando arquivo compactado..."
cd $PACKAGE_DIR
tar -czf ../sistema-auditoria-v${VERSION}-${TIMESTAMP}.tar.gz .
cd ..

echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""
echo "📦 Pacote criado:"
echo "   - Arquivo: sistema-auditoria-v${VERSION}-${TIMESTAMP}.tar.gz"
echo "   - Diretório: $PACKAGE_DIR/"
echo ""
echo "📊 Estatísticas:"
echo "   - Versão: ${VERSION}"
echo "   - Build: ${TIMESTAMP}"
echo "   - Tamanho: $(du -h sistema-auditoria-v${VERSION}-${TIMESTAMP}.tar.gz | cut -f1)"
echo ""
echo "🚀 Para fazer deploy:"
echo "   1. Envie o arquivo .tar.gz para o servidor"
echo "   2. Extraia: tar -xzf sistema-auditoria-v${VERSION}-${TIMESTAMP}.tar.gz"
echo "   3. Configure: cp .env.example .env && vi .env"
echo "   4. Execute: ./scripts/docker-manager.sh start"
echo ""
