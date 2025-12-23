import { Tecnologia, Colaborador } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PencilSimple, Trash, DeviceMobile, TestTube, RocketLaunch, Cloud, HardDrives, Calendar, Link as LinkIcon, GithubLogo, CurrencyDollar } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface TecnologiaDetailsProps {
  tecnologia: Tecnologia;
  colaboradores: Colaborador[];
  onEdit: (tecnologia: Tecnologia) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function TecnologiaDetails({ tecnologia, colaboradores, onEdit, onDelete, onBack }: TecnologiaDetailsProps) {
  const handleDelete = () => {
    onDelete(tecnologia.id);
    toast.success(`Tecnologia "${tecnologia.nome}" excluída com sucesso`);
    onBack();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'default';
      case 'Em avaliação':
        return 'secondary';
      case 'Obsoleta':
        return 'outline';
      case 'Descontinuada':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getColaboradorNome = (matricula: string): string => {
    const colab = colaboradores.find(c => c.matricula === matricula);
    return colab?.nome || matricula;
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{tecnologia.nome}</h1>
                <p className="text-muted-foreground mt-1">{tecnologia.sigla}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onEdit(tecnologia)}>
                <PencilSimple className="mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a tecnologia "{tecnologia.nome}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Versão/Release" value={tecnologia.versaoRelease} />
                <InfoRow label="Categoria" value={tecnologia.categoria} />
                <InfoRow 
                  label="Status" 
                  value={
                    <Badge variant={getStatusVariant(tecnologia.status)}>
                      {tecnologia.status}
                    </Badge>
                  } 
                />
                <InfoRow label="Fornecedor/Fabricante" value={tecnologia.fornecedorFabricante} />
                <InfoRow label="Tipo de Licenciamento" value={tecnologia.tipoLicenciamento} />
                {tecnologia.dataFimSuporteEoS && (
                  <InfoRow 
                    label="Fim de Suporte (EoS/EoL)" 
                    value={new Date(tecnologia.dataFimSuporteEoS).toLocaleDateString('pt-BR')}
                    icon={<Calendar size={16} />}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ambientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {tecnologia.ambientes.dev && (
                    <Badge variant="secondary" className="px-4 py-2">
                      <DeviceMobile size={16} className="mr-2" />
                      Desenvolvimento
                    </Badge>
                  )}
                  {tecnologia.ambientes.qa && (
                    <Badge variant="secondary" className="px-4 py-2">
                      <TestTube size={16} className="mr-2" />
                      QA / Testes
                    </Badge>
                  )}
                  {tecnologia.ambientes.prod && (
                    <Badge variant="secondary" className="px-4 py-2">
                      <RocketLaunch size={16} className="mr-2" />
                      Produção
                    </Badge>
                  )}
                  {tecnologia.ambientes.cloud && (
                    <Badge variant="secondary" className="px-4 py-2">
                      <Cloud size={16} className="mr-2" />
                      Cloud
                    </Badge>
                  )}
                  {tecnologia.ambientes.onPremise && (
                    <Badge variant="secondary" className="px-4 py-2">
                      <HardDrives size={16} className="mr-2" />
                      On-Premise
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {(tecnologia.documentacaoOficial || tecnologia.repositorioInterno) && (
              <Card>
                <CardHeader>
                  <CardTitle>Recursos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tecnologia.documentacaoOficial && (
                    <a
                      href={tecnologia.documentacaoOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <LinkIcon size={16} />
                      Documentação Oficial
                    </a>
                  )}
                  {tecnologia.repositorioInterno && (
                    <a
                      href={tecnologia.repositorioInterno}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <GithubLogo size={16} />
                      Repositório Interno
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {(tecnologia.responsaveis?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsáveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tecnologia.responsaveis?.map((resp) => (
                      <div key={resp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{getColaboradorNome(resp.matriculaFuncionario)}</p>
                          <p className="text-sm text-muted-foreground">{resp.perfil}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Início: {new Date(resp.dataInicio).toLocaleDateString('pt-BR')}
                            {resp.dataTermino && ` • Término: ${new Date(resp.dataTermino).toLocaleDateString('pt-BR')}`}
                          </p>
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
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suporte e Maturidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Maturidade Interna" value={tecnologia.maturidadeInterna} />
                <InfoRow label="Nível de Suporte" value={tecnologia.nivelSuporteInterno} />
              </CardContent>
            </Card>

            {(tecnologia.contratosAMS?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contratos AMS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tecnologia.contratosAMS?.map((contrato) => (
                      <div key={contrato.id} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium text-sm">{contrato.contrato}</p>
                        <p className="text-xs text-muted-foreground mt-1">CNPJ: {contrato.cnpjContratado}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')} até {new Date(contrato.dataTermino).toLocaleDateString('pt-BR')}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-primary">
                            R$ {contrato.custoAnual.toLocaleString('pt-BR')}/ano
                          </span>
                          <Badge variant={contrato.status === 'Ativo' ? 'default' : 'secondary'}>
                            {contrato.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(tecnologia.custosSaaS?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custos SaaS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tecnologia.custosSaaS?.map((custo) => (
                      <div key={custo.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <CurrencyDollar size={16} className="text-primary" />
                          <span className="font-medium">
                            R$ {custo.custoTotalSaaS.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Custo por licença: R$ {custo.custoPorLicenca.toLocaleString('pt-BR')}</p>
                          <p>Licenças: {custo.licencasUtilizadas} / {custo.numeroLicencasContratadas}</p>
                          <p>SLA cumprido: {custo.slaCumprido}%</p>
                          <p>Crescimento MoM: {custo.crescimentoCustoMensalMoM}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(tecnologia.manutencoesSaaS?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Manutenções SaaS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tecnologia.manutencoesSaaS?.map((manutencao) => (
                      <div key={manutencao.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {new Date(manutencao.dataHoraInicio).toLocaleString('pt-BR')}
                        </p>
                        <p className="font-medium mt-1">
                          {manutencao.tempoIndisponibilidadeHoras}h de indisponibilidade
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
