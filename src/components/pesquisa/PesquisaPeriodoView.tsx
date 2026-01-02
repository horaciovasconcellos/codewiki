import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { MagnifyingGlass, CalendarBlank, Users, Code } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AfastamentoResult {
  colaboradorId: string;
  colaboradorNome: string;
  tipoAfastamento: string;
  dataInicial: string;
  dataFinal: string;
  status: string;
}

interface ContratoResult {
  tecnologiaId: string;
  tecnologiaSigla: string;
  tecnologiaNome: string;
  numeroContrato: string;
  vigenciaInicial: string;
  vigenciaTermino: string;
  valorContrato: number;
  status: string;
}

export function PesquisaPeriodoView() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [afastamentos, setAfastamentos] = useState<AfastamentoResult[]>([]);
  const [contratos, setContratos] = useState<ContratoResult[]>([]);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);

  const handlePesquisar = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Preencha as datas de início e término');
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast.error('Data de início deve ser anterior à data de término');
      return;
    }

    try {
      setLoading(true);

      // Buscar afastamentos
      const afastamentosRes = await fetch(
        `${API_URL}/api/pesquisa/afastamentos?dataInicio=${dataInicio}&dataFim=${dataFim}`
      );
      
      if (!afastamentosRes.ok) throw new Error('Erro ao buscar afastamentos');
      const afastamentosData = await afastamentosRes.json();
      setAfastamentos(afastamentosData);

      // Buscar contratos
      const contratosRes = await fetch(
        `${API_URL}/api/pesquisa/contratos-tecnologias?dataInicio=${dataInicio}&dataFim=${dataFim}`
      );
      
      if (!contratosRes.ok) throw new Error('Erro ao buscar contratos');
      const contratosData = await contratosRes.json();
      setContratos(contratosData);

      setPesquisaRealizada(true);
      toast.success('Pesquisa realizada com sucesso');
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      toast.error('Erro ao realizar pesquisa');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpar = () => {
    setDataInicio('');
    setDataFim('');
    setAfastamentos([]);
    setContratos([]);
    setPesquisaRealizada(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MagnifyingGlass size={32} weight="duotone" className="text-primary" />
            Pesquisa por Período
          </h1>
          <p className="text-muted-foreground mt-2">
            Pesquise afastamentos de colaboradores e contratos de tecnologias por período
          </p>
        </div>
      </div>

      {/* Formulário de Pesquisa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarBlank size={24} weight="duotone" />
            Filtros de Pesquisa
          </CardTitle>
          <CardDescription>
            Selecione o período para pesquisar afastamentos e contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Término</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handlePesquisar} disabled={loading} className="flex-1">
                <MagnifyingGlass className="mr-2" weight="bold" />
                {loading ? 'Pesquisando...' : 'Pesquisar'}
              </Button>
              <Button variant="outline" onClick={handleLimpar} disabled={loading}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pesquisaRealizada && (
        <>
          {/* Resultado: Afastamentos */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={24} weight="duotone" />
                Colaboradores com Afastamentos
              </CardTitle>
              <CardDescription>
                {afastamentos.length} colaborador(es) ativo(s) com afastamento(s) no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {afastamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum afastamento encontrado no período
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Tipo de Afastamento</TableHead>
                        <TableHead>Data Inicial</TableHead>
                        <TableHead>Data Final</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {afastamentos.map((afastamento, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {afastamento.colaboradorNome}
                          </TableCell>
                          <TableCell>{afastamento.tipoAfastamento}</TableCell>
                          <TableCell>{formatarData(afastamento.dataInicial)}</TableCell>
                          <TableCell>{formatarData(afastamento.dataFinal)}</TableCell>
                          <TableCell>
                            <Badge variant={afastamento.status === 'Ativo' ? 'default' : 'secondary'}>
                              {afastamento.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultado: Contratos de Tecnologias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code size={24} weight="duotone" />
                Contratos de Tecnologias
              </CardTitle>
              <CardDescription>
                {contratos.length} contrato(s) de tecnologia(s) com vencimento no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contratos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum contrato encontrado no período
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tecnologia</TableHead>
                        <TableHead>Número do Contrato</TableHead>
                        <TableHead>Vigência Inicial</TableHead>
                        <TableHead>Vigência Término</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contratos.map((contrato, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{contrato.tecnologiaSigla}</div>
                              <div className="text-sm text-muted-foreground">
                                {contrato.tecnologiaNome}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {contrato.numeroContrato}
                          </TableCell>
                          <TableCell>{formatarData(contrato.vigenciaInicial)}</TableCell>
                          <TableCell>{formatarData(contrato.vigenciaTermino)}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(contrato.valorContrato)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                contrato.status === 'Ativo' || contrato.status === 'Vigente'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {contrato.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
