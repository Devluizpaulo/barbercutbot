'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppNav } from './app-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Try to extract shopId from routes like /dashboard/:shopId/*
  const shopId = (() => {
    if (!pathname) return undefined;
    const m = pathname.match(/^\/dashboard\/([^\/]+)(?:\/|$)/);
    return m?.[1];
  })();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Show a loading spinner while the user's auth state is being determined.
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there is a user, render the main app layout.
  if (user) {
    return (
      <SidebarProvider>
        <AppNav shopId={shopId} />
        <SidebarInset>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Fallback for the brief moment before redirect happens when no user is found.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
