
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
import { Calendar as CalendarIcon, LoaderCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

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

export function AddTransactionForm({ shopId, onSuccess }: AddTransactionFormProps) {
  const { toast } = useToast();
  
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
     console.log("Simulating add transaction:", values);
     toast({
       title: 'Modo de Simulação',
       description: 'Funcionalidade de adicionar transação desabilitada.',
     });
 
     onSuccess?.();
     form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Transação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('category', '');
                      }}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
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
                  <FormControl>
                    <Input 
                      type="text"
                      readOnly
                      placeholder="0,00" 
                      className="h-14 text-3xl text-center font-bold"
                      value={field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    />
                  </FormControl>
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
                    <FormControl>
                        <Textarea placeholder="Ex: Corte de cabelo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{transactionType === 'income' ? 'Serviço' : 'Categoria'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={transactionType === 'income' ? 'Selecione um serviço' : 'Selecione uma categoria'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(transactionType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
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
            <div className="grid grid-cols-3 gap-2">
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
