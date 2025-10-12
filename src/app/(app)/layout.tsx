
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';

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

    // If no user is logged in, redirect them to the regular login page.
    if (!user) {
      router.push('/login');
      return;
    }

    // If the user is an admin, they should not be in the regular app section.
    // Redirect them to the CPanel.
    if (user.role === 'admin') {
      router.push('/cpanel');
    }

  }, [user, isUserLoading, router, pathname]);

  // Show loading spinner while checking auth or if the user is an admin being redirected.
  if (isUserLoading || !user || user.role === 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render children only if the user is a regular user.
  return <>{children}</>;
}
