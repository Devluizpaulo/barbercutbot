
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppNav } from './app-nav';

/**
 * This is the main security gate for the authenticated user application.
 * Its responsibilities are:
 * 1. Ensure a user is logged in. If not, redirect to /login.
 * 2. Ensure the logged-in user has the 'owner' role. If not, redirect away.
 * 3. Render the main app shell (Sidebar, etc.) for authenticated owners.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Extract shopId from the URL for the AppNav component.
  const shopId = (() => {
    const match = pathname.match(/^\/dashboard\/([^\/]+)/);
    return match?.[1];
  })();

  useEffect(() => {
    // Wait until the authentication check is complete.
    if (isUserLoading) {
      return;
    }

    // If no user is authenticated, they must log in.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // If the user is an admin, they belong in the CPanel, not here.
    if (user.role === 'admin') {
      router.replace('/cpanel');
      return;
    }
    
    // If for some reason a user with a role other than 'owner' ends up here,
    // send them back to the main login page as a fallback.
    if (user.role !== 'owner') {
        router.replace('/login');
        return;
    }

  }, [user, isUserLoading, router]);

  // While authentication is loading, show a full-screen loader.
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Preparando seu painel...</h2>
            <p className="text-muted-foreground max-w-sm">
                Carregando suas informações e permissões.
            </p>
        </div>
      </div>
    );
  }

  // If loading is complete and we have a valid 'owner' user, render the app shell.
  // This check prevents non-owners from briefly seeing the app layout before redirection.
  if (user && user.role === 'owner') {
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

  // This fallback loader catches the brief moment before a non-owner user is redirected.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
