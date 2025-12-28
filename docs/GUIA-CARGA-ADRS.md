# Guia de Carga de ADRs

## Visão Geral

Este guia fornece instruções passo a passo para realizar carga de dados de ADRs (Architectural Decision Records) no sistema.

## Pré-requisitos

- ✅ Sistema em execução (containers Docker rodando)
- ✅ Node.js instalado
- ✅ Dependência `csv-parse` instalada (`npm install csv-parse`)
- ✅ Aplicações já cadastradas (se for associar ADRs a aplicações)

## Arquivos de Template

O diretório `data-templates/` contém os seguintes arquivos:

| Arquivo | Descrição | Formato | Registros |
|---------|-----------|---------|-----------|
| `adrs.csv` | ADRs básicos sem aplicações | CSV | 10 ADRs |
| `adrs-carga.json` | ADRs detalhados sem aplicações | JSON | 5 ADRs |
| `adrs-aplicacoes-exemplo.json` | ADRs com aplicações associadas | JSON | 5 ADRs |

## Métodos de Carga

### 1. Via Interface Web (Recomendado para Poucos ADRs)

1. Acesse o sistema em `http://localhost:5173`
2. Navegue para **DevSecOps > Decisões Arquitetônicas**
3. Clique em **"Novo ADR"**
4. Preencha o wizard de 3 etapas:
   - **Etapa 1:** Dados Básicos (descrição, status, contexto, decisão, justificativa)
   - **Etapa 2:** Detalhes (consequências, riscos, alternativas, compliance)
   - **Etapa 3:** Aplicações Associadas
5. Clique em **"Criar ADR"**

**Vantagens:**
- ✅ Interface visual intuitiva
- ✅ Validação em tempo real
- ✅ Seleção de aplicações via dropdown
- ✅ Melhor para ADRs únicos ou poucos registros

### 2. Via Script de Carga (Recomendado para Muitos ADRs)

#### Validação (Dry-Run)

Primeiro, sempre valide seus dados sem inserir:

```bash
# Validar arquivo JSON
node scripts/carga-adrs.js \
  --file data-templates/adrs-carga.json \
  --dry-run

# Validar arquivo CSV
node scripts/carga-adrs.js \
  --file data-templates/adrs.csv \
  --format csv \
  --dry-run
```

#### Carga Real

Após validação bem-sucedida:

```bash
# Carregar ADRs do JSON
node scripts/carga-adrs.js \
  --file data-templates/adrs-carga.json

# Carregar ADRs do CSV
node scripts/carga-adrs.js \
  --file data-templates/adrs.csv \
  --format csv

# Carregar com verbosidade
node scripts/carga-adrs.js \
  --file data-templates/adrs-aplicacoes-exemplo.json \
  --verbose
```

**Vantagens:**
- ✅ Carga em lote de múltiplos ADRs
- ✅ Validação prévia
- ✅ Logs detalhados
- ✅ Suporte a CSV e JSON
- ✅ Ideal para migração de dados

### 3. Via API REST (Para Integrações)

#### Criar ADR Único

```bash
curl -X POST http://localhost:3000/api/adrs \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Uso de GraphQL para APIs",
    "status": "Proposto",
    "contexto": "APIs REST com over-fetching",
    "decisao": "Implementar GraphQL",
    "justificativa": "Reduzir over-fetching e under-fetching"
  }'
```

#### Criar ADR com Aplicações

```bash
curl -X POST http://localhost:3000/api/adrs \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Uso de Redis para Cache",
    "status": "Aceito",
    "contexto": "Necessidade de reduzir latência",
    "decisao": "Implementar Redis como camada de cache",
    "aplicacoes": [
      {
        "aplicacaoId": "uuid-da-aplicacao",
        "status": "Ativo",
        "observacoes": "Cache de queries frequentes"
      }
    ]
  }'
```

**Vantagens:**
- ✅ Integração com outros sistemas
- ✅ Automação via CI/CD
- ✅ Controle programático completo

## Passo a Passo Completo

### Carga Inicial do Sistema

1. **Preparar Aplicações**
   ```bash
   # Certifique-se de que as aplicações existem
   curl http://localhost:3000/api/aplicacoes | jq '.[] | {id, sigla, descricao}'
   ```

