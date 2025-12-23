import { useState, useEffect } from 'react';
import { Tecnologia, Colaborador } from '@/lib/types';
import { TecnologiaWizard } from './TecnologiaWizard';
import { TecnologiaDetails } from './TecnologiaDetails';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { TecnologiasDataTable } from './TecnologiasDataTable';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';

interface TecnologiasViewProps {
  colaboradores: Colaborador[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function TecnologiasView({ colaboradores }: TecnologiasViewProps) {
  const [tecnologias, setTecnologias] = useState<Tecnologia[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTecnologia, setSelectedTecnologia] = useState<Tecnologia | null>(null);
  const [editingTecnologia, setEditingTecnologia] = useState<Tecnologia | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTecnologias();
  }, []);

  const loadTecnologias = async () => {
    try {
      setLoading(true);
      console.log('Carregando tecnologias de:', `${API_URL}/api/tecnologias`);
      const response = await fetch(`${API_URL}/api/tecnologias`);
      if (response.ok) {
        const data = await response.json();
        console.log('Tecnologias carregadas:', data.length, data);
        setTecnologias(data);
      } else {
        console.error('Erro ao carregar tecnologias:', response.status, response.statusText);
        toast.error('Erro ao carregar tecnologias');
      }
    } catch (error) {
      console.error('Erro ao carregar tecnologias:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tecnologia: Tecnologia) => {
    try {
      const isEditing = !!tecnologia.id && tecnologias.some(t => t.id === tecnologia.id);
      
      // Transformar o objeto ambientes para os campos esperados pela API
      const tecnologiaPayload = {
        ...tecnologia,
        ambienteDev: tecnologia.ambientes?.dev || false,
        ambienteQa: tecnologia.ambientes?.qa || false,
        ambienteProd: tecnologia.ambientes?.prod || false,
        ambienteCloud: tecnologia.ambientes?.cloud || false,
        ambienteOnPremise: tecnologia.ambientes?.onPremise || false,
      };
      // Remover o objeto ambientes do payload
      delete tecnologiaPayload.ambientes;
      
      const response = await fetch(
        isEditing ? `${API_URL}/api/tecnologias/${tecnologia.id}` : `${API_URL}/api/tecnologias`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tecnologiaPayload)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar tecnologia');
      }

      const savedTecnologia = await response.json();
      
      // Salvar responsáveis se houver
      if (tecnologia.responsaveis && tecnologia.responsaveis.length > 0) {
        await saveResponsaveis(savedTecnologia.id, tecnologia.responsaveis);
      }

      // Salvar contratos se houver
      if (tecnologia.contratos && tecnologia.contratos.length > 0) {
        await saveContratos(savedTecnologia.id, tecnologia.contratos);
      }

      // Salvar contratos AMS se houver
      if (tecnologia.contratosAMS && tecnologia.contratosAMS.length > 0) {
        await saveContratosAMS(savedTecnologia.id, tecnologia.contratosAMS);
      }

      // Salvar custos SaaS se houver
      if (tecnologia.custosSaaS && tecnologia.custosSaaS.length > 0) {
        await saveCustosSaaS(savedTecnologia.id, tecnologia.custosSaaS);
      }

      // Salvar manutenções SaaS se houver
      if (tecnologia.manutencoesSaaS && tecnologia.manutencoesSaaS.length > 0) {
        await saveManutencoesSaaS(savedTecnologia.id, tecnologia.manutencoesSaaS);
      }

      await loadTecnologias();
      setShowWizard(false);
      setEditingTecnologia(undefined);
      toast.success(isEditing ? 'Tecnologia atualizada com sucesso' : 'Tecnologia cadastrada com sucesso');
    } catch (error) {
      console.error('Erro ao salvar tecnologia:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar tecnologia');
    }
  };

  const saveResponsaveis = async (tecnologiaId: string, responsaveis: any[]) => {
    try {
      // Primeiro, buscar responsáveis existentes
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/responsaveis`);
      const existentes = response.ok ? await response.json() : [];

      // Para cada responsável novo/editado
      for (const responsavel of responsaveis) {
        const colaborador = colaboradores.find(c => c.matricula === responsavel.matriculaFuncionario);
        if (!colaborador) continue;

        const dados = {
          colaboradorId: colaborador.id,
          perfil: responsavel.perfil,
          dataInicio: responsavel.dataInicio,
          dataTermino: responsavel.dataTermino || null,
          status: responsavel.status,
          observacoes: null
        };

        // Verificar se já existe
        const existente = existentes.find((e: any) => e.id === responsavel.id);

        if (existente) {
          // Atualizar
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/responsaveis/${responsavel.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        } else {
          // Criar novo
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/responsaveis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar responsáveis:', error);
      toast.error('Erro ao salvar responsáveis');
    }
  };

  const saveContratos = async (tecnologiaId: string, contratos: any[]) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos`);
      const existentes = response.ok ? await response.json() : [];

      for (const contrato of contratos) {
        const dados = {
          numeroContrato: contrato.numeroContrato,
          vigenciaInicial: contrato.vigenciaInicial,
          vigenciaTermino: contrato.vigenciaTermino,
          valorContrato: contrato.valorContrato,
          status: contrato.status
        };

        const existente = existentes.find((e: any) => e.id === contrato.id);
        if (existente) {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos/${contrato.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        } else {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar contratos:', error);
      toast.error('Erro ao salvar contratos');
    }
  };

  const saveContratosAMS = async (tecnologiaId: string, contratosAMS: any[]) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos-ams`);
      const existentes = response.ok ? await response.json() : [];

      for (const contrato of contratosAMS) {
        const dados = {
          contrato: contrato.contrato,
          cnpjContratado: contrato.cnpjContratado,
          custoAnual: contrato.custoAnual,
          dataInicio: contrato.dataInicio,
          dataTermino: contrato.dataTermino,
          status: contrato.status
        };

        const existente = existentes.find((e: any) => e.id === contrato.id);
        if (existente) {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos-ams/${contrato.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        } else {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos-ams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar contratos AMS:', error);
      toast.error('Erro ao salvar contratos AMS');
    }
  };

  const saveCustosSaaS = async (tecnologiaId: string, custosSaaS: any[]) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/custos-saas`);
      const existentes = response.ok ? await response.json() : [];

      for (const custo of custosSaaS) {
        const dados = {
          custoTotalSaaS: custo.custoTotalSaaS,
          custoPorLicenca: custo.custoPorLicenca,
          numeroLicencasContratadas: custo.numeroLicencasContratadas,
          licencasUtilizadas: custo.licencasUtilizadas,
          crescimentoCustoMensalMoM: custo.crescimentoCustoMensalMoM,
          slaCumprido: custo.slaCumprido
        };

        const existente = existentes.find((e: any) => e.id === custo.id);
        if (existente) {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/custos-saas/${custo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        } else {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/custos-saas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar custos SaaS:', error);
      toast.error('Erro ao salvar custos SaaS');
    }
  };

  const saveManutencoesSaaS = async (tecnologiaId: string, manutencoesSaaS: any[]) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/manutencoes-saas`);
      const existentes = response.ok ? await response.json() : [];

      for (const manutencao of manutencoesSaaS) {
        const dados = {
          dataHoraInicio: manutencao.dataHoraInicio,
          dataHoraTermino: manutencao.dataHoraTermino,
          tempoIndisponibilidadeHoras: manutencao.tempoIndisponibilidadeHoras
        };

        const existente = existentes.find((e: any) => e.id === manutencao.id);
        if (existente) {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/manutencoes-saas/${manutencao.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        } else {
          await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/manutencoes-saas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar manutenções SaaS:', error);
      toast.error('Erro ao salvar manutenções SaaS');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir tecnologia');
      }

      await loadTecnologias();
      setSelectedTecnologia(null);
      toast.success('Tecnologia excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir tecnologia:', error);
      toast.error('Erro ao excluir tecnologia');
    }
  };

  const handleEdit = (tecnologia: Tecnologia) => {
    setEditingTecnologia(tecnologia);
    setShowWizard(true);
    setSelectedTecnologia(null);
  };

  const handleNewTecnologia = () => {
    setEditingTecnologia(undefined);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingTecnologia(undefined);
  };

  if (showWizard) {
    return (
      <TecnologiaWizard
        tecnologia={editingTecnologia}
        tecnologias={tecnologias || []}
        colaboradores={colaboradores}
        onSave={handleSave}
        onCancel={handleCloseWizard}
      />
    );
  }

  if (selectedTecnologia) {
    return (
      <TecnologiaDetails
        tecnologia={selectedTecnologia}
        colaboradores={colaboradores}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={() => setSelectedTecnologia(null)}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Catálogo de Tecnologias</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie todas as tecnologias utilizadas na instituição
              </p>
            </div>
            <Button onClick={handleNewTecnologia} size="lg">
              <Plus className="mr-2" />
              Nova Tecnologia
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando tecnologias...</p>
          </div>
        ) : (
          <TecnologiasDataTable
            tecnologias={tecnologias || []}
            onSelect={setSelectedTecnologia}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
