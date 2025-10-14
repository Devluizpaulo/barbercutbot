
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
    // Only execute redirection logic when loading is fully complete.
    if (!isLoading) {
      if (shops && shops.length > 0) {
        // If the user has shops, redirect to the first one.
        router.push(`/dashboard/${shops[0].id}`);
      } else if (shops && shops.length === 0) {
        // If the user has no shops, redirect to the 'new shop' page.
        router.push('/dashboard/shops/new');
      }
      // If shops is null (e.g., query hasn't run yet), do nothing and wait.
    }
  }, [isLoading, shops, router]);

  // Display a loading screen while user and shop data are being fetched
  // and the redirection logic is being determined.
  return (
    <div className="flex flex-1 items-center justify-center h-screen bg-secondary">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
