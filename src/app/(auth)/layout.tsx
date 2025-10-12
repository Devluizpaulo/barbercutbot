
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
    // Wait until the user loading process is fully complete.
    if (isUserLoading) {
      return;
    }

    // After loading, if a user object exists, then we can safely check its role.
    if (user) {
      if (user.role === 'admin') {
        router.push('/cpanel');
      } else {
        router.push('/dashboard/shops');
      }
    }
    // If there's no user after loading, do nothing and let the child page (login/signup) render.
  }, [user, isUserLoading, router]);

  // Show a loading screen ONLY if we are still checking the user state.
  // If we are done loading and there is a user, we will be redirecting, so a loader is appropriate.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is finished AND there is no user, render the login/signup page.
  return <>{children}</>;
}
