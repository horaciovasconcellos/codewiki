import { useState } from 'react';
import { OptInOut } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, UploadSimple, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';
import { apiDelete } from '@/hooks/use-api';
import { generateUUID } from '@/utils/uuid';

interface OptInOutStepProps {
  optInOuts: OptInOut[];
  setOptInOuts: (optInOuts: OptInOut[]) => void;
  aplicacoes: Array<{ id: string; nome: string }>;
}

export function OptInOutStep({
  optInOuts,
  setOptInOuts,
  aplicacoes
}: OptInOutStepProps) {
  console.log('[OptInOutStep] Aplicações recebidas:', aplicacoes);
  console.log('[OptInOutStep] Total de aplicações:', aplicacoes.length);
  
  // Data de início sempre será a data atual do sistema
  const hoje = new Date().toISOString().split('T')[0];
  
  const [aplicacaoId, setAplicacaoId] = useState<string>('');
  const [dataInicio] = useState(hoje); // Não precisa do setter pois é readonly
  const [dataRevogacao, setDataRevogacao] = useState('');
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const [assinaturaEletronica, setAssinaturaEletronica] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são permitidos');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('O arquivo deve ter no máximo 5MB');
        e.target.value = '';
        return;
      }
      setArquivoPdf(file);
    }
  };

  const handleAddOptInOut = () => {
    if (!aplicacaoId || !dataInicio) {
      toast.error('Preencha os campos obrigatórios (Aplicação e Data de Início)');
      return;
    }

    if (dataRevogacao && dataInicio > dataRevogacao) {
      toast.error('A data de início não pode ser posterior à data de revogação');
      return;
    }

    if (!arquivoPdf) {
      toast.error('É necessário anexar o arquivo PDF');
      return;
    }

    if (!assinaturaEletronica) {
      toast.error('É necessário informar a assinatura eletrônica');
      return;
    }

    // Verificar se já existe opt-in para a mesma aplicação
    const optInExistente = optInOuts.find(opt => opt.aplicacaoId === aplicacaoId && !opt.dataRevogacao);
    if (optInExistente) {
      toast.error('Já existe um Opt-In ativo para esta aplicação');
      return;
    }

    // Converter arquivo para base64 ou URL (em produção, seria feito upload para servidor)
    const reader = new FileReader();
    reader.onloadend = () => {
      const novoOptInOut: OptInOut = {
        id: generateUUID(),
        aplicacaoId,
        dataInicio,
        dataRevogacao: dataRevogacao || undefined,
        arquivoPdf: reader.result as string,
        assinaturaEletronica
      };

      setOptInOuts([...optInOuts, novoOptInOut]);
      
      // Limpar formulário
      setAplicacaoId('');
      setDataInicio('');
      setDataRevogacao('');
      setArquivoPdf(null);
      setAssinaturaEletronica('');
      
      // Limpar input de arquivo
      const fileInput = document.getElementById('arquivoPdf') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success('Opt-In/Out adicionado');
    };
    reader.readAsDataURL(arquivoPdf);
  };

  const handleRemoveOptInOut = async (id: string) => {
    const optInOut = optInOuts.find(opt => opt.id === id);
    
    // Só tentar deletar da API se o registro tem colaboradorId (foi salvo no banco)
    if (optInOut && optInOut.colaboradorId) {
      try {
        await apiDelete(`/optinouts/${id}`);
        toast.success('Opt-In/Out removido');
      } catch (error) {
        console.error('Erro ao deletar Opt-In/Out:', error);
        toast.error('Erro ao remover Opt-In/Out do servidor');
        return;
      }
    } else {
      // Registro ainda não foi salvo, apenas remover localmente
      toast.success('Opt-In/Out removido');
    }
    
    // Remover do estado local
    setOptInOuts(optInOuts.filter(opt => opt.id !== id));
  };

  const getAplicacaoNome = (aplicacaoId: string) => {
    const aplicacao = aplicacoes.find(a => a.id === aplicacaoId);
    return aplicacao ? aplicacao.nome : aplicacaoId;
  };

  const handleDownloadPdf = (optInOut: OptInOut) => {
    if (!optInOut.arquivoPdf) return;
    
    const link = document.createElement('a');
    link.href = optInOut.arquivoPdf;
    link.download = `opt-in-out-${getAplicacaoNome(optInOut.aplicacaoId)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold mb-4">Adicionar Opt-In/Out</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aplicacao">Aplicação *</Label>
              <Select value={aplicacaoId} onValueChange={setAplicacaoId}>
                <SelectTrigger id="aplicacao">
                  <SelectValue placeholder="Selecione a aplicação" />
                </SelectTrigger>
                <SelectContent>
                  {aplicacoes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Carregando aplicações...</div>
                  ) : (
                    aplicacoes.map((aplicacao) => (
                      <SelectItem key={aplicacao.id} value={aplicacao.id}>
                        {aplicacao.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {aplicacoes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aguardando carregamento de aplicações...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Data preenchida automaticamente com a data atual
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataRevogacao">Data de Revogação</Label>
              <Input
                id="dataRevogacao"
                type="date"
                value={dataRevogacao}
                onChange={(e) => setDataRevogacao(e.target.value)}
                min={dataInicio}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assinaturaEletronica">Assinatura Eletrônica *</Label>
              <Input
                id="assinaturaEletronica"
                type="text"
                placeholder="Hash ou identificador da assinatura"
                value={assinaturaEletronica}
                onChange={(e) => setAssinaturaEletronica(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="arquivoPdf">Arquivo PDF *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="arquivoPdf"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              {arquivoPdf && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={20} />
                  <span className="text-sm">{arquivoPdf.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 5MB - Somente arquivos PDF
            </p>
          </div>

          <Button onClick={handleAddOptInOut} className="w-full">
            <Plus className="mr-2" />
            Adicionar Opt-In/Out
          </Button>
        </div>
      </div>

      {optInOuts.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Opt-In/Out Cadastrados ({optInOuts.length})</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aplicação</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Data de Revogação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optInOuts.map((optInOut) => (
                  <TableRow key={optInOut.id}>
                    <TableCell className="font-medium">{getAplicacaoNome(optInOut.aplicacaoId)}</TableCell>
                    <TableCell>{formatarData(optInOut.dataInicio)}</TableCell>
                    <TableCell>
                      {optInOut.dataRevogacao ? formatarData(optInOut.dataRevogacao) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                        ${!optInOut.dataRevogacao ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {!optInOut.dataRevogacao ? 'Ativo' : 'Revogado'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">{optInOut.assinaturaEletronica?.substring(0, 12)}...</span>
                    </TableCell>
                    <TableCell>
                      {optInOut.arquivoPdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(optInOut)}
                        >
                          <UploadSimple size={16} />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOptInOut(optInOut.id)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
