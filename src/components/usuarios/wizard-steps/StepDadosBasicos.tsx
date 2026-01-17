import { Colaborador, Usuario, RoleSistema } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ShieldCheck } from '@phosphor-icons/react';

interface StepDadosBasicosProps {
  colaboradorId: string;
  setColaboradorId: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  senha: string;
  setSenha: (value: string) => void;
  role: RoleSistema;
  setRole: (value: RoleSistema) => void;
  ativo: boolean;
  setAtivo: (value: boolean) => void;
  colaboradores: Colaborador[];
  usuarios: Usuario[];
  isEditing: boolean;
}

export function StepDadosBasicos({
  colaboradorId,
  setColaboradorId,
  email,
  setEmail,
  senha,
  setSenha,
  role,
  setRole,
  ativo,
  setAtivo,
  colaboradores,
  usuarios,
  isEditing
}: StepDadosBasicosProps) {
  // Filtrar colaboradores que não têm usuário ainda (exceto o atual em edição)
  const colaboradoresDisponiveis = colaboradores.filter(
    c => !usuarios.some(u => u.colaboradorId === c.id && u.id !== colaboradorId)
  );

  const colaboradorSelecionado = colaboradores.find(c => c.id === colaboradorId);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {isEditing 
            ? 'Para alterar o colaborador ou função do usuário, é necessário excluí-lo e criar um novo.' 
            : 'Cada usuário deve estar associado a um colaborador cadastrado no sistema.'}
        </AlertDescription>
      </Alert>

      {/* Email - PRIMEIRO CAMPO */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Email será usado para login no sistema
        </p>
      </div>

      {/* Seleção de Colaborador - SEGUNDO CAMPO */}
      <div className="space-y-2">
        <Label htmlFor="colaborador">
          Colaborador <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={colaboradorId} 
          onValueChange={setColaboradorId}
          disabled={isEditing}
        >
          <SelectTrigger id="colaborador" disabled={isEditing}>
            <SelectValue placeholder="Selecione um colaborador" />
          </SelectTrigger>
          <SelectContent>
            {colaboradoresDisponiveis.map(colaborador => (
              <SelectItem key={colaborador.id} value={colaborador.id}>
                {colaborador.nome} - {colaborador.matricula} ({colaborador.setor})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isEditing && (
          <p className="text-sm text-red-600 font-medium">
            🔒 Colaborador não pode ser alterado. Para trocar, exclua e recrie o usuário.
          </p>
        )}
        {!isEditing && colaboradoresDisponiveis.length === 0 && (
          <p className="text-sm text-red-500">
            Todos os colaboradores já possuem usuários cadastrados
          </p>
        )}
      </div>

      {/* Informações do Colaborador Selecionado */}
      {colaboradorSelecionado && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold">Dados do Colaborador</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{colaboradorSelecionado.nome}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Matrícula:</span>
              <p className="font-medium">{colaboradorSelecionado.matricula}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Setor:</span>
              <p className="font-medium">{colaboradorSelecionado.setor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Data Admissão:</span>
              <p className="font-medium">{new Date(colaboradorSelecionado.dataAdmissao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Senha - TERCEIRO CAMPO */}
      <div className="space-y-2">
        <Label htmlFor="senha">
          {isEditing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'} 
          {!isEditing && <span className="text-red-500"> *</span>}
        </Label>
        <Input
          id="senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Mínimo de 6 caracteres
        </p>
      </div>

      {/* Role - QUARTO CAMPO */}
      <div className="space-y-2">
        <Label htmlFor="role">
          Função (Role) <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={role} 
          onValueChange={(value) => setRole(value as RoleSistema)}
          disabled={isEditing}
        >
          <SelectTrigger id="role" disabled={isEditing}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administrador">
              <div className="flex items-center gap-2">
                <ShieldCheck weight="fill" className="text-red-500" />
                <span>Administrador (Acesso Total)</span>
              </div>
            </SelectItem>
            <SelectItem value="Back-office">
              <div className="flex items-center gap-2">
                <ShieldCheck weight="fill" className="text-orange-500" />
                <span>Back-office</span>
              </div>
            </SelectItem>
            <SelectItem value="Usuário">
              <div className="flex items-center gap-2">
                <ShieldCheck weight="fill" className="text-blue-500" />
                <span>Usuário</span>
              </div>
            </SelectItem>
            <SelectItem value="Consulta">
              <div className="flex items-center gap-2">
                <ShieldCheck weight="fill" className="text-gray-500" />
                <span>Consulta (Somente Leitura)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {isEditing && (
          <p className="text-sm text-red-600 font-medium">
            🔒 Função não pode ser alterada. Para trocar, exclua e recrie o usuário.
          </p>
        )}
        
        {/* Descrição das Roles */}
        {!isEditing && (
        <div className="p-3 bg-muted rounded-md text-sm space-y-2">
          <p><strong>Administrador:</strong> Acesso total a todas as telas e operações (*)</p>
          <p><strong>Back-office:</strong> Acesso amplo a funcionalidades operacionais</p>
          <p><strong>Usuário:</strong> Acesso padrão com permissões configuráveis por setor</p>
          <p><strong>Consulta:</strong> Apenas visualização, sem permissões de edição</p>
        </div>
        )}
      </div>

      {/* Status Ativo */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="ativo">Usuário Ativo</Label>
          <p className="text-sm text-muted-foreground">
            Usuários inativos não podem fazer login no sistema
          </p>
        </div>
        <Switch
          id="ativo"
          checked={ativo}
          onCheckedChange={setAtivo}
        />
      </div>
    </div>
  );
}
