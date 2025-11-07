
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppNav } from './app-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Try to extract shopId from routes like /dashboard/:shopId/*
  const shopId = (() => {
    if (!pathname) return undefined;
    const m = pathname.match(/^\/dashboard\/([^\/]+)(?:\/|$)/);
    return m?.[1];
  })();

  useEffect(() => {
    if (isUserLoading) {
      return; // Still checking, do nothing yet.
    }

    if (!user) {
      // If no user is found after loading, redirect to the main login page.
      router.replace('/login');
      return;
    }
    
    // If the user is an admin, they should not be in the app layout. Redirect them to the CPanel.
    if (user.role === 'admin') {
      router.replace('/cpanel');
      return;
    }

    // If the user is an owner but somehow landed outside the /dashboard routes,
    // redirect them to their main dashboard page.
    if (user.role === 'owner' && !pathname.startsWith('/dashboard')) {
        router.replace('/dashboard');
        return;
    }

  }, [user, isUserLoading, router, pathname]);

  // Show a loading spinner while the user's auth state is being determined.
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

  // If there is a user and they are an owner, render the main app layout.
  // This check prevents non-owners from seeing a flash of the app layout before redirection.
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

  // This is a fallback loading state, typically seen during the brief moment of redirection.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
