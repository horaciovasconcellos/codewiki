-- Script de melhoria: Adicionar logging de auditoria em todas as APIs
-- Este arquivo documenta as entidades que precisam de logging adicionado

/*
RESUMO DE IMPLEMENTAÇÃO:
=========================

Total de 60 rotas sem logging identificadas.
Apenas tipos-afastamento possui logging completo.

PRIORIDADE ALTA (já possui a função logOperation criada):
1. Colaboradores (3 rotas)
2. Habilidades (3 rotas)
3. Integrador-Projetos (3 rotas)
4. Integrações (3 rotas)
5. Estruturas-Projeto (3 rotas)

PRIORIDADE MÉDIA:
6. Tecnologias (18 rotas)
7. Aplicações (3 rotas)
8. Capacidades-Negocio (3 rotas)

PRIORIDADE BAIXA:
9. Processos-Negocio (3 rotas)
10. SLAs (3 rotas)
11. Runbooks (3 rotas)
12. Azure DevOps Projetos (8 rotas)
13. Configurações (1 rota)
14. Integrações-Execuções (3 rotas)

FUNÇÃO HELPER CRIADA:
----------------------
async function logOperation({
  req,
  operationType,
  entityType,
  entityId,
  statusCode,
  startTime,
  oldValues = null,
  newValues = null,
  errorMessage = null
})

PADRÃO DE IMPLEMENTAÇÃO:
-------------------------
1. Adicionar no início da rota:
   const startTime = Date.now();
   const requestInfo = extractRequestInfo(req);

2. Para UPDATE e DELETE, buscar oldValues antes:
   const [existing] = await pool.query('SELECT * FROM table WHERE id = ?', [id]);
   const oldValues = existing.length > 0 ? mapEntity(existing[0]) : null;

3. Após operação bem-sucedida, chamar logOperation:
   await logOperation({
     req,
     operationType: 'CREATE' | 'UPDATE' | 'DELETE',
     entityType: 'nome_da_entidade',
     entityId: id,
     statusCode: 200 | 201 | 204,
     startTime,
     oldValues,  // para UPDATE e DELETE
     newValues   // para CREATE e UPDATE
   });

NOTA: Devido ao grande volume de mudanças (60 rotas), a implementação deve ser feita
em fases, priorizando as entidades mais críticas primeiro.
*/
