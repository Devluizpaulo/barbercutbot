
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

  const isLoading = isUserLoading || isLoadingShops;
  const shop = shops?.[0];

  useEffect(() => {
    if (isLoading) {
      return; // Wait for all data to be loaded.
    }

    // 1. Authentication Check: If no user, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }

    // 2. Authorization Check: Handle non-owner roles.
    if (user.role === 'admin') {
      router.replace('/cpanel');
      return;
    }
    if (user.role !== 'owner') {
      router.replace('/login'); // Fallback for any other unauthorized roles
      return;
    }
    
    // At this point, we have a logged-in 'owner'. Now, check for shop and setup.
    if (!shop) {
      // This is a critical error state, but we avoid a loop by not redirecting.
      // A more robust solution would be a "Create your first shop" page.
      console.error("Critical: Owner user exists without any associated shop.");
      return; 
    }

    // 3. Onboarding/Setup Check: The core logic.
    if (shop.isSetupComplete === false) {
      // If setup is incomplete, forcefully redirect to the setup page.
      if (!pathname.startsWith(`/setup/${shop.id}`)) {
        router.replace(`/setup/${shop.id}`);
      }
      return;
    }

    // 4. If setup IS complete, but user is on a setup-related page, or the root dashboard, redirect to their shop.
    if (shop.isSetupComplete === true) {
      if (pathname.startsWith('/setup/') || pathname === '/dashboard') {
        router.replace(`/dashboard/${shop.id}`);
        return;
      }
    }

  }, [user, isLoading, shop, pathname, router]);

  // While ANY of the core data is loading, or if we are in a redirection state, show a full-screen loader.
  if (isLoading || !shop || (shop.isSetupComplete === false && !pathname.startsWith('/setup'))) {
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
  
  // If all checks pass, render the main application layout.
  return (
    <SidebarProvider>
      <AppNav shopId={shop.id} />
      <SidebarInset>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
