
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Lock, Mail, Shield, AlertTriangle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logLoginSuccess, logLoginFailed, logSecurityAlert, getBrowserInfo } from '@/lib/admin-logs';

export default function CpanelLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focused, setFocused] = useState(false);

  const isValidEmail = (v: string) => /.+@.+\..+/.test(v.trim());
  const isFormValid = isValidEmail(email) && password.length >= 6;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) newErrors.email = 'Informe um email válido.';
    if (password.length < 6) newErrors.password = 'A senha deve ter ao menos 6 caracteres.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    const browserInfo = getBrowserInfo();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Force token refresh to get latest claims
      const idTokenResult = await user.getIdTokenResult(true);
      const hasAdminClaim = !!idTokenResult.claims.admin;

      // Fallback check: Read the user's document from Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const hasAdminRoleInDb = userDoc.exists() && userDoc.data()?.role === 'admin';

      if (hasAdminClaim || hasAdminRoleInDb) {
        if (!hasAdminClaim && hasAdminRoleInDb) {
            console.warn(`[Admin Login] User ${user.uid} has 'admin' role in DB but is missing the custom claim. Access granted via fallback.`);
        }
        
        await logLoginSuccess(firestore, user.uid, email, {
          userName: user.displayName || '',
          ...browserInfo,
        });

        toast({
          title: 'Login de Administrador',
          description: 'Bem-vindo ao painel de controle!',
        });
        
        // The /cpanel layout will handle the user and grant access
        router.push('/cpanel');

      } else {
        await logSecurityAlert(firestore, email, 'Tentativa de acesso ao painel admin sem permissão (role ou claim).', {
          userId: user.uid,
          actualRole: userDoc.data()?.role || 'N/A',
          ...browserInfo,
        });
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Você não tem as permissões necessárias para acessar esta área.',
          duration: 10000,
        });
      }
    } catch (error: any) {
      let reason = 'Credenciais inválidas';
      if (error.code === 'auth/too-many-requests') {
        reason = 'Muitas tentativas de login';
      }
      await logLoginFailed(firestore, email, reason, error.code, error.message);
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: 'Email ou senha inválidos. Verifique suas credenciais de administrador.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-20 border-b">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial da BarberCut Bot">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">
                Login de Usuário
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center pt-20 px-4 bg-secondary overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/image/cpanel-desk-1.jpg"
            alt=""
            fill
            priority
            aria-hidden
            sizes="100vw"
            className="object-cover object-[center_40%] opacity-60 select-none scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/40" />
        </div>
        {/* Overlay para escurecer e desfocar o fundo quando focado */}
        <div
          className={
            `pointer-events-none absolute inset-0 z-10 transition-all duration-300 ${
              focused ? 'backdrop-blur-md bg-black/30' : 'backdrop-blur-0 bg-transparent'
            }`
          }
          aria-hidden
        />
        <Card
          className={
            `relative z-20 w-full overflow-hidden transition-all duration-500 ease-out will-change-transform ${
              focused
                ? 'max-w-lg scale-100 max-h-none shadow-xl drop-shadow-2xl lg:-translate-x-6 xl:-translate-x-10 2xl:-translate-x-16'
                : 'max-w-[20rem] md:max-w-[20rem] scale-75 opacity-95 max-h-[50vh] cursor-pointer shadow-md sm:-translate-x-3 md:-translate-x-8 lg:-translate-x-20 xl:-translate-x-28 2xl:-translate-x-40 md:-translate-y-1'
            } lg:-translate-y-6 xl:-translate-y-10 ring-1 ring-white/10`
          }
          onClick={() => !focused && setFocused(true)}
        >
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Acesso Administrativo</CardTitle>
            <CardDescription>
              Área restrita para administradores da plataforma
            </CardDescription>
            {!focused && (
              <p className="text-xs text-muted-foreground">
                Clique no card para focar o login
              </p>
            )}
          </CardHeader>
          <form onSubmit={handleAdminLogin} noValidate onFocus={() => setFocused(true)}>
            <CardContent className="space-y-6">
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-600 dark:text-amber-200 text-sm">
                  Esta área é destinada exclusivamente para administradores. 
                  Todas as ações são registradas.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="email">Email Administrativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@barbercutbot.com"
                    required
                    autoComplete="username"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    className="pl-10 transition-colors"
                    autoFocus
                  />
                  {errors.email && (
                    <div id="email-error" className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    onKeyUp={(e) => setCapsLockOn((e as any).getModifierState?.('CapsLock'))}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password || capsLockOn ? 'password-help' : undefined}
                    className="pl-10 pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {(errors.password || capsLockOn) && (
                    <div id="password-help" className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.password ? errors.password : 'Caps Lock está ativo.'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 p-6 pt-0">
              <Button 
                className="w-full" 
                type="submit" 
                disabled={isLoading || !isFormValid}
                aria-disabled={isLoading || !isFormValid}
              >
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Shield className="mr-2 h-4 w-4" />
                {isLoading ? 'Entrando...' : 'Acessar Painel Admin'}
              </Button>
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Não é administrador?{' '}
                  <Link href="/login" className="underline hover:text-primary">
                    Fazer login como usuário
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Primeira vez?{' '}
                  <Link href="/setup" className="underline hover:text-primary">
                    Configurar sistema
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Esqueceu a senha?{' '}
                  <Link href="/recover" className="underline hover:text-primary">
                    Recuperar acesso
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="py-6 border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4">
          <p className="text-sm text-muted-foreground text-center">
            <Shield className="inline h-3 w-3 mr-1" />
            Área Segura • Conexão Criptografada
          </p>
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} BarberCut Bot. Sistema de Administração.
          </p>
        </div>
      </footer>
    </div>
  );
}
