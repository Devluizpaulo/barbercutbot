

'use client';

import React from "react";
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
import { Home, Shield, Users, Store, FileText, Ticket, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
    { id: 'home', label: 'Início', icon: Home, href: '/cpanel' },
    { id: 'shops', label: 'Lojas', icon: Store, href: '/cpanel/shops' },
    { id: 'users', label: 'Usuários', icon: Users, href: '/cpanel/users' },
    { id: 'team', label: 'Equipe', icon: Shield, href: '/cpanel/team' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, href: '/cpanel/tickets' },
    { id: 'documents', label: 'Documentos', icon: FileText, href: '/cpanel/documents' },
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/cpanel/settings' },
    { id: 'logs', label: 'Logs', icon: Shield, href: '/cpanel/logs' },
];

function ThemeToggle() {
    const [theme, setTheme] = React.useState<string | null>(null);

    React.useEffect(() => {
        // Only run on client
        const storedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(storedTheme || systemTheme);
      }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
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
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <Logo />
                  <SidebarTrigger />
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
                                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center justify-between p-2">
                    <div className="group-data-[collapsible=icon]:hidden">
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuário"} />
                                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-sm font-medium truncate">{user.displayName || 'Admin'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start" side="top">
                                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    </div>
                    <ThemeToggle />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
