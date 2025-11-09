'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Users, 
  Package, 
  DollarSign,
  Settings,
  BarChart3,
  Moon,
  Sun,
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarFooter } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';

interface AppNavProps {
  shopId?: string;
}

export function AppNav({ shopId }: AppNavProps) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const shopRef = useMemoFirebase(() => (shopId ? doc(firestore, 'barberShops', shopId) : null), [firestore, shopId]);
  const { data: shop } = useDoc<{ id: string; name?: string; logo?: string }>(shopRef);

  function ThemeToggle() {
    const [theme, setTheme] = useState<string | null>(null);

    useEffect(() => {
        // Acessa o tema do localStorage no lado do cliente
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
    }, []);

    const toggleTheme = () => {
        const el = document.documentElement;
        const currentTheme = el.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        el.classList.toggle('dark', newTheme === 'dark');
        try {
            localStorage.setItem('theme', newTheme);
            setTheme(newTheme);
        } catch {}
    };
    
    if (theme === null) return null;

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    );
  }
  
  const isActive = (href: string) => {
    if (!shopId) return false;
    const baseHref = `/dashboard/${shopId}`;
    if (href === baseHref) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  const groups = [
    {
      title: 'Operação',
      items: [
        { name: 'Dashboard', href: shopId ? `/dashboard/${shopId}` : '/dashboard', icon: LayoutDashboard },
        { name: 'Agendamentos', href: shopId ? `/dashboard/${shopId}/appointments` : '/dashboard', icon: Calendar },
        { name: 'Finanças', href: shopId ? `/dashboard/${shopId}/finance` : '/dashboard', icon: DollarSign },
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
              {shop?.logo && <AvatarImage src={shop.logo} alt={shop?.name || 'Loja'} />}
              <AvatarFallback>
                {shop?.name ? shop.name.charAt(0).toUpperCase() : 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm text-muted-foreground">BarberCut</span>
              <span className="text-sm font-medium truncate max-w-[140px]">{shop?.name || 'Minha Barbearia'}</span>
            </div>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, groupIndex) => (
          <div key={group.title} className={cn("mb-2", groupIndex > 0 && "pt-2 border-t")}>
            <div className="px-5 pb-1 text-xs font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
              {group.title}
            </div>
            <SidebarMenu>
              {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.name}>
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
       <SidebarFooter>
        <div className="flex items-center justify-between p-2">
            <div className="group-data-[collapsible=icon]:hidden">
              <UserNav />
            </div>
            <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
    