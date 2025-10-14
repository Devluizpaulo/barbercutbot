
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { LoaderCircle, Lock, Mail, Shield, AlertTriangle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logLoginSuccess, logLoginFailed, logSecurityAlert, getBrowserInfo } from '@/lib/admin-logs';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const browserInfo = getBrowserInfo();

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Verify admin role in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data()?.role === 'admin') {
        // SUCCESS: User is an admin
        await logLoginSuccess(firestore, user.uid, email, {
          userName: `${userDoc.data()?.firstName} ${userDoc.data()?.lastName}`,
          ...browserInfo,
        });
        toast({
          title: 'Login de Administrador',
          description: 'Bem-vindo ao painel de controle!',
        });
        router.push('/cpanel');
      } else {
        // FAILURE: User is not an admin or document doesn't exist
        const reason = userDoc.exists()
          ? 'Tentativa de acesso ao painel admin sem permissão'
          : 'Usuário autenticado no Auth mas não encontrado no Firestore';
        
        await logSecurityAlert(firestore, email, reason, {
          userId: user.uid,
          actualRole: userDoc.data()?.role || 'N/A',
          ...browserInfo,
        });
        
        await auth.signOut(); // Log out the non-admin user
        toast({
          variant: 'destructive',
          title: 'Acesso Restrito',
          description: 'Você não tem permissão para acessar esta área.',
        });
      }
    } catch (error: any) {
      // AUTHENTICATION FAILED
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm z-20 border-b border-slate-700">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial da BarberCut Bot">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-slate-300 hover:text-white">
              <Link href="/login">
                Login de Usuário
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 px-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-white">Acesso Administrativo</CardTitle>
            <CardDescription className="text-slate-400">
              Área restrita para administradores da plataforma
            </CardDescription>
          </CardHeader>

          <Alert className="mx-6 mb-4 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200 text-sm">
              Esta área é destinada exclusivamente para administradores. 
              Todas as ações são registradas.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleAdminLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email Administrativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@barbercutbot.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Shield className="mr-2 h-4 w-4" />
                Acessar Painel Admin
              </Button>
              <div className="space-y-2 text-center">
                <p className="text-sm text-slate-400">
                  Não é administrador?{' '}
                  <Link href="/login" className="underline hover:text-primary">
                    Fazer login como usuário
                  </Link>
                </p>
                <p className="text-xs text-slate-500">
                  Primeira vez?{' '}
                  <Link href="/setup" className="underline hover:text-primary">
                    Configurar sistema
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="py-6 border-t border-slate-700 bg-slate-900/80">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4">
          <p className="text-sm text-slate-400 text-center">
            <Shield className="inline h-3 w-3 mr-1" />
            Área Segura • Conexão Criptografada
          </p>
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} BarberCut Bot. Sistema de Administração.
          </p>
        </div>
      </footer>
    </div>
  );
}
