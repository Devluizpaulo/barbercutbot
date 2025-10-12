
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
      // Do nothing while loading to prevent flicker
      return;
    }

    if (user) {
      // If a user is logged in, redirect them to the correct dashboard.
      if (user.role === 'admin') {
        router.push('/cpanel');
      } else {
        router.push('/dashboard/shops');
      }
    }
  }, [user, isUserLoading, router]);

  // Show a loading screen while checking for a user or during redirection.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user is found after loading, show the children (login/signup page).
  return <>{children}</>;
}
