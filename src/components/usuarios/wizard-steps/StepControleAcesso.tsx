import { useState, useEffect } from 'react';
import { PermissoesPorSetor, PermissaoTela, TELAS_SISTEMA, RoleSistema } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Plus, Trash, Info } from '@phosphor-icons/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface StepControleAcessoProps {
  role: RoleSistema;
  colaboradorSetor?: string;
  permissoesPorSetor: PermissoesPorSetor[];
  setPermissoesPorSetor: (value: PermissoesPorSetor[]) => void;
}

export function StepControleAcesso({
  role,
  colaboradorSetor,
  permissoesPorSetor,
  setPermissoesPorSetor
}: StepControleAcessoProps) {
  const [setorAtual, setSetorAtual] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  // Inicializar automaticamente com o setor do colaborador (apenas uma vez)
  useEffect(() => {
    if (colaboradorSetor && permissoesPorSetor.length === 0 && role !== 'Administrador') {
      // Criar permissões padrão baseadas no role para o setor do colaborador
      const permissoesPadrao: PermissaoTela[] = TELAS_SISTEMA.map(tela => ({
        tela: tela.id,
        create: role === 'Back-office',
        read: true, // Todos podem ler
        update: role === 'Back-office',
        delete: false // Delete sempre false por padrão
      }));

      setPermissoesPorSetor([{
        setor: colaboradorSetor,
        permissoes: permissoesPadrao
      }]);
    }
  }, [colaboradorSetor, role]); // Executar apenas quando colaboradorSetor ou role mudar

  // Se for Administrador, não precisa configurar permissões
  if (role === 'Administrador') {
    return (
      <div className="space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" weight="fill" />
          <AlertDescription>
            <strong>Perfil Administrador:</strong> Este usuário terá acesso total (*) a todas as telas e operações do sistema.
            Não é necessário configurar permissões individuais.
          </AlertDescription>
        </Alert>

        <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={32} weight="fill" className="text-green-600" />
            <h3 className="text-lg font-bold text-green-900">Permissões Administrativas</h3>
          </div>
          <p className="text-green-800">
            Acesso completo a todas as {TELAS_SISTEMA.length} telas do sistema com permissões de:
          </p>
          <ul className="mt-2 space-y-1 text-green-800">
            <li>✓ Criar (Create)</li>
            <li>✓ Consultar (Read)</li>
            <li>✓ Atualizar (Update)</li>
            <li>✓ Excluir (Delete)</li>
          </ul>
        </div>
      </div>
    );
  }

  // Adicionar novo setor
  const handleAdicionarSetor = () => {
    if (!setorAtual.trim()) {
      return;
    }

    // Verificar se já existe
    if (permissoesPorSetor.some(p => p.setor === setorAtual)) {
      return;
    }

    // Criar permissões padrão baseadas no role
    const permissoesPadrao: PermissaoTela[] = TELAS_SISTEMA.map(tela => ({
      tela: tela.id,
      create: role === 'Back-office',
      read: true, // Todos podem ler
      update: role === 'Back-office',
      delete: false // Delete sempre false por padrão
    }));

    setPermissoesPorSetor([
      ...permissoesPorSetor,
      {
        setor: setorAtual,
        permissoes: permissoesPadrao
      }
    ]);

    setSetorAtual('');
  };

  // Remover setor
  const handleRemoverSetor = (setor: string) => {
    setPermissoesPorSetor(permissoesPorSetor.filter(p => p.setor !== setor));
  };

  // Atualizar permissão de uma tela específica em um setor
  const handleTogglePermissao = (
    setor: string,
    telaId: string,
    acao: keyof Omit<PermissaoTela, 'tela'>
  ) => {
    setPermissoesPorSetor(
      permissoesPorSetor.map(ps => {
        if (ps.setor === setor) {
          return {
            ...ps,
            permissoes: ps.permissoes.map(perm => {
              if (perm.tela === telaId) {
                return {
                  ...perm,
                  [acao]: !perm[acao]
                };
              }
              return perm;
            })
          };
        }
        return ps;
      })
    );
  };

  // Marcar/desmarcar todos de uma categoria
  const handleToggleCategoria = (setor: string, categoria: string, acao: keyof Omit<PermissaoTela, 'tela'>, valor: boolean) => {
    const telasDaCategoria = TELAS_SISTEMA.filter(t => t.categoria === categoria);
    
    setPermissoesPorSetor(
      permissoesPorSetor.map(ps => {
        if (ps.setor === setor) {
          return {
            ...ps,
            permissoes: ps.permissoes.map(perm => {
              if (telasDaCategoria.some(t => t.id === perm.tela)) {
                return {
                  ...perm,
                  [acao]: valor
                };
              }
              return perm;
            })
          };
        }
        return ps;
      })
    );
  };

  // Agrupar telas por categoria
  const categorias = Array.from(new Set(TELAS_SISTEMA.map(t => t.categoria)));
  const telasPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = TELAS_SISTEMA.filter(t => t.categoria === cat);
    return acc;
  }, {} as Record<string, typeof TELAS_SISTEMA>);

  // Sugerir setor do colaborador
  useEffect(() => {
    if (colaboradorSetor && permissoesPorSetor.length === 0) {
      setSetorAtual(colaboradorSetor);
    }
  }, [colaboradorSetor]);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure as permissões de acesso por setor. Use o setor do colaborador ({colaboradorSetor}) 
          para organização hierárquica, e selecione as telas e operações permitidas (Create, Read, Update, Delete).
        </AlertDescription>
      </Alert>

      {/* Adicionar Setor */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Setor</CardTitle>
          <CardDescription>
            Configure permissões para um setor específico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do setor (ex: TI, Financeiro, RH)"
              value={setorAtual}
              onChange={(e) => setSetorAtual(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdicionarSetor()}
            />
            <Button onClick={handleAdicionarSetor} disabled={!setorAtual.trim()}>
              <Plus className="mr-2" />
              Adicionar
            </Button>
          </div>
          {colaboradorSetor && (
            <p className="text-sm text-muted-foreground mt-2">
              Sugestão: {colaboradorSetor}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Setores Configurados */}
      {permissoesPorSetor.length === 0 ? (
        <div className="p-8 border-2 border-dashed rounded-lg text-center">
          <ShieldCheck size={48} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Nenhum setor configurado. Adicione um setor para definir permissões.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {permissoesPorSetor.map((ps) => {
            const totalPermitidas = ps.permissoes.filter(p => p.read || p.create || p.update || p.delete).length;
            
            return (
              <Card key={ps.setor}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{ps.setor}</CardTitle>
                      <CardDescription>
                        {totalPermitidas} de {TELAS_SISTEMA.length} telas com permissões
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoverSetor(ps.setor)}
                    >
                      <Trash className="mr-2" />
                      Remover
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filtro por categoria */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge
                      variant={filtroCategoria === 'todas' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFiltroCategoria('todas')}
                    >
                      Todas
                    </Badge>
                    {categorias.map(cat => (
                      <Badge
                        key={cat}
                        variant={filtroCategoria === cat ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setFiltroCategoria(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  {/* Accordion por Categoria */}
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(telasPorCategoria)
                      .filter(([cat]) => filtroCategoria === 'todas' || filtroCategoria === cat)
                      .map(([categoria, telas]) => {
                        const permissoesCategoria = ps.permissoes.filter(p => 
                          telas.some(t => t.id === p.tela)
                        );
                        const todasCreate = permissoesCategoria.every(p => p.create);
                        const todasRead = permissoesCategoria.every(p => p.read);
                        const todasUpdate = permissoesCategoria.every(p => p.update);
                        const todasDelete = permissoesCategoria.every(p => p.delete);

                        return (
                          <AccordionItem key={categoria} value={categoria}>
                            <AccordionTrigger>
                              <div className="flex items-center justify-between w-full pr-4">
                                <span>{categoria} ({telas.length} telas)</span>
                                <div className="flex gap-2">
                                  {todasRead && <Badge variant="secondary">Read</Badge>}
                                  {todasCreate && <Badge variant="secondary">Create</Badge>}
                                  {todasUpdate && <Badge variant="secondary">Update</Badge>}
                                  {todasDelete && <Badge variant="secondary">Delete</Badge>}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {/* Ações em lote para categoria */}
                              <div className="mb-4 p-3 bg-muted rounded-md">
                                <p className="text-sm font-semibold mb-2">Marcar todos nesta categoria:</p>
                                <div className="flex gap-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleCategoria(ps.setor, categoria, 'create', !todasCreate)}
                                  >
                                    {todasCreate ? 'Desmarcar' : 'Marcar'} Create
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleCategoria(ps.setor, categoria, 'read', !todasRead)}
                                  >
                                    {todasRead ? 'Desmarcar' : 'Marcar'} Read
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleCategoria(ps.setor, categoria, 'update', !todasUpdate)}
                                  >
                                    {todasUpdate ? 'Desmarcar' : 'Marcar'} Update
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleCategoria(ps.setor, categoria, 'delete', !todasDelete)}
                                  >
                                    {todasDelete ? 'Desmarcar' : 'Marcar'} Delete
                                  </Button>
                                </div>
                              </div>

                              {/* Lista de telas */}
                              <div className="space-y-2">
                                {telas.map(tela => {
                                  const permissao = ps.permissoes.find(p => p.tela === tela.id);
                                  if (!permissao) return null;

                                  return (
                                    <div key={tela.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                                      <span className="font-medium">{tela.nome}</span>
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${ps.setor}-${tela.id}-create`}
                                            checked={permissao.create}
                                            onCheckedChange={() => handleTogglePermissao(ps.setor, tela.id, 'create')}
                                          />
                                          <Label htmlFor={`${ps.setor}-${tela.id}-create`} className="cursor-pointer">
                                            Create
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${ps.setor}-${tela.id}-read`}
                                            checked={permissao.read}
                                            onCheckedChange={() => handleTogglePermissao(ps.setor, tela.id, 'read')}
                                          />
                                          <Label htmlFor={`${ps.setor}-${tela.id}-read`} className="cursor-pointer">
                                            Read
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${ps.setor}-${tela.id}-update`}
                                            checked={permissao.update}
                                            onCheckedChange={() => handleTogglePermissao(ps.setor, tela.id, 'update')}
                                          />
                                          <Label htmlFor={`${ps.setor}-${tela.id}-update`} className="cursor-pointer">
                                            Update
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${ps.setor}-${tela.id}-delete`}
                                            checked={permissao.delete}
                                            onCheckedChange={() => handleTogglePermissao(ps.setor, tela.id, 'delete')}
                                          />
                                          <Label htmlFor={`${ps.setor}-${tela.id}-delete`} className="cursor-pointer">
                                            Delete
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
