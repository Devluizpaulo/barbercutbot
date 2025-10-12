'use client';

import { useState } from 'react';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCPanel } from '../context';

interface TeamTableProps {
  isLoading: boolean;
}

export function TeamTable({ isLoading }: TeamTableProps) {
  const { users } = useCPanel();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleDelete = () => {
    if (!userToDelete) return;
    // Note: Deleting the auth user should be handled by a Cloud Function for security.
    // This only deletes the Firestore record.
    const userRef = doc(firestore, 'users', userToDelete.id);
    deleteDocumentNonBlocking(userRef);
    toast({
      title: 'Usuário Removido',
      description: `O usuário "${userToDelete.email}" foi removido do Firestore.`,
    });
    setUserToDelete(null);
  };
  
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'owner':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <>
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
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.firstName} {user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4"/>
                      Editar (em breve)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setUserToDelete(user)}
                    >
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && users?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">Nenhum membro da equipe encontrado.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
       <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação removerá o registro do usuário <strong>{userToDelete?.email}</strong> do Firestore, mas não excluirá a conta do Firebase Auth. A exclusão completa deve ser feita no Firebase Console.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Sim, remover do Firestore
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
