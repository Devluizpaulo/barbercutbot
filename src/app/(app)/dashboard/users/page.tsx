
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { users, shops } from "@/lib/data"
import type { User } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";


export default function AdminUsersPage() {

    const getShopByOwnerId = (ownerId: string) => {
        // This is a placeholder logic. In a real app, you'd likely have a more direct relationship.
        const user = users.find(u => u.id === ownerId);
        if (!user) return null;
        
        // Let's assume shop owner name is in the shop data.
        return shops.find(s => s.owner.includes(user.firstName));
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
                    {users.map(user => {
                         const associatedShop = getShopByOwnerId(user.id);
                         return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
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
                                    <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
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
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
