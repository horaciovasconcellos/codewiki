# Status de Logging e Auditoria - Sistema de Auditoria

## ✅ Infraestrutura de Logging

- [x] Tabela `logs_auditoria` criada
- [x] Função `logAuditoria()` implementada  
- [x] Função `extractRequestInfo()` implementada
- [x] Função `logOperation()` helper implementada
- [x] Views de consulta criadas
- [x] Stored Procedure de limpeza criada

## 📊 Status por Entidade

### ✅ COM Logging Implementado

| Entidade | POST | PUT | DELETE | Observação |
|----------|------|-----|--------|------------|
| TiposAfastamento | ✅ | ✅ | ✅ | Logging completo |

### ❌ SEM Logging (PRIORIDADE ALTA)

| Entidade | POST | PUT | DELETE | Endpoints |
|----------|------|-----|--------|-----------|
| Colaboradores | ❌ | ❌ | ❌ | `/api/colaboradores` |
| Tecnologias | ❌ | ❌ | ❌ | `/api/tecnologias` |
| Aplicações | ❌ | ❌ | ❌ | `/api/aplicacoes` |
| Habilidades | ❌ | ❌ | ❌ | `/api/habilidades` |
| CapacidadesNegocio | ❌ | ❌ | ❌ | `/api/capacidades-negocio` |
| ProcessosNegocio | ❌ | ❌ | ❌ | `/api/processos-negocio` |
| SLAs | ❌ | ❌ | ❌ | `/api/slas` |
| Runbooks | ❌ | ❌ | ❌ | `/api/runbooks` |
| IntegradorProjetos | ❌ | ❌ | ❌ | `/api/integrador-projetos` |
| Integracoes | ❌ | ❌ | ❌ | `/api/integracoes` |
| IntegracoesExecucoes | ❌ | ❌ | ❌ | `/api/integracoes-execucoes` |
| EstruturaProjeto | ❌ | ❌ | ❌ | `/api/estruturas-projeto` |
| Configuracoes | ❌ | ❌ | ❌ | `/api/configuracoes/:chave` |

### ❌ SEM Logging (PRIORIDADE MÉDIA)

| Entidade | POST | PUT | DELETE | Endpoints |
|----------|------|-----|--------|-----------|
| TecnologiaResponsaveis | ❌ | ❌ | ❌ | `/api/tecnologias/:id/responsaveis` |
| ContratosTecnologia | ❌ | ❌ | ❌ | `/api/tecnologias/:id/contratos` |
| ContratosAMS | ❌ | ❌ | ❌ | `/api/tecnologias/:id/contratos-ams` |
| CustosSaaS | ❌ | ❌ | ❌ | `/api/tecnologias/:id/custos-saas` |
| ManutencoesSaaS | ❌ | ❌ | ❌ | `/api/tecnologias/:id/manutencoes-saas` |
| AzureDevOpsProjetos | ❌ | ❌ | ❌ | `/api/azure-devops-projetos` |

### ⚠️ Endpoints Azure DevOps (Logging Opcional)

| Endpoint | Método | Logging | Observação |
|----------|--------|---------|------------|
| `/api/azure-devops/setup-project` | POST | ❌ | Logging interno no service |
| `/api/azure-devops/create-project` | POST | ❌ | Logging interno no service |
| `/api/azure-devops/create-team` | POST | ❌ | Logging interno no service |
| `/api/azure-devops/create-iterations` | POST | ❌ | Logging interno no service |
| `/api/azure-devops/configure-board` | POST | ❌ | Logging interno no service |

## 📋 Totais

- **Total de endpoints mutáveis**: 63 (POST/PUT/DELETE)
- **Com logging completo**: 3 (TiposAfastamento)
- **Sem logging**: 60
- **Taxa de cobertura**: 4.8%

## 🎯 Plano de Ação

### Fase 1 - CRÍTICO (Dados Principais)
1. ✅ Colaboradores (3 endpoints)
2. ✅ Tecnologias (3 endpoints)
3. ✅ Aplicações (3 endpoints)
4. ✅ Integrações (3 endpoints)
5. ✅ Integrações Execuções (3 endpoints)

**Total Fase 1**: 15 endpoints

### Fase 2 - ALTO (Gestão de Negócio)
1. ✅ Habilidades (3 endpoints)
2. ✅ Capacidades Negócio (3 endpoints)
3. ✅ Processos Negócio (3 endpoints)
4. ✅ SLAs (3 endpoints)
5. ✅ Runbooks (3 endpoints)

