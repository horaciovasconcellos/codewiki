# Instruções para Criar Tabelas LGPD

## Problema
O acesso ao banco de dados MySQL está restrito. As tabelas LGPD precisam ser criadas manualmente.

## Solução - Opção 1: Via Docker Exec (Recomendado)

Execute os comandos abaixo diretamente no terminal do container MySQL:

```bash
# Acessar o container
docker exec -it mysql-master-prod bash

# Dentro do container, conectar ao MySQL
mysql -uroot -prootpass auditoria_db

# Executar os comandos SQL abaixo:
```

```sql
-- Criar tabela principal
CREATE TABLE IF NOT EXISTS lgpd_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identificacao_dados VARCHAR(255) NOT NULL,
  tipo_dados VARCHAR(100) NOT NULL,
  tecnica_anonimizacao VARCHAR(150) NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criar tabela de campos
CREATE TABLE IF NOT EXISTS lgpd_campos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lgpd_id INT NOT NULL,
  nome_campo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  matriz_vendas VARCHAR(150) NOT NULL,
  matriz_marketing VARCHAR(150) NOT NULL,
  matriz_financeiro VARCHAR(150) NOT NULL,
  matriz_rh VARCHAR(150) NOT NULL,
  matriz_logistica VARCHAR(150) NOT NULL,
  matriz_assistencia_tecnica VARCHAR(150) NOT NULL,
  matriz_analytics VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lgpd_id) REFERENCES lgpd_registros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir dados de exemplo
INSERT IGNORE INTO lgpd_registros (id, identificacao_dados, tipo_dados, tecnica_anonimizacao, data_inicio, ativo) VALUES
(1, 'Dados de Clientes - CRM', 'Dados Identificadores Diretos', 'Pseudonimização (Embaralhamento Reversível)', '2024-01-01', true),
(2, 'Histórico de Navegação', 'Dados Identificadores Indiretos', 'Anonimização por Generalização', '2024-01-15', true);

INSERT IGNORE INTO lgpd_campos (id, lgpd_id, nome_campo, descricao, matriz_vendas, matriz_marketing, matriz_financeiro, matriz_rh, matriz_logistica, matriz_assistencia_tecnica, matriz_analytics) VALUES
(1, 1, 'cpf', 'CPF do cliente', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Supressão', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Supressão', 'Anonimização por Supressão', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Generalização'),
(2, 1, 'email', 'Endereço de e-mail', 'Pseudonimização (Embaralhamento Reversível)', 'Pseudonimização (Embaralhamento Reversível)', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Supressão', 'Anonimização por Supressão', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Generalização');
```

## Solução - Opção 2: Via MySQL Workbench / Adminer

1. Conecte-se ao banco de dados:
   - Host: `localhost`
   - Porta: `3307`
   - Usuário: `root`
   - Senha: `rootpass`
   - Database: `auditoria_db`

2. Execute o script SQL completo disponível em:
   - `database/lgpd-tables.sql` (versão completa com ENUM)
   - OU os comandos SQL acima (versão simplificada com VARCHAR)

## Verificar Criação

```sql
SHOW TABLES LIKE 'lgpd_%';
SELECT * FROM lgpd_registros;
SELECT * FROM lgpd_campos;
```

## Testar Aplicação

Após criar as tabelas:

1. Reinicie o backend (se necessário):
   ```bash
   docker restart auditoria-app-prod
   ```

2. Acesse no navegador:
   ```
   http://localhost:4173
   ```

3. No menu lateral, clique em:
   **Governança e Compliance > LGPD**

4. Você deve ver:
   - 2 registros de exemplo na tabela
   - Botões para criar, visualizar, editar e excluir
   - Filtros por tipo de dados e status
   - Paginação completa
