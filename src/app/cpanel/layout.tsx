
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Logo } from "@/components/logo";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: `/cpanel`, label: "Visão Geral", icon: LayoutDashboard },
    { href: `/cpanel/users`, label: "Usuários", icon: Users },
    { href: `/cpanel/tickets`, label: "Tickets de Suporte", icon: Ticket },
    { href: `/cpanel/documents`, label: "Documentos", icon: FileText },
    { href: `/cpanel/settings`, label: "Configurações", icon: Settings },
  ];

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
                <Link href={`/cpanel/profile`}>
                  <SidebarMenuButton tooltip="Perfil" className="justify-start" isActive={pathname.startsWith(`/cpanel/profile`)}>
                    <User />
                    <span>Perfil</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <Link href="/dashboard/shops">
                  <SidebarMenuButton tooltip="Voltar para Lojas" className="justify-start">
                    <LogOut className="rotate-180" />
                    <span>Voltar para Lojas</span>
                  </SidebarMenuButton>
                </Link>
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
