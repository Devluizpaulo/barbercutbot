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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

interface AppNavProps {
  shopId?: string;
}

export function AppNav({ shopId }: AppNavProps) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const shopRef = useMemoFirebase(() => (shopId ? doc(firestore, 'barberShops', shopId) : null), [firestore, shopId]);
  const { data: shop } = useDoc<{ id: string; name?: string; logoUrl?: string }>(shopRef);

  function ThemeToggle() {
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
    const label = isDark ? 'Claro' : 'Escuro';
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const el = document.documentElement;
          const willDark = !el.classList.contains('dark');
          el.classList.toggle('dark', willDark);
          try { localStorage.setItem('theme', willDark ? 'dark' : 'light'); } catch {}
        }}
      >
        {label}
      </Button>
    );
  }

  const groups = [
    {
      title: 'Operação',
      items: [
        { name: 'Dashboard', href: shopId ? `/dashboard/${shopId}` : '/dashboard', icon: LayoutDashboard },
        { name: 'Agendamentos', href: shopId ? `/dashboard/${shopId}/appointments` : '/dashboard', icon: Calendar },
        { name: 'Financeiro', href: shopId ? `/dashboard/${shopId}/finance` : '/dashboard', icon: DollarSign },
      ],
    },
    {
      title: 'Cadastro',
      items: [
        { name: 'Clientes', href: shopId ? `/dashboard/${shopId}/clients` : '/dashboard', icon: Users },
        { name: 'Barbeiros', href: shopId ? `/dashboard/${shopId}/barbers` : '/dashboard', icon: Scissors },
        { name: 'Serviços', href: shopId ? `/dashboard/${shopId}/services` : '/dashboard', icon: Package },
      ],
    },
    {
      title: 'Análise',
      items: [
        { name: 'Relatórios', href: shopId ? `/dashboard/${shopId}/reports` : '/dashboard', icon: BarChart3 },
      ],
    },
    {
      title: 'Admin',
      items: [
        { name: 'Configurações', href: shopId ? `/dashboard/${shopId}/settings` : '/dashboard', icon: Settings },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {shop?.logoUrl && <AvatarImage src={shop.logoUrl} alt={shop?.name || 'Loja'} />}
              <AvatarFallback>
                {shop?.name ? shop.name.charAt(0).toUpperCase() : 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-muted-foreground">BarberCut</span>
              <span className="text-sm font-medium truncate max-w-[140px]">{shop?.name || 'Minha Barbearia'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <div key={group.title} className="px-3 py-2">
            <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.title}</div>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
