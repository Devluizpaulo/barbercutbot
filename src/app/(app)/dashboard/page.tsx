
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Settings, Rocket, ArrowRight } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * This page acts as a welcome and decision point for new users.
 * If the shop is not configured, it prompts the user to start the setup or skip.
 * If the shop is configured, it redirects to the main dashboard.
 */
export default function DashboardDecisionPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userShopsQuery = useMemoFirebase(() => (
    user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null
  ), [firestore, user]);

  const { data: shops, isLoading: isLoadingShopsHook } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  // Combined loading state
  const isLoading = isUserLoading || isLoadingShopsHook;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Carregando seu negócio...</h2>
          <p className="text-muted-foreground">Estamos preparando seu ambiente.</p>
        </div>
      </div>
    );
  }

  const firstShop = shops?.[0];

  // If there's a shop and its setup is complete, redirect.
  if (firstShop && firstShop.isSetupComplete !== false) {
    router.replace(`/dashboard/${firstShop.id}`);
    // Return a loader while redirecting
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's a shop and setup is NOT complete, show the decision card.
  if (firstShop && firstShop.isSetupComplete === false) {
    return (
        <div className="flex flex-1 items-center justify-center h-full bg-secondary">
            <Card className="w-full max-w-lg text-center shadow-2xl">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                        <Rocket className="h-10 w-10 text-primary"/>
                    </div>
                    <CardTitle className="font-headline text-3xl">Bem-vindo(a) ao BarberCut Bot!</CardTitle>
                    <CardDescription className="text-base">
                        Sua loja <span className="font-bold">{firstShop.name}</span> foi criada. Vamos dar os próximos passos!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Para aproveitar ao máximo a plataforma, recomendamos concluir a configuração inicial. Leva apenas alguns minutos.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="w-full" size="lg">
                        <Link href={`/setup/${firstShop.id}`}>
                            <Settings className="mr-2 h-5 w-5"/>
                            Configurar minha loja agora
                        </Link>
                    </Button>
                     <Button asChild variant="ghost" className="w-full" size="lg">
                        <Link href={`/dashboard/${firstShop.id}`}>
                            Lembrar-me depois
                            <ArrowRight className="ml-2 h-5 w-5"/>
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  // Fallback case if no shop is found after loading.
  return (
     <div className="flex flex-1 items-center justify-center h-full">
       <div className="text-center">
          <h2 className="text-xl font-semibold">Nenhuma loja encontrada</h2>
          <p className="text-muted-foreground">Não encontramos uma barbearia associada a esta conta.</p>
          <Button asChild className="mt-4">
            <Link href="/signup">Criar uma nova loja</Link>
          </Button>
       </div>
     </div>
  );
}
