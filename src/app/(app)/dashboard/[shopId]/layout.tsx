
"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
  Calendar,
  Users,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  User,
  Scissors,
  ClipboardList,
  Truck,
} from "lucide-react";
import { shops } from "@/lib/data";
import { Logo } from "@/components/logo";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const shopId = params.shopId as string;
  const shop = shops.find((s) => s.id === shopId);

  const navItems = [
    { href: `/dashboard/${shopId}`, label: "Visão Geral", icon: LayoutDashboard },
    { href: `/dashboard/${shopId}/appointments`, label: "Agendamentos", icon: Calendar },
    { href: `/dashboard/${shopId}/clients`, label: "Clientes", icon: Users },
    { href: `/dashboard/${shopId}/barbers`, label: "Barbeiros", icon: User },
    { href: `/dashboard/${shopId}/services`, label: "Serviços", icon: ClipboardList },
    { href: `/dashboard/${shopId}/suppliers`, label: "Fornecedores", icon: Truck },
    { href: `/dashboard/${shopId}/finance`, label: "Finanças", icon: CreditCard },
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
                      isActive={pathname.startsWith(item.href) && (item.href.length === pathname.length || pathname[item.href.length] === '/')}
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
                    <Link href="/dashboard">
                        <SidebarMenuButton tooltip="Admin" className="justify-start">
                            <Shield />
                            <span>Admin</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
               <SidebarMenuItem>
                <Link href={`/dashboard/${shopId}/settings`}>
                  <SidebarMenuButton tooltip="Configurações" className="justify-start"
                   isActive={pathname.startsWith(`/dashboard/${shopId}/settings`)}
                  >
                    <Settings />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="#">
                  <SidebarMenuButton tooltip="Perfil" className="justify-start">
                    <User />
                    <span>Perfil</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton tooltip="Sair" className="justify-start">
                    <LogOut />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 p-4 sm:p-6 md:p-8 pt-[4.2rem] bg-background">
          {children}
        </div>
      </div>
  );
}
