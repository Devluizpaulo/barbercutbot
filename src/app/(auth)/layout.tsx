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
      return;
    }

    if (user) {
        if (user.role === 'admin') {
            router.push('/cpanel');
        } else {
            router.push('/dashboard/shops');
        }
    }
    
  }, [user, isUserLoading, router]);

  // Show a loading screen while checking for an existing session
  // or if a logged-in user is being redirected.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user is logged in, show the login/signup page.
  return <>{children}</>;
}
