# Atualização API Tecnologias - Campo Camada

## Data: 15/01/2026

### Mudanças Realizadas

#### 1. Banco de Dados
- **Nova coluna**: `camada ENUM('Front-End', 'UI', 'Design', 'Back-end', 'Linguagem') NOT NULL`
- **Posição**: Após `versao_release`
- **Índice**: Criado `idx_tecnologias_camada` para performance
- **⚠️ OBRIGATÓRIO**: Campo camada é obrigatório

#### 2. Categoria - Valores Atualizados
**Removidos:**
- `Frontend`
- `Backend`

**Adicionado:**
- `Framework` *(novo)*
- `Gerenciador`

**Categorias Atuais:**
- Aplicação Terceira
- Banco de Dados
- Biblioteca
- Framework *(novo)*
- Gerenciador
- Infraestrutura
- Devops
- Segurança
- Analytics
- Integração
- Inteligencia Artificial
- Outras

#### 3. Valores Default
- **Camada**: `'Back-end'`
- **Categoria**: `'Biblioteca'`
- **Status**: `'Ativa'`

#### 4. API Endpoints

##### GET /api/tecnologias
**Resposta atualizada:**
```json
{
  "id": "uuid",
  "sigla": "REACT",
  "nome": "React",
  "versaoRelease": "18.2.0",
  "camada": "Front-End",
  "categoria": "Biblioteca",
  "status": "Ativa",
  ...
}
```

##### POST /api/tecnologias
**Request Body (camada obrigatório):**
```json
{
  "sigla": "REACT",
  "nome": "React",
  "versaoRelease": "18.2.0",
  "camada": "Front-End",
  "categoria": "Biblioteca",
  "status": "Ativa",
  ...
}
```

##### PUT /api/tecnologias/:id
**Request Body:** Mesma estrutura do POST (camada obrigatório)

#### 5. Valores de Camada (OBRIGATÓRIO)
- `Front-End` - Tecnologias de interface web
- `UI` - Bibliotecas de componentes de interface
- `Design` - Ferramentas de design/prototipação
- `Back-end` - Tecnologias de servidor
- `Linguagem` - Linguagens de programação

#### 6. Carga CSV
**Formato Atualizado (camada obrigatório):**
```csv
sigla,nome,versaoRelease,camada,categoria,status,fornecedorFabricante,tipoLicenciamento,maturidadeInterna,nivelSuporteInterno
REACT,React,18.2.0,Front-End,Biblioteca,Ativa,Meta,Open Source,Padronizada,Suporte Completo / Especializado
NODE,Node.js,20.10.0,Back-end,Linguagem,Ativa,OpenJS Foundation,Open Source,Padronizada,Suporte Completo / Especializado
FIGMA,Figma,Latest,Design,Outras,Ativa,Figma Inc.,SaaS,Adotada,Suporte Intermediário
MUI,Material-UI,5.14.0,UI,Biblioteca,Ativa,MUI,Open Source,Padronizada,Suporte Completo / Especializado
```

**⚠️ ATENÇÃO:** Campo `camada` é **obrigatório**. Não pode ser deixado em branco.

#### 7. Migração de Dados

Execute o script de migração:
```bash
mysql -u root -p auditoria_db < database/migrations/add-camada-tecnologias.sql
```

O script irá:
1. Adicionar coluna `camada`
2. Migrar dados existentes (Frontend → Front-End, Backend → Back-end)
3. Definir 'Back-end' como default para registros sem camada
4. Tornar camada **NOT NULL** (obrigatório)
5. Atualizar categoria de Frontend/Backend para Framework
6. Criar índice para performance

#### 8. Interface Frontend
- Campo **Camada** é **obrigatório** (marcado com * vermelho)
- Layout reorganizado: **Camada, Categoria e Status na mesma linha**
- Select com valor default 'Back-end'
- Categoria default: 'Biblioteca'
- Status default: 'Ativa'

### ⚠️ Breaking Changes
- Campo `camada` agora é **OBRIGATÓRIO**
- Requisições POST/PUT sem camada serão **REJEITADAS**
- Importações CSV devem incluir coluna `camada`
- Frontend e Backend **não existem mais** como categoria

### Compatibilidade
- ❌ Campo `camada` é **obrigatório** - não há retrocompatibilidade
- Dados existentes foram migrados automaticamente para 'Back-end'
- Frontend e Backend não estão mais disponíveis como categoria

### Exemplos de Uso

#### Tecnologia Front-End
```json
{
  "sigla": "REACT",
  "camada": "Front-End",
  "categoria": "Biblioteca"
}
```

#### Tecnologia de Linguagem
```json
{
  "sigla": "JAVA",
  "camada": "Linguagem",
  "categoria": "Linguagem"
}
```

#### Framework (nova categoria)
```json
{
  "sigla": "SPRING",
  "camada": "Back-end",
  "categoria": "Framework"
}
```

#### Gerenciador
```json
{
  "sigla": "DOCKER",
  "camada": "Back-end",
  "categoria": "Gerenciador"
}
```
