
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createInitialShopAndUser } from '@/lib/google-auth-utils';

/**
 * This page acts as a smart router and bootstrapper for the user's dashboard.
 * 1. It waits for the user and their shop data to load.
 * 2. If a shop exists, it redirects to that shop's dashboard.
 * 3. If no shop exists, it transparently creates a default one and then redirects.
 */
export default function DashboardBootstrapperPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isCreatingShop, setIsCreatingShop] = useState(false);

  // Memoized query to find the user's first active shop.
  const userShopsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), where('status', '==', 'active'), limit(1)) : null),
    [firestore, user]
  );
  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    // Wait until both user and shop data have finished loading.
    if (isUserLoading || isLoadingShops) {
      return;
    }
    
    // If there's no authenticated user, redirect to the login page.
    if (!user) {
        router.replace('/login');
        return;
    }

    const hasShops = shops && shops.length > 0;

    if (hasShops) {
      // User has a shop, redirect to their dashboard.
      const firstShopId = shops[0].id;
      router.replace(`/dashboard/${firstShopId}`);
    } else if (!isCreatingShop) {
      // User has no shops, and we are not already in the process of creating one.
      // This is the bootstrapping step.
      setIsCreatingShop(true);
      const createDefaultShop = async () => {
        try {
          // Use the utility function to create both user and shop docs.
          // This is idempotent and will handle cases where the user doc might already exist.
          const newShopId = await createInitialShopAndUser(firestore, user, "Minha Barbearia");
          
          toast({
              title: "Bem-vindo(a)!",
              description: "Configuramos uma barbearia padrão para você começar."
          });
          
          router.replace(`/dashboard/${newShopId}`);

        } catch (error) {
            console.error("Failed to create default shop:", error);
            toast({
                variant: "destructive",
                title: "Erro Crítico",
                description: "Não foi possível criar sua loja inicial. Por favor, contate o suporte."
            });
            // Potentially redirect to an error page or back to login
            router.replace('/login');
        }
      };
      
      createDefaultShop();
    }

  }, [shops, isUserLoading, isLoadingShops, user, router, firestore, toast, isCreatingShop]);

  // Render a clear loading/bootstrapping state to the user.
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">
                {isCreatingShop ? 'Configurando seu ambiente...' : 'Carregando seu negócio...'}
            </h2>
            <p className="text-muted-foreground max-w-sm">
                {isCreatingShop 
                  ? 'Estamos criando sua primeira loja. Isso levará apenas um momento.' 
                  : 'Estamos preparando tudo para você. Aguarde um instante.'
                }
            </p>
        </div>
    </div>
  );
}
