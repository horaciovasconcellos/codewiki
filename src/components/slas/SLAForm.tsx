import { useState } from 'react';
import { SLA, TipoSLA } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { SLASuporteForm } from './forms/SLASuporteForm';
import { SLASegurancaForm } from './forms/SLASegurancaForm';
import { SLACapacidadeForm } from './forms/SLACapacidadeForm';
import { SLADisponibilidadeForm } from './forms/SLADisponibilidadeForm';
import { SLAPerformanceForm } from './forms/SLAPerformanceForm';
import { SLAPrioridadeForm } from './forms/SLAPrioridadeForm';
import { SLAApoioForm } from './forms/SLAApoioForm';
import { SLAOperacionalForm } from './forms/SLAOperacionalForm';
import { SLAComponentesForm } from './forms/SLAComponentesForm';
import { SLAUsuarioForm } from './forms/SLAUsuarioForm';
import { SLAServicoForm } from './forms/SLAServicoForm';

interface SLAFormProps {
  slas: SLA[];
  onSave: (sla: SLA) => void;
  onCancel: () => void;
  editingSLA?: SLA;
}

const tiposSLA: TipoSLA[] = [
  'SLA por Serviço',
  'SLA por Cliente',
  'SLA por Usuário',
  'SLA Baseado em Componentes',
  'SLA Operacional',
  'SLA de Apoio',
  'SLA por Nível de Prioridade / Severidade',
  'SLA de Performance',
  'SLA de Disponibilidade',
  'SLA de Capacidade',
  'SLA de Segurança',
  'SLA de Suporte / Atendimento',
];

