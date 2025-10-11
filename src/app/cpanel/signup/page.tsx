
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
import { LoaderCircle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

    if (email.toLowerCase() !== 'admin@flowcutspro.com') {
         toast({
            variant: 'destructive',
            title: 'Cadastro não permitido',
            description: 'Apenas o e-mail de administrador pode se cadastrar aqui.',
        });
        setIsLoading(false);
        return;
    }

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
        await setDoc(userDocRef, {
            id: user.uid,
            firstName,
            lastName,
            email: user.email,
        });

        // Add to admins collection since it's the admin email
        const adminDocRef = doc(firestore, 'admins', user.uid);
        await setDoc(adminDocRef, {
            createdAt: serverTimestamp(),
        });

        toast({
          title: 'Conta de Administrador Criada!',
          description: 'Você será redirecionado para o painel de controle.',
        });
        
        router.push('/cpanel');

    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        let description = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Esta conta de administrador já existe.';
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
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
                <Logo />
            </div>
          <CardTitle>Cadastro de Administrador</CardTitle>
          <CardDescription>
            Crie a conta principal para gerenciar a plataforma.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email de Admin</Label>
                <Input
                id="email"
                type="email"
                placeholder="admin@flowcutspro.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
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
    </div>
  );
}
