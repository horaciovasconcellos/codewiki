import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { DecisaoArquiteturalSDD, StatusADR } from '@/types/sdd';
import { DecisaoADRForm } from './DecisaoADRForm';

interface DecisoesArquiteturaisListProps {
  projetoId: string;
}

const STATUS_COLORS: Record<StatusADR, string> = {
  'Proposta': 'bg-blue-100 text-blue-800',
  'Aceita': 'bg-green-100 text-green-800',
  'Supersedida': 'bg-orange-100 text-orange-800',
  'Depreciada': 'bg-red-100 text-red-800',
};

export function DecisoesArquiteturaisList({ projetoId }: DecisoesArquiteturaisListProps) {
  const [decisoes, setDecisoes] = useState<DecisaoArquiteturalSDD[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDecisao, setEditingDecisao] = useState<DecisaoArquiteturalSDD | null>(null);

  useEffect(() => {
    loadDecisoes();
  }, [projetoId]);

  const loadDecisoes = async () => {
    try {
      const response = await fetch(`/api/sdd/decisoes/${projetoId}`);
      const data = await response.json();
      setDecisoes(data);
    } catch (error) {
      toast.error('Erro ao carregar decisões arquiteturais');
    }
  };

  const handleSave = () => {
    loadDecisoes();
    setShowForm(false);
    setEditingDecisao(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta decisão?')) return;

    try {
      const response = await fetch(`/api/sdd/decisoes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar decisão');
      
      toast.success('Decisão deletada com sucesso');
      loadDecisoes();
    } catch (error) {
      toast.error('Erro ao deletar decisão');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Decisões Arquiteturais (ADRs)</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Decisão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {decisoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma decisão arquitetural associada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ADR</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisoes.map((decisao) => (
                  <TableRow key={decisao.id}>
                    <TableCell className="font-medium">{decisao.adr_titulo || 'ADR não encontrado'}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(decisao.data_inicio).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {decisao.data_termino 
                        ? new Date(decisao.data_termino).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[decisao.status]}>{decisao.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingDecisao(decisao); setShowForm(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(decisao.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <DecisaoADRForm
          projetoId={projetoId}
          decisao={editingDecisao || undefined}
          onClose={() => { setShowForm(false); setEditingDecisao(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
