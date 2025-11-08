
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { ensureUserExists } from '@/lib/google-auth-utils';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUserAndShop() {
      if (isUserLoading) return;
      
      if (user) {
        // Garantir que o usuário e a loja padrão existam.
        await ensureUserExists(firestore, user);

        // Depois de garantir a existência, procurar pela loja.
        const shopsQuery = query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1));
        const shopsSnapshot = await getDocs(shopsQuery);

        if (!shopsSnapshot.empty) {
          const shop = shopsSnapshot.docs[0].data() as BarberShop;
          if (shop.isSetupComplete) {
            router.replace(`/dashboard/${shop.id}`);
          } else {
            router.replace(`/dashboard/setup/${shop.id}`);
          }
        } else {
          // Fallback - se ensureUserExists falhar por alguma razão.
          console.error("Falha crítica: Nenhuma loja encontrada para o usuário após a verificação.");
          setIsSetupComplete(false); // Mantém na tela de loading com erro.
        }
      } else {
        // Se não houver usuário, não faz nada, pois o AppLayout redirecionará.
      }
    }

    checkUserAndShop();
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
