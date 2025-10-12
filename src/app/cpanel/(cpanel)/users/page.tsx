'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useCPanel } from '../layout';

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { users, shops, isLoading } = useCPanel(); 

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        if (!searchTerm) return users;
        const lowercasedTerm = searchTerm.toLowerCase();
        return users.filter(user =>
            (user.firstName || '').toLowerCase().includes(lowercasedTerm) ||
            (user.lastName || '').toLowerCase().includes(lowercasedTerm) ||
            (user.email || '').toLowerCase().includes(lowercasedTerm)
        );
    }, [users, searchTerm]);

    const getShopByOwnerId = (ownerId: string) => {
        return shops?.find(s => s.ownerId === ownerId);
    }
    
    const toDate = (timestamp: Timestamp | Date | string): Date => {
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate();
        }
        return new Date(timestamp);
    }


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
                    <Input 
                    placeholder="Buscar usuário..." 
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button disabled>
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
                                <TableHead className="hidden lg:table-cell">Negócio Vinculado</TableHead>
                                <TableHead className="hidden sm:table-cell">Data de Cadastro</TableHead>
                                <TableHead>Perfil</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers?.map(user => {
                                const associatedShop = getShopByOwnerId(user.id);
                                const isAdmin = user.role === 'admin';
                                const userRole = isAdmin ? 'Admin' : 'Dono de Negócio';
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="font-medium">
                                                    {user.firstName} {user.lastName}
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {isAdmin ? 'Plataforma' : (associatedShop ? associatedShop.name : 'Nenhum')}
                                        </TableCell>
                                         <TableCell className="hidden sm:table-cell">
                                            {user.createdAt ? format(toDate(user.createdAt), 'dd/MM/yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isAdmin ? 'destructive' : 'outline'}>{userRole}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem disabled>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem disabled>Resetar Senha</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-500" disabled>Suspender</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {!isLoading && filteredUsers?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                    {searchTerm ? `Nenhum usuário encontrado para "${searchTerm}"` : "Nenhum usuário encontrado."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
