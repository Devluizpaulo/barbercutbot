
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
    // Only perform actions once the user loading state is confirmed (not loading).
    if (isUserLoading) {
      return;
    }

    // If there is a user, decide where to redirect them based on their role.
    if (user) {
      if (user.role === 'admin') {
        router.push('/cpanel');
      } else {
        router.push('/dashboard/shops');
      }
    }
    // If there is no user and loading is complete, do nothing, allowing the
    // login/signup pages to be displayed.
  }, [user, isUserLoading, router]);

  // Show a loading spinner while the user's auth state is being determined,
  // or if we are about to redirect a logged-in user.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is finished and there's no user, render the authentication page (e.g., Login, Signup).
  return <>{children}</>;
}
