
'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Search, Shield } from 'lucide-react';
import { AddTeamMemberForm } from './add-team-member-form';
import { useCPanel } from '@/app/cpanel/context';
import { Input } from '@/components/ui/input';
import { TeamTable } from './team-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';


export default function CPanelTeamPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { users, isLoading } = useCPanel();

  const teamMembers = useMemo(() => {
    const allTeam = users?.filter(u => u.role === 'admin' || u.role === 'support') || [];
    if (!searchTerm) return allTeam;

    const lowercasedTerm = searchTerm.toLowerCase();
    return allTeam.filter(user =>
        (user.firstName && user.firstName.toLowerCase().includes(lowercasedTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(lowercasedTerm)) ||
        user.email.toLowerCase().includes(lowercasedTerm) ||
        user.role.toLowerCase().includes(lowercasedTerm)
    );
  }, [users, searchTerm]);
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Shield />
            Equipe da Plataforma
          </h1>
          <p className="text-muted-foreground">
            Gerencie os administradores e a equipe de suporte do sistema.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Membro da Equipe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro da Equipe</DialogTitle>
              <DialogDescription>
                Crie uma nova conta de usuário e atribua um perfil de acesso.
              </DialogDescription>
            </DialogHeader>
            <AddTeamMemberForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

       <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou perfil..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <Skeleton className="h-[200px] w-full" />}
                {!isLoading && <TeamTable users={teamMembers} isLoading={isLoading}/>}
            </CardContent>
          </Card>
    </div>
  );
}
