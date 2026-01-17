import React from 'react';
import { Checkpoint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckpointDetalhesManager } from './CheckpointDetalhesManager';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';

interface CheckpointDetailsProps {
  checkpoint: Checkpoint;
  onBack: () => void;
}

export function CheckpointDetails({ checkpoint, onBack }: CheckpointDetailsProps) {
  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const STATUS_BADGE: Record<string, string> = {
    'OK': 'bg-green-100 text-green-800',
    'Em Risco': 'bg-yellow-100 text-yellow-800',
    'Bloqueado': 'bg-red-100 text-red-800',
  };

  const CATEGORIA_BADGE: Record<string, string> = {
    'Escopo': 'bg-blue-100 text-blue-800',
    'Prazo': 'bg-purple-100 text-purple-800',
    'Custo': 'bg-orange-100 text-orange-800',
    'Qualidade': 'bg-teal-100 text-teal-800',
    'Seguranca': 'bg-red-100 text-red-800',
    'Compliance': 'bg-indigo-100 text-indigo-800',
  };

  const isFinalized = !!checkpoint.dataReal;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{checkpoint.descricao}</h2>
              <p className="text-sm text-muted-foreground">
                {checkpoint.aplicacaoSigla || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={CATEGORIA_BADGE[checkpoint.categoria]}>
              {checkpoint.categoria}
            </Badge>
            <Badge className={STATUS_BADGE[checkpoint.status]}>
              {checkpoint.status}
            </Badge>
            {isFinalized && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Finalizado
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-6 mt-6">
          {/* Card: Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Descrição</Label>
                  <p className="text-sm">{checkpoint.descricao}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Aplicação</Label>
                  <p className="text-sm">{checkpoint.aplicacaoSigla || 'N/A'}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Categoria</Label>
                  <div className="mt-1">
                    <Badge className={CATEGORIA_BADGE[checkpoint.categoria]}>
                      {checkpoint.categoria}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">
                    <Badge className={STATUS_BADGE[checkpoint.status]}>
                      {checkpoint.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Data Prevista</Label>
                  <p className="text-sm">{formatDate(checkpoint.dataPrevista)}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Data Real</Label>
                  <p className="text-sm">
                    {checkpoint.dataReal ? formatDate(checkpoint.dataReal) : (
                      <span className="text-muted-foreground">Não concluído</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Detalhes */}
          <CheckpointDetalhesManager checkpointId={checkpoint.id} isFinalized={isFinalized} />

          {/* Card: Auditoria */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Auditoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-semibold">Criado em</Label>
                  <p className="text-muted-foreground">
                    {checkpoint.createdAt ? new Date(checkpoint.createdAt).toLocaleString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Atualizado em</Label>
                  <p className="text-muted-foreground">
                    {checkpoint.updatedAt ? new Date(checkpoint.updatedAt).toLocaleString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
