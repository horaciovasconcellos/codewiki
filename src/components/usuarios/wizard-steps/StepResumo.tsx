import { PermissoesPorSetor, RoleSistema, TELAS_SISTEMA } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShieldCheck, 
  User, 
  Envelope, 
  Buildings, 
  CheckCircle, 
  XCircle,
  Info
} from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StepResumoProps {
  colaboradorNome?: string;
  colaboradorMatricula?: string;
  colaboradorSetor?: string;
  email: string;
  role: RoleSistema;
  ativo: boolean;
  permissoesPorSetor: PermissoesPorSetor[];
}

export function StepResumo({
  colaboradorNome,
  colaboradorMatricula,
  colaboradorSetor,
  email,
  role,
  ativo,
  permissoesPorSetor
}: StepResumoProps) {
  const getRoleBadgeColor = (role: RoleSistema) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-500';
      case 'Back-office':
        return 'bg-blue-500';
      case 'Usuário':
        return 'bg-green-500';
      case 'Consulta':
        return 'bg-gray-500';
    }
  };

  const contarPermissoes = () => {
    let total = 0;
    let comPermissao = 0;

    permissoesPorSetor.forEach(ps => {
      ps.permissoes.forEach(perm => {
        total++;
        if (perm.create || perm.read || perm.update || perm.delete) {
          comPermissao++;
        }
      });
    });

    return { total, comPermissao };
  };

  const { total, comPermissao } = contarPermissoes();

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Revise todas as informações antes de salvar. Após a criação, o usuário poderá fazer login com o email e senha configurados.
        </AlertDescription>
      </Alert>

      {/* Dados do Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User weight="fill" />
            Dados do Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium">{colaboradorNome || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Matrícula</p>
            <p className="font-medium">{colaboradorMatricula || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Setor</p>
            <p className="font-medium">{colaboradorSetor || 'Não informado'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Envelope weight="fill" />
            Dados de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Perfil de Acesso</p>
            <Badge className={getRoleBadgeColor(role)}>
              <ShieldCheck className="mr-1" weight="fill" />
              {role}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              {ativo ? (
                <>
                  <CheckCircle weight="fill" className="text-green-500" />
                  <span className="font-medium text-green-700">Ativo</span>
                </>
              ) : (
                <>
                  <XCircle weight="fill" className="text-red-500" />
                  <span className="font-medium text-red-700">Inativo</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissões Configuradas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Buildings weight="fill" />
            Permissões Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {role === 'Administrador' ? (
            <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={24} weight="fill" className="text-green-600" />
                <h4 className="font-bold text-green-900">Acesso Total</h4>
              </div>
              <p className="text-green-800">
                Perfil Administrador possui acesso completo (*) a todas as {TELAS_SISTEMA.length} telas do sistema
                com permissões ilimitadas.
              </p>
            </div>
          ) : permissoesPorSetor.length === 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                Nenhum setor configurado. Este usuário não terá acesso a nenhuma tela do sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {permissoesPorSetor.length} setor(es) configurado(s)
                </span>
                <span className="text-sm text-muted-foreground">
                  {comPermissao} de {total} permissões atribuídas
                </span>
              </div>

              {permissoesPorSetor.map(ps => {
                const permissoesAtivas = ps.permissoes.filter(
                  p => p.create || p.read || p.update || p.delete
                );
                const totalCreate = permissoesAtivas.filter(p => p.create).length;
                const totalRead = permissoesAtivas.filter(p => p.read).length;
                const totalUpdate = permissoesAtivas.filter(p => p.update).length;
                const totalDelete = permissoesAtivas.filter(p => p.delete).length;

                return (
                  <div key={ps.setor} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3">
                      <h4 className="font-semibold">{ps.setor}</h4>
                      <div className="flex gap-2 mt-2">
                        {totalCreate > 0 && (
                          <Badge variant="secondary">Create: {totalCreate}</Badge>
                        )}
                        {totalRead > 0 && (
                          <Badge variant="secondary">Read: {totalRead}</Badge>
                        )}
                        {totalUpdate > 0 && (
                          <Badge variant="secondary">Update: {totalUpdate}</Badge>
                        )}
                        {totalDelete > 0 && (
                          <Badge variant="secondary">Delete: {totalDelete}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tela</TableHead>
                            <TableHead className="text-center w-20">C</TableHead>
                            <TableHead className="text-center w-20">R</TableHead>
                            <TableHead className="text-center w-20">U</TableHead>
                            <TableHead className="text-center w-20">D</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissoesAtivas.map(perm => {
                            const tela = TELAS_SISTEMA.find(t => t.id === perm.tela);
                            if (!tela) return null;

                            return (
                              <TableRow key={perm.tela}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{tela.nome}</p>
                                    <p className="text-xs text-muted-foreground">{tela.categoria}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {perm.create ? (
                                    <CheckCircle weight="fill" className="text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle weight="fill" className="text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {perm.read ? (
                                    <CheckCircle weight="fill" className="text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle weight="fill" className="text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {perm.update ? (
                                    <CheckCircle weight="fill" className="text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle weight="fill" className="text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {perm.delete ? (
                                    <CheckCircle weight="fill" className="text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle weight="fill" className="text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso Final */}
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Após salvar, o usuário receberá as credenciais de acesso e poderá fazer login imediatamente.
          As permissões configuradas entrarão em vigor na próxima autenticação.
        </AlertDescription>
      </Alert>
    </div>
  );
}
