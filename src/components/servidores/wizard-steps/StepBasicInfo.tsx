import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TipoServidor, AmbienteServidor, FinalidadeServidor, StatusServidor, ProvedorServidor, VirtualizadorServidor, SistemaOperacionalServidor, FerramentaMonitoramento } from '@/lib/types';

interface StepBasicInfoProps {
  sigla: string;
  setSigla: (value: string) => void;
  hostname: string;
  setHostname: (value: string) => void;
  tipo: TipoServidor;
  setTipo: (value: TipoServidor) => void;
  ambiente: AmbienteServidor;
  setAmbiente: (value: AmbienteServidor) => void;
  finalidade: FinalidadeServidor;
  setFinalidade: (value: FinalidadeServidor) => void;
  status: StatusServidor;
  setStatus: (value: StatusServidor) => void;
  provedor: ProvedorServidor;
  setProvedor: (value: ProvedorServidor) => void;
  datacenterRegiao?: string;
  setDatacenterRegiao: (value: string) => void;
  zonaAvailability?: string;
  setZonaAvailability: (value: string) => void;
  clusterHost?: string;
  setClusterHost: (value: string) => void;
  virtualizador?: VirtualizadorServidor;
  setVirtualizador: (value: VirtualizadorServidor) => void;
  sistemaOperacional: SistemaOperacionalServidor;
  setSistemaOperacional: (value: SistemaOperacionalServidor) => void;
  distribuicaoVersao?: string;
  setDistribuicaoVersao: (value: string) => void;
  arquitetura?: string;
  setArquitetura: (value: string) => void;
  ferramentaMonitoramento?: FerramentaMonitoramento;
  setFerramentaMonitoramento: (value: FerramentaMonitoramento) => void;
  backupDiario: boolean;
  setBackupDiario: (value: boolean) => void;
  backupSemanal: boolean;
  setBackupSemanal: (value: boolean) => void;
  backupMensal: boolean;
  setBackupMensal: (value: boolean) => void;
}

