
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Users, Shield, Store } from 'lucide-react';
import { useCPanel } from '@/app/cpanel/context';
import { TeamTable } from '@/app/cpanel/(cpanel)/team/team-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CPanelUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, isLoading } = useCPanel();

  const { owners, team } = useMemo(() => {
    const ownersList = users?.filter(u => u.role === 'owner') || [];
    const teamList = users?.filter(u => u.role === 'admin' || u.role === 'support') || [];
    return { owners: ownersList, team: teamList };
  }, [users]);

  const filteredOwners = useMemo(() => {
    if (!searchTerm) return owners;
    const lowercasedTerm = searchTerm.toLowerCase();
    return owners.filter(user =>
        (user.firstName && user.firstName.toLowerCase().includes(lowercasedTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(lowercasedTerm)) ||
        user.email.toLowerCase().includes(lowercasedTerm)
    );
  }, [owners, searchTerm]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Users />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Visualize todos os usuários da plataforma, incluindo donos de lojas e equipe interna.
          </p>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="owners" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="owners">
            <Store className="mr-2 h-4 w-4" />
            Donos de Lojas ({owners.length})
          </TabsTrigger>
          <TabsTrigger value="team">
            <Shield className="mr-2 h-4 w-4" />
            Equipe da Plataforma ({team.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <CardTitle>Donos de Lojas</CardTitle>
              <CardDescription>Lista de todos os usuários com perfil de "owner".</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && <Skeleton className="h-[200px] w-full" />}
              {!isLoading && <TeamTable users={filteredOwners} isLoading={isLoading} />}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Equipe da Plataforma</CardTitle>
              <CardDescription>Usuários com perfis de "admin" e "support".</CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading && <Skeleton className="h-[200px] w-full" />}
               {!isLoading && <TeamTable users={team} isLoading={isLoading} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
