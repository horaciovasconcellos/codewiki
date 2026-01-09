import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TokenAcesso, TipoEntidadeToken, EscopoToken, AmbienteToken, HistoricoTokenAcesso } from '@/lib/types';
import { Plus, Copy, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import * as jose from 'jose';
import { generateUUID } from '@/utils/uuid';

interface TokenFormProps {
  tokens: TokenAcesso[];
  onSave: (token: TokenAcesso) => void;
  editToken?: TokenAcesso;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TokenForm({ tokens, onSave, editToken, onClose, open: controlledOpen, onOpenChange }: TokenFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const getInitialFormData = (): Partial<TokenAcesso> => {
    if (editToken) return editToken;
    return {
      tipoEntidade: 'Sistema' as TipoEntidadeToken,
      escopos: [],
      ambiente: 'Desenvolvimento' as AmbienteToken,
      tokenTemporario: false,
      permitirRegeneracao: true,
      rateLimitPorHora: 100,
      origensPermitidas: [],
      requerMFA: false,
      quantidadeAcessos: 0,
    };
  };
  
  const [formData, setFormData] = useState<Partial<TokenAcesso>>(getInitialFormData());

  const escoposDisponiveis: EscopoToken[] = ['INSERT', 'UPDATE', 'DELETE', 'READ', 'ADMIN', 'FINANCEIRO', 'AUDITORIA', 'INTEGRACAO'];

  const generateJWTToken = async (tokenData: Partial<TokenAcesso>) => {
    const systemUrl = window.location.origin;
    const secret = new TextEncoder().encode(generateUUID() + Date.now().toString(36));
    
    const payload = {
      jti: generateUUID(),
      iss: systemUrl,
      sub: tokenData.identificadorEntidade,
      aud: systemUrl,
      exp: tokenData.dataExpiracao 
        ? Math.floor(new Date(tokenData.dataExpiracao).getTime() / 1000) 
        : Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      nbf: Math.floor(new Date(tokenData.dataInicioValidade!).getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
      entity: {
        type: tokenData.tipoEntidade,
        id: tokenData.identificadorEntidade,
        name: tokenData.nomeEntidade,
      },
      scopes: tokenData.escopos,
      environment: tokenData.ambiente,
      rateLimit: tokenData.rateLimitPorHora,
      mfa: tokenData.requerMFA,
      origins: tokenData.origensPermitidas,
    };
    
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(systemUrl)
      .setSubject(tokenData.identificadorEntidade!)
      .setAudience(systemUrl)
      .setExpirationTime(payload.exp)
      .setNotBefore(payload.nbf)
      .sign(secret);
    
    return token;
  };

  const hashToken = (token: string) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  };

  const handleSave = async () => {
    if (!formData.tipoEntidade || !formData.identificadorEntidade || !formData.nomeEntidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.escopos || formData.escopos.length === 0) {
      toast.error('Selecione pelo menos um escopo');
      return;
    }

    if (!formData.dataInicioValidade) {
      toast.error('Informe a data de início da validade');
      return;
    }

    const user = { login: 'sistema' };
    const now = new Date().toISOString();
    
    let tokenHash = formData.tokenHash;
    let plainToken: string | null = null;

    if (!editToken) {
      plainToken = await generateJWTToken(formData);
      tokenHash = hashToken(plainToken);
    }

    // Criar entrada de histórico
    const novaEntradaHistorico: HistoricoTokenAcesso = {
      id: generateUUID(),
      tokenId: editToken?.id || generateUUID(),
      tipoAcao: editToken ? 'Alteração de Escopos' : 'Criação',
      descricao: editToken 
        ? `Token atualizado - Alteração nos dados do token`
        : `Token criado para ${formData.nomeEntidade}`,
      realizadoPor: user?.login || 'sistema',
      dataHora: now,
      dadosAnteriores: editToken ? {
        escopos: editToken.escopos,
        ambiente: editToken.ambiente,
        status: editToken.status,
      } : undefined,
      dadosNovos: {
        escopos: formData.escopos,
        ambiente: formData.ambiente,
        status: editToken?.status || 'Ativo',
      }
    };

    const token: TokenAcesso = {
      id: editToken?.id || generateUUID(),
      tokenHash: tokenHash!,
      tipoEntidade: formData.tipoEntidade!,
      identificadorEntidade: formData.identificadorEntidade!,
      nomeEntidade: formData.nomeEntidade!,
      escopos: formData.escopos!,
      ambiente: formData.ambiente!,
      dataGeracao: editToken?.dataGeracao || now,
      dataInicioValidade: formData.dataInicioValidade!,
      dataExpiracao: formData.dataExpiracao,
      tokenTemporario: formData.tokenTemporario || false,
      motivoExpiracao: formData.motivoExpiracao,
      permitirRegeneracao: formData.permitirRegeneracao ?? true,
      rateLimitPorHora: formData.rateLimitPorHora || 100,
      origensPermitidas: formData.origensPermitidas || [],
      requerMFA: formData.requerMFA || false,
      status: editToken?.status || 'Ativo',
      motivoRevogacao: formData.motivoRevogacao,
      ultimaAtualizacao: now,
      criadoPor: editToken?.criadoPor || user?.login || 'sistema',
      dataHoraCriacao: editToken?.dataHoraCriacao || now,
      ultimoUso: formData.ultimoUso,
      quantidadeAcessos: formData.quantidadeAcessos || 0,
      origemUltimoAcesso: formData.origemUltimoAcesso,
      localizacaoUltimoAcesso: formData.localizacaoUltimoAcesso,
      historico: [...(editToken?.historico || []), novaEntradaHistorico],
    };

    onSave(token);
    
    if (plainToken) {
      setGeneratedToken(plainToken);
      toast.success('Token gerado com sucesso! Copie-o agora, ele não será exibido novamente.');
    } else {
      toast.success('Token atualizado com sucesso');
      setOpen(false);
      if (onClose) onClose();
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      toast.success('Token copiado para a área de transferência');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseDialog = () => {
    setGeneratedToken(null);
    setCopied(false);
    setFormData(getInitialFormData());
    setOpen(false);
    if (onClose) onClose();
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData(getInitialFormData());
    }
  };

  const toggleEscopo = (escopo: EscopoToken) => {
    const escoposAtuais = formData.escopos || [];
    if (escoposAtuais.includes(escopo)) {
      setFormData({ ...formData, escopos: escoposAtuais.filter(e => e !== escopo) });
    } else {
      setFormData({ ...formData, escopos: [...escoposAtuais, escopo] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {!editToken && (
            <Button>
              <Plus className="mr-2" />
              Gerar Novo Token
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editToken ? 'Editar Token' : 'Gerar Novo Token de Acesso'}</DialogTitle>
          <DialogDescription>
            {generatedToken 
              ? 'Token gerado com sucesso. Copie-o agora, pois não será possível visualizá-lo novamente.'
              : 'Preencha as informações para gerar um novo token de autenticação.'}
          </DialogDescription>
        </DialogHeader>

        {generatedToken ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Token JWT Gerado</Label>
                <Badge variant="secondary" className="text-xs">
                  Formato: JWT (JSON Web Token)
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background rounded border text-sm font-mono break-all max-h-[200px] overflow-y-auto">
                  {generatedToken}
                </code>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyToken}
                  title="Copiar token"
                >
                  {copied ? <Check className="text-green-600" /> : <Copy />}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-1">
                ⚠️ Atenção - Primeira e última visualização
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Copie este token agora! Por motivos de segurança, ele não será exibido novamente após fechar este dialog. 
                Após salvá-lo, apenas uma versão mascarada (****) será visível na tabela.
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
                📋 Informações do Token JWT
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Emissor (iss):</strong> {window.location.origin}</li>
                <li>• <strong>Algoritmo:</strong> HS256 (HMAC with SHA-256)</li>
                <li>• <strong>Contém:</strong> Escopos, entidade, ambiente e configurações de segurança</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoEntidade">Tipo de Entidade *</Label>
                <Select
                  value={formData.tipoEntidade || 'Sistema'}
                  onValueChange={(value) => setFormData({ ...formData, tipoEntidade: value as TipoEntidadeToken })}
                >
                  <SelectTrigger id="tipoEntidade">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                    <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                    <SelectItem value="Serviço Interno">Serviço Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identificadorEntidade">
                  {formData.tipoEntidade === 'Pessoa Física' ? 'CPF' : 
                   formData.tipoEntidade === 'Pessoa Jurídica' ? 'CNPJ' : 'ID'} *
                </Label>
                <Input
                  id="identificadorEntidade"
                  value={formData.identificadorEntidade || ''}
                  onChange={(e) => setFormData({ ...formData, identificadorEntidade: e.target.value })}
                  placeholder="Identificador único"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeEntidade">Nome / Descrição *</Label>
              <Input
                id="nomeEntidade"
                value={formData.nomeEntidade || ''}
                onChange={(e) => setFormData({ ...formData, nomeEntidade: e.target.value })}
                placeholder="Nome do responsável ou sistema"
              />
            </div>

            <div className="space-y-2">
              <Label>Escopos / Operações Permitidas *</Label>
              <div className="grid grid-cols-4 gap-2">
                {escoposDisponiveis.map(escopo => (
                  <div key={escopo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`escopo-${escopo}`}
                      checked={formData.escopos?.includes(escopo) || false}
                      onCheckedChange={() => toggleEscopo(escopo)}
                    />
                    <Label htmlFor={`escopo-${escopo}`} className="text-sm font-normal cursor-pointer">
                      {escopo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ambiente">Ambiente *</Label>
                <Select
                  value={formData.ambiente || 'Desenvolvimento'}
                  onValueChange={(value) => setFormData({ ...formData, ambiente: value as AmbienteToken })}
                >
                  <SelectTrigger id="ambiente">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Homologação">Homologação</SelectItem>
                    <SelectItem value="Produção">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicioValidade">Início Validade *</Label>
                <Input
                  id="dataInicioValidade"
                  type="date"
                  value={formData.dataInicioValidade || ''}
                  onChange={(e) => setFormData({ ...formData, dataInicioValidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataExpiracao">Data Expiração</Label>
                <Input
                  id="dataExpiracao"
                  type="date"
                  value={formData.dataExpiracao || ''}
                  onChange={(e) => setFormData({ ...formData, dataExpiracao: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimitPorHora">Rate Limit (chamadas/hora)</Label>
                <Input
                  id="rateLimitPorHora"
                  type="number"
                  value={formData.rateLimitPorHora || 100}
                  onChange={(e) => setFormData({ ...formData, rateLimitPorHora: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origensPermitidas">IPs Permitidos (separados por vírgula)</Label>
                <Input
                  id="origensPermitidas"
                  value={formData.origensPermitidas?.join(', ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    origensPermitidas: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) 
                  })}
                  placeholder="192.168.1.1, 10.0.0.0/24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivoExpiracao">Motivo / Observação</Label>
              <Textarea
                id="motivoExpiracao"
                value={formData.motivoExpiracao || ''}
                onChange={(e) => setFormData({ ...formData, motivoExpiracao: e.target.value })}
                placeholder="Informações adicionais sobre o token"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="tokenTemporario"
                  checked={formData.tokenTemporario}
                  onCheckedChange={(checked) => setFormData({ ...formData, tokenTemporario: checked })}
                />
                <Label htmlFor="tokenTemporario" className="cursor-pointer">Token Temporário</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="permitirRegeneracao"
                  checked={formData.permitirRegeneracao}
                  onCheckedChange={(checked) => setFormData({ ...formData, permitirRegeneracao: checked })}
                />
                <Label htmlFor="permitirRegeneracao" className="cursor-pointer">Permitir Regeneração</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requerMFA"
                  checked={formData.requerMFA}
                  onCheckedChange={(checked) => setFormData({ ...formData, requerMFA: checked })}
                />
                <Label htmlFor="requerMFA" className="cursor-pointer">Requer MFA</Label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {generatedToken ? (
            <Button onClick={handleCloseDialog}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button onClick={handleSave}>{editToken ? 'Salvar' : 'Gerar Token'}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
