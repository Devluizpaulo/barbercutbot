
'use client';
// This file was created by the AI assistant.
// It is intended to handle the logic for managing roles and permissions.
// The code is structured to be modular and reusable.
import { useEffect, useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PlusCircle,
  Trash2,
  Save,
  LoaderCircle,
  Shield,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import type { BarberShop, Role } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
        // Novas permissões de Caixa/Recibos
        openCashier: z.boolean().default(false),
        closeCashier: z.boolean().default(false),
        viewReceipts: z.boolean().default(false),
        issueReceipts: z.boolean().default(false),
        refundReceipts: z.boolean().default(false),
        manageCashMovements: z.boolean().default(false),
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
  manageSettings: "Gerenciar Configurações",
  openCashier: "Abrir Caixa",
  closeCashier: "Fechar Caixa",
  viewReceipts: "Ver Recibos/Comprovantes",
  issueReceipts: "Emitir Recibos",
  refundReceipts: "Estornar Recibos",
  manageCashMovements: "Movimentações de Caixa",
};


export function PermissionsManager({ shopId, initialData }: PermissionsManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [shopOwnerId, setShopOwnerId] = useState<string | null>(null);
  const handleOpenChange = (open: boolean) => {
    if (!open && form.formState.isDirty) {
      const confirmClose = window.confirm('Existem alterações não salvas. Deseja sair sem salvar?');
      if (!confirmClose) return;
    }
    setIsOpen(open);
  };

  useEffect(() => {
    let cancelled = false;
    const loadOwner = async () => {
      try {
        const ref = doc(firestore, 'barberShops', shopId);
        const snap = await getDoc(ref);
        if (!cancelled) {
          const data = snap.data() as Partial<BarberShop> | undefined;
          setShopOwnerId(data?.ownerId ?? null);
        }
      } catch {
        if (!cancelled) setShopOwnerId(null);
      }
    };
    loadOwner();
    return () => { cancelled = true; };
  }, [firestore, shopId]);

  const isOwner = !!(user && shopOwnerId && user.uid === shopOwnerId);
  const canEditBuiltIn = isOwner;

  const form = useForm<PermissionsFormValues>({
    resolver: zodResolver(permissionsFormSchema),
    defaultValues: {
      roles: initialData || [
        {
          id: 'gerente', name: 'Gerente', isBuiltIn: true, permissions: {
            viewDashboard: true,
            manageAppointments: true,
            manageClients: true,
            manageTeam: true,
            manageServices: true,
            viewFinancial: true,
            manageSettings: true,
            openCashier: true,
            closeCashier: true,
            viewReceipts: true,
            issueReceipts: true,
            refundReceipts: true,
            manageCashMovements: true,
          }
        },
        {
          id: 'barbeiro', name: 'Barbeiro', isBuiltIn: true, permissions: {
            viewDashboard: true,
            manageAppointments: true,
            manageClients: true,
            manageTeam: false,
            manageServices: false,
            viewFinancial: false,
            manageSettings: false,
            openCashier: false,
            closeCashier: false,
            viewReceipts: true,
            issueReceipts: false,
            refundReceipts: false,
            manageCashMovements: false,
          }
        },
        {
          id: 'recepcionista', name: 'Recepcionista', isBuiltIn: true, permissions: {
            viewDashboard: true,
            manageAppointments: true,
            manageClients: true,
            manageTeam: false,
            manageServices: false,
            viewFinancial: false,
            manageSettings: false,
            openCashier: false,
            closeCashier: false,
            viewReceipts: true,
            issueReceipts: true,
            refundReceipts: false,
            manageCashMovements: false,
          }
        },
        {
          id: 'caixa', name: 'Caixa', isBuiltIn: true, permissions: {
            viewDashboard: true,
            manageAppointments: false,
            manageClients: true,
            manageTeam: false,
            manageServices: false,
            viewFinancial: true,
            manageSettings: false,
            openCashier: true,
            closeCashier: true,
            viewReceipts: true,
            issueReceipts: true,
            refundReceipts: true,
            manageCashMovements: true,
          }
        },
        {
          id: 'financeiro', name: 'Financeiro', isBuiltIn: true, permissions: {
            viewDashboard: true,
            manageAppointments: false,
            manageClients: false,
            manageTeam: false,
            manageServices: false,
            viewFinancial: true,
            manageSettings: false,
            openCashier: false,
            closeCashier: false,
            viewReceipts: true,
            issueReceipts: false,
            refundReceipts: true,
            manageCashMovements: true,
          }
        },
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
        const exists = form.getValues('roles')?.some(r => r.id === newRoleId);
        if (exists) {
          toast({ title: 'Perfil já existe', description: 'Escolha outro nome para o perfil.', variant: 'destructive' });
          return;
        }
        append({
            id: newRoleId,
            name: newRoleName,
            isBuiltIn: false,
            permissions: {
              viewDashboard: false,
              manageAppointments: true,
              manageClients: false,
              manageTeam: false,
              manageServices: false,
              viewFinancial: false,
              manageSettings: false,
              openCashier: false,
              closeCashier: false,
              viewReceipts: false,
              issueReceipts: false,
              refundReceipts: false,
              manageCashMovements: false,
            }
        });
        setNewRoleName("");
    }
  };

  const handleDuplicateRole = (index: number) => {
    const role = form.getValues(`roles.${index}`);
    const baseId = `${role.id}-custom`;
    let newId = baseId;
    let i = 1;
    const all = form.getValues('roles') || [];
    while (all.some(r => r.id === newId)) { newId = `${baseId}-${i++}`; }
    append({
      id: newId,
      name: `${role.name} (Personalizado)`,
      isBuiltIn: false,
      permissions: { ...role.permissions },
    });
    toast({ title: 'Perfil duplicado', description: 'Agora você pode editar este perfil.' });
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Gerenciar Permissões</Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl"
        onEscapeKeyDown={(e) => {
          if (form.formState.isDirty) {
            e.preventDefault();
            const confirmClose = window.confirm('Existem alterações não salvas. Deseja sair sem salvar?');
            if (confirmClose) setIsOpen(false);
          }
        }}
        onPointerDownOutside={(e) => {
          if (form.formState.isDirty) {
            e.preventDefault();
            const confirmClose = window.confirm('Existem alterações não salvas. Deseja sair sem salvar?');
            if (confirmClose) setIsOpen(false);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Perfis e Permissões de Acesso</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Defina o que cada membro da sua equipe pode ver e fazer no sistema.
          </p>
          <p className="text-xs text-muted-foreground">
            {canEditBuiltIn
              ? 'Você é o Dono: pode editar os perfis padrão diretamente.'
              : 'Perfis padrão marcados com cadeado não podem ser editados diretamente. Duplique para personalizar.'}
          </p>
          {form.formState.isDirty && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span>Alterações não salvas</span>
            </div>
          )}
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
                       {role.isBuiltIn && !canEditBuiltIn && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                     {!role.isBuiltIn ? (
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                     ) : (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={canEditBuiltIn}
                                onClick={() => !canEditBuiltIn && handleDuplicateRole(index)}
                              >
                                Duplicar como personalizado
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {canEditBuiltIn && (
                            <TooltipContent side="top">
                              <span>Você é o Dono: já pode editar o perfil padrão diretamente.</span>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
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
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={role.isBuiltIn && !canEditBuiltIn}
                                      />
                                    </FormControl>
                                  </div>
                                </TooltipTrigger>
                                {role.isBuiltIn && !canEditBuiltIn && (
                                  <TooltipContent side="top">
                                    <span>Perfil padrão bloqueado. Duplique para personalizar.</span>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
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
              <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
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

    