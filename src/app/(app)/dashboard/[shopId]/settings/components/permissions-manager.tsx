
'use client';
// This file was created by the AI assistant.
// It is intended to handle the logic for managing roles and permissions.
// The code is structured to be modular and reusable.
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  PlusCircle,
  Trash2,
  Save,
  LoaderCircle,
  Shield,
  Lock,
} from 'lucide-react';
import type { BarberShop, Role } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

const permissionsFormSchema = z.object({
  roles: z.array(z.object({
    id: z.string(),
    name: z.string().min(2, "O nome do perfil é obrigatório."),
    isBuiltIn: z.boolean().default(false),
    permissions: z.object({
        viewDashboard: z.boolean().default(true),
        manageAppointments: z.boolean().default(true),
        manageClients: z.boolean().default(true),
        manageTeam: z.boolean().default(true),
        manageServices: z.boolean().default(true),
        viewFinancial: z.boolean().default(true),
        manageSettings: z.boolean().default(true),
    })
  })),
});

type PermissionsFormValues = z.infer<typeof permissionsFormSchema>;

interface PermissionsManagerProps {
  shopId: string;
  initialData?: BarberShop['roles'];
}

const permissionLabels: { [key: string]: string } = {
  viewDashboard: "Ver Dashboard",
  manageAppointments: "Gerenciar Agendamentos",
  manageClients: "Gerenciar Clientes",
  manageTeam: "Gerenciar Equipe",
  manageServices: "Gerenciar Serviços",
  viewFinancial: "Ver Financeiro",
  manageSettings: "Gerenciar Configurações"
};


export function PermissionsManager({ shopId, initialData }: PermissionsManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const form = useForm<PermissionsFormValues>({
    resolver: zodResolver(permissionsFormSchema),
    defaultValues: {
      roles: initialData || [
        { id: 'gerente', name: 'Gerente', isBuiltIn: true, permissions: { viewDashboard: true, manageAppointments: true, manageClients: true, manageTeam: true, manageServices: true, viewFinancial: true, manageSettings: true } },
        { id: 'barbeiro', name: 'Barbeiro', isBuiltIn: true, permissions: { viewDashboard: true, manageAppointments: true, manageClients: true, manageTeam: false, manageServices: false, viewFinancial: false, manageSettings: false } },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'roles',
  });

  const handleAddRole = () => {
    if (newRoleName.trim()) {
        const newRoleId = newRoleName.trim().toLowerCase().replace(/\s+/g, '-');
        append({
            id: newRoleId,
            name: newRoleName,
            isBuiltIn: false,
            permissions: { viewDashboard: false, manageAppointments: true, manageClients: false, manageTeam: false, manageServices: false, viewFinancial: false, manageSettings: false }
        });
        setNewRoleName("");
    }
  };

  const onSubmit = (values: PermissionsFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    setDocumentNonBlocking(shopRef, { roles: values.roles }, { merge: true });
    toast({
      title: 'Permissões Atualizadas!',
      description: 'Os perfis de acesso foram salvos com sucesso.',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Gerenciar Permissões</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Perfis e Permissões de Acesso</DialogTitle>
          <FormDescription>
            Defina o que cada membro da sua equipe pode ver e fazer no sistema.
          </FormDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto space-y-4 p-1">
              {fields.map((role, index) => (
                <div key={role.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                       <Shield className="h-5 w-5" />
                       <h3 className="text-lg font-semibold">{role.name}</h3>
                       {role.isBuiltIn && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                     {!role.isBuiltIn && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                     )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(permissionLabels).map(key => (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`roles.${index}.permissions.${key as keyof Role['permissions']}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={role.isBuiltIn}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {permissionLabels[key]}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-4">
                  <Input 
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    placeholder="Nome do novo perfil. Ex: Recepcionista"
                  />
                  <Button type="button" onClick={handleAddRole}><PlusCircle className="mr-2"/> Adicionar Perfil</Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Salvar Permissões
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    