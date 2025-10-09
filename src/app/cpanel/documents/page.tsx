
'use client';

import { useState } from 'react';
import { FileText, PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { AddDocumentForm } from './add-document-form';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import type { Document as DocumentType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { CPanelLayout } from '../cpanel-layout';

export default function DocumentsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | undefined>(undefined);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentType | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const documentsQuery = useMemoFirebase(() => user ? collection(firestore, 'documents') : null, [firestore, user]);
  const { data: documents, isLoading } = useCollection<DocumentType>(documentsQuery);

  const handleEdit = (doc: DocumentType) => {
    setSelectedDocument(doc);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedDocument(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedDocument(undefined);
  };

  const handleDelete = () => {
    if (!documentToDelete) return;
    const docRef = doc(firestore, 'documents', documentToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Documento Removido',
      description: `O documento "${documentToDelete.title}" foi removido.`,
    });
    setDocumentToDelete(null);
  };

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  return (
    <CPanelLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <FileText />
              Documentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie os termos de serviço e outros documentos importantes da plataforma.
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedDocument(undefined); setFormOpen(isOpen); }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedDocument ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes abaixo para gerenciar o documento.
                </DialogDescription>
              </DialogHeader>
              <AddDocumentForm
                initialData={selectedDocument}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
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
                {isLoading && Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && documents?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div>{doc.title}</div>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">{doc.content}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={doc.status === 'Publicado' ? 'secondary' : 'outline'}>{doc.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {doc.lastUpdatedAt ? format(toDate(doc.lastUpdatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDocumentToDelete(doc)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && documents?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={(isOpen) => !isOpen && setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e irá remover o documento <strong>{documentToDelete?.title}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
