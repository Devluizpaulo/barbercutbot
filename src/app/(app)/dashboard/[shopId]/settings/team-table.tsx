
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit, Trash2, PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { TeamMember } from '@/lib/types';
import { AddTeamMemberForm } from './add-team-member-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface TeamTableProps {
  shopId: string;
}

export function TeamTable({ shopId }: TeamTableProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>(undefined);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const teamQuery = useMemoFirebase(
    () => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'teamMembers') : null,
    [firestore, shopId, user]
  );
  const { data: teamMembers, isLoading } = useCollection<TeamMember>(teamQuery);

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setFormOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedMember(undefined);
    setFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedMember(undefined);
  };
  
  const handleDelete = () => {
    if (!memberToDelete) return;
    const memberRef = doc(firestore, 'barberShops', shopId, 'teamMembers', memberToDelete.id);
    deleteDocumentNonBlocking(memberRef);
    toast({
      title: 'Membro Removido',
      description: `O membro da equipe "${memberToDelete.firstName}" foi removido.`,
    });
    setMemberToDelete(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Membro
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
            </TableRow>
          ))}
          {teamMembers?.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.firstName} {member.lastName}</TableCell>
              <TableCell>{member.email || '-'}</TableCell>
              <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEdit(member)}>
                      <Edit className="mr-2 h-4 w-4"/>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setMemberToDelete(member)}
                    >
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && teamMembers?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">Nenhum membro da equipe encontrado.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
       <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedMember(undefined); setFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedMember ? 'Editar Membro' : 'Novo Membro da Equipe'}</DialogTitle>
          </DialogHeader>
          <AddTeamMemberForm
            shopId={shopId}
            initialData={selectedMember}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
       <AlertDialog open={!!memberToDelete} onOpenChange={(isOpen) => !isOpen && setMemberToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover permanentemente o membro da equipe <strong>{memberToDelete?.firstName}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Sim, remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
