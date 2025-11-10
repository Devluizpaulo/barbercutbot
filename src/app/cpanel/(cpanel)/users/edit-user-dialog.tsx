
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserProfile, UserRole } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const formSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  role: z.custom<UserRole>(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const firestore = useFirestore();
  const [saving, setSaving] = useState(false);
  const functions = getFunctions(undefined, 'us-central1');
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (_) {}
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    },
    values: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const callable = httpsCallable(functions, 'updateUserRole');
      await callable({
        uid: user.id,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
      });
      onOpenChange(false);
    } catch (e) {
      console.error('Erro ao atualizar usuário:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Atualize os dados do usuário. O email é somente leitura aqui.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input value={user.email} disabled />
              </FormItem>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="support">support</SelectItem>
                        <SelectItem value="owner">owner</SelectItem>
                        <SelectItem value="staff">staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
