
'use client';

import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { useEffect } from 'react';
import { CPanelProvider } from './context';
import { CPanelNav } from './cnav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';

export default function CPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    if (!user) {
      router.replace('/cpanel/login');
      return;
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

  // If user is a confirmed admin, render the layout.
  // This check prevents non-admins from seeing a flash of the CPanel layout before redirection.
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

  // Logged-in but not admin: show friendly access denied screen.
  if (user && user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <h2 className="text-xl font-semibold">Acesso negado ao Painel Administrativo</h2>
          <p className="text-muted-foreground">
            Sua conta não possui permissões de administrador. Caso tenha sido promovido recentemente,
            faça logout e login novamente para atualizar suas permissões.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.replace('/login')}>Ir para Login</Button>
            <Button onClick={() => signOut(auth)}>Sair</Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading state during redirections.
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
