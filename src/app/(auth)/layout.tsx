
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
  
  // This layout should not handle redirects. 
  // It should simply render the children if the user is not yet authenticated,
  // or a loader if auth state is pending. The protected layouts ((app) or cpanel)
  // are responsible for redirecting already-authenticated users.

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete, render the children (login form, signup, setup, etc.)
  return <>{children}</>;
}
