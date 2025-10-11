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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Login bem-sucedido!',
          description: 'Bem-vindo de volta!',
        });
        router.push('/dashboard/shops');
    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        toast({
          variant: 'destructive',
          title: 'Falha no login',
          description: 'Por favor, verifique seu e-mail e senha.',
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
          <CardTitle>Bem-vindo de volta!</CardTitle>
          <CardDescription>
            Faça login para gerenciar seu negócio.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
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
    </div>
  );
}
