# Pipeline Wizard - Sistema de Associação de Stages

## ✨ Nova Funcionalidade Implementada

O **PipelineWizard** agora é um wizard multi-etapas que permite associar stages aos 6 grupos definidos para cada pipeline.

## 🎯 Estrutura do Wizard

### Etapa 1: Definições Básicas
Configuração dos 13 campos do bloco de definições:
- Nome (obrigatório)
- extends, jobs, parameters, pool, pr, resources
- schedules, steps, target, trigger, variables

### Etapas 2-7: Associação de Stages

Cada uma das próximas 6 etapas permite selecionar stages para um grupo específico:

1. **Policy & Governance Stage** 🛡️
   - Estágios de governança, compliance e políticas
   
2. **Build Stage** 🔨
   - Compilação, build e preparação de artefatos
   
3. **Security Stage** 🔒
   - Análise de segurança (SAST, DAST, SCA)
   
4. **Test Stage** 🧪
   - Testes unitários, integração e E2E
   
5. **Deploy Stage** 🚀
   - Deploy para ambientes
   
6. **Monitor Stage** 📊
   - Monitoramento e observabilidade

## 🎨 Interface do Wizard

### Recursos Visuais
- ✅ Barra de progresso visual mostrando etapa atual
- 🎨 Ícones coloridos para cada grupo de stage
- ☑️ Checkboxes para seleção múltipla de stages
- 📝 Contador de stages selecionados por grupo
- 🔙 Navegação entre etapas (Voltar/Próximo)
- 💾 Validação antes de salvar

### Seleção de Stages
- Lista scrollável de todos os stages disponíveis
- Visualização do nome, tipo e descrição de cada stage
- Seleção/deseleção com um clique
- Feedback visual para stages selecionados
- Badge com contador de seleções

## 🔧 API Endpoints Criados

### 1. Associar Stages a um Grupo
```http
POST /api/pipelines/:pipelineId/stages/:groupId
Content-Type: application/json

{
  "stageIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Grupos disponíveis:**
- `policy_governance`
- `build`
- `security`
- `test`
- `deploy`
- `monitor`

### 2. Obter Stages de um Grupo
```http
GET /api/pipelines/:pipelineId/stages/:groupId
```

**Resposta:**
```json
[
  {
    "id": "...",
    "pipelineId": "...",
    "stageId": "...",
    "ordemExecucao": 1,
    "nome": "SAST Scan",
    "descricao": "Análise estática de segurança",
    "tipo": "Security",
    "reutilizavel": true,
    "timeoutSeconds": 600
  }
]
```

### 3. Obter Todos os Stages da Pipeline
```http
GET /api/pipelines/:pipelineId/stages
```

**Resposta:**
```json
{
  "policy_governance": [...],
  "build": [...],
  "security": [...],
  "test": [...],
  "deploy": [...],
  "monitor": [...]
}
```

## 📝 Fluxo de Criação de Pipeline

1. **Usuário clica em "Novo Pipeline"**
   - Wizard abre na Etapa 1

2. **Etapa 1: Preenche definições básicas**
   - Insere nome (obrigatório)
   - Opcionalmente preenche outros campos
   - Clica em "Próximo"

3. **Etapas 2-7: Seleciona stages**
   - Para cada grupo, seleciona os stages desejados
   - Pode pular grupos (não obrigatório selecionar stages)
   - Navega entre etapas com "Voltar" e "Próximo"

4. **Etapa Final: Revisão e Salvamento**
   - Clica em "Criar Pipeline"
   - Sistema cria pipeline
   - Sistema salva associações de stages
   - Feedback de sucesso

## 🗄️ Tabelas de Associação

Cada grupo possui sua própria tabela associativa:

```sql
CREATE TABLE pipeline_policy_governance_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
);

-- Mesma estrutura para:
-- pipeline_build_stages
-- pipeline_security_stages
-- pipeline_test_stages
-- pipeline_deploy_stages
-- pipeline_monitor_stages
```

## 🔄 Lógica de Associação

1. **Ao salvar pipeline:**
   - Cria/atualiza registro da pipeline
   - Para cada grupo com stages selecionados:
     - Remove associações antigas
     - Insere novas associações com ordem de execução
     
2. **Ordem de execução:**
   - Automaticamente definida pela ordem de seleção
   - Inicia em 1, incrementa sequencialmente

3. **Remoção em cascata:**
   - Se pipeline for deletada, todas as associações são removidas
   - Se stage for deletado, associações são removidas

## 🎯 Benefícios

✅ **Organização:** Stages agrupados por categoria funcional
✅ **Flexibilidade:** Pode escolher quais grupos usar
✅ **Reutilização:** Mesmos stages podem ser usados em múltiplas pipelines
✅ **Rastreabilidade:** Histórico de associações por grupo
✅ **UX Intuitiva:** Wizard guiado passo a passo
✅ **Validação:** Campos obrigatórios com feedback claro

## 📊 Estatísticas de Uso

- Total de etapas: **7** (1 definição + 6 grupos)
- Campos de definição: **13**
- Grupos de stages: **6**
- Tabelas associativas: **6**
- Endpoints novos: **3**

## 🚀 Como Usar

### 1. Acessar Pipeline Database
```
http://localhost:5173/pipelines
```

### 2. Criar Nova Pipeline
- Clique no botão "Novo Pipeline"
- Preencha as definições básicas
- Navegue pelas etapas selecionando stages
- Finalize clicando em "Criar Pipeline"

### 3. Editar Pipeline Existente
- Clique no ícone de editar (✏️) na tabela
- Wizard abre com dados preenchidos
- Modifique conforme necessário
- Salve as alterações

## ⚠️ Observações Importantes

- **Nome é obrigatório** - validação impede avanço sem nome
- **Stages são opcionais** - pode criar pipeline sem associar stages
- **Ordem importa** - stages são executados na ordem de seleção
- **Dados são preservados** - voltar para etapas anteriores mantém seleções

## 🐛 Troubleshooting

### Stages não aparecem no wizard
- Verifique se existem stages cadastrados: `GET /api/stages`
- Confirme que o backend está rodando
- Verifique console do navegador por erros

### Erro ao salvar associações
- Verifique se as tabelas associativas existem no banco
- Confirme que o script SQL foi executado
- Veja logs do backend: `docker-compose logs app`

### Pipeline criada mas sem stages
- Endpoint de associação pode ter falhado silenciosamente
- Verifique resposta da API no Network tab
- Tente associar stages manualmente via API

## 📚 Arquivos Modificados

```
src/components/pipelines/
  └── PipelineWizard.tsx          ✅ Wizard multi-etapas completo

server/
  └── api.js                       ✅ 3 novos endpoints adicionados

database/
  └── 30-create-pipeline-database.sql  ✅ Já atualizado anteriormente
```

## 🎉 Conclusão

O novo PipelineWizard oferece uma experiência completa e intuitiva para criar e gerenciar pipelines com associações organizadas de stages. A estrutura modular permite fácil manutenção e extensão futura.
