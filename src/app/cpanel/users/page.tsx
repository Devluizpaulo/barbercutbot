
'use client';

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { BarberShop, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


export default function AdminUsersPage() {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const usersQuery = useMemoFirebase(() => adminUser ? collection(firestore, 'users') : null, [firestore, adminUser]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    const shopsQuery = useMemoFirebase(() => adminUser ? collection(firestore, 'barberShops') : null, [firestore, adminUser]);
    const { data: shops, isLoading: isLoadingShops } = useCollection<BarberShop>(shopsQuery);


    const getShopByOwnerId = (ownerId: string) => {
        return shops?.find(s => s.ownerId === ownerId);
    }
    
    const isLoading = isLoadingUsers || isLoadingShops;

  return (
    <div className="flex flex-1 flex-col gap-8">
       <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Gerenciamento de Usuários
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários da plataforma.
        </p>
      </div>

        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário..." className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]" />
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Usuário
            </Button>
        </div>


      <Card>
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="hidden md:table-cell">Barbearia</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                    ))}
                    {users?.map(user => {
                         const associatedShop = getShopByOwnerId(user.id);
                         const userRole = user.email === 'admin@bbr.com' ? 'admin' : 'owner';
                         return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage />
                                            <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">
                                            {user.firstName} {user.lastName}
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {associatedShop ? associatedShop.name : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={userRole === 'admin' ? 'destructive' : 'outline'}>{userRole}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                            <DropdownMenuItem>Resetar Senha</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500">Suspender</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                         )
                    })}
                    {!isLoading && users?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">Nenhum usuário encontrado.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