export function SLAForm({ slas, onSave, onCancel, editingSLA }: SLAFormProps) {
  // Helper para converter data ISO para formato yyyy-MM-dd
  const formatDateForInput = (date?: string) => {
    if (!date) return '';
    return date.split('T')[0]; // Pega apenas a parte da data
  };

  const [sigla, setSigla] = useState(editingSLA?.sigla || '');
  const [descricao, setDescricao] = useState(editingSLA?.descricao || '');
  const [tipoSLA, setTipoSLA] = useState<TipoSLA | undefined>(editingSLA?.tipoSLA);
  const [dataInicio, setDataInicio] = useState(
    editingSLA?.dataInicio ? formatDateForInput(editingSLA.dataInicio) : getTodayDate()
  );
  const [dataTermino, setDataTermino] = useState(
    editingSLA?.dataTermino ? formatDateForInput(editingSLA.dataTermino) : ''
  );
  const [currentTab, setCurrentTab] = useState('basico');

  const [suporteData, setSuporteData] = useState(editingSLA?.suporteAtendimento);
  const [segurancaData, setSegurancaData] = useState(editingSLA?.seguranca);
  const [capacidadeData, setCapacidadeData] = useState(editingSLA?.capacidade);
  const [disponibilidadeData, setDisponibilidadeData] = useState(editingSLA?.disponibilidade);
  const [performanceData, setPerformanceData] = useState(editingSLA?.performance);
  const [prioridadeData, setPrioridadeData] = useState(editingSLA?.prioridade);
  const [apoioData, setApoioData] = useState(editingSLA?.apoio);
  const [operacionalData, setOperacionalData] = useState(editingSLA?.operacional);
  const [componentesData, setComponentesData] = useState(editingSLA?.componentes);
  const [usuarioData, setUsuarioData] = useState(editingSLA?.usuario);
  const [servicoData, setServicoData] = useState(editingSLA?.servico);

  const isEditing = !!editingSLA;

  const handleSubmit = () => {
    if (!sigla.trim() || !descricao.trim() || !tipoSLA || !dataInicio) {
      toast.error('Preencha todos os campos obrigatórios da aba Básico');
      setCurrentTab('basico');
      return;
    }

    const sla: SLA = {
      id: editingSLA?.id || crypto.randomUUID(),
      sigla: sigla.trim(),
      descricao: descricao.trim(),
      tipoSLA,
      dataInicio,
      dataTermino: dataTermino || undefined,
      status: editingSLA?.status || 'Ativo',
      suporteAtendimento: tipoSLA === 'SLA de Suporte / Atendimento' ? suporteData : undefined,
      seguranca: tipoSLA === 'SLA de Segurança' ? segurancaData : undefined,
      capacidade: tipoSLA === 'SLA de Capacidade' ? capacidadeData : undefined,
      disponibilidade: tipoSLA === 'SLA de Disponibilidade' ? disponibilidadeData : undefined,
      performance: tipoSLA === 'SLA de Performance' ? performanceData : undefined,
      prioridade: tipoSLA === 'SLA por Nível de Prioridade / Severidade' ? prioridadeData : undefined,
      apoio: tipoSLA === 'SLA de Apoio' ? apoioData : undefined,
      operacional: tipoSLA === 'SLA Operacional' ? operacionalData : undefined,
      componentes: tipoSLA === 'SLA Baseado em Componentes' ? componentesData : undefined,
      usuario: tipoSLA === 'SLA por Usuário' ? usuarioData : undefined,
      servico: tipoSLA === 'SLA por Serviço' ? servicoData : undefined,
    };

    onSave(sla);
    toast.success(editingSLA ? 'SLA atualizado com sucesso' : 'SLA cadastrado com sucesso');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onCancel}>
              <X className="mr-2" />
              Cancelar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Editar SLA' : 'Novo SLA'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Preencha as informações do SLA
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="detalhes" disabled={!tipoSLA}>
                    Detalhes do SLA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sigla">Sigla *</Label>
                    <Input
                      id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
                placeholder="Ex: SLA-PROD-01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição detalhada do SLA"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-sla">Tipo de SLA *</Label>
              <Select value={tipoSLA || undefined} onValueChange={(value) => setTipoSLA(value as TipoSLA)}>
                <SelectTrigger id="tipo-sla">
                  <SelectValue placeholder="Selecione o tipo de SLA" />
                </SelectTrigger>
                <SelectContent>
                  {tiposSLA.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data de Início *</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-termino">Data de Término</Label>
                <Input
                  id="data-termino"
                  type="date"
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4">
            {tipoSLA === 'SLA de Suporte / Atendimento' && (
              <SLASuporteForm data={suporteData} onChange={setSuporteData} />
            )}
            {tipoSLA === 'SLA de Segurança' && (
              <SLASegurancaForm data={segurancaData} onChange={setSegurancaData} />
            )}
            {tipoSLA === 'SLA de Capacidade' && (
              <SLACapacidadeForm data={capacidadeData} onChange={setCapacidadeData} />
            )}
            {tipoSLA === 'SLA de Disponibilidade' && (
              <SLADisponibilidadeForm data={disponibilidadeData} onChange={setDisponibilidadeData} />
            )}
            {tipoSLA === 'SLA de Performance' && (
              <SLAPerformanceForm data={performanceData} onChange={setPerformanceData} />
            )}
            {tipoSLA === 'SLA por Nível de Prioridade / Severidade' && (
              <SLAPrioridadeForm data={prioridadeData} onChange={setPrioridadeData} />
            )}
            {tipoSLA === 'SLA de Apoio' && (
              <SLAApoioForm data={apoioData} onChange={setApoioData} />
            )}
            {tipoSLA === 'SLA Operacional' && (
              <SLAOperacionalForm data={operacionalData} onChange={setOperacionalData} />
            )}
            {tipoSLA === 'SLA Baseado em Componentes' && (
              <SLAComponentesForm data={componentesData} onChange={setComponentesData} />
            )}
            {tipoSLA === 'SLA por Usuário' && (
              <SLAUsuarioForm data={usuarioData} onChange={setUsuarioData} />
            )}
            {tipoSLA === 'SLA por Serviço' && (
              <SLAServicoForm data={servicoData} onChange={setServicoData} />
            )}
            {tipoSLA === 'SLA por Cliente' && (
              <div className="text-muted-foreground text-sm p-4 border border-border rounded-md">
                Este tipo de SLA utiliza apenas as informações básicas.
              </div>
            )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" onClick={onCancel}>
                  <X className="mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  <Check className="mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar SLA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
