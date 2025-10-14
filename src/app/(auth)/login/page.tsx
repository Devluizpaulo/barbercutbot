
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Lock, Menu, Shield, Mail, Scissors } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ensureUserExists } from '@/lib/google-auth-utils';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
        />
        <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
        />
        <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
        />
        <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
        />
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    setIsLoading(true);

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // The AuthLayout will handle redirection after the user state is updated.
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para seu dashboard...',
        });
    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        let title = 'Falha no login';
        let description = 'Ocorreu um erro ao tentar fazer login.';
        
        if (error.code === 'auth/user-not-found' || 
            error.code === 'auth/invalid-credential' || 
            error.code === 'auth/wrong-password') {
            description = 'E-mail ou senha inválidos. Por favor, verifique suas credenciais.';
        } else if (error.code === 'auth/too-many-requests') {
            title = 'Conta temporariamente bloqueada';
            description = 'Muitas tentativas de login falhadas. Tente novamente em alguns minutos ou redefina sua senha.';
        } else if (error.code === 'auth/user-disabled') {
            title = 'Conta desativada';
            description = 'Esta conta foi desativada. Entre em contato com o suporte.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'O endereço de e-mail não é válido.';
        } else if (error.code === 'auth/network-request-failed') {
            title = 'Erro de conexão';
            description = 'Verifique sua conexão com a internet e tente novamente.';
        }
        
        toast({
          variant: 'destructive',
          title,
          description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Ensure user exists in Firestore
        const wasCreated = await ensureUserExists(firestore, user);
        
        if (wasCreated) {
            toast({ title: "Bem-vindo!", description: "Sua conta foi criada com sucesso." });
        } else {
            toast({ title: "Login bem-sucedido!", description: "Redirecionando..." });
        }
        
        // Redirection is handled by the main layout's auth listener
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({
            variant: "destructive",
            title: "Erro no Login com Google",
            description: "Não foi possível fazer login. Tente novamente."
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({
            variant: 'destructive',
            title: 'Campo obrigatório',
            description: 'Por favor, insira o seu e-mail.',
        });
        return;
    }

    setIsResetLoading(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: 'E-mail de recuperação enviado!',
            description: 'Verifique sua caixa de entrada (e spam) para redefinir sua senha.',
        });
        setIsResetDialogOpen(false);
        setResetEmail('');
    } catch (error: any) {
        console.error("Password Reset Error:", error);
        toast({
            variant: 'destructive',
            title: 'Falha ao enviar e-mail',
            description: 'Não foi possível enviar o e-mail. Verifique se o e-mail está correto ou tente novamente.',
        });
    } finally {
        setIsResetLoading(false);
    }
  };


  return (
     <>
     <div className="flex flex-col min-h-screen">
        <Image
            src="/image/hero.png"
            alt="Fundo de uma barbearia estilosa"
            fill
            className="object-cover"
            quality={90}
            data-ai-hint="barber shop background"
        />
        <div className="absolute inset-0 bg-black/70" />

        <header className="fixed top-0 left-0 right-0 bg-transparent z-20">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
                <Link href="/" aria-label="Página Inicial da BarberCut Bot">
                    <Logo />
                </Link>
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
                        <Link href="/signup">
                            Criar Conta
                        </Link>
                    </Button>
                </div>
                 <div className="md:hidden">
                    <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-transparent text-white border-white/20 hover:bg-white/10">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Abrir Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-background">
                        <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <Link href="/" aria-label="Página Inicial da BarberCut Bot">
                                <Logo />
                            </Link>
                        </div>
                        <div className="p-4 border-t mt-auto flex flex-col gap-4">
                            <Button asChild className="w-full">
                                <Link href="/signup">Criar Conta</Link>
                            </Button>
                        </div>
                        </div>
                    </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>

        <main className="flex-1 flex items-center justify-center pt-20 px-4 z-10">
             <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-lg border-white/10 text-white">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 rounded-full p-3">
                        <Scissors className="h-8 w-8 text-primary"/>
                    </div>
                <CardTitle className="font-headline text-3xl">Bem-vindo de volta!</CardTitle>
                <CardDescription className="text-slate-400">
                    Faça login para gerenciar seu negócio.
                </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                     <Button variant="outline" className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                        {isGoogleLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                        Entrar com Google
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/20" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-900/80 px-2 text-muted-foreground">
                            Ou continue com
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-white/5 border-white/20"
                                disabled={isGoogleLoading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-slate-300">Senha</Label>
                            <Button 
                                type="button" 
                                variant="link" 
                                className="h-auto p-0 text-xs text-primary/80 hover:text-primary"
                                onClick={() => {
                                    setResetEmail(email);
                                    setIsResetDialogOpen(true);
                                }}
                            >
                                Esqueceu sua senha?
                            </Button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 bg-white/5 border-white/20"
                                disabled={isGoogleLoading}
                            />
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Não tem uma conta?{' '}
                            <Link href="/signup" className="underline hover:text-primary">
                                Cadastre-se
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </main>
        
        <footer className="py-8 z-10">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
            <Link href="/" aria-label="Página Inicial da BarberCut Bot">
                <Logo />
            </Link>
            <nav className="flex flex-wrap justify-center items-center gap-4 text-center md:gap-6">
                <Link href="#" className="text-sm text-slate-400 hover:text-primary">Termos de Serviço</Link>
                <Link href="#" className="text-sm text-slate-400 hover:text-primary">Política de Privacidade</Link>
                <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-primary">
                    <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4"/>
                        Admin
                    </Link>
                </Button>
            </nav>
            <p className="text-sm text-slate-400 text-center md:text-right">
                © {new Date().getFullYear()} BarberCut Bot. Todos os direitos reservados.
            </p>
            </div>
        </footer>
     </div>
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Redefinir Senha</DialogTitle>
                <DialogDescription>
                    Digite seu e-mail para receber um link de redefinição de senha.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="reset-email">E-mail</Label>
                    <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button type="button" onClick={handlePasswordReset} disabled={isResetLoading}>
                    {isResetLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Link
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
     </>
  );
}

    