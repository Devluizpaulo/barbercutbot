
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function CPanelAuthLayout({
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

    // If an admin is already logged in, redirect them to the main cpanel dashboard
    if (user && user.role === 'admin') {
      router.push('/cpanel');
    }
    
  }, [user, isUserLoading, router]);

  // Show a loading screen while checking for an existing session
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's a logged-in admin, they are being redirected, show loader.
  if (user && user.role === 'admin') {
     return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no admin is logged in, show the login/signup page.
  return <>{children}</>;
}
