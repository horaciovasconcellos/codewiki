# Configuração Docker - Sistema de Auditoria

## Correções Implementadas

### Problema Original
O sistema apresentava o erro `MODULE_NOT_FOUND` para `@rollup/rollup-linux-arm64-musl` ao tentar executar o Vite em container Docker com Alpine Linux.

### Soluções Aplicadas

1. **Mudança de Imagem Base**
   - **Antes:** `node:20-alpine` 
   - **Depois:** `node:20-slim` (Debian)
   - **Motivo:** Alpine Linux tem problemas com dependências nativas do Rollup em arquiteturas ARM64

2. **Especificação de Plataforma**
   - Adicionado `platform: linux/amd64` no docker-compose.yml
   - Garante compatibilidade independente da arquitetura do host (Intel/ARM)

3. **Otimização do Build**
   - Limpeza de cache npm antes da instalação
   - Remoção de node_modules e package-lock.json
   - Instalação verbosa para melhor diagnóstico

4. **Configuração de Volumes**
   - Volume anônimo para `/app/node_modules` (evita conflitos com host)
   - Volumes montados para `src` e `public` (hot-reload)

5. **Configuração do Vite**
   - Servidor configurado para `host: 0.0.0.0` (acessível externamente)
   - Porta padrão: `5000` (dentro do container)
   - `strictPort: true` para evitar conflitos

6. **Arquivo .dockerignore**
   - Criado para otimizar build
   - Exclui node_modules, cache, e arquivos desnecessários

## Como Usar

### Iniciar o Sistema
```bash
docker-compose up -d
```

### Reconstruir do Zero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Verificar Logs
```bash
docker logs auditoria-app
docker logs mysql-master
docker logs mysql-slave
```

### Acessar a Aplicação
- **Frontend:** http://localhost:5173
- **MySQL Master:** localhost:3306
- **MySQL Slave:** localhost:3307

## Estrutura de Serviços

- **mysql-master**: Banco de dados principal (porta 3306)
- **mysql-slave**: Réplica de leitura (porta 3307)
- **app**: Aplicação React/Vite (porta 5173→5000)

## Variáveis de Ambiente

```env
VITE_DB_HOST=mysql-master
VITE_DB_PORT=3306
VITE_DB_USER=app_user
VITE_DB_PASSWORD=apppass123
VITE_DB_NAME=auditoria_db
```

## Troubleshooting

### Porta já em uso
Se a porta 5173 estiver ocupada, altere no docker-compose.yml:
```yaml
ports:
  - "OUTRA_PORTA:5000"
```

### Reconstruir apenas a aplicação
```bash
docker-compose build --no-cache app
docker-compose up -d app
```

### Limpar tudo e começar do zero
```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d
```
