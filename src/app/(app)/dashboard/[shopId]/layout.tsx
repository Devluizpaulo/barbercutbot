
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
  LogOut,
  User,
  ClipboardList,
  Truck,
  LifeBuoy,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { BarberShop } from "@/lib/types";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();

  const shopRef = useMemoFirebase(
    () => (shopId ? doc(firestore, "barberShops", shopId) : null),
    [firestore, shopId]
  );
  const { data: shop } = useDoc<BarberShop>(shopRef);

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
          <SidebarHeader className="p-4 flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground">
                  <Settings />
              </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={item.href === pathname}
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
                    <Link href={`/dashboard/${shopId}/support`}>
                        <SidebarMenuButton tooltip="Suporte" className="justify-start" isActive={pathname.startsWith(`/dashboard/${shopId}/support`)}>
                            <LifeBuoy />
                            <span>Suporte</span>
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
                <Link href={`/dashboard/${shopId}/profile`}>
                  <SidebarMenuButton tooltip="Perfil" className="justify-start" isActive={pathname.startsWith(`/dashboard/${shopId}/profile`)}>
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
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
          {children}
        </main>
      </div>
  );
}
