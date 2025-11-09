
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';

/**
 * This is the central routing page after a user logs in.
 * Its sole responsibility is to find the user's first shop and redirect them
 * to the appropriate place: the setup page or the main dashboard.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userShopsQuery = useMemoFirebase(() => (
    user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null
  ), [firestore, user]);

  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    // Wait until we have all necessary information.
    if (isUserLoading || isLoadingShops) {
      return; 
    }

    // If there's no user, the main layout should have already redirected to /login.
    // This is an extra safety check.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // If the user is logged in and shop data is loaded:
    if (shops) {
      if (shops.length > 0) {
        const shop = shops[0];
        // If setup is explicitly false, go to the onboarding flow.
        if (shop.isSetupComplete === false) {
          router.replace(`/setup/${shop.id}`);
        } else {
          // Otherwise, go to the main dashboard for that shop.
          router.replace(`/dashboard/${shop.id}`);
        }
      } else {
        // Fallback: This user has no shops. This can happen if shop creation failed
        // during signup. Send them to login to be safe. A better experience might
        // be a page that says "No shop found, create one?".
        console.error("Nenhuma loja encontrada para o usuário. Redirecionando para login.");
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, shops, isLoadingShops, router]);

  // Display a loading state while determining the correct route.
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
