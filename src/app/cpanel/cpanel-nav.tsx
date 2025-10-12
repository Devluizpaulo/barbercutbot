
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Home,
  Users,
  Store,
  Ticket,
  FileText,
  Settings,
  Shield,
  LifeBuoy,
} from 'lucide-react';
import { UserNav } from '@/components/user-nav';

const menuItems = [
  { href: '/cpanel', label: 'Dashboard', icon: Home },
  { href: '/cpanel/shops', label: 'Lojas', icon: Store },
  { href: '/cpanel/users', label: 'Usuários', icon: Users },
  { href: '/cpanel/tickets', label: 'Tickets', icon: Ticket },
  { href: '/cpanel/documents', label: 'Documentos', icon: FileText },
  { href: '/cpanel/settings', label: 'Configurações', icon: Settings },
];

export function CPanelNav() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Logo />
          {isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  icon={<item.icon />}
                  tooltip={item.label}
                >
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between">
            <UserNav />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
