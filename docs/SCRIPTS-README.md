# 📜 Scripts - Documentação

## Visão Geral

A funcionalidade de **Scripts** permite gerenciar scripts de automação, administração, banco de dados, infraestrutura e outros tipos de scripts utilizados no sistema. Esta tela oferece um DataTable completo com busca, filtros e upload de arquivos.

## Características

### 🎯 Tipos de Script Suportados

O sistema suporta os seguintes tipos de script:

1. **Automação** - Scripts de automação de tarefas
2. **Administração** - Scripts administrativos do sistema
3. **Banco de Dados** - Scripts SQL e de manutenção de banco
4. **Integração** - Scripts de integração entre sistemas
5. **Testes** - Scripts de testes automatizados
6. **Build & Deploy** - Scripts de compilação e deploy
7. **CI/CD** - Scripts de integração e entrega contínuas
8. **Infraestrutura (IaC)** - Scripts de infraestrutura como código
9. **Monitoramento** - Scripts de monitoramento e alertas
10. **Segurança** - Scripts de segurança e compliance
11. **Governança** - Scripts de governança de TI
12. **Dados** - Scripts de ETL e processamento de dados
13. **ERP** - Scripts relacionados a sistemas ERP
14. **Documentação** - Scripts de geração de documentação

### 📋 Campos do Script

- **UUID**: Identificador único gerado automaticamente
- **Sigla**: Código de identificação do script (ex: SCR-001)
- **Descrição**: Descrição detalhada do propósito do script
- **Data de Início**: Data de início de uso do script
- **Data de Término**: Data de término (opcional)
- **Tipo de Script**: Categoria do script (dropdown)
- **Arquivo**: Upload do arquivo do script

### 📁 Formatos de Arquivo Aceitos

- `.sh` - Shell scripts
- `.ps1` - PowerShell scripts
- `.py` - Python scripts
- `.js` - JavaScript
- `.ts` - TypeScript
- `.sql` - SQL scripts
- `.yaml`, `.yml` - YAML files
- `.json` - JSON files
- `.xml` - XML files
- `.txt` - Text files

**Limite de tamanho**: 50 MB por arquivo

## Interface do Usuário

### DataTable

A tabela de scripts exibe:

- **Sigla**: Código do script
- **Descrição**: Descrição do script (truncada se muito longa)
- **Tipo**: Badge colorido indicando o tipo
- **Data Início**: Data de início formatada
- **Data Término**: Data de término (se houver)
- **Arquivo**: Ícone e nome do arquivo anexado
- **Ações**: Botões para visualizar e excluir

### Funcionalidades da Tabela

1. **Busca**: Campo de busca por sigla ou descrição
2. **Filtro por Tipo**: Dropdown para filtrar por tipo de script
3. **Ordenação**: Ordenação alfabética por sigla
4. **Paginação**: Suporte a grandes volumes de dados

### Cores dos Badges por Tipo

Cada tipo de script tem uma cor específica para fácil identificação:

- 🔵 Automação (azul)
- 🟣 Administração (roxo)
- 🟢 Banco de Dados (verde)
- 🟡 Integração (amarelo)
- 🟠 Testes (laranja)
- 🔴 Build & Deploy (vermelho)
- 🩷 CI/CD (rosa)
- 🔵 Infraestrutura (índigo)
- 🔷 Monitoramento (ciano)
- 🌹 Segurança (rose)
- 🟣 Governança (violeta)
- 🐚 Dados (teal)
- 🟡 ERP (âmbar)
- ⚫ Documentação (slate)

## API Endpoints

### GET /api/scripts
Lista todos os scripts cadastrados.

**Resposta:**
```json
[
  {
    "id": "uuid",
    "sigla": "SCR-001",
    "descricao": "Script de backup automático",
    "dataInicio": "2024-12-29",
    "dataTermino": null,
    "tipoScript": "Automação",
    "arquivo": "backup.sh",
    "arquivoUrl": "uploads/scripts/1234567890-backup.sh",
    "arquivoTamanho": 2048,
    "arquivoTipo": "application/x-sh"
  }
]
```

### GET /api/scripts/:id
Busca um script específico por ID.

### POST /api/scripts
Cria um novo script.

**Content-Type**: `multipart/form-data` (se houver arquivo) ou `application/json`

**Body (FormData com arquivo)**:
- `data`: JSON string com os dados do script
- `arquivo`: File upload

**Body (JSON sem arquivo)**:
```json
{
  "sigla": "SCR-001",
  "descricao": "Descrição do script",
  "dataInicio": "2024-12-29",
  "dataTermino": null,
  "tipoScript": "Automação"
}
```

