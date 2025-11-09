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

  const userShopsQuery = useMemoFirebase(() => (
    user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null
  ), [firestore, user]);

  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    if (isUserLoading || isLoadingShops) {
      return; // Aguarde o carregamento do usuário e das lojas
    }

    if (!user) {
      // Se não houver usuário, redirecione para o login (embora o layout já deva fazer isso)
      router.replace('/login');
      return;
    }

    if (shops && shops.length > 0) {
      const shop = shops[0];
      if (shop.isSetupComplete) {
        router.replace(`/dashboard/${shop.id}`);
      } else {
        router.replace(`/dashboard/setup/${shop.id}`);
      }
    } else if (!isLoadingShops) {
      // Se terminou de carregar e não há lojas, pode ser um estado de erro ou um novo usuário cujo documento ainda não foi criado.
      // O fluxo de cadastro agora cria a loja, então isso é um fallback.
      console.error("Nenhuma loja encontrada para o usuário, mas o carregamento foi concluído. Verifique o processo de cadastro.");
      // Poderia redirecionar para uma página de erro ou tentar criar uma loja aqui.
    }
  }, [user, isUserLoading, shops, isLoadingShops, router]);

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
