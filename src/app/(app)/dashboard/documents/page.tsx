
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data for documents
const documents = [
    {
        id: 'doc-1',
        title: 'Termos de Uso',
        excerpt: 'Estes termos de serviço regem o uso da plataforma Barbearia SaaS...',
        status: 'Publicado',
        lastUpdated: '15/07/2024'
    },
    {
        id: 'doc-2',
        title: 'Política de Privacidade',
        excerpt: 'Sua privacidade é importante para nós. Esta política explica como coletamos, usamos e protegemos suas informações...',
        status: 'Publicado',
        lastUpdated: '15/07/2024'
    },
    {
        id: 'doc-3',
        title: 'Contrato de Prestação de Serviços (Pro)',
        excerpt: 'Contrato para barbearias assinantes do plano Pro, detalhando os serviços incluídos...',
        status: 'Rascunho',
        lastUpdated: '20/07/2024'
    },
];


export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <FileText />
            Documentos
            </h1>
            <p className="text-muted-foreground">
            Gerencie os termos de serviço e outros documentos importantes da
            plataforma.
            </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Documento
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Última Atualização</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                                <div>{doc.title}</div>
                                <div className="text-sm text-muted-foreground max-w-xs truncate">{doc.excerpt}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <Badge variant={doc.status === 'Publicado' ? 'secondary' : 'outline'}>{doc.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{doc.lastUpdated}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                         <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remover
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
