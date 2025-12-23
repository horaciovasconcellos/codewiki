import { useState } from 'react';
import { ProcessoNegocio, NivelMaturidade, Frequencia, Complexidade, NormaProcesso } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NormasProcessoTable } from './NormasProcessoTable';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ProcessoNegocioFormProps {
  processo?: ProcessoNegocio;
  processos: ProcessoNegocio[];
  onSave: (processo: ProcessoNegocio) => void;
}

export function ProcessoNegocioForm({ processo, processos, onSave }: ProcessoNegocioFormProps) {
  const [open, setOpen] = useState(false);
  const [identificacao, setIdentificacao] = useState(processo?.identificacao || '');
  const [descricao, setDescricao] = useState(processo?.descricao || '');
  const [nivelMaturidade, setNivelMaturidade] = useState<NivelMaturidade>(processo?.nivelMaturidade || 'Inicial');
  const [areaResponsavel, setAreaResponsavel] = useState(processo?.areaResponsavel || '');
  const [frequencia, setFrequencia] = useState<Frequencia>(processo?.frequencia || 'Mensal');
  const [duracaoMedia, setDuracaoMedia] = useState(processo?.duracaoMedia || 0);
  const [complexidade, setComplexidade] = useState<Complexidade>(processo?.complexidade || 'Média');
  const [normas, setNormas] = useState<NormaProcesso[]>(processo?.normas || []);

  const isEditing = !!processo;

  const resetForm = () => {
    if (!isEditing) {
      setIdentificacao('');
      setDescricao('');
      setNivelMaturidade('Inicial');
      setAreaResponsavel('');
      setFrequencia('Mensal');
      setDuracaoMedia(0);
      setComplexidade('Média');
      setNormas([]);
    }
  };

  const handleSubmit = () => {
    if (!identificacao || !descricao || !areaResponsavel) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const siglaRegex = /^[A-Za-z0-9]{6}-\d{5}$/;
    if (!siglaRegex.test(identificacao)) {
      toast.error('Sigla deve seguir o formato: 6 caracteres alfanuméricos, hífen, 5 dígitos (ex: ABC123-12345)');
      return;
    }

    if (descricao.length > 50) {
      toast.error('Descrição deve ter até 50 caracteres');
      return;
    }

    if (duracaoMedia < 0) {
      toast.error('Duração média deve ser um número positivo');
      return;
    }

    const identificacaoExiste = processos.some(
      p => p.identificacao?.toLowerCase() === identificacao.toLowerCase() && p.id !== processo?.id
    );

    if (identificacaoExiste) {
      toast.error('Identificação já cadastrada');
      return;
    }

    const novoProcesso: ProcessoNegocio = {
      id: processo?.id || crypto.randomUUID(),
      identificacao,
      descricao,
      nivelMaturidade,
      areaResponsavel,
      frequencia,
      duracaoMedia,
      complexidade,
      normas,
    };

    onSave(novoProcesso);
    toast.success(isEditing ? 'Processo atualizado com sucesso' : 'Processo cadastrado com sucesso');
    setOpen(false);
    if (!isEditing) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">Editar</Button>
        ) : (
          <Button>
            <Plus className="mr-2" />
            Novo Processo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Processo de Negócio' : 'Novo Processo de Negócio'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do processo de negócio
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="normas">Normas Aplicáveis</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Processo</CardTitle>
                <CardDescription>Informações gerais sobre o processo de negócio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="identificacao">Sigla (11 caracteres) *</Label>
                    <Input
                      id="identificacao"
                      value={identificacao}
                      onChange={(e) => setIdentificacao(e.target.value.slice(0, 12).toUpperCase())}
                      placeholder="Ex: ABC123-12345"
                      maxLength={12}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição (até 50 caracteres) *</Label>
                    <Input
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value.slice(0, 50))}
                      placeholder="Ex: Processo de compras"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nivelMaturidade">Nível de Maturidade</Label>
                    <Select
                      value={nivelMaturidade}
                      onValueChange={(value) => setNivelMaturidade(value as NivelMaturidade)}
                    >
                      <SelectTrigger id="nivelMaturidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inicial">Inicial</SelectItem>
                        <SelectItem value="Repetível">Repetível</SelectItem>
                        <SelectItem value="Definido">Definido</SelectItem>
                        <SelectItem value="Gerenciado">Gerenciado</SelectItem>
                        <SelectItem value="Otimizado">Otimizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="areaResponsavel">Área Responsável *</Label>
                    <Input
                      id="areaResponsavel"
                      value={areaResponsavel}
                      onChange={(e) => setAreaResponsavel(e.target.value)}
                      placeholder="Ex: TI, Compras"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequencia">Frequência</Label>
                    <Select
                      value={frequencia}
                      onValueChange={(value) => setFrequencia(value as Frequencia)}
                    >
                      <SelectTrigger id="frequencia">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diário">Diário</SelectItem>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Ad-Hoc">Ad-Hoc</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Bi-Anual">Bi-Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="duracaoMedia">Duração Média (minutos)</Label>
                    <Input
                      id="duracaoMedia"
                      type="number"
                      min="0"
                      value={duracaoMedia}
                      onChange={(e) => setDuracaoMedia(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="complexidade">Complexidade</Label>
                    <Select
                      value={complexidade}
                      onValueChange={(value) => setComplexidade(value as Complexidade)}
                    >
                      <SelectTrigger id="complexidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Muito Baixa">Muito Baixa</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Muito Alta">Muito Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="normas" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Normas Aplicáveis</CardTitle>
                <CardDescription>
                  Gerencie as normas e regulamentações aplicáveis a este processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NormasProcessoTable
                  normas={normas}
                  onChange={setNormas}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
