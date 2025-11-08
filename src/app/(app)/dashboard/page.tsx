
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';

// Esta página agora serve como a entrada principal do dashboard.
// Ela é responsável por encontrar a primeira loja do usuário e redirecioná-lo.
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Consulta para encontrar as lojas do usuário.
  const userShopsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null),
    [firestore, user]
  );
  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    if (isUserLoading || isLoadingShops) {
      return; // Aguardando dados
    }

    if (shops && shops.length > 0) {
      const shop = shops[0];
      // Verifica se a configuração inicial foi concluída.
      if (shop.isSetupComplete) {
        router.replace(`/dashboard/${shop.id}`);
      } else {
        // Se não, redireciona para a página de onboarding.
        router.replace(`/dashboard/setup/${shop.id}`);
      }
    } else {
        // Cenário de fallback: Se o usuário não tiver lojas.
        // A lógica em `ensureUserExists` deve prevenir isso, mas é uma salvaguarda.
    }
  }, [shops, isUserLoading, isLoadingShops, router]);

  // Exibe uma tela de carregamento universal enquanto a lógica de redirecionamento está em andamento.
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
