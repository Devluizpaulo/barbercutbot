
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { MoreVertical, Shield, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { EditUserDialog } from '../users/edit-user-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface TeamTableProps {
  users: UserProfile[];
  isLoading: boolean;
}

export function TeamTable({ users, isLoading }: TeamTableProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const functions = getFunctions(undefined, 'us-central1');

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const deleteUserFunc = httpsCallable(functions, 'deleteUser');
      await deleteUserFunc({ uid: userToDelete.id });
      toast({ title: "Usuário Removido", description: `O usuário ${userToDelete.email} foi removido com sucesso.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erro ao remover usuário", description: error.message });
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={4}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-muted-foreground md:hidden">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsEditOpen(true); }}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setUserToDelete(user)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">Nenhum usuário encontrado.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setSelectedUser(null);
            }
          }}
        />
      )}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação irá remover permanentemente o usuário <strong>{userToDelete?.email}</strong>. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
