# Migração: Campo Semanas Sprint

**Data**: 2025-12-09  
**Autor**: Sistema de Auditoria  
**Versão**: 1.0

## Descrição

Adição do campo `semanas_sprint` na tabela `integrador_projetos` para permitir a configuração da duração de cada sprint em semanas (1 a 4 semanas).

## Alterações Realizadas

### 1. Banco de Dados

- **Tabela**: `integrador_projetos`
- **Coluna adicionada**: `semanas_sprint INT NOT NULL DEFAULT 2`
- **Posição**: Após a coluna `iteracao`
- **Valor padrão**: 2 semanas

**Status**: ✅ Executado com sucesso

### 2. Frontend

**Arquivo**: `src/components/integrador/IntegradorForm.tsx`

- Adicionado estado: `const [semanasSprint, setSemanasSprint] = useState('2');`
- Adicionado campo visual após "Iteração":
  ```tsx
  <div className="space-y-2">
    <Label htmlFor="semanasSprint">Semanas Sprint *</Label>
    <Input
      id="semanasSprint"
      type="number"
      value={semanasSprint}
      onChange={(e) => setSemanasSprint(e.target.value)}
      min="1"
      max="4"
    />
  </div>
  ```
- Atualizado carregamento de dados de projeto existente
- Atualizado envio para API (payload de criação, atualização e setup)

**Status**: ✅ Concluído

### 3. Backend (API)

**Arquivo**: `server/api.js`

**Endpoint POST /api/integrador-projetos**:
- Adicionado `semanasSprint` no destructuring
- Adicionado coluna `semanas_sprint` no INSERT
- Valor padrão: 2 (se não fornecido)

**Endpoint PUT /api/integrador-projetos/:id**:
- Adicionado `semanasSprint` no destructuring
- Adicionado `semanas_sprint` no UPDATE
- Valor padrão: 2 (se não fornecido)

**Status**: ✅ Concluído

### 4. TypeScript Types

**Arquivo**: `src/lib/integrador-types.ts`

- Adicionado `semanasSprint?: number;` na interface `ProjetoIntegrador`

**Status**: ✅ Concluído

### 5. Documentação

**Arquivo**: `docs/DOCUMENTACAO_API.md`

- Atualizado exemplo de payload do endpoint POST
- Adicionada descrição dos campos com detalhes do `semanasSprint`

**Status**: ✅ Concluído

### 6. Schema do Banco

**Arquivo**: `database/init-master.sql`

- Adicionada coluna `semanas_sprint INT NOT NULL DEFAULT 2 AFTER iteracao`

**Status**: ✅ Concluído

## Como Executar a Migração

A migração já foi executada automaticamente no banco de dados ativo. Para novos ambientes, basta subir os containers normalmente:

```bash
docker-compose up -d
```

O arquivo `database/init-master.sql` já contém a definição completa da tabela com a nova coluna.

## Verificação

Para verificar se a coluna foi adicionada corretamente:

```bash
docker exec mysql-master sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD auditoria_db -e "SHOW COLUMNS FROM integrador_projetos LIKE \"semanas_sprint\";"'
```

**Resultado esperado**:
```
Field           Type    Null    Key     Default
semanas_sprint  int     NO              2
```

## Funcionalidade

O campo `semanasSprint` permite configurar a duração de cada sprint ao criar um projeto no Azure DevOps Integrador:

- **Valores permitidos**: 1 a 4 semanas
- **Valor padrão**: 2 semanas
- **Uso**: Define a duração das iterações/sprints criadas automaticamente no projeto

## Próximos Passos

Para que o campo `semanasSprint` seja utilizado na criação de sprints no Azure DevOps, será necessário atualizar o método `createIterations()` no arquivo `server/azure-devops-service.js` para calcular as datas de início e fim considerando a duração configurada.

## Testes

✅ Compilação sem erros  
✅ Banco de dados atualizado  
✅ Container reiniciado com sucesso  
✅ Campo visual aparecendo no formulário
