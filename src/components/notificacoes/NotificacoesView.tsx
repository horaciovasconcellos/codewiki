import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Envelope, Eye, Trash, DotsThree, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';

interface Notificacao {
  id: string;
  data: string;
  subject: string;
  conteudo: string;
  de: string;
  para: string;
  lida: boolean;
  aplicacaoId?: string;
  aplicacaoSigla?: string;
  email?: string;
}

export function NotificacoesView() {
  const { logClick, logEvent, logError } = useLogging('notificacoes-view');
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotificacao, setSelectedNotificacao] = useState<Notificacao | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificacaoToDelete, setNotificacaoToDelete] = useState<Notificacao | null>(null);

  useEffect(() => {
    loadNotificacoes();
  }, []);

  const loadNotificacoes = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch('/api/notificacoes');
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data);
      } else {
        toast.error('Erro ao carregar notificações');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (notificacao: Notificacao) => {
    setSelectedNotificacao(notificacao);
    setViewDialogOpen(true);
    
    // Marcar como lida
    if (!notificacao.lida) {
      markAsRead(notificacao.id);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notificacoes/${id}/lida`, {
        method: 'PUT',
      });
      setNotificacoes(notificacoes.map(n => 
        n.id === id ? { ...n, lida: true } : n
      ));
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleDeleteClick = (notificacao: Notificacao) => {
    setNotificacaoToDelete(notificacao);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!notificacaoToDelete) return;

    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`/api/notificacoes/${notificacaoToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotificacoes(notificacoes.filter(n => n.id !== notificacaoToDelete.id));
        toast.success('Notificação deletada com sucesso');
      } else {
        toast.error('Erro ao deletar notificação');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao deletar notificação');
    } finally {
      setDeleteDialogOpen(false);
      setNotificacaoToDelete(null);
    }
  };

  const handleSyncEmails = async () => {
    try {
      setLoading(true);
      toast.info('Buscando e-mails...');
      
      logEvent('api_call_start', 'api_call');

      
      const response = await fetch('/api/notificacoes/buscar-emails', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'E-mails sincronizados com sucesso');
        await loadNotificacoes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao buscar e-mails');
      }
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao buscar e-mails:', error);
      toast.error('Erro ao buscar e-mails');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotificacoes = notificacoes.filter(notificacao =>
    notificacao.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notificacao.de.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notificacao.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1800px]">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Envelope size={32} weight="duotone" className="text-primary" />
              Notificações por E-mail
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize e gerencie as notificações recebidas por e-mail do sistema
            </p>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Notificações</CardTitle>
                <CardDescription>
                  {filteredNotificacoes.length} notificação(ões) encontrada(s)
                  {notificacoes.filter(n => !n.lida).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {notificacoes.filter(n => !n.lida).length} não lida(s)
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <Button onClick={handleSyncEmails} disabled={loading}>
                <ArrowsClockwise className="mr-2" size={16} />
                Sincronizar E-mails
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barra de Pesquisa */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por assunto, remetente ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {/* Tabela */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Aplicação</TableHead>
                      <TableHead>De</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Carregando notificações...
                        </TableCell>
                      </TableRow>
                    ) : filteredNotificacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma notificação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotificacoes.map((notificacao) => (
                        <TableRow
                          key={notificacao.id}
                          className={!notificacao.lida ? 'bg-blue-50/50 dark:bg-blue-950/20 font-medium' : ''}
                        >
                          <TableCell>
                            {!notificacao.lida && (
                              <div className="w-2 h-2 rounded-full bg-blue-600" title="Não lida" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatarData(notificacao.data)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {notificacao.aplicacaoSigla ? (
                              <Badge variant="outline">{notificacao.aplicacaoSigla}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {notificacao.de}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {notificacao.subject}
                          </TableCell>
                          <TableCell className="text-sm">
                            {notificacao.email ? (
                              <span className="text-xs text-muted-foreground">{notificacao.email}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <DotsThree className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleView(notificacao)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(notificacao)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Envelope />
                {selectedNotificacao?.subject}
              </DialogTitle>
              <DialogDescription>
                Recebido em {selectedNotificacao && formatarData(selectedNotificacao.data)}
              </DialogDescription>
            </DialogHeader>
            {selectedNotificacao && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Aplicação:</span>
                    <p className="text-muted-foreground">
                      {selectedNotificacao.aplicacaoSigla ? (
                        <Badge variant="outline">{selectedNotificacao.aplicacaoSigla}</Badge>
                      ) : (
                        'Não associada'
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">E-mail Associado:</span>
                    <p className="text-muted-foreground">{selectedNotificacao.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-semibold">De:</span>
                    <p className="text-muted-foreground">{selectedNotificacao.de}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Para:</span>
                    <p className="text-muted-foreground">{selectedNotificacao.para}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="font-semibold text-sm">Conteúdo:</span>
                  <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                    {selectedNotificacao.conteudo}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta notificação? Esta ação não pode ser desfeita.
                <br />
                <br />
                <strong>Assunto:</strong> {notificacaoToDelete?.subject}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
