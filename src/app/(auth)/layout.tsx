
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
    // This effect now only handles redirecting an already logged-in user away from auth pages.
    // It no longer decides WHERE to redirect. That logic is centralized in the (app) layout.
    if (!isUserLoading && user) {
      // Determine the base path based on role and redirect.
      const destination = user.role === 'admin' ? '/cpanel' : '/dashboard';
      router.replace(destination);
    }
  }, [user, isUserLoading, router]);

  // While checking auth status OR if a user is found (and we are about to redirect),
  // show a loading screen. This prevents flashing the login page for an already auth'd user.
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
  
  // If loading is done and there's no user, show the auth page content (login, signup, etc.).
  return <>{children}</>;
}
