'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Query to find the first shop owned by the user.
  const userShopsQuery = useMemoFirebase(() => (
    user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null
  ), [firestore, user]);

  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    // Wait until both user and shop data have been loaded.
    if (isUserLoading || isLoadingShops) {
      return; 
    }

    // If the user is definitely not logged in, redirect them.
    if (!user) {
      router.replace('/login');
      return;
    }

    // If the user is an admin, send them to the control panel.
    if (user.role === 'admin') {
      router.replace('/cpanel');
      return;
    }

    // If we have loaded the shops data and found at least one.
    if (shops && shops.length > 0) {
      const shop = shops[0];
      // Check if the initial setup for the shop is complete.
      if (shop.isSetupComplete) {
        // If complete, go to the main dashboard for that shop.
        router.replace(`/dashboard/${shop.id}`);
      } else {
        // If not complete, go to the setup page for that shop.
        router.replace(`/dashboard/setup/${shop.id}`);
      }
    } else if (!isLoadingShops) {
      // This case handles a logged-in user who for some reason has no shops associated with them.
      // This might happen during the signup process before the shop document is created.
      // We log an error for debugging but don't redirect, to avoid loops.
      // The signup/login flow should handle creating a shop if one doesn't exist.
      console.error("Nenhuma loja encontrada para o usuário, mas o carregamento foi concluído. Verifique o processo de cadastro.");
    }
  }, [user, isUserLoading, shops, isLoadingShops, router]);

  // Render a loading state while we figure out where to send the user.
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
