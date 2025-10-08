
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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useUser } from "@/firebase";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";

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
    if (!isUserLoading && !user) {
      router.push('/cpanel/login');
    } else if (!isUserLoading && user && user.email !== 'admin@bbr.com') {
        // If a non-admin is logged in, send them away
        router.push('/dashboard/shops');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/cpanel/login');
  };

  const navItems = [
    { href: `/cpanel`, label: "Visão Geral", icon: LayoutDashboard },
    { href: `/cpanel/users`, label: "Usuários", icon: Users },
    { href: `/cpanel/tickets`, label: "Tickets de Suporte", icon: Ticket },
    { href: `/cpanel/documents`, label: "Documentos", icon: FileText },
    { href: `/cpanel/settings`, label: "Configurações", icon: Settings },
  ];

  if (isUserLoading || !user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
      <div className="flex flex-1">
        <Sidebar>
          <SidebarHeader className="py-8">
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
        <main className="flex-1 p-4 sm:p-6 md:p-8 pt-[4.2rem] bg-background">
          {children}
        </main>
      </div>
  );
}

