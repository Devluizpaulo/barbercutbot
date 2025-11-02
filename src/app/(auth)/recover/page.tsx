
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
import { LoaderCircle, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function RecoverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast({
            variant: 'destructive',
            title: 'Campo obrigatório',
            description: 'Por favor, insira o seu e-mail.',
        });
        return;
    }

    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: 'E-mail de recuperação enviado!',
            description: 'Verifique sua caixa de entrada (e spam) para redefinir sua senha.',
        });
        router.push('/login');
    } catch (error: any) {
        console.error("Password Reset Error:", error);
        toast({
            variant: 'destructive',
            title: 'Falha ao enviar e-mail',
            description: 'Não foi possível enviar o e-mail. Verifique se o e-mail está correto ou tente novamente.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
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

        <main className="flex-1 flex items-center justify-center px-4 z-10">
             <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-lg border-white/10 text-white">
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="font-headline text-3xl">Recuperar Senha</CardTitle>
                  <CardDescription className="text-slate-400">
                    Insira seu e-mail e enviaremos um link para você voltar a acessar sua conta.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordReset}>
                    <CardContent className="space-y-4">
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
                              />
                          </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Link de Recuperação
                        </Button>
                        <Button variant="link" asChild className="text-slate-400 hover:text-white">
                          <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Voltar para o Login
                          </Link>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
     </div>
  );
}
