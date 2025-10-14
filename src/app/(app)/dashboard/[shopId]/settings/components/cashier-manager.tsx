
'use client';
// This file was created by the AI assistant.
// It is intended to handle the logic for managing cashier settings.
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
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  PlusCircle,
  Trash2,
  Save,
  LoaderCircle,
  Key,
  Users as UsersIcon,
} from 'lucide-react';
import type { BarberShop, CashierOperator, ChecklistItem } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PinInput, PinInputGroup, PinInputField, PinInputSlot } from '@/components/ui/pin-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const operatorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'O nome é obrigatório.'),
  role: z.enum(['caixa', 'gerente']),
  pin: z.string().optional(),
});

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "A descrição é obrigatória."),
  required: z.boolean(),
});

const cashierFormSchema = z.object({
  requirePassword: z.boolean().default(false),
  operators: z.array(operatorSchema).optional(),
  openingChecklist: z.array(checklistItemSchema).optional(),
  closingChecklist: z.array(checklistItemSchema).optional(),
});

type CashierFormValues = z.infer<typeof cashierFormSchema>;

interface CashierManagerProps {
  shopId: string;
  initialData?: BarberShop['cashierSettings'];
}

export function CashierManager({ shopId, initialData }: CashierManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [pinOperator, setPinOperator] = useState<CashierOperator | null>(null);
  const [currentPin, setCurrentPin] = useState('');

  const form = useForm<CashierFormValues>({
    resolver: zodResolver(cashierFormSchema),
    defaultValues: {
      requirePassword: initialData?.requirePassword || false,
      operators: initialData?.operators || [],
      openingChecklist: initialData?.openingChecklist || [],
      closingChecklist: initialData?.closingChecklist || [],
    },
  });

  const { fields: operators, append: appendOperator, remove: removeOperator, update: updateOperator } = useFieldArray({
    control: form.control,
    name: 'operators',
  });
  
  const { fields: openingChecklist, append: appendOpeningItem, remove: removeOpeningItem } = useFieldArray({
      control: form.control,
      name: 'openingChecklist'
  });

  const { fields: closingChecklist, append: appendClosingItem, remove: removeClosingItem } = useFieldArray({
      control: form.control,
      name: 'closingChecklist'
  });

  const handleSetPin = () => {
    if (!pinOperator) return;

    const operatorIndex = operators.findIndex(op => op.id === pinOperator.id);
    if (operatorIndex > -1) {
        updateOperator(operatorIndex, { ...operators[operatorIndex], pin: currentPin });
    }
    
    setPinOperator(null);
    setCurrentPin('');
    toast({ title: 'PIN Salvo!', description: `O PIN para ${pinOperator.name} foi atualizado.` });
  };
  
  const onSubmit = (values: CashierFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    setDocumentNonBlocking(shopRef, { cashierSettings: values }, { merge: true });
    toast({
      title: 'Configurações de Caixa Salvas!',
    });
    setIsOpen(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Gerenciar Caixa</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurações do Caixa</DialogTitle>
          <DialogDescription>
            Gerencie operadores, checklists e outras configurações do ponto de venda.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto space-y-6 p-1">
                {/* Operators Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2"><UsersIcon /> Operadores de Caixa</h3>
                    {operators.map((op, index) => (
                        <div key={op.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 border rounded-md">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <FormField control={form.control} name={`operators.${index}.name`} render={({field}) => (
                                    <Input {...field} placeholder="Nome do operador" />
                                )}/>
                                <FormField control={form.control} name={`operators.${index}.role`} render={({field}) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="caixa">Caixa</SelectItem>
                                            <SelectItem value="gerente">Gerente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}/>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setPinOperator(op)}><Key className="h-4 w-4 mr-2" />Definir PIN</Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOperator(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendOperator({id: crypto.randomUUID(), name: '', role: 'caixa'})}><PlusCircle className="mr-2"/> Adicionar Operador</Button>
                </div>

                 {/* Checklist Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Checklist de Abertura</h3>
                         {openingChecklist.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <Input {...form.register(`openingChecklist.${index}.label`)} placeholder="Ex: Verificar troco" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOpeningItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                         ))}
                         <Button type="button" variant="outline" size="sm" onClick={() => appendOpeningItem({id: crypto.randomUUID(), label: '', required: true})}><PlusCircle className="mr-2"/> Adicionar item</Button>
                    </div>
                     <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Checklist de Fechamento</h3>
                         {closingChecklist.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <Input {...form.register(`closingChecklist.${index}.label`)} placeholder="Ex: Contar gaveta" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeClosingItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                         ))}
                         <Button type="button" variant="outline" size="sm" onClick={() => appendClosingItem({id: crypto.randomUUID(), label: '', required: true})}><PlusCircle className="mr-2"/> Adicionar item</Button>
                    </div>
                </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

     <Dialog open={!!pinOperator} onOpenChange={(open) => !open && setPinOperator(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir PIN para {pinOperator?.name}</DialogTitle>
            <DialogDescription>
              O PIN deve ter 4 dígitos e será usado para ações restritas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-8">
            <PinInput
              value={currentPin}
              onValueChange={setCurrentPin}
              onComplete={handleSetPin}
              length={4}
            >
              <PinInputGroup>
                {[...Array(4)].map((_, i) => (
                  <PinInputSlot key={i} index={i}>
                    <PinInputField />
                  </PinInputSlot>
                ))}
              </PinInputGroup>
            </PinInput>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleSetPin}>Salvar PIN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