**Total Fase 2**: 15 endpoints

### Fase 3 - MÉDIO (Relacionamentos)
1. ✅ Tecnologia - Responsáveis (3 endpoints)
2. ✅ Tecnologia - Contratos (3 endpoints)
3. ✅ Tecnologia - Contratos AMS (3 endpoints)
4. ✅ Tecnologia - Custos SaaS (3 endpoints)
5. ✅ Tecnologia - Manutenções SaaS (3 endpoints)

**Total Fase 3**: 15 endpoints

### Fase 4 - BAIXO (Infraestrutura)
1. ✅ Estruturas Projeto (3 endpoints)
2. ✅ Integrador Projetos (3 endpoints)
3. ✅ Azure DevOps Projetos (3 endpoints)
4. ✅ Configurações (1 endpoint)

**Total Fase 4**: 10 endpoints

## 🔧 Template de Implementação

```javascript
// POST - CREATE
app.post('/api/entidade', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // ... validações ...
    
    const id = uuidv4();
    // ... insert no banco ...
    
    // Log de sucesso
    await logAuditoria({
      ...requestInfo,
      operationType: 'CREATE',
      entityType: 'Entidade',
      entityId: id,
      method: 'POST',
      route: '/api/entidade',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: req.body
    });
    
    res.status(201).json(created);
  } catch (error) {
    // Log de erro
    await logAuditoria({
      ...requestInfo,
      operationType: 'CREATE',
      entityType: 'Entidade',
      method: 'POST',
      route: '/api/entidade',
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao criar' });
  }
});

// PUT - UPDATE
app.put('/api/entidade/:id', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Buscar valores antigos
    const [existing] = await pool.query('SELECT * FROM entidade WHERE id = ?', [req.params.id]);
    
    // ... update no banco ...
    
    // Log de sucesso
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'Entidade',
      entityId: req.params.id,
      method: 'PUT',
      route: '/api/entidade/:id',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload: req.body,
      oldValues: existing[0],
      newValues: req.body
    });
    
    res.json(updated);
  } catch (error) {
    // Log de erro
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'Entidade',
      entityId: req.params.id,
      method: 'PUT',
      route: '/api/entidade/:id',
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// DELETE
app.delete('/api/entidade/:id', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Buscar valores antes de deletar
    const [existing] = await pool.query('SELECT * FROM entidade WHERE id = ?', [req.params.id]);
    
    // ... delete no banco ...
    
    // Log de sucesso
    await logAuditoria({
      ...requestInfo,
      operationType: 'DELETE',
      entityType: 'Entidade',
      entityId: req.params.id,
      method: 'DELETE',
      route: '/api/entidade/:id',
      statusCode: 204,
      durationMs: Date.now() - startTime,
      oldValues: existing[0]
    });
    
    res.status(204).send();
  } catch (error) {
    // Log de erro
    await logAuditoria({
      ...requestInfo,
      operationType: 'DELETE',
      entityType: 'Entidade',
      entityId: req.params.id,
      method: 'DELETE',
      route: '/api/entidade/:id',
      statusCode: 500,
      durationMs: Date.now() - startTime,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});
```

## 📈 Benefícios do Logging

1. **Auditoria Completa**: Rastreamento de todas as mudanças
2. **Troubleshooting**: Identificação rápida de problemas
3. **Performance**: Métricas de tempo de resposta
4. **Segurança**: Rastreamento de ações por usuário
5. **Compliance**: Atendimento a requisitos regulatórios
6. **Analytics**: Dados para análise de uso

## 🔍 Consultas Úteis

```sql
-- Últimas 50 operações
SELECT * FROM logs_auditoria ORDER BY log_timestamp DESC LIMIT 50;

-- Operações de um usuário
SELECT * FROM logs_auditoria WHERE user_login = 'usuario' ORDER BY log_timestamp DESC;

-- Erros recentes
SELECT * FROM v_logs_erro LIMIT 50;

-- Performance por rota
SELECT * FROM v_logs_performance;

-- Atividade da última hora
SELECT * FROM v_logs_atividade_recente;

-- Mudanças em uma entidade específica
SELECT * FROM logs_auditoria 
WHERE entity_type = 'Tecnologia' AND entity_id = 'abc-123'
ORDER BY log_timestamp DESC;
```

---

**Última Atualização**: 6 de dezembro de 2025
**Status**: ⚠️ Implementação em andamento - 4.8% completo
