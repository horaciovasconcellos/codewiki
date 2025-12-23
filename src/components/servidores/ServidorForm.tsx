import { useState, useEffect } from 'react';
import { Servidor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react';
import { v4 as uuidv4 } from 'uuid';

interface ServidorFormProps {
  servidor?: Servidor;
  onSave: (servidor: Servidor) => void;
  onCancel: () => void;
}

export function ServidorForm({ servidor, onSave, onCancel }: ServidorFormProps) {
  const [formData, setFormData] = useState<Servidor>(() => servidor || {
    id: '',
    sigla: '',
    hostname: '',
    tipo: 'Virtual',
    ambiente: 'Produção',
    finalidade: 'Aplicação',
    status: 'Ativo',
    provedor: 'On-Premise',
    datacenterRegiao: '',
    zonaAvailability: '',
    clusterHost: '',
    virtualizador: 'VMware',
    sistemaOperacional: 'Ubuntu',
    distribuicaoVersao: '',
    arquitetura: '',
    ferramentaMonitoramento: 'Zabbix',
    backupDiario: false,
    backupSemanal: false,
    backupMensal: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.sigla || formData.sigla.length > 20) {
      alert('Sigla é obrigatória e deve ter no máximo 20 caracteres');
      return;
    }
    
    if (!formData.hostname || formData.hostname.length > 50) {
      alert('Hostname é obrigatório e deve ter no máximo 50 caracteres');
      return;
    }

    const servidorToSave: Servidor = {
      ...formData,
      id: formData.id || uuidv4()
    };

    onSave(servidorToSave);
  };

  const handleChange = (field: keyof Servidor, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-3 max-w-5xl flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <SidebarTrigger />
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {servidor ? 'Editar Servidor' : 'Novo Servidor'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Preencha as informações do servidor
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-6">
          {/* Identificação */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
              <CardDescription>Informações básicas do servidor</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla do Servidor *</Label>
                <Input
                  id="sigla"
                  value={formData.sigla}
                  onChange={(e) => handleChange('sigla', e.target.value.toUpperCase())}
                  maxLength={20}
                  required
                  placeholder="SRV-APP-01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostname">Nome do Servidor (Hostname) *</Label>
                <Input
                  id="hostname"
                  value={formData.hostname}
                  onChange={(e) => handleChange('hostname', e.target.value)}
                  maxLength={50}
                  required
                  placeholder="servidor-aplicacao-01.dominio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange('tipo', value)}
                >
                  <SelectTrigger id="tipo">
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
                <Label htmlFor="ambiente">Ambiente *</Label>
                <Select
                  value={formData.ambiente}
                  onValueChange={(value) => handleChange('ambiente', value)}
                >
                  <SelectTrigger id="ambiente">
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
                <Label htmlFor="finalidade">Finalidade *</Label>
                <Select
                  value={formData.finalidade}
                  onValueChange={(value) => handleChange('finalidade', value)}
                >
                  <SelectTrigger id="finalidade">
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
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status">
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
            </CardContent>
          </Card>

          {/* Plataforma */}
          <Card>
            <CardHeader>
              <CardTitle>Plataforma</CardTitle>
              <CardDescription>Informações de infraestrutura</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provedor">Provedor *</Label>
                <Select
                  value={formData.provedor}
                  onValueChange={(value) => handleChange('provedor', value)}
                >
                  <SelectTrigger id="provedor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-Premise">On-Premise</SelectItem>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Azure">Azure</SelectItem>
                    <SelectItem value="OCI">OCI (Oracle Cloud)</SelectItem>
                    <SelectItem value="GCP">GCP (Google Cloud)</SelectItem>
                    <SelectItem value="IBM">IBM Cloud</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="datacenterRegiao">Datacenter / Região</Label>
                <Input
                  id="datacenterRegiao"
                  value={formData.datacenterRegiao || ''}
                  onChange={(e) => handleChange('datacenterRegiao', e.target.value)}
                  maxLength={60}
                  placeholder="us-east-1, Datacenter Brasília"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zonaAvailability">Zona / Availability Zone</Label>
                <Input
                  id="zonaAvailability"
                  value={formData.zonaAvailability || ''}
                  onChange={(e) => handleChange('zonaAvailability', e.target.value)}
                  maxLength={60}
                  placeholder="us-east-1a, Zona A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clusterHost">Cluster / Host</Label>
                <Input
                  id="clusterHost"
                  value={formData.clusterHost || ''}
                  onChange={(e) => handleChange('clusterHost', e.target.value)}
                  maxLength={60}
                  placeholder="cluster-prod-01, host-esxi-05"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="virtualizador">Virtualizador / Orquestrador</Label>
                <Select
                  value={formData.virtualizador}
                  onValueChange={(value) => handleChange('virtualizador', value)}
                >
                  <SelectTrigger id="virtualizador">
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
              <CardDescription>Informações do SO</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sistemaOperacional">Sistema Operacional *</Label>
                <Select
                  value={formData.sistemaOperacional}
                  onValueChange={(value) => handleChange('sistemaOperacional', value)}
                >
                  <SelectTrigger id="sistemaOperacional">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amazon Linux">Amazon Linux</SelectItem>
                    <SelectItem value="RHEL">RHEL (Red Hat)</SelectItem>
                    <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                    <SelectItem value="SLES">SLES (SUSE)</SelectItem>
                    <SelectItem value="Debian">Debian</SelectItem>
                    <SelectItem value="Oracle Linux">Oracle Linux</SelectItem>
                    <SelectItem value="Windows Server">Windows Server</SelectItem>
                    <SelectItem value="Windows">Windows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="distribuicaoVersao">Distribuição / Versão</Label>
                <Input
                  id="distribuicaoVersao"
                  value={formData.distribuicaoVersao || ''}
                  onChange={(e) => handleChange('distribuicaoVersao', e.target.value)}
                  maxLength={20}
                  placeholder="22.04, 2022, 8.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arquitetura">Arquitetura</Label>
                <Input
                  id="arquitetura"
                  value={formData.arquitetura || ''}
                  onChange={(e) => handleChange('arquitetura', e.target.value)}
                  maxLength={20}
                  placeholder="x86_64, arm64"
                />
              </div>
            </CardContent>
          </Card>

          {/* Operação e Monitoramento */}
          <Card>
            <CardHeader>
              <CardTitle>Operação e Monitoramento</CardTitle>
              <CardDescription>Configurações de monitoramento e backup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ferramentaMonitoramento">Ferramenta de Monitoramento</Label>
                <Select
                  value={formData.ferramentaMonitoramento}
                  onValueChange={(value) => handleChange('ferramentaMonitoramento', value)}
                >
                  <SelectTrigger id="ferramentaMonitoramento">
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

              <div className="space-y-3 md:col-span-2">
                <Label>Política de Backup</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backupDiario"
                      checked={formData.backupDiario}
                      onCheckedChange={(checked) => handleChange('backupDiario', checked)}
                    />
                    <label
                      htmlFor="backupDiario"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Backup Diário
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backupSemanal"
                      checked={formData.backupSemanal}
                      onCheckedChange={(checked) => handleChange('backupSemanal', checked)}
                    />
                    <label
                      htmlFor="backupSemanal"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Backup Semanal
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backupMensal"
                      checked={formData.backupMensal}
                      onCheckedChange={(checked) => handleChange('backupMensal', checked)}
                    />
                    <label
                      htmlFor="backupMensal"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Backup Mensal
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3 justify-end pb-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              <FloppyDisk className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
