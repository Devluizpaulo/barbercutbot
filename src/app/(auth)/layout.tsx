
'use client';

import { useUser } from '@/firebase';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * This layout is responsible for rendering the authentication pages (login, signup, etc.).
 * Its primary job is to show a loading state while authentication is being checked,
 * preventing users from seeing auth forms if they are already logged in.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    // If a user is already logged in, redirect them away from auth pages.
    if (!isUserLoading && user) {
        if (user.role === 'admin') {
            router.replace('/cpanel');
        } else {
            router.replace('/dashboard');
        }
    }
  }, [user, isUserLoading, router]);


  // While checking auth status, or if a user is found (and redirection is pending),
  // show a full-screen loader to prevent flashing the auth form.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and there's no user, render the auth page (e.g., login form).
  return <>{children}</>;
}
