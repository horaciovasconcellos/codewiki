FROM node:20-slim

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files para instalar dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor portas
EXPOSE 5173 3000

# Script de inicialização que roda backend e frontend
CMD ["npm", "run", "dev:all"]