2. **Validar Dados**
   ```bash
   # Testar sem inserir
   node scripts/carga-adrs.js \
     --file data-templates/adrs-carga.json \
     --dry-run
   ```

3. **Carregar ADRs Básicos**
   ```bash
   # Carregar ADRs sem aplicações primeiro
   node scripts/carga-adrs.js \
     --file data-templates/adrs-carga.json
   ```

4. **Verificar Inserção**
   ```bash
   # Listar ADRs criados
   curl http://localhost:3000/api/adrs | jq '.[] | {sequencia, descricao, status}'
   ```

5. **Carregar ADRs com Aplicações**
   
   Edite `adrs-aplicacoes-exemplo.json` para usar siglas corretas:
   
   ```json
   {
     "descricao": "Meu ADR",
     "status": "Aceito",
     "aplicacoes": [
       {
         "aplicacao_sigla": "PORTAL",  // Use sigla real
         "status": "Ativo"
       }
     ]
   }
   ```
   
   Depois carregue:
   ```bash
   node scripts/carga-adrs.js \
     --file data-templates/adrs-aplicacoes-exemplo.json
   ```

6. **Criar ADR Substituído**
   
   Após criar ADRs, você pode marcar um como substituído:
   
   ```bash
   # Primeiro, obter ID do ADR substituto
   curl http://localhost:3000/api/adrs | jq '.[] | select(.sequencia==5) | .id'
   
   # Depois, atualizar ADR antigo
   curl -X PUT http://localhost:3000/api/adrs/{id-do-adr-antigo} \
     -H "Content-Type: application/json" \
     -d '{
       "descricao": "Vue.js para Frontend (DEPRECADO)",
       "status": "Substituído",
       "adrSubstitutaId": "id-do-adr-substituto",
       ...
     }'
   ```

## Exemplos de Arquivos de Carga

### CSV Simples

```csv
descricao,status,contexto,decisao,justificativa
"Uso de TypeScript","Aceito","Necessidade de type safety","Adotar TypeScript","Reduzir bugs de tipo"
"MongoDB para Logs","Proposto","Volume alto de logs","Avaliar MongoDB","Melhor para dados não estruturados"
```

### JSON com Markdown

```json
{
  "descricao": "Implementação de CQRS",
  "status": "Aceito",
  "contexto": "Necessidade de separar leitura e escrita",
  "decisao": "Implementar padrão CQRS com Event Sourcing",
  "justificativa": "Melhor escalabilidade e auditoria",
  "consequencias_positivas": "- Escalabilidade independente\n- Auditoria completa\n- Performance otimizada",
  "consequencias_negativas": "- Complexidade aumentada\n- Eventually consistent",
  "riscos": "- Curva de aprendizado\n- Overhead operacional",
  "alternativas_consideradas": "1. **CRUD simples**: Descartado por limitações de escala\n2. **Event Sourcing puro**: Muito complexo",
  "compliance_constitution": "Alinhado com princípios de escalabilidade",
  "referencias": "- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)\n- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)"
}
```

### JSON com Aplicações

```json
{
  "descricao": "Autenticação OAuth 2.0",
  "status": "Aceito",
  "contexto": "Sistema de autenticação moderno",
  "decisao": "Implementar OAuth 2.0 com JWT",
  "aplicacoes": [
    {
      "aplicacao_sigla": "API-CORE",
      "data_inicio": "2024-01-15",
      "status": "Ativo",
      "observacoes": "Implementação completa"
    },
    {
      "aplicacao_sigla": "PORTAL",
      "data_inicio": "2024-02-01",
      "status": "Ativo",
      "observacoes": "Integrado com Azure AD"
    },
    {
      "aplicacao_sigla": "MOBILE-APP",
      "data_inicio": "2024-03-01",
      "status": "Planejado",
      "observacoes": "Em desenvolvimento"
    }
  ]
}
```

## Validações Automáticas

O script realiza as seguintes validações:

| Validação | Descrição |
|-----------|-----------|
| ✅ Descrição obrigatória | Máximo 500 caracteres |
| ✅ Status válido | Deve ser um dos 6 status permitidos |
| ✅ ADR substituta | Obrigatória se status = "Substituído" |
| ✅ Sigla de aplicação | Deve existir no sistema |
| ✅ Status de aplicação | Deve ser um dos 4 status permitidos |
| ✅ Datas | data_termino >= data_inicio |

