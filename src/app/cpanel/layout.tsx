
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarProvider, 
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  LogOut,
  Ticket,
  LoaderCircle,
  Store,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";

export default function CPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();


  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isUserLoading) {
        return;
      }

      if (!user) {
        if (pathname !== '/cpanel/login' && pathname !== '/cpanel/signup') {
            router.push('/cpanel/login');
        }
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data() as UserProfile;

        if (userData?.role !== 'admin') {
           router.push('/dashboard/shops');
        } else if (pathname === '/cpanel/login' || pathname === '/cpanel/signup') {
           router.push('/cpanel');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push('/login');
      }
    };
    
    checkAdminStatus();

  }, [user, isUserLoading, router, pathname, firestore]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/cpanel/login');
  };
  
  if (isUserLoading || (!user && pathname !== '/cpanel/login' && pathname !== '/cpanel/signup')) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }
  
  if (pathname === '/cpanel/login' || pathname === '/cpanel/signup') {
    return <>{children}</>;
  }


  const navItems = [
    { href: `/cpanel`, label: "Visão Geral", icon: LayoutDashboard },
    { href: `/cpanel/shops`, label: "Lojas", icon: Store },
    { href: `/cpanel/users`, label: "Usuários", icon: Users },
    { href: `/cpanel/tickets`, label: "Tickets de Suporte", icon: Ticket },
    { href: `/cpanel/documents`, label: "Documentos", icon: FileText },
    { href: `/cpanel/settings`, label: "Configurações", icon: Settings },
  ];

  return (
    <SidebarProvider>
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
              <SidebarTrigger />
          </div>
          <Link
            href="/cpanel"
            className="hidden items-center gap-2 text-lg font-semibold md:flex md:text-base"
          >
            <Logo />
          </Link>
        </div>
        
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <UserNav />
        </div>
      </header>
        <main className="flex flex-1">
          <Sidebar>
            <SidebarHeader className="p-4 flex items-center justify-between">
                <Logo />
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/cpanel')}
                        tooltip={item.label}
                        className="justify-start"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
              <SidebarMenu>
                 <SidebarMenuItem>
                  <Link href="/dashboard/shops">
                    <SidebarMenuButton tooltip="Voltar para Lojas" className="justify-start">
                      <LogOut className="rotate-180" />
                      <span>Voltar para Lojas</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sair" className="justify-start" onClick={handleLogout}>
                      <LogOut />
                      <span>Sair</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <div className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

    