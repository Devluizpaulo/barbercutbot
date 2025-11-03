
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo";
import { Home, Shield, Users, Store, FileText, Ticket, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const menuItems = [
    { id: 'home', label: 'Início', icon: Home, href: '/cpanel' },
    { id: 'shops', label: 'Lojas', icon: Store, href: '/cpanel/shops' },
    { id: 'team', label: 'Usuários & Equipe', icon: Users, href: '/cpanel/team' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, href: '/cpanel/tickets' },
    { id: 'documents', label: 'Documentos', icon: FileText, href: '/cpanel/documents' },
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/cpanel/settings' },
    { id: 'logs', label: 'Logs', icon: Shield, href: '/cpanel/logs' },
];

export function CPanelNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/cpanel/login');
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                  <Logo />
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <SidebarTrigger />
                  </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map(item => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.href !== '/cpanel' && pathname.startsWith(item.href))}
                                tooltip={item.label}
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
                {user && (
                  <div className="flex items-center gap-3 rounded-md border p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuário"} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.displayName || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-1" />
                      Sair
                    </Button>
                  </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}

function ThemeToggle() {
  if (typeof document === 'undefined') return null;
  const isDark = document.documentElement.classList.contains('dark');
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
        el.setAttribute('data-theme', willDark ? 'dark' : 'light');
      }}
    >
      {label}
    </Button>
  );
}
