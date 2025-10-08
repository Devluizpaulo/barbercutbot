
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, LoaderCircle, Trash2, Coins, BookText, LayoutList, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { FinancialRecord } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  type: z.enum(['income', 'expense'], {
    required_error: 'O tipo é obrigatório.',
  }),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  category: z.string().min(1, { message: 'A categoria é obrigatória.' }),
  paymentMethod: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type AddTransactionFormValues = z.infer<typeof formSchema>;

interface AddTransactionFormProps {
  shopId: string;
  initialData?: FinancialRecord;
  onSuccess?: () => void;
}

const incomeCategories = ['Venda de Serviço', 'Venda de Produto', 'Outros'];
const expenseCategories = ['Aluguel', 'Salários', 'Fornecedores', 'Marketing', 'Contas (Água, Luz, etc.)', 'Outros'];
const paymentMethods = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix'];

// Component moved outside the main component body
const KeypadButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <Button
      type="button"
      variant="outline"
      className={cn("h-16 text-3xl font-bold", className)}
      onClick={onClick}
    >
      {children}
    </Button>
  );

export function AddTransactionForm({ shopId, initialData, onSuccess }: AddTransactionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      type: 'income',
      date: new Date(),
      category: '',
      paymentMethod: '',
      isRecurring: false,
      amount: 0,
    },
  });

  const { isSubmitting } = form.formState;
  const transactionType = form.watch('type');

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: toDate(initialData.date),
      });
    }
  }, [initialData, form]);

  // Logic function moved before the return statement
  const handleKeypadPress = (key: string) => {
    const currentAmount = form.getValues('amount') || 0;
    let currentAmountString = currentAmount.toFixed(2).replace('.', '');

    if (key === 'backspace') {
        currentAmountString = currentAmountString.slice(0, -1);
        if (currentAmountString.length === 0) {
            currentAmountString = '0';
        }
    } else {
        if (currentAmountString === '0' && key !== '00') {
             currentAmountString = key;
        } else {
             currentAmountString += key;
        }
    }
    
    currentAmountString = currentAmountString.padStart(3, '0');

    const numericValue = parseInt(currentAmountString, 10) || 0;
    const newAmount = numericValue / 100;

    form.setValue('amount', newAmount, { shouldValidate: true });
  };


  const onSubmit = async (values: AddTransactionFormValues) => {
     try {
       const transactionData = {
         ...values,
         barberShopId: shopId,
         date: Timestamp.fromDate(values.date),
         createdAt: serverTimestamp(),
       };
       if(transactionData.type === 'expense') delete transactionData.paymentMethod;
       if(transactionData.type === 'income') delete transactionData.isRecurring;

       if (initialData) {
         const recordRef = doc(firestore, 'barberShops', shopId, 'financialRecords', initialData.id);
         setDocumentNonBlocking(recordRef, transactionData, { merge: true });
       } else {
         const recordsRef = collection(firestore, 'barberShops', shopId, 'financialRecords');
         addDocumentNonBlocking(recordsRef, transactionData);
       }
       toast({
         title: initialData ? 'Transação Atualizada!' : 'Transação Adicionada!',
         description: 'A transação foi salva com sucesso.',
       });
       onSuccess?.();
       if (!initialData) form.reset();
     } catch (error) {
       console.error("Error saving transaction: ", error);
       toast({
         variant: 'destructive',
         title: 'Erro ao salvar',
         description: 'Não foi possível salvar a transação.',
       });
     }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>Tipo de Transação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('category', '');
                      }}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-6"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" id="income" className="sr-only" />
                        </FormControl>
                        <FormLabel
                          htmlFor="income"
                          className={cn(
                            "flex-1 text-center font-normal border rounded-md p-3 cursor-pointer transition-colors",
                            field.value === 'income' 
                            ? "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-700"
                            : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          Receita
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" id="expense" className="sr-only" />
                        </FormControl>
                        <FormLabel
                          htmlFor="expense"
                          className={cn(
                            "flex-1 text-center font-normal border rounded-md p-3 cursor-pointer transition-colors",
                            field.value === 'expense'
                            ? "border-destructive bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200 dark:border-red-700"
                            : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          Despesa
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground" />
                    <FormControl>
                      <Input 
                        type="text"
                        readOnly
                        placeholder="0,00" 
                        className="h-20 text-4xl text-center font-bold pl-16"
                        value={field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <div className="relative">
                      <BookText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                          <Textarea placeholder="Ex: Corte de cabelo" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{transactionType === 'income' ? 'Categoria da Receita' : 'Categoria da Despesa'}</FormLabel>
                      <div className="relative">
                        <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder={'Selecione uma categoria'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(transactionType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            
            {transactionType === 'income' && (
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                     <div className="relative">
                       <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map(method => (
                              <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {transactionType === 'expense' && (
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md pt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        É uma despesa recorrente?
                      </FormLabel>
                      <FormDescription>
                        Marque se esta despesa se repete (ex: aluguel).
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
        </div>

        <div className="flex flex-col justify-between gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                  <FormItem className="flex flex-col p-2 gap-2">
                  <FormLabel>Data da Transação</FormLabel>
                  <Popover>
                      <PopoverTrigger asChild>
                      <FormControl>
                          <Button
                          variant={'outline'}
                          className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                          )}
                          >
                          {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                              <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                      </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          locale={ptBR}
                      />
                      </PopoverContent>
                  </Popover>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((key) => (
                    <KeypadButton key={key} onClick={() => handleKeypadPress(key)}>{key}</KeypadButton>
                ))}
                <KeypadButton onClick={() => handleKeypadPress('backspace')}><Trash2 /></KeypadButton>
            </div>
             <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Transação
            </Button>
        </div>
        </div>
      </form>
    </Form>
  );
}
