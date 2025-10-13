
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Users } from 'lucide-react';
import { TeamTable } from './TeamTable';
import { AddTeamMemberForm } from './add-team-member-form';
import { useCPanel } from '../context';

export default function CPanelTeamPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { isLoading } = useCPanel(); // Use context to manage loading state centrally

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Users />
            Equipe & Acessos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os administradores e outros membros da equipe da plataforma.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Membro
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

      <TeamTable isLoading={isLoading} />
    </div>
  );
}
