"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
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
  DollarSign,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { shops } from "@/lib/data";

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
    { href: `/dashboard/${shopId}/finance`, label: "Finanças", icon: DollarSign },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-4rem-1px)] w-full">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold tracking-tight font-headline truncate px-2">
                {shop?.name || "Barbearia"}
            </h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
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
                  <SidebarMenuButton tooltip="Voltar para Lojas">
                    <ChevronLeft />
                    <span>Todas as Lojas</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <Link href="#">
                  <SidebarMenuButton tooltip="Configurações">
                    <Settings />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="max-w-full">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
