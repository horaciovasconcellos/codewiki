# Primeiros Passos

Este guia fornece instruções completas para instalação, configuração e testes iniciais do Sistema de Auditoria.

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 2.0 ou superior)
- **Git**
- **Node.js** 18+ (opcional, para desenvolvimento local)

## Instalação com Docker

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd sistema-de-auditoria
```

### 2. Inicie os Containers

```bash
docker compose up -d
```

Este comando irá:

- ✅ Criar container MySQL Master (porta 3306)
- ✅ Criar container MySQL Slave (porta 3307)
- ✅ Criar container da aplicação (porta 5173 frontend + 3000 API)
- ✅ Configurar rede Docker entre containers
- ✅ Aplicar volumes persistentes para dados

### 3. Configure a Replicação

```bash
chmod +x database/setup-replication.sh
./database/setup-replication.sh
```

### 4. Verifique o Status

```bash
docker compose ps
```

**Saída esperada:**

```
NAME                  STATUS              PORTS
mysql-master          Up (healthy)        0.0.0.0:3306->3306/tcp
mysql-slave           Up (healthy)        0.0.0.0:3307->3306/tcp
auditoria-app         Up                  0.0.0.0:5173->5173/tcp, 0.0.0.0:3000->3000/tcp
```

## Instalação para Desenvolvimento Local

### 1. Instale as Dependências

```bash
npm install
```

### 2. Configure as Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpass123
DB_NAME=auditoria_db

# API
API_PORT=3000
VITE_API_URL=http://localhost:3000/api

# Frontend
VITE_PORT=5173
```

### 3. Execute em Modo de Desenvolvimento

```bash
# Terminal 1 - Backend
npm run dev:api

# Terminal 2 - Frontend
npm run dev
```

## Carga Inicial de Dados

O sistema inclui templates de dados para facilitar testes iniciais.

### 1. Acesse o Container

```bash
docker exec -it mysql-master bash
```

### 2. Execute o Script de Carga

```bash
mysql -uroot -prootpass123 auditoria_db < /docker-entrypoint-initdb.d/load-data.sql
```

### 3. Verifique os Dados

```bash
mysql -uroot -prootpass123 auditoria_db
```

```sql
-- Verificar tipos de afastamento
SELECT * FROM tipos_afastamento;

-- Verificar aplicações
SELECT * FROM aplicacoes LIMIT 5;

-- Verificar colaboradores
SELECT * FROM colaboradores LIMIT 5;
```

## Testes de Validação

### Teste 1: Banco de Dados Master

```bash
docker exec -it mysql-master mysql -uroot -prootpass123 auditoria_db -e "SHOW TABLES;"
```

**Tabelas esperadas:**

- `tipos_afastamento`
- `colaboradores`
- `habilidades`
- `colaboradores_habilidades`
- `afastamentos`
- `aplicacoes`
- `tecnologias`
- `processos_negocio`
- `slas`
- `capacidades_negocio`

### Teste 2: Replicação Master → Slave

```bash
# Verificar status da replicação
docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" | grep Running
```

**Saída esperada:**

```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
```

### Teste 3: Inserir Dados e Verificar Replicação

```bash
# Inserir no Master
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e \
"INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo) 
VALUES (UUID(), 'TST', 'Teste Replicacao', 'Teste de manual', 1, 'N');"

# Aguardar replicação
sleep 2

# Verificar no Slave
docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db -e \
"SELECT * FROM tipos_afastamento WHERE sigla='TST';"
```

Se o registro aparecer no Slave, a replicação está funcionando corretamente! ✅

### Teste 4: API Backend

```bash
# Listar tipos de afastamento
curl http://localhost:3000/api/tipos-afastamento

# Listar colaboradores
curl http://localhost:3000/api/colaboradores

# Health check
curl http://localhost:3000/api/health
```

### Teste 5: Frontend

Abra o navegador:

```
http://localhost:5173
```

**Funcionalidades para testar:**

1. ✅ Navegação lateral
2. ✅ Listagem de colaboradores
3. ✅ Cadastro de novo colaborador
4. ✅ Gestão de tipos de afastamento
5. ✅ Visualização de aplicações
6. ✅ Dashboard de tecnologias

## Solução de Problemas

### Container não inicia

```bash
# Ver logs
docker compose logs mysql-master
docker compose logs auditoria-app

# Reiniciar
docker compose down
docker compose up -d
```

### Erro de conexão com banco

```bash
# Verificar rede Docker
docker network inspect sistema-de-auditoria_default

# Testar conectividade
docker exec auditoria-app ping mysql-master
```

### Replicação quebrada

```bash
# Parar replicação
docker exec mysql-slave mysql -uroot -prootpass123 -e "STOP SLAVE;"

# Reconfigurar
./database/setup-replication.sh

# Iniciar replicação
docker exec mysql-slave mysql -uroot -prootpass123 -e "START SLAVE;"
```

### Porta já em uso

```bash
# Verificar processos na porta 3306
lsof -i :3306

# Matar processo (se necessário)
kill -9 <PID>

# Ou modificar porta no docker-compose.yml
ports:
  - "3307:3306"  # Usar porta 3307 ao invés de 3306
```

## Comandos Úteis

### Docker

```bash
# Parar containers
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose down -v

# Rebuild da aplicação
docker compose up -d --build

# Ver logs em tempo real
docker compose logs -f auditoria-app

# Executar comando no container
docker exec -it auditoria-app sh
```

### Banco de Dados

```bash
# Backup
docker exec mysql-master mysqldump -uroot -prootpass123 auditoria_db > backup.sql

# Restore
docker exec -i mysql-master mysql -uroot -prootpass123 auditoria_db < backup.sql

# Conectar via CLI
docker exec -it mysql-master mysql -uroot -prootpass123 auditoria_db
```

## Próximos Passos

Após concluir a instalação:

1. 📖 Leia a [documentação de funcionalidades](funcionalidades.md)
2. 🔌 Explore a [documentação da API](api-referencia.md)
3. ⚙️ Configure [integrações](integracao-azure-devops.md) com Azure DevOps
4. 👨‍💻 Consulte o [guia de desenvolvimento](desenvolvimento.md)

## Suporte

Em caso de dúvidas ou problemas:

- 📧 Email: suporte@empresa.com.br
- 🐛 Issues: GitHub Issues
- 📚 Documentação: [docs.empresa.com.br](/)
