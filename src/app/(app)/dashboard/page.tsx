
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { ensureUserExists } from '@/lib/google-auth-utils';

export default function DashboardRedirectPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userShopsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: shops, isLoading: areShopsLoading } = useCollection<BarberShop>(userShopsQuery);

  const isLoading = isUserLoading || areShopsLoading;

  useEffect(() => {
    if (!isLoading && user) {
        // Se o usuário está logado mas não tem lojas, isso pode indicar que a Cloud Function
        // de criação ainda não terminou. O useCollection vai re-renderizar quando as lojas aparecerem.
        // Se depois de um tempo não aparecer, pode ser um problema.
        if (shops && shops.length > 0) {
            router.push(`/dashboard/${shops[0].id}`);
        }
    }
  }, [isLoading, user, shops, router]);


  // Exibe uma tela de carregamento enquanto o usuário e as lojas estão sendo carregados
  // e o redirecionamento está sendo processado.
  return (
    <div className="flex flex-1 items-center justify-center h-screen bg-secondary">
      <div className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Carregando seu dashboard...</h2>
        <p className="text-muted-foreground max-w-sm">
          Estamos preparando tudo para você. Se for seu primeiro acesso, isso pode levar alguns instantes.
        </p>
      </div>
    </div>
  );
}
