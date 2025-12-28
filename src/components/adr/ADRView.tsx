import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { ADR } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarBlank, 
  FileText, 
  ShieldCheck,
  LinkSimple,
  Buildings
} from '@phosphor-icons/react';

interface ADRViewProps {
  open: boolean;
  onClose: () => void;
  adr: ADR | null;
}

const statusColorMap: Record<string, string> = {
  'Proposto': 'bg-blue-100 text-blue-800 border-blue-300',
  'Aceito': 'bg-green-100 text-green-800 border-green-300',
  'Rejeitado': 'bg-red-100 text-red-800 border-red-300',
  'Substituído': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Obsoleto': 'bg-gray-100 text-gray-800 border-gray-300',
  'Adiado/Retirado': 'bg-orange-100 text-orange-800 border-orange-300'
};

const statusAplicacaoColorMap: Record<string, string> = {
  'Ativo': 'bg-green-100 text-green-800 border-green-300',
  'Inativo': 'bg-gray-100 text-gray-800 border-gray-300',
  'Planejado': 'bg-blue-100 text-blue-800 border-blue-300',
  'Descontinuado': 'bg-red-100 text-red-800 border-red-300'
};

export function ADRView({ open, onClose, adr }: ADRViewProps) {
  if (!adr) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const renderSection = (title: string, content?: string, icon?: React.ReactNode) => {
    if (!content) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {icon && <span className="text-xl">{icon}</span>}
          {title}
        </div>
        <div className="text-base text-muted-foreground whitespace-pre-wrap bg-muted/50 p-5 rounded-md min-h-[200px] max-h-[600px] overflow-y-auto leading-relaxed">
          {content}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[1120px] w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-mono">
              ADR-{adr.sequencia}
            </DialogTitle>
            <Badge 
              variant="outline" 
              className={`${statusColorMap[adr.status]} text-sm`}
            >
              {adr.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <CalendarBlank size={16} />
              Criado em {formatDate(adr.dataCriacao)}
            </div>
            {adr.dataAtualizacao && (
              <>
                <span>•</span>
                <div>Atualizado em {formatDate(adr.dataAtualizacao)}</div>
              </>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4 min-h-0">
          <div className="space-y-8 py-6">
            {/* Descrição */}
            <div className="space-y-3">
              <h3 className="font-semibold text-xl mb-3">Descrição</h3>
              <p className="text-base text-muted-foreground bg-muted/30 p-5 rounded-md leading-relaxed min-h-[120px]">{adr.descricao}</p>
            </div>

            <Separator />

            {/* ADR Substituta */}
            {adr.adrSubstitutaSequencia && (
              <>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <LinkSimple size={20} className="text-yellow-700" />
                  <span className="text-sm text-yellow-800">
                    Substituído por <span className="font-mono font-semibold">ADR-{adr.adrSubstitutaSequencia}</span>
                  </span>
                </div>
                <Separator />
              </>
            )}

            {/* Contexto */}
            {renderSection('Contexto', adr.contexto, <FileText size={16} />)}

            {/* Decisão */}
            {renderSection('Decisão', adr.decisao, <ShieldCheck size={16} />)}

            {/* Justificativa */}
            {renderSection('Justificativa', adr.justificativa, <FileText size={16} />)}

            <Separator />

            {/* Consequências Positivas */}
            {renderSection('Consequências Positivas', adr.consequenciasPositivas)}

            {/* Consequências Negativas */}
            {renderSection('Consequências Negativas', adr.consequenciasNegativas)}

            {/* Riscos */}
            {renderSection('Riscos', adr.riscos)}

            {/* Alternativas Consideradas */}
            {renderSection('Alternativas Consideradas', adr.alternativasConsideradas)}

            <Separator />

            {/* Compliance */}
            {renderSection('Compliance com Constitution', adr.complianceConstitution, <ShieldCheck size={16} />)}

            {/* Referências */}
            {adr.referencias && (
              <>
                <Separator />
                {renderSection('Referências', adr.referencias, <LinkSimple size={16} />)}
              </>
            )}

            {/* Aplicações Associadas */}
            {adr.aplicacoes && adr.aplicacoes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <Buildings size={18} />
                    Aplicações Associadas ({adr.aplicacoes.length})
                  </div>
                  <div className="grid gap-3">
                    {adr.aplicacoes.map((app, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold">
                              {app.aplicacaoSigla} - {app.aplicacaoNome}
                            </div>
                            {app.aplicacaoDescricao && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {app.aplicacaoDescricao}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={statusAplicacaoColorMap[app.status]}
                          >
                            {app.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {app.dataInicio && (
                            <div>
                              <span className="text-muted-foreground">Data Início:</span>{' '}
                              <span className="font-medium">{formatDateOnly(app.dataInicio)}</span>
                            </div>
                          )}
                          {app.dataTermino && (
                            <div>
                              <span className="text-muted-foreground">Data Término:</span>{' '}
                              <span className="font-medium">{formatDateOnly(app.dataTermino)}</span>
                            </div>
                          )}
                        </div>

                        {app.observacoes && (
                          <div className="mt-3 pt-3 border-t text-sm">
                            <span className="text-muted-foreground font-medium">Observações:</span>
                            <p className="mt-1 text-muted-foreground">{app.observacoes}</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
