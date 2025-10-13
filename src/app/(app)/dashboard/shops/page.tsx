
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

export default function DashboardShopsPage() {
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
    // Só executa a lógica de redirecionamento quando o carregamento terminar.
    if (!isLoading) {
      if (shops && shops.length > 0) {
        router.push(`/dashboard/${shops[0].id}`);
      } else if (shops && shops.length === 0) {
        router.push('/dashboard/shops/new');
      }
    }
  }, [isLoading, shops, router]);

  // Exibe uma tela de carregamento enquanto os dados estão sendo buscados
  // e a lógica de redirecionamento está sendo decidida.
  return (
    <div className="flex flex-1 items-center justify-center h-screen bg-secondary">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
