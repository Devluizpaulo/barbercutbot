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
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
