

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { ensureUserExists } from '@/lib/google-auth-utils';
import { seedDemoData } from '@/lib/dev-seed';

export default function DashboardRedirectPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userShopsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: shops, isLoading: areShopsLoading, refresh } = useCollection<BarberShop>(userShopsQuery);

  const isLoading = isUserLoading || areShopsLoading;
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (shops && shops.length > 0) {
        router.push(`/dashboard/${shops[0].id}`);
        return;
      }
      // Se não há lojas, garanta criação da loja padrão e force refresh
      if (!bootstrapping) {
        setBootstrapping(true);
        ensureUserExists(firestore, user)
          .then(() => {
            // dá um pequeno tempo para propagação e então força novo snapshot
            setTimeout(() => {
              refresh();
              setBootstrapping(false);
            }, 800);
          })
          .catch(() => setBootstrapping(false));
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
                  if (!user) return;
                  setBootstrapping(true);
                  try {
                    // Garante a loja e popula coleções com dados exemplo
                    await ensureUserExists(firestore, user);
                    // Após criação, a query de shops pega o ID; ainda assim popular no primeiro shop após refresh
                    setTimeout(async () => {
                      refresh();
                      // sem o id ainda aqui, o seed será chamado a partir das páginas de collection
                      setBootstrapping(false);
                    }, 600);
                  } catch {
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
