
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, User, Mail, Lock, Menu, Shield, Building } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { createInitialShopAndUser } from '@/lib/google-auth-utils';


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


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [shopName, setShopName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [acceptedLGPD, setAcceptedLGPD] = useState(false);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedLGPD || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !shopName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, preencha todos os campos e aceite os termos para continuar.',
      });
      return;
    }
    
    if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Senha muito curta',
            description: 'A senha deve ter pelo menos 6 caracteres.',
        });
        return;
    }

    setIsLoading(true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: `${firstName.trim()} ${lastName.trim()}`
        });

        await user.reload(); // Ensure the user object has the updated displayName
        const updatedUser = auth.currentUser;
        if (!updatedUser?.displayName) {
             throw new Error("Falha ao atualizar o perfil do usuário.");
        }

        await createInitialShopAndUser(firestore, updatedUser, shopName);
        
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você será redirecionado para a página de login.',
        });
        
        router.push('/login');

    } catch (error: any) {
        let description = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este e-mail já está em uso. Tente fazer login.';
        }
        toast({
          variant: 'destructive',
          title: 'Falha no cadastro',
          description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!acceptedLGPD || !shopName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, preencha o nome da sua barbearia e aceite os termos.',
      });
      return;
    }
    setIsGoogleLoading(true);
    
    const provider = new GoogleAuthProvider();
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await createInitialShopAndUser(firestore, user, shopName);
        
        toast({ title: "Cadastro com Google bem-sucedido!", description: "Você será redirecionado para o login." });
        router.push('/login');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro no Cadastro com Google",
            description: "Não foi possível criar sua conta. Tente novamente."
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };


  return (
    <div className="relative flex flex-col min-h-screen">
       <div className="absolute inset-0">
            <Image
                src="/image/hero.png"
                alt="Fundo de uma barbearia estilosa"
                fill
                className="object-cover"
                data-ai-hint="barber shop background"
            />
        </div>
        <div className="absolute inset-0 bg-black/70" />

      <header className="fixed top-0 left-0 right-0 bg-transparent z-20">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial da BarberCut Bot">
            <Logo />
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/login">
                  <Lock className="mr-2 h-4 w-4" />
                  Login
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
                     <Button variant="ghost" asChild className="w-full">
                      <Link href="/login">
                          <Lock className="mr-2 h-4 w-4" />
                          Login
                      </Link>
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
                <div className="mx-auto">
                    <Logo />
                </div>
              <CardTitle className="font-headline text-3xl">Crie sua Conta</CardTitle>
              <CardDescription className="text-slate-400">
                Comece a gerenciar seu negócio hoje mesmo.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="shopName" className="text-slate-300">Nome da Barbearia</Label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="shopName" required value={shopName} onChange={(e) => setShopName(e.target.value)} className="pl-10 bg-white/5 border-white/20" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || !acceptedLGPD || !shopName.trim()}>
                      {isGoogleLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      Cadastrar com Google
                  </Button>
                   <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/20" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-900/80 px-2 text-muted-foreground">
                            Ou cadastre com e-mail
                            </span>
                        </div>
                    </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-slate-300">Nome</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10 bg-white/5 border-white/20" disabled={isGoogleLoading}/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-slate-300">Sobrenome</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10 bg-white/5 border-white/20" disabled={isGoogleLoading}/>
                        </div>
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
                    <Label htmlFor="password" className="text-slate-300">Senha</Label>
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
                <div className="flex items-start gap-3 rounded-md border border-white/10 p-3">
                  <Checkbox id="lgpd" checked={acceptedLGPD} onCheckedChange={(v) => setAcceptedLGPD(Boolean(v))} />
                  <Label htmlFor="lgpd" className="text-slate-300 text-sm leading-relaxed">
                    Eu li e concordo com a <Link href="/privacy" className="underline">Política de Privacidade</Link> e autorizo o tratamento dos meus dados pessoais conforme a <abbr title="Lei Geral de Proteção de Dados">LGPD</abbr> e os <Link href="/terms" className="underline">Termos de Uso</Link>.
                  </Label>
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading || !acceptedLGPD}>
                        {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Criar conta
                    </Button>
                     <p className="text-sm text-center text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="underline hover:text-primary">
                            Faça login
                        </Link>
                    </p>
                </CardFooter>
            </form>
          </Card>
      </main>
    </div>
  );
}
