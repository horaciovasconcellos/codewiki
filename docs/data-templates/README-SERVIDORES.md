# Carga de Dados - Servidores

Este arquivo contém exemplos de dados para carga de servidores no sistema.

## Arquivos Disponíveis

- `servidores.csv` - Formato CSV para importação
- `servidores.json` - Formato JSON para importação via API

## Estrutura dos Dados

### Campos Obrigatórios

- **sigla** (string, max 20): Sigla única do servidor (ex: SRV-APP-01)
- **hostname** (string, max 50): Nome do host/FQDN
- **tipo** (enum): Físico | Virtual | Cloud
- **ambiente** (enum): Produção | Pré-Produção | Homologação | Teste | Desenvolvimento
- **finalidade** (enum): Aplicação | Banco de Dados | Integração | Batch | Monitoramento
- **status** (enum): Ativo | Inativo | Em manutenção | Obsoleto
- **provedor** (enum): On-Premise | AWS | Azure | OCI | GCP | IBM
- **sistemaOperacional** (enum): Amazon Linux | RHEL | Ubuntu | SLES | Debian | Oracle Linux | Windows Server | Windows

### Campos Opcionais

- **datacenterRegiao** (string, max 60): Datacenter ou região cloud
- **zonaAvailability** (string, max 60): Zona de disponibilidade
- **clusterHost** (string, max 60): Nome do cluster ou host
- **virtualizador** (enum): VMware | Hyper-V | KVM | Kubernetes | N/A
- **distribuicaoVersao** (string, max 50): Versão da distribuição/SO
- **arquitetura** (string, max 20): Arquitetura do processador (x86_64, arm64, etc)
- **ferramentaMonitoramento** (enum): Zabbix | Prometheus | Dynatrace | DataDog | SigNoz | N/A
- **backupDiario** (boolean): Possui backup diário
- **backupSemanal** (boolean): Possui backup semanal
- **backupMensal** (boolean): Possui backup mensal

## Exemplos de Uso

### Importação via CSV

```bash
# Upload do arquivo CSV pela interface de Carga de Dados
# Selecione: Servidores > Importar CSV > servidores.csv
```

### Importação via API (JSON)

```bash
# POST individual
curl -X POST http://localhost:3000/api/servidores \
  -H "Content-Type: application/json" \
  -d @servidores.json

# Bulk insert
curl -X POST http://localhost:3000/api/bulk/servidores \
  -H "Content-Type: application/json" \
  -d @servidores.json
```

## Tipos de Servidores nos Exemplos

### Produção
- **SRV-APP-01/02**: Servidores de aplicação na AWS (cluster prod)
- **SRV-DB-01/02**: Servidores de banco de dados na AWS (cluster prod)
- **SRV-INT-01**: Servidor de integração no Azure
- **SRV-BATCH-01**: Servidor de processamento batch no OCI
- **SRV-MON-01**: Servidor físico de monitoramento

### Homologação
- **SRV-APP-HML**: Servidor de aplicação on-premise
- **SRV-DB-HML**: Servidor de banco de dados on-premise

### Teste
- **SRV-APP-TST**: Servidor de aplicação para testes
- **SRV-DB-TST**: Servidor de banco de dados para testes

### Desenvolvimento
- **SRV-APP-DEV**: Servidor de aplicação cloud (Kubernetes/ARM)
- **SRV-DB-DEV**: Servidor de banco de dados cloud (Kubernetes/ARM)

### Legados
- **SRV-LEGACY-01**: Servidor físico legado (em manutenção)
- **SRV-OLD-01**: Servidor virtual obsoleto (Windows 2012)

## Características dos Exemplos

### Por Provedor
- **AWS**: 6 servidores (produção e desenvolvimento)
- **Azure**: 1 servidor (integração)
- **OCI**: 1 servidor (batch)
- **On-Premise**: 7 servidores (diversos ambientes)

### Por Tipo
- **Virtual**: 12 servidores
- **Cloud**: 2 servidores (Kubernetes)
- **Físico**: 1 servidor (monitoramento e legado)

### Por Sistema Operacional
- **Linux**: 11 servidores (Ubuntu, RHEL, Debian, Oracle Linux, Amazon Linux)
- **Windows**: 4 servidores (Windows Server 2012-2022)

### Política de Backup
- **Backup completo** (diário+semanal+mensal): 5 servidores de produção críticos
- **Backup parcial**: 3 servidores de homologação/batch
- **Sem backup**: 7 servidores de desenvolvimento/teste

## Notas Importantes

1. **Siglas únicas**: Cada servidor deve ter uma sigla única no sistema
2. **Hostnames**: Use FQDNs quando possível para identificação clara
3. **Cloud vs Virtual**: "Cloud" é para containers/serverless, "Virtual" para VMs tradicionais
4. **Backups**: Defina políticas apropriadas para cada ambiente
5. **Monitoramento**: Servidores de produção devem ter ferramenta de monitoramento definida

## Validações do Sistema

- Sigla: máximo 20 caracteres, única
- Hostname: máximo 50 caracteres
- Campos enum: devem usar valores exatos da lista permitida
- Backup: pelo menos um tipo recomendado para servidores de produção

## Associação com Aplicações

Após importar os servidores, você pode associá-los a aplicações através do wizard:
1. Vá até a tela de Servidores
2. Edite um servidor
3. Na aba "Aplicações", adicione as aplicações que rodam naquele servidor
4. Defina data de início, data de término (opcional) e status

## Suporte

Para mais informações sobre carga de dados, consulte:
- `README-CARGA.md` - Guia geral de carga de dados
- Documentação do sistema em `/docs`
