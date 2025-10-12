
"use client";

import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useUser } from "@/firebase";
import { useEffect } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
       if(pathname !== '/login' && pathname !== '/signup') {
         router.push('/login');
       }
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || (!user && (pathname !== '/login' && pathname !== '/signup'))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
