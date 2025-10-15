'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Users, 
  Package, 
  DollarSign,
  Settings,
  BarChart3
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';

interface AppNavProps {
  shopId?: string;
}

export function AppNav({ shopId }: AppNavProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: shopId ? `/dashboard/${shopId}` : '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Agendamentos',
      href: shopId ? `/dashboard/${shopId}/appointments` : '/dashboard',
      icon: Calendar,
    },
    {
      name: 'Clientes',
      href: shopId ? `/dashboard/${shopId}/clients` : '/dashboard',
      icon: Users,
    },
    {
      name: 'Barbeiros',
      href: shopId ? `/dashboard/${shopId}/barbers` : '/dashboard',
      icon: Scissors,
    },
    {
      name: 'Serviços',
      href: shopId ? `/dashboard/${shopId}/services` : '/dashboard',
      icon: Package,
    },
    {
      name: 'Financeiro',
      href: shopId ? `/dashboard/${shopId}/finance` : '/dashboard',
      icon: DollarSign,
    },
    {
      name: 'Relatórios',
      href: shopId ? `/dashboard/${shopId}/reports` : '/dashboard',
      icon: BarChart3,
    },
    {
      name: 'Configurações',
      href: shopId ? `/dashboard/${shopId}/settings` : '/dashboard',
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <h2 className="text-lg font-semibold">BarberCut</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
