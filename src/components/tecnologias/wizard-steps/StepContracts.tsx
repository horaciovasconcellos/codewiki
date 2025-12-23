import { ContratoAMS, ContratoTecnologia, CustoSaaS, ManutencaoSaaS, NivelSuporteInterno, TipoLicenciamento } from '@/lib/types';
import { ContratosAMSTable } from '@/components/ContratosAMSTable';
import { ContratosTecnologiaTable } from '@/components/ContratosTecnologiaTable';
import { CustosSaaSTable } from '@/components/CustosSaaSTable';
import { ManutencoesSaaSTable } from '@/components/ManutencoesSaaSTable';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from '@phosphor-icons/react';

interface StepContractsProps {
  nivelSuporteInterno: NivelSuporteInterno;
  tipoLicenciamento: TipoLicenciamento;
  contratos: ContratoTecnologia[];
  setContratos: (value: ContratoTecnologia[]) => void;
  contratosAMS: ContratoAMS[];
  setContratosAMS: (value: ContratoAMS[]) => void;
  custosSaaS: CustoSaaS[];
  setCustosSaaS: (value: CustoSaaS[]) => void;
  manutencoesSaaS: ManutencaoSaaS[];
  setManutencoesSaaS: (value: ManutencaoSaaS[]) => void;
}

export function StepContracts({
  nivelSuporteInterno,
  tipoLicenciamento,
  contratos,
  setContratos,
  contratosAMS,
  setContratosAMS,
  custosSaaS,
  setCustosSaaS,
  manutencoesSaaS,
  setManutencoesSaaS,
}: StepContractsProps) {
  const hasAMS = nivelSuporteInterno === 'AMS';
  const hasSaaS = tipoLicenciamento === 'SaaS';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-1">Contratos da Tecnologia</h3>
          <p className="text-sm text-muted-foreground">
            Informações sobre contratos relacionados à tecnologia
          </p>
        </div>
        <ContratosTecnologiaTable
          contratos={contratos}
          onChange={setContratos}
        />
      </div>

      {hasAMS && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-1">Contratos AMS</h3>
            <p className="text-sm text-muted-foreground">
              Gerenciamento de contratos de Application Management Services
            </p>
          </div>
          <ContratosAMSTable
            contratos={contratosAMS}
            onChange={setContratosAMS}
          />
        </div>
      )}

      {hasSaaS && (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-1">Custos SaaS</h3>
              <p className="text-sm text-muted-foreground">
                Informações sobre licenças e custos do serviço SaaS
              </p>
            </div>
            <CustosSaaSTable
              custos={custosSaaS}
              onChange={setCustosSaaS}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-1">Manutenções SaaS</h3>
              <p className="text-sm text-muted-foreground">
                Registro de manutenções e indisponibilidades do serviço
              </p>
            </div>
            <ManutencoesSaaSTable
              manutencoes={manutencoesSaaS}
              onChange={setManutencoesSaaS}
            />
          </div>
        </>
      )}
    </div>
  );
}
