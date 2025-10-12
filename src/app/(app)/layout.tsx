'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import DashboardLayout from './dashboard/layout';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/login');
    } else if (user.role === 'admin') {
      router.push('/cpanel');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || user.role === 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
