
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { DashboardLayout } from '../(dashboard)/layout';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      // If user is not logged in, redirect to login page.
      // This protects the entire /dashboard route group.
      router.push('/login');
      return;
    }
    
    // If the user has the 'admin' role, redirect them away from the regular
    // app dashboard to the CPanel.
    if (user.role === 'admin') {
      router.push('/cpanel');
    }

  }, [user, isUserLoading, router, pathname]);

  // While loading auth state, or if user is not a regular user (or is null), show a loader.
  if (isUserLoading || !user || user.role === 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render children inside the DashboardLayout for regular, authenticated users.
  return <DashboardLayout>{children}</DashboardLayout>;
}
