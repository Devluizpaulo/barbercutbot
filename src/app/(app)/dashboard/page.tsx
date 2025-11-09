
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    async function findUserShopAndRedirect() {
      if (isUserLoading || !user || !firestore) {
        return;
      }
      
      // 1. Find the user's shop
      const shopsQuery = query(
        collection(firestore, 'barberShops'), 
        where('ownerId', '==', user.uid), 
        limit(1)
      );
      const shopsSnapshot = await getDocs(shopsQuery);

      if (!shopsSnapshot.empty) {
        const shop = shopsSnapshot.docs[0].data() as BarberShop;
        
        // 2. Check if the setup is complete
        if (shop.isSetupComplete) {
          router.replace(`/dashboard/${shop.id}`);
        } else {
          router.replace(`/dashboard/setup/${shop.id}`);
        }
      } else {
        // This case should ideally not happen if signup flow is correct,
        // but it's a good fallback.
        console.error("Nenhuma loja encontrada para o usuário. Redirecionando para criação de conta.");
        // We might want to redirect to a page that allows creating a shop,
        // or back to signup. For now, let's show an error state.
        // Or, more robustly, attempt to create it. But for now, we'll just log.
      }
    }

    findUserShopAndRedirect();
  }, [user, isUserLoading, firestore, router]);

  return (
    <div className="flex flex-1 items-center justify-center h-screen bg-secondary">
      <div className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Carregando seu negócio...</h2>
        <p className="text-muted-foreground">Estamos preparando seu ambiente.</p>
      </div>
    </div>
  );
}
