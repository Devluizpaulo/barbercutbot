'use client';

import { redirect, useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

export default function DashboardShopsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // FIX: The query now filters for shops where ownerId matches the current user's UID.
  // This aligns with the Firestore security rules and prevents permission errors.
  const userShopsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid)) : null,
    [firestore, user]
  );
  const { data: shops, isLoading: areShopsLoading } = useCollection<BarberShop>(userShopsQuery);

  if (isUserLoading || areShopsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has shops, redirect to the first one's dashboard.
  if (shops && shops.length > 0) {
    redirect(`/dashboard/${shops[0].id}`);
  }

  // If user has no shops, redirect to the creation page.
  if (shops && shops.length === 0) {
    redirect('/dashboard/shops/new');
  }

  // Fallback for edge cases, should not be reached.
  return (
    <div className="flex flex-1 items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
