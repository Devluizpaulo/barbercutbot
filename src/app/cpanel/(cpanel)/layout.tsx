
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect } from "react";
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
  Shield,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';
import { collection, query } from "firebase/firestore";
import type { UserProfile, BarberShop, Ticket as TicketType } from "@/lib/types";

interface CPanelContextType {
  shops: BarberShop[] | null;
  users: UserProfile[] | null;
  tickets: TicketType[] | null;
  isLoading: boolean;
}

const CPanelContext = createContext<CPanelContextType>({
  shops: null,
  users: null,
  tickets: null,
  isLoading: true,
});

export const useCPanel = () => useContext(CPanelContext);


export default function CPanelDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const shopsQuery = useMemoFirebase(() => (user?.role === 'admin') ? collection(firestore, 'barberShops') : null, [firestore, user]);
  const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(shopsQuery);

  const usersQuery = useMemoFirebase(() => (user?.role === 'admin') ? collection(firestore, 'users') : null, [firestore, user]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const ticketsQuery = useMemoFirebase(() => (user?.role === 'admin') ? query(collection(firestore, 'tickets')) : null, [firestore, user]);
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<TicketType>(ticketsQuery);
  
  const isLoadingData = isLoadingShops || isLoadingUsers || isLoadingTickets;


  useEffect(() => {
    if (isUserLoading) return; 

    if (!user || user.role !== 'admin') {
      router.push('/cpanel/login');
    }
  }, [user, isUserLoading, router]);


  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/cpanel/login');
  };
  
  if (isUserLoading || !user || user.role !== 'admin') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
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
    <CPanelContext.Provider value={{ shops, users, tickets, isLoading: isLoadingData }}>
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
                          <span>Acessar como Cliente</span>
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
    </CPanelContext.Provider>
  );
}