## Troubleshooting

### "ADR Substituta não encontrado"

**Problema:** ADR referenciado não existe  
**Solução:** Crie o ADR substituto primeiro, ou use sequência correta

```bash
# Listar ADRs existentes
curl http://localhost:3000/api/adrs | jq '.[] | {sequencia, descricao}'
```

### "Aplicação não encontrada"

**Problema:** Sigla de aplicação não existe  
**Solução:** Crie a aplicação primeiro ou corrija a sigla

```bash
# Listar aplicações
curl http://localhost:3000/api/aplicacoes | jq '.[] | {sigla, descricao}'

# Criar aplicação se necessário
curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "PORTAL",
    "descricao": "Portal Web Principal",
    ...
  }'
```

### "Descrição muito longa"

**Problema:** Descrição excede 500 caracteres  
**Solução:** Reduza o texto ou mova detalhes para outros campos

```bash
# Verificar tamanho
echo -n "Sua descrição aqui" | wc -c
```

### "Erro de permissão ao executar script"

**Problema:** Script não tem permissão de execução  
**Solução:** Tornar executável

```bash
chmod +x scripts/carga-adrs.js
```

### "csv-parse not found"

**Problema:** Dependência não instalada  
**Solução:** Instalar pacote

```bash
npm install csv-parse
```

## Verificação Pós-Carga

Após a carga, verifique:

```bash
# 1. Contar ADRs
curl http://localhost:3000/api/adrs | jq 'length'

# 2. Listar ADRs por status
curl http://localhost:3000/api/adrs | jq 'group_by(.status) | map({status: .[0].status, count: length})'

# 3. ADRs com aplicações
curl http://localhost:3000/api/adrs | jq '.[] | select(.aplicacoes != null) | {sequencia, descricao, apps: (.aplicacoes | length)}'

# 4. ADRs substituídos
curl http://localhost:3000/api/adrs | jq '.[] | select(.status == "Substituído") | {sequencia, descricao, substituta: .adrSubstitutaSequencia}'
```

## Boas Práticas

1. **Sempre use --dry-run primeiro** para validar dados
2. **Crie aplicações antes** de associá-las a ADRs
3. **Use formato JSON** para ADRs complexos com formatação Markdown
4. **Use formato CSV** para carga rápida de muitos ADRs simples
5. **Documente referências** com links válidos
6. **Seja específico** em contexto, decisão e justificativa
7. **Liste alternativas** consideradas e por que foram rejeitadas
8. **Mantenha descrição concisa** (máx 500 caracteres)
9. **Use verbosidade** (--verbose) durante debugging
10. **Faça backup** antes de cargas grandes

## Scripts Úteis

### Backup de ADRs

```bash
# Exportar ADRs para JSON
curl http://localhost:3000/api/adrs | jq '.' > backup-adrs-$(date +%Y%m%d).json
```

### Limpar ADRs de Teste

```bash
# Deletar ADRs de teste (com cuidado!)
curl http://localhost:3000/api/adrs | jq '.[] | select(.descricao | contains("TESTE")) | .id' | xargs -I {} curl -X DELETE http://localhost:3000/api/adrs/{}
```

### Estatísticas

```bash
# Estatísticas completas
curl http://localhost:3000/api/adrs | jq '{
  total: length,
  por_status: group_by(.status) | map({status: .[0].status, count: length}),
  com_aplicacoes: [.[] | select(.aplicacoes != null)] | length,
  substituidos: [.[] | select(.status == "Substituído")] | length
}'
```

## Próximos Passos

Após carregar os ADRs:

1. ✅ Acesse a interface web para visualizar
2. ✅ Associe aplicações adicionais via wizard
3. ✅ Atualize status conforme decisões evoluem
4. ✅ Marque ADRs obsoletos como "Substituído"
5. ✅ Exporte documentação para compartilhar

## Suporte

- 📚 [Documentação Completa](../docs/SISTEMA-ADR.md)
- 📖 [README de Templates](README-ADRS.md)
- 🔧 [Guia de Componentes](../src/components/adr/README.md)
- 🌐 [Documentação Online](http://localhost:8000)