### PUT /api/scripts/:id
Atualiza um script existente (mesmo formato do POST).

### DELETE /api/scripts/:id
Remove um script do sistema.

## Estrutura do Banco de Dados

### Tabela: `scripts`

```sql
CREATE TABLE scripts (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE,
  tipo_script VARCHAR(50) NOT NULL,
  arquivo VARCHAR(255),
  arquivo_url VARCHAR(500),
  arquivo_tamanho INT,
  arquivo_tipo VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scripts_sigla (sigla),
  INDEX idx_scripts_tipo (tipo_script),
  INDEX idx_scripts_data_inicio (data_inicio)
);
```

## Upload de Arquivos

### Configuração

O sistema utiliza `multer` para gerenciar uploads:

```javascript
const uploadScript = multer({
  storage: multer.diskStorage({
    destination: 'uploads/scripts/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.sh', '.ps1', '.py', '.js', '.ts', '.sql', '.yaml', '.yml', '.json', '.xml', '.txt'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});
```

### Diretório de Uploads

Os arquivos são armazenados em:
```
/uploads/scripts/
```

Este diretório é servido como rota estática:
```javascript
app.use('/uploads', express.static('uploads'));
```

## Fluxo de Trabalho

### Cadastro de Novo Script

1. Usuário clica em "Novo Script"
2. Preenche o formulário:
   - Sigla (obrigatória, máx 20 caracteres)
   - Descrição (obrigatória, máx 500 caracteres)
   - Data de Início (obrigatória)
   - Data de Término (opcional)
   - Tipo de Script (obrigatório)
   - Arquivo (opcional, clique ou drag & drop)
3. Clica em "Cadastrar Script"
4. Sistema valida os dados
5. Se houver arquivo, faz upload
6. Salva no banco de dados
7. Retorna à lista atualizada

### Visualização de Script

1. Usuário clica no ícone de visualização (👁️)
2. Modal abre com todos os detalhes do script
3. Exibe informações do arquivo (se houver)
4. Botão "Download" disponível para arquivos
5. Opção "Editar Script" direciona ao formulário

### Exclusão de Script

1. Usuário clica no ícone de lixeira (🗑️)
2. Dialog de confirmação aparece
3. Usuário confirma a exclusão
4. Script é removido do banco
5. Lista é atualizada automaticamente

## Componentes

### ScriptsView.tsx
Componente principal que gerencia estado e API calls.

### ScriptsTable.tsx
Componente de tabela com busca, filtros e ações.

### ScriptWizard.tsx
Formulário de criação/edição com upload de arquivo.

## Validações

### Frontend

- Sigla: obrigatória, máx 20 caracteres
- Descrição: obrigatória, máx 500 caracteres
- Data de Início: obrigatória
- Data de Término: deve ser posterior à data de início
- Tipo de Script: obrigatório
- Arquivo: opcional, máx 50MB, formatos específicos

### Backend

- Validação de tipo de arquivo
- Limite de tamanho de arquivo
- Validação de campos obrigatórios
- Sanitização de nome de arquivo

## Segurança

1. **Validação de Tipo de Arquivo**: Apenas extensões permitidas
2. **Limite de Tamanho**: Máximo 50MB por arquivo
3. **Nome de Arquivo Único**: Timestamp + random para evitar colisões
4. **Sanitização**: Nome de arquivo original preservado mas armazenado separadamente

## Melhorias Futuras

- [ ] Versionamento de scripts
- [ ] Histórico de execução
- [ ] Integração com CI/CD pipelines
- [ ] Análise estática de código
- [ ] Templates de scripts
- [ ] Categorias personalizadas
- [ ] Permissões granulares por tipo
- [ ] Logs de execução
- [ ] Agendamento de execução
- [ ] Preview de conteúdo do arquivo

## Troubleshooting

### Upload não funciona
- Verifique se o diretório `uploads/scripts/` existe
- Confirme permissões de escrita no diretório
- Verifique limite de tamanho do arquivo

### Arquivo não é exibido
- Confirme que a rota `/uploads` está configurada corretamente
- Verifique se o arquivo existe no filesystem
- Confirme que `arquivo_url` está salvo corretamente no banco

### Erro de conexão com banco
- Verifique credenciais do MySQL
- Confirme que a tabela `scripts` foi criada
- Execute a migration: `20241229-create-scripts-table.sql`

---

**Última atualização**: 29/12/2024
**Versão**: 1.0.0
