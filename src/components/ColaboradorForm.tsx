import { useState } from 'react';
import { Colaborador, TipoAfastamento } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AfastamentosTable } from './AfastamentosTable';
import { Separator } from '@/components/ui/separator';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface ColaboradorFormProps {
  colaborador?: Colaborador;
  colaboradores: Colaborador[];
  tiposAfastamento: TipoAfastamento[];
  onSave: (colaborador: Colaborador) => void;
  trigger?: React.ReactNode;
}

export function ColaboradorForm({ colaborador, colaboradores, tiposAfastamento, onSave, trigger }: ColaboradorFormProps) {
  const [open, setOpen] = useState(false);
  const [matricula, setMatricula] = useState(colaborador?.matricula || '');
  const [nome, setNome] = useState(colaborador?.nome || '');
  const [setor, setSetor] = useState(colaborador?.setor || '');
  const [dataAdmissao, setDataAdmissao] = useState(colaborador?.dataAdmissao || getTodayDate());
  const [dataDemissao, setDataDemissao] = useState(colaborador?.dataDemissao || '');
  const [afastamentos, setAfastamentos] = useState(colaborador?.afastamentos || []);

  const isDemitido = !!colaborador?.dataDemissao;
  const isEditing = !!colaborador;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricula || !nome || !setor || !dataAdmissao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const matriculaExiste = colaboradores.some(
      c => c.matricula === matricula && c.id !== colaborador?.id
    );

    if (matriculaExiste) {
      toast.error('Matrícula já cadastrada');
      return;
    }

    const novoColaborador: Colaborador = {
      id: colaborador?.id || generateUUID(),
      matricula,
      nome,
      setor,
      dataAdmissao,
      dataDemissao: dataDemissao || undefined,
      afastamentos,
      habilidades: colaborador?.habilidades || []
    };

    onSave(novoColaborador);
    setOpen(false);
    toast.success(isEditing ? 'Colaborador atualizado com sucesso' : 'Colaborador cadastrado com sucesso');
    
    if (!isEditing) {
      setMatricula('');
      setNome('');
      setSetor('');
      setDataAdmissao(getTodayDate());
      setDataDemissao('');
      setAfastamentos([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2" />
            Novo Colaborador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <form onSubmit={handleSubmit} className="space-y-8 pb-4">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="matricula" className="text-base font-medium">Matrícula *</Label>
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    disabled={isDemitido}
                    required
                    className="h-11 text-base"
                    placeholder="Digite a matrícula do colaborador"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="nome" className="text-base font-medium">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isDemitido}
                    required
                    className="h-11 text-base"
                    placeholder="Digite o nome completo"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="setor" className="text-base font-medium">Setor *</Label>
                  <Input
                    id="setor"
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    disabled={isDemitido}
                    required
                    className="h-11 text-base"
                    placeholder="Digite o setor"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="data-admissao" className="text-base font-medium">Data de Admissão *</Label>
                  <Input
                    id="data-admissao"
                    type="date"
                    value={dataAdmissao}
                    onChange={(e) => setDataAdmissao(e.target.value)}
                    disabled={isDemitido}
                    required
                    className="h-11 text-base"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="data-demissao" className="text-base font-medium">Data de Demissão</Label>
                  <Input
                    id="data-demissao"
                    type="date"
                    value={dataDemissao}
                    onChange={(e) => setDataDemissao(e.target.value)}
                    min={dataAdmissao}
                    disabled={isDemitido}
                    className="h-11 text-base"
                  />
                </div>
              </div>
              
              {isDemitido && (
                <div className="bg-muted p-5 rounded-lg text-base text-muted-foreground">
                  <strong>Atenção:</strong> Este colaborador está demitido. Seus dados não podem ser alterados.
                </div>
              )}
            </div>

            {isEditing && !isDemitido && (
              <>
                <Separator className="my-6" />
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-foreground border-b pb-2">Afastamentos</h3>
                  <AfastamentosTable
                    colaboradorId={colaborador.id}
                    afastamentos={afastamentos}
                    tiposAfastamento={tiposAfastamento}
                    onAfastamentosChange={setAfastamentos}
                  />
                </div>
              </>
            )}
            
            <Separator className="my-6" />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 text-base">
                Cancelar
              </Button>
              <Button type="submit" disabled={isDemitido} className="h-11 px-6 text-base">
                {isEditing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
