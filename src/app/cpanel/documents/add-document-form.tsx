

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, Type, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { Document as DocumentType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  content: z.string().min(20, 'O conteúdo deve ter pelo menos 20 caracteres.'),
  status: z.enum(['Rascunho', 'Publicado']),
});

type AddDocumentFormValues = z.infer<typeof formSchema>;

interface AddDocumentFormProps {
  initialData?: DocumentType;
  onSuccess?: () => void;
}

export function AddDocumentForm({ initialData, onSuccess }: AddDocumentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AddDocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: '',
      content: '',
      status: 'Rascunho',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AddDocumentFormValues) => {
    try {
      const docData = {
        ...values,
        lastUpdatedAt: serverTimestamp(),
      };

      if (initialData) {
        const docRef = doc(firestore, 'documents', initialData.id);
        await setDocumentNonBlocking(docRef, docData, { merge: true });
      } else {
        const docsRef = collection(firestore, 'documents');
        await addDocumentNonBlocking(docsRef, { ...docData, createdAt: serverTimestamp() });
      }

      toast({
        title: initialData ? 'Documento Atualizado!' : 'Documento Criado!',
        description: `O documento "${values.title}" foi salvo com sucesso.`,
      });
      onSuccess?.();
      if (!initialData) form.reset();
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o documento.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Documento</FormLabel>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Termos de Uso" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Insira o conteúdo completo do documento aqui..."
                    {...field}
                    className="pl-10 min-h-[250px]"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Publicado">Publicado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Salvar Alterações' : 'Salvar Documento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
