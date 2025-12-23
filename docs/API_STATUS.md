# ✅ Sistema de Auditoria - API Funcionando!

## 🎉 Status Atual

**Última atualização**: 22 de novembro de 2025 12:45

✅ **Frontend React/Vite**: Funcionando em http://localhost:5173  
✅ **API Backend Express**: Funcionando em http://localhost:3000  
✅ **MySQL Master**: Rodando na porta 3306 (healthy)  
✅ **MySQL Slave**: Rodando na porta 3307 (healthy, replicando)  
✅ **Proxy API**: Configurado - use http://localhost:5173/api/...  
✅ **Replicação**: Slave_IO_Running: Yes, Slave_SQL_Running: Yes, Seconds_Behind_Master: 0  
✅ **ENUMs**: Todos sem acentos (UTF-8 normalizado)

## 🔧 Problemas Resolvidos

### ENUM Double-Encoding UTF-8 ✅
- **Problema**: MySQL ENUM armazenava 'Técnica' como `54C383C2A9636E696361` (double-encoded)
- **Causa**: Schema SQL tinha acentos que foram double-encoded durante inicialização
- **Solução**: 
  1. Alterado ENUM para valores sem acentos: `ENUM('Tecnica','Comportamental','Gestao')`
  2. Alterado `colaborador_habilidades`: `ENUM('Basico','Intermediario','Avancado','Expert')`
  3. Atualizado `database/01-init-schema-data.sql`
  4. Corrigido função `mapHabilidade()` em `server/api.js`
  5. Atualizado dados existentes no banco
- **Resultado**: POST /api/habilidades funcionando ✓

### ENUMs Normalizados ✅
Todos os ENUMs foram convertidos para valores sem acentos:
- `habilidades.tipo`: `Tecnica`, `Comportamental`, `Gestao`
- `colaborador_habilidades.nivel_declarado`: `Basico`, `Intermediario`, `Avancado`, `Expert`
- `colaborador_habilidades.nivel_avaliado`: `Basico`, `Intermediario`, `Avancado`, `Expert`

## 🚀 Teste Rápido

```bash
# Criar um tipo de afastamento
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "BH",
    "descricao": "Banco de Horas",
    "argumentacaoLegal": "CCT 2024/2025 Cláusula 22",
    "numeroDias": 10,
    "tipoTempo": "N"
  }'

# Resposta esperada: HTTP 201 Created
{
  "id": "uuid-gerado-automaticamente",
  "sigla": "BH",
  "descricao": "Banco de Horas",
  "argumentacaoLegal": "CCT 2024/2025 Cláusula 22",
  "numeroDias": 10,
  "tipoTempo": "N"
}
```

## 📊 Dados Iniciais Disponíveis

A API já vem com 4 tipos de afastamento pré-cadastrados:

1. **FER** - Férias (30 dias)
2. **LIC-MED** - Licença Médica (15 dias)
3. **LIC-MAT** - Licença Maternidade (180 dias)
4. **LIC-PAT** - Licença Paternidade (20 dias)

## 🔌 Endpoints Implementados

### Tipos de Afastamento
- `GET /api/tipos-afastamento` - Listar todos
- `POST /api/tipos-afastamento` - Criar novo
- `GET /api/tipos-afastamento/:id` - Buscar por ID
- `PUT /api/tipos-afastamento/:id` - Atualizar
- `DELETE /api/tipos-afastamento/:id` - Excluir

### Outros Endpoints
- `GET /api/colaboradores`
- `POST /api/colaboradores`
- `GET /api/habilidades`
- `POST /api/habilidades`
- `GET /api/capacidades-negocio`
- `POST /api/capacidades-negocio`
- `GET /api/tecnologias`
- `POST /api/tecnologias`
- `GET /health` - Health check

## 📝 Estrutura do Projeto

