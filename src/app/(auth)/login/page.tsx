
'use client';

import { useState, useEffect } from 'react';
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
import { LoaderCircle, Lock, Menu, Shield, Mail } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
        // If a user is already logged in, redirect them.
        if (user.role === 'admin') {
            router.push('/cpanel');
        } else {
            router.push('/dashboard/shops');
        }
    }
  }, [user, isUserLoading, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // The useEffect hook will handle redirection after the user state is updated.
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando...',
        });
    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        let description = 'Ocorreu um erro ao tentar fazer login.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            description = 'E-mail ou senha inválidos. Por favor, verifique suas credenciais.';
        }
        toast({
          variant: 'destructive',
          title: 'Falha no login',
          description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-secondary">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return (
     <div className="flex flex-col min-h-screen bg-white dark:bg-background">
        <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm z-20 border-b">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
                <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
                    <Logo />
                </Link>
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/signup">
                            Criar Conta
                        </Link>
                    </Button>
                </div>
                 <div className="md:hidden">
                    <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Abrir Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
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

        <main className="flex-1 flex items-center justify-center pt-20 bg-secondary">
             <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto">
                        <Logo />
                    </div>
                <CardTitle>Bem-vindo de volta!</CardTitle>
                <CardDescription>
                    Faça login para gerenciar seu negócio.
                </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
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
        
        <footer className="py-8 border-t bg-secondary">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
            <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
                <Logo />
            </Link>
            <nav className="flex flex-wrap justify-center items-center gap-4 text-center md:gap-6">
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Termos de Serviço</Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Política de Privacidade</Link>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/cpanel/login">
                        <Shield className="mr-2 h-4 w-4"/>
                        Admin
                    </Link>
                </Button>
            </nav>
            <p className="text-sm text-muted-foreground text-center md:text-right">
                © {new Date().getFullYear()} FlowCuts Pro. Todos os direitos reservados.
            </p>
            </div>
        </footer>
     </div>
  );
}
