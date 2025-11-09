
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * This page acts as a router.
 * It finds the user's first shop and redirects to that shop's dashboard.
 * If no shop is found, it creates a default one.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userShopsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), where('status', '==', 'active'), limit(1)) : null),
    [firestore, user]
  );
  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  useEffect(() => {
    if (isUserLoading || isLoadingShops) {
      return; // Wait for data to load
    }
    
    if (!user) {
        router.replace('/login');
        return;
    }

    if (shops && shops.length > 0) {
      // User has one or more shops, redirect to the first one.
      const firstShop = shops[0];
      router.replace(`/dashboard/${firstShop.id}`);
    } else if (shops && shops.length === 0) {
      // User has no shops, create a default one as a fallback.
      const createDefaultShop = async () => {
        try {
            const newShopRef = collection(firestore, 'barberShops');
            const docRef = await addDocumentNonBlocking(newShopRef, {
                name: 'Minha Barbearia',
                ownerId: user.uid,
                status: 'active',
                isSetupComplete: true, // Setup is now considered complete by default
                createdAt: serverTimestamp(),
            });
            if (docRef) {
                toast({
                    title: "Bem-vindo(a)!",
                    description: "Criamos uma barbearia padrão para você começar."
                });
                router.replace(`/dashboard/${docRef.id}`);
            }
        } catch (error) {
            console.error("Failed to create default shop:", error);
            toast({
                variant: "destructive",
                title: "Erro Crítico",
                description: "Não foi possível criar sua loja inicial. Por favor, contate o suporte."
            });
        }
      };
      createDefaultShop();
    }

  }, [shops, isUserLoading, isLoadingShops, user, router, firestore, toast]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Carregando seu negócio...</h2>
            <p className="text-muted-foreground max-w-sm">
                Estamos preparando tudo para você.
            </p>
        </div>
    </div>
  );
}
