import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TokenAcesso } from '@/lib/types';
import { Copy, Check, X, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import * as jose from 'jose';
import { generateUUID } from '@/utils/uuid';
import { useTokens } from '@/hooks/use-tokens';

interface TokenFormProps {
  onSave: () => void;
  editToken?: TokenAcesso;
  onCancel: () => void;
}

export function TokenForm({ onSave, editToken, onCancel }: TokenFormProps) {
  const { createToken, updateToken } = useTokens();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const getInitialFormData = (): Partial<TokenAcesso> => {
    if (editToken) return editToken;
    
    // Data atual para início da validade
    const hoje = new Date();
    const dataInicio = hoje.toISOString().split('T')[0];
    
    // Data de expiração: 180 dias a partir de hoje
    const dataExpiracao = new Date(hoje);
    dataExpiracao.setDate(dataExpiracao.getDate() + 180);
    const dataExp = dataExpiracao.toISOString().split('T')[0];
    
    return {
      entidadeTipo: 'Servico',
      escopos: [],
      permitirRegeneracao: true,
      requerMFA: false,
      dataInicioValidade: dataInicio,
      dataExpiracao: dataExp,
    };
  };
  
  const [formData, setFormData] = useState<Partial<TokenAcesso>>(getInitialFormData());

  const escoposDisponiveis = ['INSERT', 'UPDATE', 'DELETE', 'READ', 'ADMIN', 'FINANCEIRO', 'AUDITORIA', 'INTEGRACAO'];

  const generateJWTToken = async (tokenData: Partial<TokenAcesso>) => {
    const systemUrl = window.location.origin;
    const secret = new TextEncoder().encode(generateUUID() + Date.now().toString(36));
    
    const payload = {
      jti: generateUUID(),
      iss: systemUrl,
      sub: tokenData.entidadeNome || '',
      aud: systemUrl,
      exp: tokenData.dataExpiracao 
        ? Math.floor(new Date(tokenData.dataExpiracao).getTime() / 1000) 
        : Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60), // 180 dias
      nbf: Math.floor(new Date(tokenData.dataInicioValidade!).getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
      entity: {
        type: tokenData.entidadeTipo,
        name: tokenData.entidadeNome,
      },
      scopes: tokenData.escopos,
      mfa: tokenData.requerMFA,
    };
    
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(systemUrl)
      .setSubject(tokenData.entidadeNome!)
      .setAudience(systemUrl)
      .setExpirationTime(payload.exp)
      .setNotBefore(payload.nbf)
      .sign(secret);
    
    return token;
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.entidadeTipo || !formData.entidadeNome) {
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

    try {
      setSaving(true);
      
      if (editToken) {
        // Atualizar token existente (não regenera o token JWT)
        await updateToken(editToken.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          entidadeTipo: formData.entidadeTipo,
          entidadeNome: formData.entidadeNome,
          dataInicioValidade: formData.dataInicioValidade,
          dataExpiracao: formData.dataExpiracao,
          escopos: formData.escopos,
          permitirRegeneracao: formData.permitirRegeneracao,
          requerMFA: formData.requerMFA,
        });
        toast.success('Token atualizado com sucesso');
        onSave();
      } else {
        // Criar novo token
        const plainToken = await generateJWTToken(formData);
        
        await createToken({
          nome: formData.nome!,
          descricao: formData.descricao,
          entidadeTipo: formData.entidadeTipo!,
          entidadeNome: formData.entidadeNome!,
          dataInicioValidade: formData.dataInicioValidade!,
          dataExpiracao: formData.dataExpiracao!,
          escopos: formData.escopos!,
          token: plainToken,
          permitirRegeneracao: formData.permitirRegeneracao ?? true,
          requerMFA: formData.requerMFA ?? false,
          status: 'Ativo',
        });
        
        setGeneratedToken(plainToken);
        toast.success('Token gerado com sucesso! Copie-o agora, ele não será exibido novamente.');
      }
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar token');
    } finally {
      setSaving(false);
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

  const handleCloseAfterCopy = () => {
    setGeneratedToken(null);
    setCopied(false);
    onCancel();
  };

  const toggleEscopo = (escopo: string) => {
    const escoposAtuais = formData.escopos || [];
    if (escoposAtuais.includes(escopo)) {
      setFormData({ ...formData, escopos: escoposAtuais.filter(e => e !== escopo) });
    } else {
      setFormData({ ...formData, escopos: [...escoposAtuais, escopo] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{editToken ? 'Editar Token' : 'Gerar Novo Token de Acesso'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generatedToken ? (
          <div className="space-y-4">
            <div className="p-4 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Token JWT Gerado</Label>
                <Badge variant="secondary" className="text-xs">
                  Formato: JWT (JSON Web Token)
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded border text-sm font-mono break-all max-h-[200px] overflow-y-auto">
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
            <div className="p-3 bg-white border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 font-medium mb-1">
                ⚠️ Atenção - Primeira e última visualização
              </p>
              <p className="text-sm text-amber-800">
                Copie este token agora! Por motivos de segurança, ele não será exibido novamente após fechar. 
                Após salvá-lo, apenas uma versão mascarada (****) será visível na tabela.
              </p>
            </div>
            <div className="p-3 bg-white border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900 font-medium mb-1">
                📋 Informações do Token JWT
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Emissor (iss):</strong> {window.location.origin}</li>
                <li>• <strong>Algoritmo:</strong> HS256 (HMAC with SHA-256)</li>
                <li>• <strong>Contém:</strong> Escopos, entidade, ambiente e configurações de segurança</li>
              </ul>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleCloseAfterCopy}>
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Token <span className="text-destructive">*</span></Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome identificador do token"
              />
              <p className="text-xs text-muted-foreground">
                Nome único para identificar este token
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do propósito deste token"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Opcional: Informações adicionais sobre o uso do token
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entidadeTipo">Tipo de Entidade <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.entidadeTipo || 'Servico'}
                  onValueChange={(value) => setFormData({ ...formData, entidadeTipo: value as 'Usuario' | 'Servico' | 'Aplicacao' })}
                >
                  <SelectTrigger id="entidadeTipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Usuario">Usuário</SelectItem>
                    <SelectItem value="Servico">Serviço</SelectItem>
                    <SelectItem value="Aplicacao">Aplicação</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define o tipo de entidade que usará o token
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entidadeNome">Nome da Entidade <span className="text-destructive">*</span></Label>
                <Input
                  id="entidadeNome"
                  value={formData.entidadeNome || ''}
                  onChange={(e) => setFormData({ ...formData, entidadeNome: e.target.value })}
                  placeholder="Nome do responsável ou sistema"
                />
                <p className="text-xs text-muted-foreground">
                  Nome descritivo da entidade
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Escopos / Operações Permitidas <span className="text-destructive">*</span></Label>
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
              <p className="text-xs text-muted-foreground">
                Selecione as permissões que este token terá
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicioValidade">Início Validade *</Label>
                <Input
                  id="dataInicioValidade"
                  type="date"
                  value={formData.dataInicioValidade || ''}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Data atual do sistema (não editável)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataExpiracao">Data Expiração *</Label>
                <Input
                  id="dataExpiracao"
                  type="date"
                  value={formData.dataExpiracao || ''}
                  onChange={(e) => setFormData({ ...formData, dataExpiracao: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Padrão: 180 dias após a data de início
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permitirRegeneracao"
                  checked={formData.permitirRegeneracao ?? true}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, permitirRegeneracao: checked as boolean })
                  }
                />
                <Label htmlFor="permitirRegeneracao" className="cursor-pointer">Permitir Regeneração</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requerMFA"
                  checked={formData.requerMFA || false}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, requerMFA: checked as boolean })
                  }
                />
                <Label htmlFor="requerMFA" className="cursor-pointer">Requer MFA</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <FloppyDisk className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : (editToken ? 'Atualizar' : 'Gerar Token')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
