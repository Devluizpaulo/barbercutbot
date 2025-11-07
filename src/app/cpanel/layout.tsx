
'use client';

import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { CPanelProvider } from './context';
import { CPanelNav } from './cnav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function CPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    if (!user) {
      router.replace('/cpanel/login');
      return;
    }
    
    if (user.role !== 'admin') {
      // If user is not an admin, deny access and redirect.
      router.replace('/dashboard');
    }

  }, [user, isUserLoading, router]);

  // Show a loading screen while user status is being checked.
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
          <div className="flex flex-col items-center gap-4 text-center">
              <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verificando Acesso Admin...</h2>
              <p className="text-muted-foreground max-w-sm">
                  Validando suas permissões de administrador.
              </p>
          </div>
      </div>
    );
  }

  // If user is a confirmed admin, render the layout. Otherwise, render a loader
  // while the redirect is in progress.
  if (user && user.role === 'admin') {
    return (
      <SidebarProvider>
        <CPanelProvider>
          <div className="flex min-h-screen w-full">
              <CPanelNav />
              <SidebarInset>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
              </SidebarInset>
          </div>
        </CPanelProvider>
      </SidebarProvider>
    );
  }

  // Fallback loading screen while redirecting non-admins
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
