'use client';

import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { CPanelProvider } from './context';
import { CPanelNav } from '@/app/cpanel/cpanel-nav';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function CPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/cpanel/login');
      return;
    }
    
    if (user.role !== 'admin') {
      router.push('/dashboard/shops');
    }

  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <CPanelProvider>
        <div className="flex min-h-screen w-full">
          <CPanelNav />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {children}
          </main>
        </div>
      </CPanelProvider>
    </SidebarProvider>
  );
}
