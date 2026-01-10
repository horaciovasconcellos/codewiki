import { useState, useEffect } from 'react';
import { LGPDRegistro } from '@/types/lgpd';
import { LGPDDataTable } from '@/components/lgpd/LGPDDataTable';
import { LGPDWizard } from '@/components/lgpd/LGPDWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function LGPDView() {
  const [registros, setRegistros] = useState<LGPDRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<LGPDRegistro | undefined>();
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingRegistro, setViewingRegistro] = useState<LGPDRegistro | undefined>();

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/lgpd`);
      if (!response.ok) throw new Error('Erro ao buscar registros');
      const data = await response.json();
      setRegistros(data);
    } catch (error) {
      console.error('Erro ao buscar registros LGPD:', error);
      alert('Erro ao carregar registros LGPD');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRegistro(undefined);
    setShowWizard(true);
  };

  const handleEdit = async (registro: LGPDRegistro) => {
    try {
      // Buscar registro completo com campos
      const response = await fetch(`${API_URL}/api/lgpd/${registro.id}`);
      if (!response.ok) throw new Error('Erro ao buscar registro completo');
      const registroCompleto = await response.json();
      setEditingRegistro(registroCompleto);
      setShowWizard(true);
    } catch (error) {
      console.error('Erro ao buscar registro:', error);
      alert('Erro ao carregar dados para edição');
    }
  };

  const handleView = async (registro: LGPDRegistro) => {
    try {
      const response = await fetch(`${API_URL}/api/lgpd/${registro.id}`);
      if (!response.ok) throw new Error('Erro ao buscar registro');
      const registroCompleto = await response.json();
      setViewingRegistro(registroCompleto);
      setShowViewDialog(true);
    } catch (error) {
      console.error('Erro ao visualizar registro:', error);
      alert('Erro ao carregar detalhes');
    }
  };

  const handleDelete = async (id: number, identificacao: string) => {
    try {
      const response = await fetch(`${API_URL}/api/lgpd/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir registro');
      alert(`Registro "${identificacao}" excluído com sucesso!`);
      fetchRegistros();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir registro');
    }
  };

  const handleSave = async (data: any) => {
    try {
      const method = editingRegistro ? 'PUT' : 'POST';
      const url = editingRegistro 
        ? `${API_URL}/api/lgpd/${editingRegistro.id}`
        : `${API_URL}/api/lgpd`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erro ao salvar registro');
      
      alert(editingRegistro ? 'Registro atualizado com sucesso!' : 'Registro criado com sucesso!');
      fetchRegistros();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      throw error;
    }
  };

  // Se wizard estiver aberto, renderizar apenas o wizard
  if (showWizard) {
    return (
      <LGPDWizard
        registro={editingRegistro}
        onSave={handleSave}
        onCancel={() => {
          setShowWizard(false);
          setEditingRegistro(undefined);
        }}
      />
    );
  }

  const formatarData = (data: string | undefined) => {
    if (!data) return '-';
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full p-6">
        <Card className="h-full">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-center text-muted-foreground">Carregando registros LGPD...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 space-y-6">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Gestão de LGPD</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerenciamento de dados pessoais e técnicas de anonimização conforme Lei Geral de Proteção de Dados
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  Total: {registros.length} registros
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Ativos: {registros.filter(r => r.ativo).length}
                </Badge>
              </div>
            </div>
            <Button onClick={handleCreate} size="lg">
              <Plus size={20} className="mr-2" />
              Novo Registro LGPD
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <LGPDDataTable
            registros={registros}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes do Registro LGPD</DialogTitle>
          </DialogHeader>
          {viewingRegistro && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Identificação</p>
                  <p className="text-base">{viewingRegistro.identificacaoDados}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Dados</p>
                  <Badge variant="default">{viewingRegistro.tipoDados}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Técnica de Anonimização Padrão</p>
                  <p className="text-sm">{viewingRegistro.tecnicaAnonimizacao}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={viewingRegistro.ativo ? 'default' : 'secondary'}>
                    {viewingRegistro.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Início</p>
                  <p className="text-base">{formatarData(viewingRegistro.dataInicio)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Término</p>
                  <p className="text-base">{formatarData(viewingRegistro.dataTermino)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Campos e Matriz de Anonimização</h4>
                {viewingRegistro.campos && viewingRegistro.campos.length > 0 ? (
                  <div className="space-y-4">
                    {viewingRegistro.campos.map((campo, index) => (
                      <div key={campo.id} className="border rounded-md p-4 space-y-3">
                        <div>
                          <p className="font-medium">{campo.nomeCampo}</p>
                          <p className="text-sm text-muted-foreground">{campo.descricao}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Vendas:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.vendas}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Marketing:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.marketing}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Financeiro:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.financeiro}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">RH:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.rh}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Logística:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.logistica}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Assistência:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.assistenciaTecnica}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Analytics:</span>{' '}
                            <Badge variant="outline" className="text-xs">{campo.matrizAnonimizacao.analytics}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum campo cadastrado</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
