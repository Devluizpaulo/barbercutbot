
'use client';

import { useUser } from '@/firebase';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * This layout is responsible for rendering the authentication pages (login, signup, etc.).
 * It shows a loader only while auth state is being determined, to prevent a flash of
 * the login form for an already-authenticated user who is about to be redirected.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    // If a user is found, the appropriate layout ((app) or cpanel) will handle
    // the redirection. This layout's job is done.
    if (!isUserLoading && user) {
        if (user.role === 'admin') {
            router.replace('/cpanel');
        } else {
            router.replace('/dashboard');
        }
    }
  }, [user, isUserLoading, router]);


  // While checking auth status OR if a user is found and redirection is imminent,
  // show a loader. This is the key to preventing the "flicker" of the login form.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Only if loading is complete and there is NO user, render the children (login form).
  return <>{children}</>;
}
