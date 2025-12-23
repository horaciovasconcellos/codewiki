import { useState, useEffect } from 'react';
import { Colaborador, TipoAfastamento, Habilidade } from '@/lib/types';
import { ColaboradorDetails } from './ColaboradorDetails';
import { ColaboradorWizard } from './ColaboradorWizard';
import { ColaboradoresDataTable } from './ColaboradoresDataTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { toast } from 'sonner';

interface ColaboradoresViewProps {
  colaboradores: Colaborador[];
  tiposAfastamento: TipoAfastamento[];
  habilidades: Habilidade[];
}

export function ColaboradoresView({ 
  colaboradores: initialColaboradores,
  tiposAfastamento,
  habilidades
}: ColaboradoresViewProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(initialColaboradores);
  
  // Atualizar quando os props mudarem
  useEffect(() => {
    setColaboradores(initialColaboradores);
  }, [initialColaboradores]);
  
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | undefined>(undefined);
  const [showWizard, setShowWizard] = useState(false);

  const handleSave = async (colaborador: Colaborador) => {
    try {
      const payload = {
        nome: colaborador.nome,
        matricula: colaborador.matricula,
        setor: colaborador.setor,
        dataAdmissao: colaborador.dataAdmissao,
        dataDemissao: colaborador.dataDemissao || null
      };

      let savedColaborador;
      if (colaborador.id && colaboradores?.some(c => c.id === colaborador.id)) {
        // Atualizar existente
        savedColaborador = await apiPut(`/colaboradores/${colaborador.id}`, payload);
        
        // Salvar afastamentos - apenas os novos (IDs temporários gerados com crypto.randomUUID no frontend)
        if (colaborador.afastamentos && colaborador.afastamentos.length > 0) {
          const afastamentosExistentes = initialColaboradores.find(c => c.id === colaborador.id)?.afastamentos || [];
          const existingIds = new Set(afastamentosExistentes.map(a => a.id));
          
          for (const afastamento of colaborador.afastamentos) {
            if (!existingIds.has(afastamento.id)) {
              // Novo afastamento
              await apiPost(`/colaboradores/${savedColaborador.id}/afastamentos`, {
                tipoAfastamentoId: afastamento.tipoAfastamentoId,
                inicialProvavel: afastamento.inicialProvavel,
                finalProvavel: afastamento.finalProvavel,
                inicialEfetivo: afastamento.inicialEfetivo,
                finalEfetivo: afastamento.finalEfetivo
              });
            }
          }
        }
        
        // Salvar habilidades - apenas as novas
        if (colaborador.habilidades && colaborador.habilidades.length > 0) {
          const habilidadesExistentes = initialColaboradores.find(c => c.id === colaborador.id)?.habilidades || [];
          const existingIds = new Set(habilidadesExistentes.map(h => h.id));
          
          for (const habilidade of colaborador.habilidades) {
            if (!existingIds.has(habilidade.id)) {
              // Nova habilidade
              await apiPost(`/colaboradores/${savedColaborador.id}/habilidades`, {
                habilidadeId: habilidade.habilidadeId,
                nivelDeclarado: habilidade.nivelDeclarado,
                nivelAvaliado: habilidade.nivelAvaliado,
                dataInicio: habilidade.dataInicio,
                dataTermino: habilidade.dataTermino
              });
            }
          }
        }
        
        // Salvar avaliações - apenas as novas
        if (colaborador.avaliacoes && colaborador.avaliacoes.length > 0) {
          const avaliacoesExistentes = initialColaboradores.find(c => c.id === colaborador.id)?.avaliacoes || [];
          const existingIds = new Set(avaliacoesExistentes.map(a => a.id));
          
          for (const avaliacao of colaborador.avaliacoes) {
            if (!existingIds.has(avaliacao.id)) {
              // Nova avaliação
              await apiPost(`/colaboradores/${savedColaborador.id}/avaliacoes`, {
                dataAvaliacao: avaliacao.dataAvaliacao,
                resultadosEntregas: avaliacao.resultadosEntregas,
                competenciasTecnicas: avaliacao.competenciasTecnicas,
                qualidadeSeguranca: avaliacao.qualidadeSeguranca,
                comportamentoCultura: avaliacao.comportamentoCultura,
                evolucaoAprendizado: avaliacao.evolucaoAprendizado,
                motivo: avaliacao.motivo,
                dataConversa: avaliacao.dataConversa
              });
            }
          }
        }
        
        setColaboradores((current) => {
          const currentList = current || [];
          return currentList.map(c => c.id === colaborador.id ? {...savedColaborador, afastamentos: colaborador.afastamentos, habilidades: colaborador.habilidades, avaliacoes: colaborador.avaliacoes} : c);
        });
        toast.success('Colaborador atualizado com sucesso!');
      } else {
        // Criar novo
        savedColaborador = await apiPost('/colaboradores', payload);
        
        // Salvar afastamentos
        if (colaborador.afastamentos && colaborador.afastamentos.length > 0) {
          for (const afastamento of colaborador.afastamentos) {
            await apiPost(`/colaboradores/${savedColaborador.id}/afastamentos`, {
              tipoAfastamentoId: afastamento.tipoAfastamentoId,
              inicialProvavel: afastamento.inicialProvavel,
              finalProvavel: afastamento.finalProvavel,
              inicialEfetivo: afastamento.inicialEfetivo,
              finalEfetivo: afastamento.finalEfetivo
            });
          }
        }
        
        // Salvar habilidades
        if (colaborador.habilidades && colaborador.habilidades.length > 0) {
          for (const habilidade of colaborador.habilidades) {
            await apiPost(`/colaboradores/${savedColaborador.id}/habilidades`, {
              habilidadeId: habilidade.habilidadeId,
              nivelDeclarado: habilidade.nivelDeclarado,
              nivelAvaliado: habilidade.nivelAvaliado,
              dataInicio: habilidade.dataInicio,
              dataTermino: habilidade.dataTermino
            });
          }
        }
        
        // Salvar avaliações
        if (colaborador.avaliacoes && colaborador.avaliacoes.length > 0) {
          for (const avaliacao of colaborador.avaliacoes) {
            await apiPost(`/colaboradores/${savedColaborador.id}/avaliacoes`, {
              dataAvaliacao: avaliacao.dataAvaliacao,
              resultadosEntregas: avaliacao.resultadosEntregas,
              competenciasTecnicas: avaliacao.competenciasTecnicas,
              qualidadeSeguranca: avaliacao.qualidadeSeguranca,
              comportamentoCultura: avaliacao.comportamentoCultura,
              evolucaoAprendizado: avaliacao.evolucaoAprendizado,
              motivo: avaliacao.motivo,
              dataConversa: avaliacao.dataConversa
            });
          }
        }
        
        setColaboradores((current) => {
          const currentList = current || [];
          return [...currentList, {...savedColaborador, afastamentos: colaborador.afastamentos, habilidades: colaborador.habilidades, avaliacoes: colaborador.avaliacoes}];
        });
        toast.success('Colaborador cadastrado com sucesso!');
      }
      
      setShowWizard(false);
      setIsEditing(false);
      setEditingColaborador(undefined);
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
      toast.error('Erro ao salvar colaborador');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      try {
        await apiDelete(`/colaboradores/${id}`);
        setColaboradores((current) => {
          const currentList = current || [];
          return currentList.filter(c => c.id !== id);
        });
        toast.success('Colaborador excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir colaborador');
        console.error(error);
      }
    }
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setIsEditing(true);
    setShowWizard(true);
    setSelectedColaborador(null);
  };

  const handleView = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
  };

  const handleBack = () => {
    setSelectedColaborador(null);
  };

  const handleNewColaborador = () => {
    setEditingColaborador(undefined);
    setIsEditing(false);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setIsEditing(false);
    setEditingColaborador(undefined);
  };

  if (selectedColaborador) {
    return (
      <ColaboradorDetails
        colaborador={selectedColaborador}
        tiposAfastamento={tiposAfastamento}
        habilidades={habilidades}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />
    );
  }

  if (showWizard) {
    return (
      <ColaboradorWizard
        colaborador={editingColaborador}
        tiposAfastamento={tiposAfastamento}
        habilidades={habilidades}
        colaboradores={colaboradores || []}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground mt-2">
            Gestão de colaboradores, afastamentos e habilidades
          </p>
        </div>
      </div>

      <ColaboradoresDataTable
        colaboradores={colaboradores || []}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={handleNewColaborador}
      />
    </div>
  );
}
