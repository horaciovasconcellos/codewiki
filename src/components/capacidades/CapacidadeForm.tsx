import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CapacidadeNegocio, NivelCapacidade, CategoriaCapacidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CapacidadeFormProps {
  capacidades: CapacidadeNegocio[];
  capacidadeToEdit?: CapacidadeNegocio;
  onSave: (capacidade: CapacidadeNegocio) => void | Promise<void>;
  trigger?: React.ReactNode;
}

const NIVEIS: NivelCapacidade[] = ['Nível 1', 'Nível 2', 'Nível 3'];
const CATEGORIAS: CategoriaCapacidade[] = ['Financeiro', 'RH', 'Logística', 'Atendimento', 'Produção', 'Comercial'];

export function CapacidadeForm({ capacidades, capacidadeToEdit, onSave, trigger }: CapacidadeFormProps) {
  const [open, setOpen] = useState(false);
  const [sigla, setSigla] = useState(capacidadeToEdit?.sigla || '');
  const [nome, setNome] = useState(capacidadeToEdit?.nome || '');
  const [descricao, setDescricao] = useState(capacidadeToEdit?.descricao || '');
  const [nivel, setNivel] = useState<NivelCapacidade>(capacidadeToEdit?.nivel || 'Nível 1');
  const [categoria, setCategoria] = useState<CategoriaCapacidade>(capacidadeToEdit?.categoria || 'Financeiro');
  const [alinhamentoObjetivos, setAlinhamentoObjetivos] = useState(capacidadeToEdit?.coberturaEstrategica?.alinhamentoObjetivos || '');
  const [beneficiosEsperados, setBeneficiosEsperados] = useState(capacidadeToEdit?.coberturaEstrategica?.beneficiosEsperados || '');
  const [estadoFuturoDesejado, setEstadoFuturoDesejado] = useState(capacidadeToEdit?.coberturaEstrategica?.estadoFuturoDesejado || '');
  const [gapEstadoAtualFuturo, setGapEstadoAtualFuturo] = useState(capacidadeToEdit?.coberturaEstrategica?.gapEstadoAtualFuturo || '');

  const resetForm = () => {
    if (!capacidadeToEdit) {
      setSigla('');
      setNome('');
      setDescricao('');
      setNivel('Nível 1');
      setCategoria('Financeiro');
      setAlinhamentoObjetivos('');
      setBeneficiosEsperados('');
      setEstadoFuturoDesejado('');
      setGapEstadoAtualFuturo('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sigla.trim() || !nome.trim()) {
      toast.error('Preencha a sigla e o nome da capacidade');
      return;
    }

    const siglaExistente = capacidades.find(
      c => c.sigla?.toUpperCase() === sigla.toUpperCase() && c.id !== capacidadeToEdit?.id
    );

    if (siglaExistente) {
      toast.error('Já existe uma capacidade com esta sigla');
      return;
    }

    const capacidade: CapacidadeNegocio = {
      id: capacidadeToEdit?.id || uuidv4(),
      sigla: sigla.trim().toUpperCase(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      nivel,
      categoria,
      coberturaEstrategica: {
        alinhamentoObjetivos: alinhamentoObjetivos.trim(),
        beneficiosEsperados: beneficiosEsperados.trim(),
        estadoFuturoDesejado: estadoFuturoDesejado.trim(),
        gapEstadoAtualFuturo: gapEstadoAtualFuturo.trim(),
      },
    };

    await onSave(capacidade);
    toast.success(capacidadeToEdit ? 'Capacidade atualizada com sucesso' : 'Capacidade criada com sucesso');
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2" />
            Nova Capacidade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold">
            {capacidadeToEdit ? 'Editar Capacidade de Negócio' : 'Nova Capacidade de Negócio'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da capacidade de negócio e sua cobertura estratégica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="sigla" className="text-base font-medium">Sigla *</Label>
              <Input
                id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
                placeholder="Ex: FIN-01"
                maxLength={20}
                className="h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Até 20 caracteres
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="nome" className="text-base font-medium">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da capacidade"
                className="h-11 text-base"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="descricao" className="text-base font-medium">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição detalhada da capacidade"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="nivel" className="text-base font-medium">Nível</Label>
              <Select value={nivel} onValueChange={(value) => setNivel(value as NivelCapacidade)}>
                <SelectTrigger id="nivel" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVEIS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="categoria" className="text-base font-medium">Categoria da Capacidade</Label>
              <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaCapacidade)}>
                <SelectTrigger id="categoria" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Cobertura Estratégica</h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="alinhamento" className="text-base font-medium">Alinhamento com Objetivos Estratégicos</Label>
                <Textarea
                  id="alinhamento"
                  value={alinhamentoObjetivos}
                  onChange={(e) => setAlinhamentoObjetivos(e.target.value)}
                  placeholder="Descreva como esta capacidade se alinha aos objetivos estratégicos da organização"
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="beneficios" className="text-base font-medium">Benefícios Esperados</Label>
                <Textarea
                  id="beneficios"
                  value={beneficiosEsperados}
                  onChange={(e) => setBeneficiosEsperados(e.target.value)}
                  placeholder="Liste os benefícios esperados com o desenvolvimento desta capacidade"
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="estadoFuturo" className="text-base font-medium">Estado Futuro Desejado (Target State)</Label>
                <Textarea
                  id="estadoFuturo"
                  value={estadoFuturoDesejado}
                  onChange={(e) => setEstadoFuturoDesejado(e.target.value)}
                  placeholder="Descreva o estado futuro desejado para esta capacidade"
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="gap" className="text-base font-medium">Gap entre Estado Atual e Futuro</Label>
                <Textarea
                  id="gap"
                  value={gapEstadoAtualFuturo}
                  onChange={(e) => setGapEstadoAtualFuturo(e.target.value)}
                  placeholder="Identifique as lacunas entre o estado atual e o estado futuro desejado"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 text-base">
              Cancelar
            </Button>
            <Button type="submit" className="h-11 px-6 text-base">
              {capacidadeToEdit ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
