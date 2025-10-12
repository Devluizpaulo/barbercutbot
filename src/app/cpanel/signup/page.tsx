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
import { LoaderCircle, User, Mail, Lock, Menu, Shield } from 'lucide-react';
import { useAuth, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function CPanelSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Senha muito curta',
            description: 'A senha deve ter pelo menos 6 caracteres.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });

        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = {
            id: user.uid,
            firstName,
            lastName,
            email: user.email,
        };
        // Use setDoc for the main user profile
        await setDoc(userDocRef, userData, { merge: true });
        
        // Add the user to the 'admins' collection
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminData = {
            createdAt: serverTimestamp(),
        };
        await setDoc(adminDocRef, adminData);


        toast({
          title: 'Conta de Administrador Criada!',
          description: 'Você será redirecionado para o painel de controle.',
        });
        
        router.push('/cpanel');

    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        let description = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este endereço de e-mail já está em uso.';
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

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background">
       <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm z-20 border-b">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
            <Logo />
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/cpanel/login">
                  <Lock className="mr-2 h-4 w-4" />
                  Login de Admin
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
                  <div className="p-4 border-t mt-auto">
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/cpanel/login">
                          <Lock className="mr-2 h-4 w-4" />
                          Login de Admin
                      </Link>
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
            <CardTitle className="text-2xl font-headline">Cadastro de Administrador</CardTitle>
            <CardDescription>
                Crie uma conta para gerenciar a plataforma.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email de Admin</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        id="email"
                        type="email"
                        placeholder="admin@email.com"
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
                        Criar Conta de Admin
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link href="/cpanel/login" className="underline hover:text-primary">
                            Faça login
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
          </nav>
          <p className="text-sm text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} FlowCuts Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
