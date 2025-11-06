
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved.
    }

    if (user) {
      // User is logged in, redirect based on role.
      if (user.role === 'admin') {
        router.replace('/cpanel');
      } else {
        router.replace('/dashboard');
      }
    }
    // If no user and loading is complete, do nothing (render the login/signup page).
  }, [user, isUserLoading, router]);

  // While checking auth or if a user is found and we are about to redirect, show a loading screen.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Autenticando...</h2>
            <p className="text-muted-foreground max-w-sm">
                Verificando suas credenciais e preparando o redirecionamento.
            </p>
        </div>
      </div>
    );
  }
  
  // If loading is done and there's no user, show the auth page (login, signup, etc.).
  return <>{children}</>;
}
