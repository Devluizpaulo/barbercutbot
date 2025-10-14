
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { Home, Shield, Users, Store, FileText, Ticket, Settings, LogOut } from "lucide-react";

const menuItems = [
    { id: 'home', label: 'Início', icon: Home, href: '/cpanel' },
    { id: 'shops', label: 'Lojas', icon: Store, href: '/cpanel/shops' },
    { id: 'team', label: 'Usuários', icon: Users, href: '/cpanel/team' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, href: '/cpanel/tickets' },
    { id: 'documents', label: 'Documentos', icon: FileText, href: '/cpanel/documents' },
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/cpanel/settings' },
    { id: 'logs', label: 'Logs', icon: Shield, href: '/cpanel/logs' },
];

export function CPanelNav() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map(item => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <UserNav />
            </SidebarFooter>
        </Sidebar>
    )
}
