
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppNav } from './app-nav';
import { collection, query, where, limit } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';

/**
 * This is the main security gate and router for the authenticated user application.
 * Its responsibilities are:
 * 1. Ensure a user is logged in. If not, redirect to /login.
 * 2. Ensure the logged-in user has the 'owner' role. If not, redirect away.
 * 3. Find the user's primary shop.
 * 4. Based on the shop's `isSetupComplete` flag, redirect to the setup page or render the main app.
 * 5. Render the main app shell (Sidebar, etc.) for fully authenticated and set-up owners.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Query to find the user's first shop.
  const userShopsQuery = useMemoFirebase(() => (
    user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1)) : null
  ), [firestore, user]);

  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(userShopsQuery);

  const shopId = shops?.[0]?.id;
  const isSetupComplete = shops?.[0]?.isSetupComplete;

  const isLoading = isUserLoading || isLoadingShops;

  useEffect(() => {
    if (isLoading) {
      return; // Wait for all data to be loaded.
    }

    // 1. Authentication Check
    if (!user) {
      router.replace('/login');
      return;
    }

    // 2. Authorization Check
    if (user.role === 'admin') {
      router.replace('/cpanel');
      return;
    }
    if (user.role !== 'owner') {
      router.replace('/login'); // Fallback for any other roles
      return;
    }
    
    // At this point, we have a logged-in 'owner'. Now, check for shop setup.
    const currentPath = pathname.split('/')[1];

    if (!shopId) {
      // This is a critical error state: an owner without a shop.
      // This should ideally be handled by a more robust "create your first shop" page.
      // For now, we'll prevent a loop by not redirecting.
      console.error("Critical: Owner user exists without any associated shop.");
      return; // Stop execution to avoid loops.
    }

    // 3. Onboarding/Setup Check
    if (isSetupComplete === false) {
      // If setup is not complete, redirect to the setup page for their shop.
      // Only redirect if they are NOT already on a setup page.
      if (!pathname.startsWith('/setup/')) {
        router.replace(`/setup/${shopId}`);
      }
      return; // Stop further execution after redirection.
    }
    
    // 4. If setup IS complete, but they are somehow on the setup page, redirect them away to their dashboard.
    if (isSetupComplete === true && pathname.startsWith('/setup/')) {
       router.replace(`/dashboard/${shopId}`);
       return;
    }


    // 5. If the user is on the root dashboard page, redirect them to their specific shop dashboard.
     if (pathname === '/dashboard') {
      router.replace(`/dashboard/${shopId}`);
      return;
    }

  }, [user, isLoading, shops, shopId, isSetupComplete, pathname, router]);

  // While ANY of the core data is loading, show a full-screen loader.
  // This is the main guard against rendering components with incomplete data.
  if (isLoading || !shopId || (isSetupComplete === false && !pathname.startsWith('/setup/'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Carregando seu ambiente...</h2>
            <p className="text-muted-foreground max-w-sm">
                Verificando suas credenciais e configurações.
            </p>
        </div>
      </div>
    );
  }
  
  // If all checks pass, render the main application layout for the user.
  return (
    <SidebarProvider>
      <AppNav shopId={shopId} />
      <SidebarInset>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