export function StepBasicInfo({
  sigla,
  setSigla,
  hostname,
  setHostname,
  tipo,
  setTipo,
  ambiente,
  setAmbiente,
  finalidade,
  setFinalidade,
  status,
  setStatus,
  provedor,
  setProvedor,
  datacenterRegiao,
  setDatacenterRegiao,
  zonaAvailability,
  setZonaAvailability,
  clusterHost,
  setClusterHost,
  virtualizador,
  setVirtualizador,
  sistemaOperacional,
  setSistemaOperacional,
  distribuicaoVersao,
  setDistribuicaoVersao,
  arquitetura,
  setArquitetura,
  ferramentaMonitoramento,
  setFerramentaMonitoramento,
  backupDiario,
  setBackupDiario,
  backupSemanal,
  setBackupSemanal,
  backupMensal,
  setBackupMensal
}: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>Informações básicas do servidor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sigla">Sigla do Servidor *</Label>
              <Input
                id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value.toUpperCase())}
                maxLength={20}
                required
                placeholder="Ex: SRVAPP01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname *</Label>
              <Input
                id="hostname"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                maxLength={50}
                required
                placeholder="Ex: server-app-01.example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Servidor</Label>
              <Select value={tipo} onValueChange={(value) => setTipo(value as TipoServidor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Físico">Físico</SelectItem>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Cloud">Cloud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente</Label>
              <Select value={ambiente} onValueChange={(value) => setAmbiente(value as AmbienteServidor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção">Produção</SelectItem>
                  <SelectItem value="Pré-Produção">Pré-Produção</SelectItem>
                  <SelectItem value="Homologação">Homologação</SelectItem>
                  <SelectItem value="Teste">Teste</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalidade">Finalidade</Label>
              <Select value={finalidade} onValueChange={(value) => setFinalidade(value as FinalidadeServidor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aplicação">Aplicação</SelectItem>
                  <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
                  <SelectItem value="Integração">Integração</SelectItem>
                  <SelectItem value="Batch">Batch</SelectItem>
                  <SelectItem value="Monitoramento">Monitoramento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusServidor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Em manutenção">Em manutenção</SelectItem>
                  <SelectItem value="Obsoleto">Obsoleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle>Plataforma</CardTitle>
          <CardDescription>Infraestrutura e virtualização</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provedor">Provedor</Label>
            <Select value={provedor} onValueChange={(value) => setProvedor(value as ProvedorServidor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On-Premise">On-Premise</SelectItem>
                <SelectItem value="AWS">AWS</SelectItem>
                <SelectItem value="Azure">Azure</SelectItem>
                <SelectItem value="OCI">OCI</SelectItem>
                <SelectItem value="GCP">GCP</SelectItem>
                <SelectItem value="IBM">IBM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datacenterRegiao">Datacenter/Região</Label>
            <Input
              id="datacenterRegiao"
              value={datacenterRegiao}
              onChange={(e) => setDatacenterRegiao(e.target.value)}
              maxLength={50}
              placeholder="Ex: us-east-1 ou DC-SP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zonaAvailability">Zona de Disponibilidade</Label>
            <Input
              id="zonaAvailability"
              value={zonaAvailability}
              onChange={(e) => setZonaAvailability(e.target.value)}
              maxLength={50}
              placeholder="Ex: us-east-1a"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clusterHost">Cluster/Host</Label>
            <Input
              id="clusterHost"
              value={clusterHost}
              onChange={(e) => setClusterHost(e.target.value)}
              maxLength={50}
              placeholder="Ex: cluster-prod-01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="virtualizador">Virtualizador</Label>
            <Select value={virtualizador} onValueChange={(value) => setVirtualizador(value as VirtualizadorServidor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VMware">VMware</SelectItem>
                <SelectItem value="Hyper-V">Hyper-V</SelectItem>
                <SelectItem value="KVM">KVM</SelectItem>
                <SelectItem value="Kubernetes">Kubernetes</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sistema Operacional */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema Operacional</CardTitle>
          <CardDescription>Configuração do sistema operacional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sistemaOperacional">Sistema Operacional</Label>
              <Select value={sistemaOperacional} onValueChange={(value) => setSistemaOperacional(value as SistemaOperacionalServidor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amazon Linux">Amazon Linux</SelectItem>
                  <SelectItem value="RHEL">RHEL</SelectItem>
                  <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                  <SelectItem value="SLES">SLES</SelectItem>
                  <SelectItem value="Debian">Debian</SelectItem>
                  <SelectItem value="Oracle Linux">Oracle Linux</SelectItem>
                  <SelectItem value="Windows Server">Windows Server</SelectItem>
                  <SelectItem value="Windows">Windows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distribuicaoVersao">Distribuição/Versão</Label>
              <Input
                id="distribuicaoVersao"
                value={distribuicaoVersao}
                onChange={(e) => setDistribuicaoVersao(e.target.value)}
                maxLength={50}
                placeholder="Ex: 22.04 LTS ou 2022"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arquitetura">Arquitetura</Label>
              <Input
                id="arquitetura"
                value={arquitetura}
                onChange={(e) => setArquitetura(e.target.value)}
                maxLength={20}
                placeholder="Ex: x86_64 ou arm64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operação e Monitoramento */}
      <Card>
        <CardHeader>
          <CardTitle>Operação e Monitoramento</CardTitle>
          <CardDescription>Configurações de backup e monitoramento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ferramentaMonitoramento">Ferramenta de Monitoramento</Label>
              <Select value={ferramentaMonitoramento} onValueChange={(value) => setFerramentaMonitoramento(value as FerramentaMonitoramento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zabbix">Zabbix</SelectItem>
                  <SelectItem value="Prometheus">Prometheus</SelectItem>
                  <SelectItem value="Dynatrace">Dynatrace</SelectItem>
                  <SelectItem value="DataDog">DataDog</SelectItem>
                  <SelectItem value="SigNoz">SigNoz</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Política de Backup</Label>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backupDiario"
                    checked={backupDiario}
                    onCheckedChange={(checked) => setBackupDiario(checked as boolean)}
                  />
                  <Label htmlFor="backupDiario" className="font-normal cursor-pointer">
                    Diário
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backupSemanal"
                    checked={backupSemanal}
                    onCheckedChange={(checked) => setBackupSemanal(checked as boolean)}
                  />
                  <Label htmlFor="backupSemanal" className="font-normal cursor-pointer">
                    Semanal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backupMensal"
                    checked={backupMensal}
                    onCheckedChange={(checked) => setBackupMensal(checked as boolean)}
                  />
                  <Label htmlFor="backupMensal" className="font-normal cursor-pointer">
                    Mensal
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
