import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Lock, Envelope, Eye, EyeSlash, Warning, Spinner } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/usePermissions';
import { useLogging } from '@/hooks/use-logging';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const { logScreenView, logClick, logInput, logError } = useLogging('login');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manterConectado, setManterConectado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string; geral?: string }>({});

  // Registrar visualização da tela
  useEffect(() => {
    logScreenView();
  }, [logScreenView]);

  // Validação do e-mail
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação da senha
  const validarSenha = (senha: string): boolean => {
    return senha.length >= 6;
  };

  // Validar campos antes de submeter
  const validarFormulario = (): boolean => {
    const novosErros: { email?: string; senha?: string } = {};

    if (!email.trim()) {
      novosErros.email = 'O e-mail é obrigatório';
    } else if (!validarEmail(email)) {
      novosErros.email = 'Informe um e-mail válido';
    }

    if (!senha) {
      novosErros.senha = 'A senha é obrigatória';
    } else if (!validarSenha(senha)) {
      novosErros.senha = 'A senha deve ter no mínimo 6 caracteres';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Handler do submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logClick('botao-entrar');

    // Limpar erros anteriores
    setErrors({});

    // Validar formulário
    if (!validarFormulario()) {
      logError(new Error('Validação de formulário falhou'), { 
        email: !!email, 
        senhaPreenchida: !!senha 
      });
      return;
    }

    setIsLoading(true);

    try {
      // Timeout de 30 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: a requisição demorou muito tempo')), 30000);
      });

      // Fazer login com timeout
      await Promise.race([
        login(email, senha),
        timeoutPromise
      ]);

      // Salvar preferência de "manter conectado"
      if (manterConectado) {
        localStorage.setItem('keep_logged_in', 'true');
      } else {
        localStorage.removeItem('keep_logged_in');
      }

      logClick('login-sucesso', { manterConectado });
      onLoginSuccess();
      
    } catch (error) {
      logError(error as Error, { email, tentativa: 'login' });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao fazer login. Tente novamente.';

      setErrors({ geral: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler de mudança do e-mail
  const handleEmailChange = (value: string) => {
    setEmail(value);
    logInput('email');
    // Limpar erro do campo ao digitar
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  // Handler de mudança da senha
  const handleSenhaChange = (value: string) => {
    setSenha(value);
    logInput('senha');
    // Limpar erro do campo ao digitar
    if (errors.senha) {
      setErrors(prev => ({ ...prev, senha: undefined }));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="space-y-4 pb-6">
          {/* Logo do Sistema */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Lock size={40} weight="fill" className="text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-base">
              Faça login para acessar a plataforma
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensagem de erro geral */}
            {errors.geral && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <Warning className="h-4 w-4" weight="fill" />
                <AlertDescription>{errors.geral}</AlertDescription>
              </Alert>
            )}

            {/* Campo E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold flex items-center gap-2">
                <Envelope size={16} weight="bold" />
                E-mail
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="email"
                  autoFocus
                />
                <Envelope 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  size={18} 
                  weight="bold" 
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in-50">
                  <Warning size={14} weight="fill" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="font-semibold flex items-center gap-2">
                <Lock size={16} weight="bold" />
                Senha
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => handleSenhaChange(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 pr-10 ${errors.senha ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="current-password"
                />
                <Lock 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  size={18} 
                  weight="bold" 
                />
                <button
                  type="button"
                  onClick={() => {
                    setMostrarSenha(!mostrarSenha);
                    logClick('toggle-mostrar-senha');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {mostrarSenha ? (
                    <EyeSlash size={18} weight="bold" />
                  ) : (
                    <Eye size={18} weight="bold" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-500 flex items-center gap-1 animate-in fade-in-50">
                  <Warning size={14} weight="fill" />
                  {errors.senha}
                </p>
              )}
            </div>

            {/* Checkbox Manter Conectado */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="manter-conectado"
                checked={manterConectado}
                onCheckedChange={(checked) => {
                  setManterConectado(checked as boolean);
                  logClick('checkbox-manter-conectado', { checked });
                }}
                disabled={isLoading}
              />
              <Label
                htmlFor="manter-conectado"
                className="text-sm font-normal cursor-pointer select-none"
              >
                Manter conectado
              </Label>
            </div>

            {/* Botão Entrar */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" weight="bold" />
                  Entrar
                </>
              )}
            </Button>

            {/* Link Esqueci Minha Senha */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => logClick('link-esqueci-senha')}
                className="text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                disabled={isLoading}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </div>
  );
}
