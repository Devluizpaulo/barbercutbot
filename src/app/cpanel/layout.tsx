
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
  User,
  Ticket,
  LoaderCircle,
  Store,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useUser } from "@/firebase";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();


  useEffect(() => {
    // Se o carregamento do usuário terminou
    if (!isUserLoading) {
      // Se não há usuário, redireciona para a página de login do cpanel
      if (!user) {
        if (pathname !== '/cpanel/login') {
            router.push('/cpanel/login');
        }
      } 
      // Se há um usuário, mas não é o admin
      else if (user.email !== 'admin@bbr.com') {
        // Redireciona para o dashboard das lojas, que é a área do usuário comum
        router.push('/dashboard/shops');
      }
      // Se é o admin e está na página de login, redireciona para o dashboard do cpanel
      else if (user.email === 'admin@bbr.com' && pathname === '/cpanel/login') {
        router.push('/cpanel');
      }
    }
  }, [user, isUserLoading, router, pathname]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/cpanel/login');
  };

  const navItems = [
    { href: `/cpanel`, label: "Visão Geral", icon: LayoutDashboard },
    { href: `/cpanel/shops`, label: "Lojas", icon: Store },
    { href: `/cpanel/users`, label: "Usuários", icon: Users },
    { href: `/cpanel/tickets`, label: "Tickets de Suporte", icon: Ticket },
    { href: `/cpanel/documents`, label: "Documentos", icon: FileText },
    { href: `/cpanel/settings`, label: "Configurações", icon: Settings },
  ];

  if (isUserLoading || (!user && pathname !== '/cpanel/login')) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }
  
  if (pathname === '/cpanel/login') {
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <div className="flex flex-1 min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4 flex items-center justify-between">
              <Logo />
              <div className="md:hidden">
                <SidebarTrigger asChild>
                    <Button variant="ghost" size="icon"><LogOut /></Button>
                </SidebarTrigger>
              </div>
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
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
