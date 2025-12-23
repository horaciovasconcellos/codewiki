import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusToken, AmbienteToken, EscopoToken } from '@/lib/types';
import { Funnel, X } from '@phosphor-icons/react';

interface TokenFiltersProps {
  onFilter: (filters: {
    status?: StatusToken;
    ambiente?: AmbienteToken;
    escopo?: EscopoToken;
    entidade?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => void;
}

export function TokenFilters({ onFilter }: TokenFiltersProps) {
  const [status, setStatus] = useState<StatusToken | 'todos'>('todos');
  const [ambiente, setAmbiente] = useState<AmbienteToken | 'todos'>('todos');
  const [escopo, setEscopo] = useState<EscopoToken | 'todos'>('todos');
  const [entidade, setEntidade] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const handleApplyFilters = () => {
    onFilter({
      status: status !== 'todos' ? status as StatusToken : undefined,
      ambiente: ambiente !== 'todos' ? ambiente as AmbienteToken : undefined,
      escopo: escopo !== 'todos' ? escopo as EscopoToken : undefined,
      entidade: entidade || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    });
  };

  const handleClearFilters = () => {
    setStatus('todos');
    setAmbiente('todos');
    setEscopo('todos');
    setEntidade('');
    setDataInicio('');
    setDataFim('');
    onFilter({});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as StatusToken | 'todos')}>
            <SelectTrigger id="filter-status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Revogado">Revogado</SelectItem>
              <SelectItem value="Expirado">Expirado</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Suspenso">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-ambiente">Ambiente</Label>
          <Select value={ambiente} onValueChange={(value) => setAmbiente(value as AmbienteToken | 'todos')}>
            <SelectTrigger id="filter-ambiente">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
              <SelectItem value="Homologação">Homologação</SelectItem>
              <SelectItem value="Produção">Produção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-escopo">Escopo</Label>
          <Select value={escopo} onValueChange={(value) => setEscopo(value as EscopoToken | 'todos')}>
            <SelectTrigger id="filter-escopo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="READ">READ</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="FINANCEIRO">FINANCEIRO</SelectItem>
              <SelectItem value="AUDITORIA">AUDITORIA</SelectItem>
              <SelectItem value="INTEGRACAO">INTEGRACAO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-entidade">Entidade / Sistema</Label>
          <Input
            id="filter-entidade"
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
            placeholder="Buscar por nome ou ID..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-data-inicio">Data Início (≥)</Label>
          <Input
            id="filter-data-inicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-data-fim">Data Expiração (≤)</Label>
          <Input
            id="filter-data-fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters}>
          <Funnel className="mr-2" />
          Aplicar Filtros
        </Button>
        <Button variant="outline" onClick={handleClearFilters}>
          <X className="mr-2" />
          Limpar
        </Button>
      </div>
    </div>
  );
}
