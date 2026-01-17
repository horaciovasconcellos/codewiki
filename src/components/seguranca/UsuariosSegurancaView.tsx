import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash, Eye, EyeSlash, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UsuarioSeguranca {
  id: string;
  login: string;
  data_vigencia_inicial: string;
  data_vigencia_termino: string | null;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO' | 'AGUARDANDO_ATIVACAO';
  created_at: string;
  updated_at: string;
}

interface FormData {
  login: string;
  password: string;
  data_vigencia_termino: string;
  status: string;
}

export function UsuariosSegurancaView() {
  const [usuarios, setUsuarios] = useState<UsuarioSeguranca[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioSeguranca | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    login: '',
    password: '',
    data_vigencia_termino: '',
    status: 'ATIVO'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios-seguranca`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        toast.error(`Erro ao carregar usuários: ${errorData.details || errorData.error || 'Erro desconhecido'}`);
        
        // Se for erro de tabela não existir, mostrar mensagem específica
        if (errorData.code === 'ER_NO_SUCH_TABLE') {
          toast.error('Tabela não encontrada. Execute o script de migração.');
        }
        return;
      }
      
      const data = await response.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    }
  };

  const handleCreate = () => {
    setEditingUsuario(null);
    setFormData({
      login: '',
      password: '',
      data_vigencia_termino: '',
      status: 'ATIVO'
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (usuario: UsuarioSeguranca) => {
    setEditingUsuario(usuario);
    setFormData({
      login: usuario.login,
      password: '', // Nunca mostrar senha existente
      data_vigencia_termino: usuario.data_vigencia_termino ? usuario.data_vigencia_termino.split('T')[0] : '',
      status: usuario.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const response = await fetch(`${API_URL}/api/usuarios-seguranca/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Usuário excluído com sucesso');
        loadUsuarios();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.login.trim()) {
      toast.error('Login é obrigatório');
      return;
    }

    if (!editingUsuario && !formData.password.trim()) {
      toast.error('Senha é obrigatória para novo usuário');
      return;
    }

    try {
      const method = editingUsuario ? 'PUT' : 'POST';
      const url = editingUsuario 
        ? `${API_URL}/api/usuarios-seguranca/${editingUsuario.id}`
        : `${API_URL}/api/usuarios-seguranca`;

      const body: any = {
        login: formData.login,
        data_vigencia_termino: formData.data_vigencia_termino || null,
        status: formData.status,
        [editingUsuario ? 'updated_by' : 'created_by']: 'admin' // TODO: pegar do usuário logado
      };

      // Só enviar senha se foi preenchida
      if (formData.password.trim()) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingUsuario ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
        setIsDialogOpen(false);
        loadUsuarios();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ATIVO: 'bg-green-100 text-green-800',
      INATIVO: 'bg-gray-100 text-gray-800',
      BLOQUEADO: 'bg-red-100 text-red-800',
      AGUARDANDO_ATIVACAO: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários de Segurança</CardTitle>
              <CardDescription>
                Gerenciamento de usuários do sistema de segurança
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por login..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login</TableHead>
                  <TableHead>Vigência Inicial</TableHead>
                  <TableHead>Vigência Término</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado Em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.login}</TableCell>
                      <TableCell>{formatDate(usuario.data_vigencia_inicial)}</TableCell>
                      <TableCell>{usuario.data_vigencia_termino ? formatDate(usuario.data_vigencia_termino) : 'Indefinido'}</TableCell>
                      <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                      <TableCell>{formatDate(usuario.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(usuario.id)}
                            title="Excluir"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUsuario 
                ? 'Atualize as informações do usuário' 
                : 'Preencha os dados do novo usuário. A data de vigência inicial será a data atual.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login *</Label>
              <Input
                id="login"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                placeholder="Digite o login"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha {!editingUsuario && '*'}
                {editingUsuario && ' (deixe em branco para manter)'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUsuario ? 'Nova senha (opcional)' : 'Digite a senha'}
                  required={!editingUsuario}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                A senha será criptografada com SHA-256 usando o SALT do sistema
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vigencia_termino">Data Vigência Término</Label>
              <Input
                id="data_vigencia_termino"
                type="date"
                value={formData.data_vigencia_termino}
                onChange={(e) => setFormData({ ...formData, data_vigencia_termino: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para vigência indefinida
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                  <SelectItem value="AGUARDANDO_ATIVACAO">Aguardando Ativação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingUsuario ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
