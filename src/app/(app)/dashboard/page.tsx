'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { ensureUserExists } from '@/lib/google-auth-utils';

export default function DashboardPage() {
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
      // Garantir que o usuário existe no Firestore e tem uma loja
      const ensureUserAndShop = async () => {
        try {
          await ensureUserExists(firestore, user);
          
          // Aguardar um pouco para a loja ser criada
          setTimeout(() => {
            // Recarregar a página para atualizar as lojas
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error('Erro ao garantir usuário e loja:', error);
        }
      };

      ensureUserAndShop();
    }
  }, [isLoading, user, firestore]);

  useEffect(() => {
    if (!isLoading && shops) {
      if (shops.length > 0) {
        // Se o usuário tem uma ou mais lojas, redireciona para a primeira.
        router.push(`/dashboard/${shops[0].id}`);
      } else {
        // Se não tem lojas, aguarda a criação automática
        console.log('Usuário não tem lojas ainda, aguardando criação...');
      }
    }
  }, [isLoading, shops, router]);

  // Exibe uma tela de carregamento enquanto o usuário e as lojas estão sendo carregados
  // e o redirecionamento está sendo processado.
  return (
    <div className="flex flex-1 items-center justify-center h-screen bg-secondary">
      <div className="flex flex-col items-center gap-4 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Configurando seu ambiente...</h2>
        <p className="text-muted-foreground max-w-sm">
          Estamos preparando tudo para você. Se for seu primeiro acesso, isso pode levar alguns instantes.
        </p>
        {user && (
          <div className="text-sm text-muted-foreground">
            <p>Usuário: {user.email}</p>
            <p>UID: {user.uid}</p>
          </div>
        )}
      </div>
    </div>
  );
}