```
sistema-de-auditoria/
├── server/
│   ├── api.js          # ⭐ Servidor Express com API REST
│   └── README.md       # Documentação do servidor
├── src/
│   ├── components/     # Componentes React
│   ├── lib/           # Tipos e utilitários
│   └── main.tsx       # Entry point
├── docs/
│   ├── EXEMPLO_POST_TIPO_AFASTAMENTO.md  # 📖 Guia completo de exemplos
│   └── DOCUMENTACAO_API.md               # Documentação da API
├── docker-compose.yml  # Configuração Docker
├── Dockerfile         # Imagem da aplicação
├── vite.config.ts     # Configuração Vite com proxy
└── QUICKSTART.md      # Guia rápido
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web
- **CORS** - Habilitado para todas as origens
- **UUID** - Geração de IDs únicos

### Frontend
- **React 19** - Framework UI
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **Radix UI** - Componentes acessíveis

### Infraestrutura
- **Docker** - Containerização
- **MySQL 8.0** - Banco de dados (master/slave)
- **Node 20** - Runtime JavaScript

## 🔄 Fluxo de Requisições

```
Cliente (Browser/cURL)
    ↓
http://localhost:5173/api/tipos-afastamento
    ↓
Vite Dev Server (porta 5000 no container)
    ↓ (proxy configurado)
Express API Server (porta 3000)
    ↓
Processamento e Validação
    ↓
Armazenamento em Memória
    ↓
Resposta JSON
```

## 💾 Persistência de Dados

**⚠️ IMPORTANTE**: Atualmente os dados são armazenados **em memória**.

- ✅ Dados iniciais são carregados ao iniciar
- ❌ Dados criados são perdidos ao reiniciar o container
- 🔜 **Próximo passo**: Conectar ao MySQL para persistência real

## 📚 Documentação Disponível

| Documento | Descrição |
|-----------|-----------|
| `QUICKSTART.md` | Guia rápido de início |
| `DOCKER_SETUP.md` | Configuração Docker detalhada |
| `docs/EXEMPLO_POST_TIPO_AFASTAMENTO.md` | **Exemplos completos de uso da API** |
| `docs/DOCUMENTACAO_API.md` | Documentação completa da API |
| `server/README.md` | Documentação do servidor Express |

## 🎯 Casos de Uso

### 1. Criar Tipo de Afastamento

```bash
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "LNR",
    "descricao": "Licença Não Remunerada",
    "argumentacaoLegal": "CCT 2024/2025 Cláusula 15",
    "numeroDias": 90,
    "tipoTempo": "N"
  }'
```

### 2. Listar Todos

```bash
curl http://localhost:5173/api/tipos-afastamento | jq
```

### 3. Buscar Específico

```bash
curl http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440001 | jq
```

### 4. Atualizar

```bash
curl -X PUT http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440001 \
  -H 'Content-Type: application/json' \
  -d '{
    "numeroDias": 35
  }'
```

### 5. Excluir

```bash
curl -X DELETE http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440001
```

## ✅ Validações Implementadas

- **Sigla**: 2-15 caracteres alfanuméricos/hífens, única
- **Descrição**: Obrigatória, máximo 50 caracteres
- **Argumentação Legal**: Obrigatória, máximo 60 caracteres
- **Número de Dias**: 1-99
- **Tipo de Tempo**: Apenas 'C' ou 'N'

## 🐛 Troubleshooting

### API retorna 404
```bash
# Verificar se o servidor está rodando
docker logs auditoria-app | grep "API Server"

# Deve mostrar:
# 🚀 API Server rodando em http://localhost:3000
```

### Porta em conflito
```bash
# Parar tudo e reiniciar
docker-compose down
docker-compose up -d
```

### Dados não persistem
Normal! Dados estão em memória. Para persistir, conecte ao MySQL.

## 🔜 Próximos Passos

- [ ] Conectar API ao MySQL
- [ ] Implementar autenticação
- [ ] Adicionar paginação
- [ ] Documentação Swagger
- [ ] Testes automatizados
- [ ] CI/CD Pipeline

## 📞 Suporte

- **Documentação**: Ver arquivos `.md` na raiz e em `/docs`
- **Logs**: `docker logs auditoria-app`
- **Status**: `docker-compose ps`

---

**Desenvolvido em**: 22 de novembro de 2025  
**Versão**: 1.0.0 (API Funcional)  
**Status**: ✅ Operacional
