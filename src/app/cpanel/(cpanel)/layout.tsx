
'use client';

import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { CPanelProvider } from './context';
import { CPanelNav } from './cnav';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';

export default function CPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    // If loading is done and there's no user, redirect to the cpanel login page
    if (!user) {
      router.push('/cpanel/login');
      return;
    }
    
    // If a user is logged in but is NOT an admin, redirect them away from cpanel
    if (user.role !== 'admin') {
      router.push('/dashboard/shops');
    }

  }, [user, isUserLoading, router]);

  // Show a loading screen while user status is being checked or if the user is not an admin
  if (isUserLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is a confirmed admin, render the layout
  return (
    <SidebarProvider>
      <CPanelProvider>
        <div className="flex min-h-screen w-full">
            <CPanelNav />
            <SidebarInset>
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                  {children}
              </main>
            </SidebarInset>
        </div>
      </CPanelProvider>
    </SidebarProvider>
  );
}
