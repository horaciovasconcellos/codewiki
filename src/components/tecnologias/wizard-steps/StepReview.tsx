import { CategoriaTecnologia, StatusTecnologia, TipoLicenciamento, MaturidadeInterna, NivelSuporteInterno, Ambiente, ContratoAMS, ResponsavelTecnologia, CustoSaaS, ManutencaoSaaS, Colaborador } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from '@phosphor-icons/react';

interface StepReviewProps {
  sigla: string;
  nome: string;
  versaoRelease: string;
  categoria: CategoriaTecnologia;
  status: StatusTecnologia;
  fornecedorFabricante: string;
  tipoLicenciamento: TipoLicenciamento;
  ambientes: Ambiente;
  dataFimSuporteEoS: string;
  maturidadeInterna: MaturidadeInterna;
  nivelSuporteInterno: NivelSuporteInterno;
  documentacaoOficial: string;
  repositorioInterno: string;
  contratosAMS: ContratoAMS[];
  responsaveis: ResponsavelTecnologia[];
  custosSaaS: CustoSaaS[];
  manutencoesSaaS: ManutencaoSaaS[];
  colaboradores: Colaborador[];
}

export function StepReview({
  sigla,
  nome,
  versaoRelease,
  categoria,
  status,
  fornecedorFabricante,
  tipoLicenciamento,
  ambientes,
  dataFimSuporteEoS,
  maturidadeInterna,
  nivelSuporteInterno,
  documentacaoOficial,
  repositorioInterno,
  contratosAMS,
  responsaveis,
  custosSaaS,
  manutencoesSaaS,
  colaboradores,
}: StepReviewProps) {
  const getAmbientesText = (): string => {
    const ambientesAtivos: string[] = [];
    if (ambientes.dev) ambientesAtivos.push('Dev');
    if (ambientes.qa) ambientesAtivos.push('QA');
    if (ambientes.prod) ambientesAtivos.push('Prod');
    if (ambientes.cloud) ambientesAtivos.push('Cloud');
    if (ambientes.onPremise) ambientesAtivos.push('On-Premise');
    return ambientesAtivos.join(', ') || 'Nenhum';
  };

  const getColaboradorNome = (matricula: string): string => {
    const colab = colaboradores.find(c => c.matricula === matricula);
    return colab?.nome || matricula;
  };

  const InfoRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-primary" size={20} />
            <h3 className="font-medium">Revise as Informações</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Confira todos os dados antes de finalizar o cadastro
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Informações Básicas</h3>
          <div className="space-y-1">
            <InfoRow label="Sigla" value={sigla} />
            <InfoRow label="Nome" value={nome} />
            <InfoRow label="Versão" value={versaoRelease} />
            <InfoRow label="Categoria" value={categoria} />
            <InfoRow label="Status" value={<Badge variant={status === 'Ativa' ? 'default' : 'secondary'}>{status}</Badge>} />
            <InfoRow label="Fornecedor/Fabricante" value={fornecedorFabricante} />
            <InfoRow label="Licenciamento" value={tipoLicenciamento} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Ambientes e Infraestrutura</h3>
          <div className="space-y-1">
            <InfoRow label="Ambientes" value={getAmbientesText()} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Suporte e Maturidade</h3>
          <div className="space-y-1">
            <InfoRow label="Maturidade Interna" value={maturidadeInterna} />
            <InfoRow label="Nível de Suporte" value={nivelSuporteInterno} />
            {dataFimSuporteEoS && (
              <InfoRow 
                label="Fim de Suporte" 
                value={new Date(dataFimSuporteEoS).toLocaleDateString('pt-BR')} 
              />
            )}
            {documentacaoOficial && (
              <InfoRow 
                label="Documentação" 
                value={
                  <a 
                    href={documentacaoOficial} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ver documentação
                  </a>
                } 
              />
            )}
            {repositorioInterno && (
              <InfoRow 
                label="Repositório" 
                value={
                  <a 
                    href={repositorioInterno} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ver repositório
                  </a>
                } 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {responsaveis.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-base">Responsáveis</h3>
            <div className="space-y-2">
              {responsaveis.map((resp, index) => (
                <div key={resp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{getColaboradorNome(resp.matriculaFuncionario)}</p>
                    <p className="text-xs text-muted-foreground">{resp.perfil}</p>
                  </div>
                  <Badge variant={resp.status === 'Ativo' ? 'default' : 'secondary'}>
                    {resp.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(contratosAMS.length > 0 || custosSaaS.length > 0 || manutencoesSaaS.length > 0) && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-base">Contratos e Custos</h3>
            {contratosAMS.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Contratos AMS: {contratosAMS.length}</p>
              </div>
            )}
            {custosSaaS.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Custos SaaS: {custosSaaS.length} registro(s)</p>
              </div>
            )}
            {manutencoesSaaS.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Manutenções SaaS: {manutencoesSaaS.length} registro(s)</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
