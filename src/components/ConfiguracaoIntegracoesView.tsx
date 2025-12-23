import { useState, useRef, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { IntegrationConfig } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FloppyDisk, Eye, EyeSlash, Trash, Palette } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { TokenIntegracaoManager } from './TokenIntegracaoManager';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  sidebar: string;
  sidebarForeground: string;
}

interface CardStyles {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  shadow: string;
  padding: string;
}

interface ConfiguracaoIntegracoesViewProps {}

export function ConfiguracaoIntegracoesView({}: ConfiguracaoIntegracoesViewProps) {
  const { logClick, logEvent, logError } = useLogging('configuracao-integracoes-view');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<IntegrationConfig>({
    azureDevOps: {
      urlOrganizacao: 'https://dev.azure.com/{organization}/',
      apiVersion: '7.1-preview.1',
      timeoutSeconds: 30,
      pageSize: 200,
      personalAccessToken: ''
    },
    sysAid: {
      urlOrganizacao: '',
      usuarioAutenticado: '',
      personalAccessToken: ''
    }
  });

  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [systemName, setSystemName] = useState('Sistema de Auditoria');
  const [themeColors, setThemeColors] = useState<ThemeColors>({
    primary: 'oklch(0.264 0.126 276)',
    secondary: 'oklch(0.35 0.08 265)',
    accent: 'oklch(0.30 0.08 265)',
    background: 'oklch(0.988 0.018 105)',
    foreground: 'oklch(0.264 0.126 276)',
    muted: 'oklch(0.92 0.08 95)',
    border: 'oklch(0.85 0.08 95)',
    sidebar: 'oklch(0.970 0.139 106)',
    sidebarForeground: 'oklch(0.264 0.126 276)'
  });
  
  const [cardStyles, setCardStyles] = useState<CardStyles>({
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#e2e8f0',
    borderWidth: '1px',
    borderRadius: '12px',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    padding: '24px'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAzureToken, setShowAzureToken] = useState(false);
  const [showSysAidToken, setShowSysAidToken] = useState(false);
  const [tempSystemName, setTempSystemName] = useState(systemName);
  const [tempThemeColors, setTempThemeColors] = useState<ThemeColors>(themeColors);
  const [tempCardStyles, setTempCardStyles] = useState<CardStyles>(cardStyles);

  // Notificações via Microsoft Graph API
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [emailCaixa, setEmailCaixa] = useState('');
  const [endpointBasico, setEndpointBasico] = useState('');
  const [endpointShared, setEndpointShared] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [novoSubject, setNovoSubject] = useState('');

  const [formData, setFormData] = useState<IntegrationConfig>(config);

  // Carregar configurações da API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/configuracoes');
        if (response.ok) {
          const data = await response.json();
          
          if (data['integration-config']) {
            setConfig(data['integration-config']);
          }
          if (data['system-name']) {
            setSystemName(data['system-name']);
            setTempSystemName(data['system-name']);
          }
          if (data['theme-colors']) {
            setThemeColors(data['theme-colors']);
            setTempThemeColors(data['theme-colors']);
          }
          if (data['card-styles']) {
            setCardStyles(data['card-styles']);
            setTempCardStyles(data['card-styles']);
          }
          if (data['company-logo']) {
            setCompanyLogo(data['company-logo']);
          }
          if (data['email-notifications']) {
            const emailConfig = data['email-notifications'];
            setTenantId(emailConfig.tenantId || '');
            setClientId(emailConfig.clientId || '');
            setClientSecret(emailConfig.clientSecret || '');
            setEmailCaixa(emailConfig.emailCaixa || '');
            setEndpointBasico(emailConfig.endpointBasico || '');
            setEndpointShared(emailConfig.endpointShared || '');
            setSubjects(emailConfig.subjects || []);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    setFormData(config || {
      azureDevOps: {
        urlOrganizacao: 'https://dev.azure.com/{organization}/',
        apiVersion: '7.1-preview.1',
        timeoutSeconds: 30,
        pageSize: 200,
        personalAccessToken: ''
      },
      sysAid: {
        urlOrganizacao: '',
        usuarioAutenticado: '',
        personalAccessToken: ''
      }
    });
  }, [config]);

  useEffect(() => {
    if (tempThemeColors) {
      const root = document.documentElement;
      root.style.setProperty('--primary', tempThemeColors.primary);
      root.style.setProperty('--secondary', tempThemeColors.secondary);
      root.style.setProperty('--accent', tempThemeColors.accent);
      root.style.setProperty('--background', tempThemeColors.background);
      root.style.setProperty('--foreground', tempThemeColors.foreground);
      root.style.setProperty('--muted', tempThemeColors.muted);
      root.style.setProperty('--border', tempThemeColors.border);
      root.style.setProperty('--sidebar', tempThemeColors.sidebar);
      root.style.setProperty('--sidebar-foreground', tempThemeColors.sidebarForeground);
    }
  }, [tempThemeColors]);

  useEffect(() => {
    if (tempCardStyles) {
      const root = document.documentElement;
      root.style.setProperty('--card-bg', tempCardStyles.backgroundColor);
      root.style.setProperty('--card-text', tempCardStyles.textColor);
      root.style.setProperty('--card-border-color', tempCardStyles.borderColor);
      root.style.setProperty('--card-border-width', tempCardStyles.borderWidth);
      root.style.setProperty('--card-border-radius', tempCardStyles.borderRadius);
      root.style.setProperty('--card-shadow', tempCardStyles.shadow);
      root.style.setProperty('--card-padding', tempCardStyles.padding);
    }
  }, [tempCardStyles]);

  const handleSave = async () => {
    try {
      // Salvar cada configuração
      await fetch('/api/configuracoes/integration-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: formData })
      });
      
      await fetch('/api/configuracoes/system-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: tempSystemName })
      });
      
      await fetch('/api/configuracoes/theme-colors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: tempThemeColors })
      });
      
      await fetch('/api/configuracoes/card-styles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: tempCardStyles })
      });
      
      if (companyLogo) {
        await fetch('/api/configuracoes/company-logo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: companyLogo })
        });
      }
      
      // Salvar configurações de notificações via Graph API
      await fetch('/api/configuracoes/email-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          valor: {
            tenantId,
            clientId,
            clientSecret,
            emailCaixa,
            endpointBasico,
            endpointShared,
            subjects
          }
        })
      });
      
      setConfig(formData);
      setSystemName(tempSystemName);
      setThemeColors(tempThemeColors);
      setCardStyles(tempCardStyles);
      
      // Disparar evento para atualizar App.tsx
      window.dispatchEvent(new CustomEvent('configuracoes-updated'));
      
      toast.success('Configurações salvas com sucesso no banco de dados');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleAddSubject = () => {
    if (!novoSubject.trim()) {
      toast.error('Digite um subject antes de adicionar');
      return;
    }
    
    if (subjects.includes(novoSubject.trim())) {
      toast.error('Este subject já foi adicionado');
      return;
    }
    
    setSubjects([...subjects, novoSubject.trim()]);
    setNovoSubject('');
    toast.success('Subject adicionado');
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
    toast.success('Subject removido');
  };

  const handleResetTheme = () => {
    const defaultColors: ThemeColors = {
      primary: 'oklch(0.264 0.126 276)',
      secondary: 'oklch(0.35 0.08 265)',
      accent: 'oklch(0.30 0.08 265)',
      background: 'oklch(0.988 0.018 105)',
      foreground: 'oklch(0.264 0.126 276)',
      muted: 'oklch(0.92 0.08 95)',
      border: 'oklch(0.85 0.08 95)',
      sidebar: 'oklch(0.970 0.139 106)',
      sidebarForeground: 'oklch(0.264 0.126 276)'
    };
    setTempThemeColors(defaultColors);
    toast.info('Tema restaurado para as cores padrão');
  };

  const handleResetCards = () => {
    const defaultCardStyles: CardStyles = {
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderColor: '#e2e8f0',
      borderWidth: '1px',
      borderRadius: '12px',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      padding: '24px'
    };
    setTempCardStyles(defaultCardStyles);
    toast.info('Estilos dos cards restaurados para o padrão');
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCompanyLogo(result);
      toast.success('Logo da empresa carregada com sucesso');
    };
    reader.onerror = () => {
      toast.error('Erro ao carregar a imagem');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setCompanyLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo da empresa removida');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Configuração de Integrações</h1>
              <p className="text-muted-foreground mt-2">
                Configure as integrações com Azure DevOps e SysAid
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nome do Sistema</CardTitle>
                <CardDescription>
                  Personalize o nome do sistema conforme a necessidade da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">Nome do Sistema</Label>
                  <Input
                    id="system-name"
                    placeholder="Digite o nome do sistema"
                    value={tempSystemName}
                    onChange={(e) => setTempSystemName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este nome será exibido no menu lateral e em outras áreas do sistema
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificações via Microsoft Graph API</CardTitle>
                <CardDescription>
                  Configure a integração com Microsoft Graph API para leitura de e-mails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Endpoint Básico</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configure as credenciais de autenticação do Azure AD
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-id">Tenant ID</Label>
                      <Input
                        id="tenant-id"
                        placeholder="00000000-0000-0000-0000-000000000000"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client ID (Application ID)</Label>
                      <Input
                        id="client-id"
                        placeholder="00000000-0000-0000-0000-000000000000"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          id="client-secret"
                          type={showClientSecret ? 'text' : 'password'}
                          placeholder="••••••••••••••••"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                        >
                          {showClientSecret ? <EyeSlash /> : <Eye />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Credenciais do aplicativo registrado no Azure Active Directory
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-3">Configuração de Leitura</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configure os endpoints e a caixa de e-mail para leitura
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-caixa">E-mail</Label>
                      <Input
                        id="email-caixa"
                        type="email"
                        placeholder="notificacoes@empresa.com"
                        value={emailCaixa}
                        onChange={(e) => setEmailCaixa(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        E-mail da caixa para leitura de mensagens
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="endpoint-basico">Endpoint Básico</Label>
                        <Input
                          id="endpoint-basico"
                          placeholder="https://graph.microsoft.com/v1.0"
                          value={endpointBasico}
                          onChange={(e) => setEndpointBasico(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          URL base da API do Microsoft Graph
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endpoint-shared">Endpoint Shared</Label>
                        <Input
                          id="endpoint-shared"
                          placeholder="/users/{email}/messages"
                          value={endpointShared}
                          onChange={(e) => setEndpointShared(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Caminho do endpoint para caixa compartilhada
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-3">Filtros de Assunto (Subjects)</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Adicione um ou mais subjects para filtrar os e-mails
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: [Notificação] Sistema"
                        value={novoSubject}
                        onChange={(e) => setNovoSubject(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubject();
                          }
                        }}
                      />
                      <Button onClick={handleAddSubject} variant="outline">
                        Adicionar
                      </Button>
                    </div>

                    {subjects.length > 0 && (
                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead className="border-b bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Subject</th>
                              <th className="text-center p-3 text-sm font-medium w-24">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjects.map((subject, index) => (
                              <tr key={index} className="border-b last:border-0">
                                <td className="p-3 text-sm">{subject}</td>
                                <td className="p-3 text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSubject(subject)}
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {subjects.length === 0 && (
                      <div className="text-center py-8 border rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                          Nenhum subject configurado. Adicione um subject para filtrar os e-mails.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                    ℹ️ Permissões necessárias no Azure AD
                  </p>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <p><strong>Application permissions:</strong></p>
                    <p>• Mail.Read (para ler e-mails da caixa compartilhada)</p>
                    <p>• Mail.ReadWrite (se precisar marcar como lido)</p>
                    <p className="mt-2">Configure estas permissões no portal do Azure AD em "API permissions"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette />
                      Cores do Tema
                    </CardTitle>
                    <CardDescription>
                      Personalize as cores do sistema para combinar com a identidade visual da sua empresa
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetTheme}
                  >
                    Restaurar Padrão
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color-primary">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-primary"
                        placeholder="oklch(0.264 0.126 276)"
                        value={tempThemeColors.primary}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, primary: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.primary}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Usada em botões principais e elementos de destaque</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-secondary">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-secondary"
                        placeholder="oklch(0.35 0.08 265)"
                        value={tempThemeColors.secondary}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, secondary: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.secondary}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Usada em botões secundários e elementos de suporte</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-accent">Cor de Destaque</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-accent"
                        placeholder="oklch(0.30 0.08 265)"
                        value={tempThemeColors.accent}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, accent: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.accent}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Usada para destacar elementos importantes</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-background">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-background"
                        placeholder="oklch(0.988 0.018 105)"
                        value={tempThemeColors.background}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, background: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.background}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor de fundo principal da página</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-foreground">Cor de Texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-foreground"
                        placeholder="oklch(0.264 0.126 276)"
                        value={tempThemeColors.foreground}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, foreground: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.foreground}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor principal do texto</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-muted">Cor de Fundo Suave</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-muted"
                        placeholder="oklch(0.92 0.08 95)"
                        value={tempThemeColors.muted}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, muted: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.muted}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Usada em elementos de fundo suaves</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-border">Cor de Bordas</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-border"
                        placeholder="oklch(0.85 0.08 95)"
                        value={tempThemeColors.border}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, border: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.border}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor das bordas e divisores</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-sidebar">Cor da Barra de Menus</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-sidebar"
                        placeholder="oklch(0.970 0.139 106)"
                        value={tempThemeColors.sidebar}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, sidebar: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.sidebar}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor de fundo da barra de menus lateral</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-sidebar-foreground">Cor do Texto da Barra de Menus</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-sidebar-foreground"
                        placeholder="oklch(0.264 0.126 276)"
                        value={tempThemeColors.sidebarForeground}
                        onChange={(e) => setTempThemeColors({...tempThemeColors, sidebarForeground: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempThemeColors.sidebarForeground}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor do texto e ícones da barra de menus</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Dica:</strong> Use o formato OKLCH para melhor controle de cores. Exemplo: <code className="bg-background px-1 py-0.5 rounded">oklch(0.5 0.2 180)</code> onde os valores são: luminosidade (0-1), croma (0-0.4), e matiz (0-360).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette />
                      Estilos dos Cards
                    </CardTitle>
                    <CardDescription>
                      Personalize a aparência dos componentes Card em Wizards, DataTables e formulários
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCards}
                  >
                    Restaurar Padrão
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-bg">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="card-bg"
                        placeholder="#ffffff"
                        value={tempCardStyles.backgroundColor}
                        onChange={(e) => setTempCardStyles({...tempCardStyles, backgroundColor: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempCardStyles.backgroundColor}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor de fundo dos cards</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-text">Cor do Texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="card-text"
                        placeholder="#0f172a"
                        value={tempCardStyles.textColor}
                        onChange={(e) => setTempCardStyles({...tempCardStyles, textColor: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempCardStyles.textColor}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor do texto dentro dos cards</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-border-color">Cor da Borda</Label>
                    <div className="flex gap-2">
                      <Input
                        id="card-border-color"
                        placeholder="#e2e8f0"
                        value={tempCardStyles.borderColor}
                        onChange={(e) => setTempCardStyles({...tempCardStyles, borderColor: e.target.value})}
                      />
                      <div 
                        className="w-12 h-10 rounded border border-border shrink-0" 
                        style={{backgroundColor: tempCardStyles.borderColor}}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cor da borda dos cards</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-border-width">Largura da Borda</Label>
                    <Select 
                      value={tempCardStyles.borderWidth} 
                      onValueChange={(value) => setTempCardStyles({...tempCardStyles, borderWidth: value})}
                    >
                      <SelectTrigger id="card-border-width">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0px">Sem borda</SelectItem>
                        <SelectItem value="1px">Fina (1px)</SelectItem>
                        <SelectItem value="2px">Média (2px)</SelectItem>
                        <SelectItem value="3px">Grossa (3px)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Espessura da borda</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-radius">Arredondamento</Label>
                    <Select 
                      value={tempCardStyles.borderRadius} 
                      onValueChange={(value) => setTempCardStyles({...tempCardStyles, borderRadius: value})}
                    >
                      <SelectTrigger id="card-radius">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0px">Sem arredondamento</SelectItem>
                        <SelectItem value="4px">Pequeno (4px)</SelectItem>
                        <SelectItem value="8px">Médio (8px)</SelectItem>
                        <SelectItem value="12px">Grande (12px)</SelectItem>
                        <SelectItem value="16px">Muito grande (16px)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Raio dos cantos arredondados</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-shadow">Sombra</Label>
                    <Select 
                      value={tempCardStyles.shadow} 
                      onValueChange={(value) => setTempCardStyles({...tempCardStyles, shadow: value})}
                    >
                      <SelectTrigger id="card-shadow">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem sombra</SelectItem>
                        <SelectItem value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Muito sutil</SelectItem>
                        <SelectItem value="0 1px 3px 0 rgb(0 0 0 / 0.1)">Sutil</SelectItem>
                        <SelectItem value="0 4px 6px -1px rgb(0 0 0 / 0.1)">Média</SelectItem>
                        <SelectItem value="0 10px 15px -3px rgb(0 0 0 / 0.1)">Forte</SelectItem>
                        <SelectItem value="0 20px 25px -5px rgb(0 0 0 / 0.1)">Muito forte</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Efeito de sombra do card</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-padding">Espaçamento Interno</Label>
                    <Select 
                      value={tempCardStyles.padding} 
                      onValueChange={(value) => setTempCardStyles({...tempCardStyles, padding: value})}
                    >
                      <SelectTrigger id="card-padding">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12px">Pequeno (12px)</SelectItem>
                        <SelectItem value="16px">Médio (16px)</SelectItem>
                        <SelectItem value="24px">Grande (24px)</SelectItem>
                        <SelectItem value="32px">Muito grande (32px)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Espaço interno do card</p>
                  </div>
                </div>

                <div className="mt-6 p-6 rounded-lg border" 
                  style={{
                    backgroundColor: tempCardStyles.backgroundColor,
                    color: tempCardStyles.textColor,
                    borderColor: tempCardStyles.borderColor,
                    borderWidth: tempCardStyles.borderWidth,
                    borderRadius: tempCardStyles.borderRadius,
                    boxShadow: tempCardStyles.shadow,
                    padding: tempCardStyles.padding
                  }}
                >
                  <h3 className="font-semibold mb-2">Preview do Card</h3>
                  <p className="text-sm opacity-80">
                    Esta é uma prévia de como os cards aparecerão com as configurações atuais nos Wizards, DataTables e demais componentes do sistema.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Dica:</strong> Use cores hexadecimais (#ffffff) ou RGBA (rgba(255, 255, 255, 1)). As alterações serão aplicadas em todos os componentes Card do sistema.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo da Empresa</CardTitle>
                <CardDescription>
                  Faça upload da logo da sua empresa para personalizar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Selecione uma imagem</Label>
                      <Input
                        ref={fileInputRef}
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                      </p>
                    </div>
                    {companyLogo && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogoRemove}
                      >
                        <Trash className="mr-2" />
                        Remover Logo
                      </Button>
                    )}
                  </div>
                  {companyLogo && (
                    <div className="flex flex-col items-center gap-2">
                      <Label>Preview</Label>
                      <div className="w-32 h-32 border-2 border-border rounded-lg flex items-center justify-center p-2 bg-card">
                        <img
                          src={companyLogo}
                          alt="Logo da empresa"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Azure DevOps</CardTitle>
                <CardDescription>
                  Configure a integração com o Azure DevOps para sincronização de projetos e work items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="azure-url">URL da Organização</Label>
                    <Input
                      id="azure-url"
                      placeholder="https://dev.azure.com/{organization}/"
                      value={formData.azureDevOps.urlOrganizacao}
                      onChange={(e) => setFormData({
                        ...formData,
                        azureDevOps: {
                          ...formData.azureDevOps,
                          urlOrganizacao: e.target.value
                        }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      A sigla do projeto (projectName) será utilizada para identificar o projeto no Azure DevOps
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="azure-api-version">Versão da API</Label>
                      <Input
                        id="azure-api-version"
                        placeholder="7.1-preview.1"
                        value={formData.azureDevOps.apiVersion}
                        onChange={(e) => setFormData({
                          ...formData,
                          azureDevOps: {
                            ...formData.azureDevOps,
                            apiVersion: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="azure-timeout">Timeout (segundos)</Label>
                      <Input
                        id="azure-timeout"
                        type="number"
                        placeholder="30"
                        value={formData.azureDevOps.timeoutSeconds}
                        onChange={(e) => setFormData({
                          ...formData,
                          azureDevOps: {
                            ...formData.azureDevOps,
                            timeoutSeconds: parseInt(e.target.value) || 30
                          }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="azure-page-size">Tamanho da Página</Label>
                    <Input
                      id="azure-page-size"
                      type="number"
                      placeholder="200"
                      value={formData.azureDevOps.pageSize}
                      onChange={(e) => setFormData({
                        ...formData,
                        azureDevOps: {
                          ...formData.azureDevOps,
                          pageSize: parseInt(e.target.value) || 200
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="azure-pat">Personal Access Token (PAT)</Label>
                    <div className="relative">
                      <Input
                        id="azure-pat"
                        type={showAzureToken ? 'text' : 'password'}
                        placeholder="Digite o PAT do Azure DevOps"
                        value={formData.azureDevOps.personalAccessToken}
                        onChange={(e) => setFormData({
                          ...formData,
                          azureDevOps: {
                            ...formData.azureDevOps,
                            personalAccessToken: e.target.value
                          }
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowAzureToken(!showAzureToken)}
                      >
                        {showAzureToken ? <EyeSlash /> : <Eye />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SysAid</CardTitle>
                <CardDescription>
                  Configure a integração com o SysAid para gestão de tickets e atendimentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sysaid-url">URL da Organização</Label>
                    <Input
                      id="sysaid-url"
                      placeholder="https://sua-organizacao.sysaid.com"
                      value={formData.sysAid.urlOrganizacao}
                      onChange={(e) => setFormData({
                        ...formData,
                        sysAid: {
                          ...formData.sysAid,
                          urlOrganizacao: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sysaid-user">Usuário Autenticado</Label>
                    <Input
                      id="sysaid-user"
                      placeholder="Digite o usuário de autenticação"
                      value={formData.sysAid.usuarioAutenticado}
                      onChange={(e) => setFormData({
                        ...formData,
                        sysAid: {
                          ...formData.sysAid,
                          usuarioAutenticado: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sysaid-pat">Personal Access Token (PAT)</Label>
                    <div className="relative">
                      <Input
                        id="sysaid-pat"
                        type={showSysAidToken ? 'text' : 'password'}
                        placeholder="Digite o PAT do SysAid"
                        value={formData.sysAid.personalAccessToken}
                        onChange={(e) => setFormData({
                          ...formData,
                          sysAid: {
                            ...formData.sysAid,
                            personalAccessToken: e.target.value
                          }
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSysAidToken(!showSysAidToken)}
                      >
                        {showSysAidToken ? <EyeSlash /> : <Eye />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} size="lg">
                <FloppyDisk className="mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
