
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { ensureUserExists } from '@/lib/google-auth-utils';
import { seedDemoData } from '@/lib/dev-seed';
import { useToast } from '@/hooks/use-toast';

export default function DashboardRedirectPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userShopsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), where('status', '==', 'active')) : null),
    [firestore, user]
  );
  const { data: shops, isLoading: areShopsLoading, refresh } = useCollection<BarberShop>(userShopsQuery);

  const isLoading = isUserLoading || areShopsLoading;
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (shops && shops.length > 0) {
        // We have shops, let's redirect to the first one.
        const firstShopId = shops[0].id;
        router.push(`/dashboard/${firstShopId}`);
        return;
      }
      
      // If we are here, it means no shops were found.
      // We trigger the bootstrapping process to create one if it doesn't exist.
      if (!bootstrapping) {
        setBootstrapping(true);
        ensureUserExists(firestore, user)
          .then(() => {
            // After attempting to create the user/shop, we force a refresh of the shops query.
            setTimeout(() => {
              refresh();
              setBootstrapping(false);
            }, 1200); // A slightly longer delay to ensure data propagation
          })
          .catch((err) => {
            console.error("Error during bootstrapping:", err);
            setBootstrapping(false);
          });
      }
    }
  }, [isLoading, user, shops, router, firestore, bootstrapping, refresh]);


  // Exibe uma tela de carregamento enquanto o usuário e as lojas estão sendo carregados
  // e o redirecionamento está sendo processado.
  const showLoading = isLoading || bootstrapping;
  return (
    <div className="flex flex-1 items-center justify-center h-screen bg-secondary">
      <div className="flex flex-col items-center gap-4 text-center">
        {showLoading ? (
          <>
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Carregando seu dashboard...</h2>
            <p className="text-muted-foreground max-w-sm">
              Estamos preparando tudo para você. Se for seu primeiro acesso, isso pode levar alguns instantes.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Quase lá!</h2>
            <p className="text-muted-foreground max-w-sm">
              Não encontramos uma loja vinculada à sua conta ainda. Vamos criar sua loja padrão agora.
            </p>
            <button
              className="mt-2 rounded bg-primary px-4 py-2 text-primary-foreground"
              onClick={async () => {
                setBootstrapping(true);
                try {
                  if (user) {
                    await ensureUserExists(firestore, user);
                    setTimeout(() => {
                      refresh();
                      setBootstrapping(false);
                    }, 600);
                  }
                } catch (e) {
                  setBootstrapping(false);
                }
              }}
            >
              Criar minha loja agora
            </button>
            {process.env.NODE_ENV !== 'production' && (
              <button
                className="mt-2 rounded bg-secondary px-4 py-2 text-secondary-foreground"
                onClick={async () => {
                  if (!user || !shops || shops.length === 0) return;
                  setBootstrapping(true);
                  try {
                    await seedDemoData(firestore, shops[0].id);
                    toast({title: "Dados de Exemplo Criados!", description: "Recarregue a página para ver as mudanças."});
                  } catch (e) {
                     console.error("Failed to seed data:", e);
                  } finally {
                    setBootstrapping(false);
                  }
                }}
              >
                Popular com dados de exemplo (dev)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
