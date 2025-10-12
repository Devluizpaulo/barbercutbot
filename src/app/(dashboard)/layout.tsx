'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
  LoaderCircle,
  Package,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { BarberShop } from '@/lib/types';
import { Search, Bell, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/user-nav';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const shopRef = useMemoFirebase(
    () => (shopId ? doc(firestore, 'barberShops', shopId) : null),
    [firestore, shopId]
  );
  const { data: shop } = useDoc<BarberShop>(shopRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    {
      href: `/dashboard/${shopId}`,
      label: 'Visão Geral',
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/${shopId}/appointments`,
      label: 'Agendamentos',
      icon: Calendar,
    },
    { href: `/dashboard/${shopId}/clients`, label: 'Clientes', icon: Users },
    {
      href: `/dashboard/${shopId}/barbers`,
      label: 'Profissionais',
      icon: User,
    },
    {
      href: `/dashboard/${shopId}/services`,
      label: 'Serviços',
      icon: ClipboardList,
    },
    { href: `/dashboard/${shopId}/products`, label: 'Produtos', icon: Package },
    {
      href: `/dashboard/${shopId}/suppliers`,
      label: 'Fornecedores',
      icon: Truck,
    },
  ];

  const financePath = `/dashboard/${shopId}/finance`;

  return (
     <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <Link
              href="/dashboard/shops"
              className="hidden items-center gap-2 text-lg font-semibold md:flex md:text-base"
            >
              <Logo />
            </Link>
          </div>
          
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Sun className="h-5 w-5" />
              <span className="sr-only">Alternar tema</span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="flex flex-1">
          <Sidebar>
            <SidebarHeader className="p-4 flex items-center justify-between">
              <Logo />
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <Link href={`${item.href}`}>
                      <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        className="justify-start"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    <SidebarMenuButton
                        isActive={pathname.startsWith(financePath)}
                        tooltip="Finanças"
                        className="justify-start"
                        asChild
                    >
                        <Link href={financePath}>
                        <CreditCard />
                        <span>Finanças</span>
                        </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                        <Link href={`${financePath}/income`}>
                            <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `${financePath}/income`}
                            >
                            <span>
                                <TrendingUp />
                                Receitas
                            </span>
                            </SidebarMenuSubButton>
                        </Link>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <Link href={`${financePath}/expenses`}>
                            <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `${financePath}/expenses`}
                            >
                            <span>
                                <TrendingDown />
                                Despesas
                            </span>
                            </SidebarMenuSubButton>
                        </Link>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href={`/dashboard/${shopId}/support`}>
                    <SidebarMenuButton
                      tooltip="Suporte"
                      className="justify-start"
                      isActive={pathname.startsWith(`/dashboard/${shopId}/support`)}
                    >
                      <LifeBuoy />
                      <span>Suporte</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href={`/dashboard/${shopId}/settings`}>
                    <SidebarMenuButton
                      tooltip="Configurações"
                      className="justify-start"
                      isActive={pathname.startsWith(`/dashboard/${shopId}/settings`)}
                    >
                      <Settings />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href={`/dashboard/${shopId}/profile`}>
                    <SidebarMenuButton
                      tooltip="Perfil"
                      className="justify-start"
                      isActive={pathname.startsWith(`/dashboard/${shopId}/profile`)}
                    >
                      <User />
                      <span>Perfil</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sair" className="justify-start" onClick={handleLogout}>
                    <LogOut />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
            {children}
          </main>
        </main>
      </div>
    </SidebarProvider>
  )
}
