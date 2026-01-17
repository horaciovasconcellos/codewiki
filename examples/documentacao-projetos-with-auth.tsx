/**
 * Exemplo de integração do sistema de controle de acesso
 * com a tela de Documentação de Projetos
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/usePermissions';
import { 
  RequirePermission, 
  CanCreate, 
  CanUpdate, 
  CanDelete,
  ImpersonationAlert 
} from '@/components/auth/ProtectedContent';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, Printer, Shield } from 'lucide-react';

export function DocumentacaoProjetosViewWithAuth() {
  const { 
    user, 
    canCreate, 
    canRead, 
    canUpdate, 
    canDelete,
    hasPermission,
    hasRole,
    impersonate,
    token
  } = useAuth();

  const [docs, setDocs] = useState([]);

  // =====================================================
  // FUNÇÕES COM VERIFICAÇÃO DE PERMISSÃO
  // =====================================================

  const handleCreate = async () => {
    if (!canCreate('documentacao-projetos')) {
      alert('Você não tem permissão para criar documentos');
      return;
    }

    // Lógica de criação com token de autenticação
    const response = await fetch('http://localhost:3000/api/documentacao-projetos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titulo: 'Novo Documento',
        categoria: 'Arquitetura',
        // ... outros campos
      })
    });

    if (response.ok) {
      const newDoc = await response.json();
      setDocs([...docs, newDoc]);
    } else if (response.status === 403) {
      alert('Permissão negada!');
    }
  };

  const handleUpdate = async (docId: number) => {
    if (!canUpdate('documentacao-projetos')) {
      alert('Você não tem permissão para atualizar documentos');
      return;
    }

    const response = await fetch(`http://localhost:3000/api/documentacao-projetos/${docId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titulo: 'Documento Atualizado',
        // ... outros campos
      })
    });

    if (response.ok) {
      // Atualizar lista
      loadDocs();
    }
  };

  const handleDelete = async (docId: number) => {
    if (!canDelete('documentacao-projetos')) {
      alert('Você não tem permissão para excluir documentos');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir?')) return;

    const response = await fetch(`http://localhost:3000/api/documentacao-projetos/${docId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      setDocs(docs.filter(d => d.id !== docId));
    }
  };

  const loadDocs = async () => {
    const response = await fetch('http://localhost:3000/api/documentacao-projetos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setDocs(data);
    }
  };

  // =====================================================
  // FUNCIONALIDADE DE IMPERSONATION (APENAS ADMINS)
  // =====================================================

  const handleImpersonate = async (userId: number) => {
    try {
      await impersonate(userId);
      alert(`Agora você está visualizando como usuário ${userId}`);
      loadDocs(); // Recarregar com permissões do usuário impersonado
    } catch (error) {
      alert('Erro ao iniciar impersonation');
    }
  };

  return (
    <div className="p-6">
      {/* Alerta de Impersonation */}
      <ImpersonationAlert />

      {/* Informações do Usuário */}
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p className="font-semibold">Usuário: {user?.nome}</p>
        <p className="text-sm text-gray-600">
          Roles: {user?.roles.join(', ')}
        </p>
      </div>

      {/* Cabeçalho com Ações */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documentação de Projetos</h1>

        <div className="flex gap-2">
          {/* Botão Criar - Protegido */}
          <CanCreate resource="documentacao-projetos">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Documento
            </Button>
          </CanCreate>

          {/* Impersonation - Apenas Admins */}
          {hasPermission('usuarios.impersonate') && (
            <Button variant="outline" onClick={() => {
              const userId = prompt('ID do usuário para impersonar:');
              if (userId) handleImpersonate(parseInt(userId));
            }}>
              <Shield className="mr-2 h-4 w-4" />
              Impersonar
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Documentos - Protegida */}
      <RequirePermission 
        permission="documentacao-projetos.read"
        showAlert={true}
      >
        <div className="space-y-4">
          {docs.map(doc => (
            <div key={doc.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{doc.titulo}</h3>
                  <p className="text-sm text-gray-600">{doc.categoria}</p>
                </div>

                <div className="flex gap-2">
                  {/* Botão Visualizar - Sempre disponível se tem read */}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Botão Imprimir - Sempre disponível se tem read */}
                  <Button variant="ghost" size="sm">
                    <Printer className="h-4 w-4" />
                  </Button>

                  {/* Botão Editar - Protegido */}
                  <CanUpdate resource="documentacao-projetos">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUpdate(doc.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </CanUpdate>

                  {/* Botão Excluir - Protegido */}
                  <CanDelete resource="documentacao-projetos">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CanDelete>
                </div>
              </div>
            </div>
          ))}
        </div>
      </RequirePermission>

      {/* Seção Administrativa - Apenas para Admins */}
      {hasRole('Super Admin') && (
        <div className="mt-8 p-4 border-2 border-yellow-400 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Área Administrativa</h2>
          <p>Conteúdo visível apenas para Super Admins</p>
          <Button className="mt-2">
            Configurações Avançadas
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Backend Endpoint Correspondente
 * server/routes/documentacaoProjetosRoutes.js
 */

// Exemplo de endpoint protegido
/*
const { authenticate, authorize, auditResponse } = require('../middleware/authMiddleware');

// GET - Listar documentos (apenas leitura)
router.get('/documentacao-projetos',
  authenticate,
  authorize('documentacao-projetos.read'),
  auditResponse('list_documentation'),
  async (req, res) => {
    try {
      const [docs] = await pool.query(
        `SELECT 
          id, titulo, descricao, categoria, status, versao,
          autor, aplicacao, tags, created_by, updated_by,
          created_at, updated_at
         FROM documentacao_projetos
         WHERE ativo = TRUE
         ORDER BY updated_at DESC`
      );

      res.json(docs);
    } catch (error) {
      console.error('Erro ao listar documentação:', error);
      res.status(500).json({ error: 'Erro ao listar documentação' });
    }
  }
);

// POST - Criar documento (requer permissão de criação)
router.post('/documentacao-projetos',
  authenticate,
  authorize('documentacao-projetos.create'),
  auditResponse('create_documentation'),
  async (req, res) => {
    try {
      const { titulo, descricao, categoria, conteudo, status, versao, aplicacao, tags } = req.body;
      
      // Validações
      if (!titulo || !categoria || !conteudo) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: titulo, categoria, conteudo' 
        });
      }

      // Inserir com tracking de quem criou
      const [result] = await pool.query(
        `INSERT INTO documentacao_projetos 
         (titulo, descricao, categoria, conteudo, status, versao, autor, aplicacao, tags, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          titulo,
          descricao,
          categoria,
          conteudo,
          status || 'Rascunho',
          versao || '1.0.0',
          req.user.nome, // Nome do usuário autenticado
          aplicacao,
          tags,
          req.user.id,   // ID do criador
          req.user.id
        ]
      );

      // Trigger de auditoria irá registrar automaticamente a criação

      res.status(201).json({
        success: true,
        id: result.insertId,
        message: 'Documento criado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar documentação:', error);
      res.status(500).json({ 
        error: 'Erro ao criar documentação',
        details: error.message 
      });
    }
  }
);

// PUT - Atualizar documento (requer permissão de atualização)
router.put('/documentacao-projetos/:id',
  authenticate,
  authorize('documentacao-projetos.update'),
  auditResponse('update_documentation'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, descricao, categoria, conteudo, status, versao, aplicacao, tags } = req.body;

      // Verificar se documento existe
      const [existing] = await pool.query(
        'SELECT id FROM documentacao_projetos WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      // Atualizar com tracking de quem atualizou
      await pool.query(
        `UPDATE documentacao_projetos 
         SET titulo = ?, descricao = ?, categoria = ?, conteudo = ?,
             status = ?, versao = ?, aplicacao = ?, tags = ?,
             updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [titulo, descricao, categoria, conteudo, status, versao, aplicacao, tags, req.user.id, id]
      );

      // Trigger de auditoria irá registrar automaticamente as mudanças

      res.json({
        success: true,
        message: 'Documento atualizado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao atualizar documentação:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar documentação',
        details: error.message 
      });
    }
  }
);

// DELETE - Excluir documento (requer permissão de exclusão)
router.delete('/documentacao-projetos/:id',
  authenticate,
  authorize('documentacao-projetos.delete'),
  auditResponse('delete_documentation'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se documento existe
      const [existing] = await pool.query(
        'SELECT id FROM documentacao_projetos WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      // Soft delete ou hard delete dependendo da política
      await pool.query(
        'DELETE FROM documentacao_projetos WHERE id = ?',
        [id]
      );

      // Trigger de auditoria irá registrar automaticamente a exclusão

      res.json({
        success: true,
        message: 'Documento excluído com sucesso'
      });

    } catch (error) {
      console.error('Erro ao excluir documentação:', error);
      res.status(500).json({ 
        error: 'Erro ao excluir documentação',
        details: error.message 
      });
    }
  }
);
*/
