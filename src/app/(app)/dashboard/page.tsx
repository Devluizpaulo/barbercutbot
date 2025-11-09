
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardRedirectorPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userShopsQuery = useMemoFirebase(() => (
    user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null
  ), [firestore, user]);

  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  const isLoading = isUserLoading || isLoadingShops;

  useEffect(() => {
    if (isLoading) {
      return; // Wait until loading is complete
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    const firstShop = shops?.[0];

    if (!firstShop) {
      // Handle case where user has no shop - maybe redirect to a "create shop" page or show an error
      console.error("Nenhuma loja encontrada para este usuário.");
      // For now, let's just show a message.
      return;
    }

    // Explicitly check if the setup is NOT complete (is false)
    if (firstShop.isSetupComplete === false) {
      router.replace(`/setup/${firstShop.id}`);
    } else {
      // If setup is complete or the field doesn't exist (legacy), go to dashboard
      router.replace(`/dashboard/${firstShop.id}`);
    }

  }, [isLoading, user, shops, router]);

  // Show a loading state until redirection logic completes
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Carregando seu negócio...</h2>
        <p className="text-muted-foreground">Estamos preparando seu ambiente e redirecionando você.</p>
         {isLoading && <p className="text-xs text-muted-foreground mt-4">(Aguardando dados...)</p>}
         {!user && !isUserLoading && <p className="text-xs text-red-500 mt-4">(Usuário não autenticado...)</p>}
      </div>
    </div>
  );
}
