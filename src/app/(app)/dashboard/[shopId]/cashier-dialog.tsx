
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Appointment, Service, Barber, Customer, BarberShop, ChecklistItem, FinancialRecord, Product, SaleItem } from '@/lib/types';
import { format, isSameDay, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, CheckSquare, Square, ShoppingCart, Trash2, PlusCircle, Search } from 'lucide-react';
import { ReceiptDialog } from './ReceiptDialog';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, Timestamp, doc, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

export function CashierDialog({ open, onOpenChange, shopId }: CashierDialogProps) {
  const [view, setView] = useState<'closed' | 'open' | 'closing'>('closed');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [receiptData, setReceiptData] = useState<{ items: SaleItem[], customer: Customer | { firstName: string }, totalPrice: number, paymentMethod: string } | null>(null);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  
  const [openingChecklist, setOpeningChecklist] = useState<Record<string, boolean>>({});
  const [closingChecklist, setClosingChecklist] = useState<Record<string, boolean>>({});

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const shopRef = useMemoFirebase(() => (user && shopId) ? doc(firestore, 'barberShops', shopId) : null, [firestore, shopId, user]);
  const { data: shop } = useDoc<BarberShop>(shopRef);
  
  // Helper declared early to be available for filters below
  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }
  
  const savedOpeningChecklist = shop?.cashierSettings?.openingChecklist || [];
  const savedClosingChecklist = shop?.cashierSettings?.closingChecklist || [];

  const allOpeningChecked = useMemo(() => savedOpeningChecklist.every(item => openingChecklist[item.id]), [openingChecklist, savedOpeningChecklist]);
  const allClosingChecked = useMemo(() => savedClosingChecklist.every(item => closingChecklist[item.id]), [closingChecklist, savedClosingChecklist]);

  useEffect(() => {
    if (open) {
      const activeSession = localStorage.getItem(`cashier-session-${shopId}`);
      if (activeSession) {
        const sessionData = JSON.parse(activeSession);
        setView('open');
        setOpeningBalance(sessionData.openingBalance);
      } else {
        setView('closed');
        setOpeningChecklist({});
        setClosingChecklist({});
      }
    }
  }, [open, shopId]);


  const handleOpenCashier = () => {
    if (parseFloat(openingBalance) >= 0 && allOpeningChecked) {
      localStorage.setItem(`cashier-session-${shopId}`, JSON.stringify({ openingBalance, startTime: new Date() }));
      setView('open');
      toast({ title: "Caixa Aberto!", description: "Sessão de caixa iniciada com sucesso." });
    } else {
      toast({ variant: 'destructive', title: "Ação Bloqueada", description: "Preencha o saldo inicial e complete o checklist para abrir o caixa." });
    }
  };

  const handleCloseCashier = () => {
    if (!allClosingChecked) {
      toast({ variant: 'destructive', title: "Ação Bloqueada", description: "Complete o checklist para fechar o caixa." });
      return;
    }
    console.log('Fechando caixa...');
    localStorage.removeItem(`cashier-session-${shopId}`);
    setView('closed');
    setOpeningBalance('');
    onOpenChange(false); // Close the main dialog
    toast({ title: "Caixa Fechado!", description: "A sessão foi finalizada." });
  };
  
  const handleFinalizeAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const onPaymentSuccess = async (appointment: Appointment, paymentMethod: string) => {
    try {
      const batch = writeBatch(firestore);
      const recordsRef = collection(firestore, 'barberShops', shopId, 'financialRecords');
      const customer = allCustomers?.find(c => c.id === appointment.customerId);
      
      const financialRecordData = {
        barberShopId: shopId,
        date: Timestamp.fromDate(new Date()),
        type: 'income' as const,
        description: `Agendamento - ${customer?.firstName || 'Cliente'}`,
        amount: appointment.totalPrice || 0,
        category: 'Venda de Serviço',
        paymentMethod: paymentMethod,
        appointmentId: appointment.id,
        createdAt: serverTimestamp(),
        items: appointment.items.map(item => {
          const service = allServices?.find(s => s.id === item.serviceId);
          return {
            id: item.serviceId,
            name: service?.name || 'Serviço desconhecido',
            price: item.price,
            quantity: 1,
            type: 'service' as const,
          }
        })
      };

      const recordDocRef = doc(recordsRef);
      batch.set(recordDocRef, financialRecordData);

      const appointmentRef = doc(firestore, 'barberShops', shopId, 'appointments', appointment.id);
      batch.update(appointmentRef, { status: 'completed' });

      await batch.commit();

      setReceiptData({
        items: financialRecordData.items,
        customer: customer || { firstName: 'Cliente' },
        totalPrice: appointment.totalPrice || 0,
        paymentMethod,
      });
      setReceiptOpen(true);
      setSelectedAppointment(null);

    } catch(error) {
      console.error("Error finalizing payment:", error);
      toast({ variant: 'destructive', title: "Erro ao finalizar", description: "Não foi possível registrar o pagamento."});
    }
  };

  const appointmentsQuery = useMemoFirebase(() => (user && shopId) ? query(
    collection(firestore, 'barberShops', shopId, 'appointments'), where('startTime', '>=', startOfToday())
  ) : null, [firestore, shopId, user]);
  const { data: allAppointments } = useCollection<Appointment>(appointmentsQuery);
  
  const todayAppointments = allAppointments?.filter(appt => isSameDay(toDate(appt.startTime), new Date()));

  const servicesQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'services') : null, [firestore, shopId, user]);
  const { data: allServices } = useCollection<Service>(servicesQuery);
  
  const productsQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'products') : null, [firestore, shopId, user]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const barbersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'barbers') : null, [firestore, shopId, user]);
  const { data: allBarbers } = useCollection<Barber>(barbersQuery);
  
  const customersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'customers') : null, [firestore, shopId, user]);
  const { data: allCustomers } = useCollection<Customer>(customersQuery);


  const getAssociatedData = (appt: Appointment) => {
    const barber = allBarbers?.find(b => appt.items.some(i => i.barberId === b.id));
    const customer = allCustomers?.find(c => c.id === appt.customerId);
    return { barber, customer };
  };

  const renderChecklist = (items: ChecklistItem[], state: Record<string, boolean>, setState: (state: Record<string, boolean>) => void) => (
    <div className="space-y-3">
        {items.map(item => (
            <div 
                key={item.id} 
                className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted"
                onClick={() => setState({ ...state, [item.id]: !state[item.id] })}
            >
                {state[item.id] ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm font-medium">{item.label}</span>
            </div>
        ))}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciador de Caixa</DialogTitle>
            <DialogDescription>
              {view === 'open'
                ? 'Finalize agendamentos, registre vendas avulsas e gerencie seu fluxo de caixa diário.'
                : view === 'closing' ? 'Confira os valores e finalize a sessão.'
                : 'Abra o caixa para começar a registrar as transações do dia.'}
            </DialogDescription>
          </DialogHeader>

          {view === 'closed' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <Card className="w-full max-w-sm">
                  <CardHeader>
                      <CardTitle>Abrir Caixa</CardTitle>
                      <CardDescription>Insira o valor inicial e complete o checklist para começar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="opening-balance">Fundo de Caixa (R$)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="opening-balance"
                                type="number"
                                placeholder="Ex: 150.00"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                className="pl-10"
                            />
                          </div>
                      </div>
                      {savedOpeningChecklist.length > 0 && (
                          <div className="space-y-2 pt-2">
                              <Label>Checklist de Abertura</Label>
                              {renderChecklist(savedOpeningChecklist, openingChecklist, setOpeningChecklist)}
                          </div>
                      )}
                  </CardContent>
                  <CardFooter>
                      <Button onClick={handleOpenCashier} className="w-full" disabled={!allOpeningChecked}>
                          Abrir Caixa
                      </Button>
                  </CardFooter>
              </Card>
            </div>
          )}

          {view === 'open' && (
            <div className="flex-1 flex flex-col min-h-0">
              <Tabs defaultValue="appointments" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appointments">Agendamentos do Dia</TabsTrigger>
                  <TabsTrigger value="walk-in">Venda Avulsa</TabsTrigger>
                </TabsList>
                <TabsContent value="appointments" className="flex-1 overflow-y-auto p-1">
                  <div className="space-y-4">
                      {todayAppointments && todayAppointments.length > 0 ? todayAppointments.map(appt => {
                        const { barber, customer } = getAssociatedData(appt);
                        const servicesNames = appt.items.map(item => allServices?.find(s => s.id === item.serviceId)?.name).join(', ');
                        const isCompleted = appt.status === 'completed';

                        return (
                          <Card key={appt.id} className={isCompleted ? 'bg-muted/50' : ''}>
                              <CardContent className="p-4 flex items-center justify-between">
                                  <div>
                                      <p className="font-semibold">{customer?.firstName || 'Cliente'}</p>
                                      <p className="text-sm text-muted-foreground">{servicesNames || 'Serviço'} com {barber?.firstName || 'Barbeiro'}</p>
                                      <p className="text-sm font-mono">{format(toDate(appt.startTime), 'HH:mm', {locale: ptBR})}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <Badge variant={appt.status === 'cancelled' ? 'destructive' : (isCompleted ? 'secondary' : 'default')}>
                                          {appt.status}
                                      </Badge>
                                      {appt.totalPrice && <p className="font-bold text-lg">R${appt.totalPrice.toFixed(2)}</p>}
                                      <Button size="sm" onClick={() => handleFinalizeAppointment(appt)} disabled={isCompleted}>
                                        {isCompleted ? 'Finalizado' : 'Finalizar'}
                                      </Button>
                                  </div>
                              </CardContent>
                          </Card>
                        )
                      }) : (
                          <div className="text-center text-muted-foreground py-10">
                              <p>Nenhum agendamento pendente para hoje.</p>
                          </div>
                      )}
                  </div>
                </TabsContent>
                <TabsContent value="walk-in" className="flex-1 overflow-y-auto">
                  <WalkInSale 
                    shopId={shopId} 
                    services={allServices || []} 
                    products={allProducts || []}
                    customers={allCustomers || []}
                    onSaleSuccess={(data) => {
                      setReceiptData(data);
                      setReceiptOpen(true);
                    }}
                  />
                </TabsContent>
              </Tabs>
              <Separator className="my-4" />
              <DialogFooter className="mt-auto">
                <div className="flex w-full justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                      Caixa aberto com <span className="font-bold">R${parseFloat(openingBalance || '0').toFixed(2)}</span> de saldo inicial.
                  </div>
                  <Button variant="destructive" onClick={() => setView('closing')}>
                      Fechar Caixa
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}

          {view === 'closing' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <Card className="w-full max-w-sm">
                  <CardHeader>
                      <CardTitle>Fechar Caixa</CardTitle>
                      <CardDescription>Confira os valores e finalize a sessão.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {/* Resumo financeiro aqui - A ser implementado */}
                      <div className="p-4 bg-muted rounded-lg text-left space-y-2">
                        <div className="flex justify-between text-sm"><span>Saldo Inicial:</span> <span>R${parseFloat(openingBalance).toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span>Entradas:</span> <span className="text-green-600">+ R$0.00</span></div>
                        <div className="flex justify-between text-sm"><span>Saídas:</span> <span className="text-red-600">- R$0.00</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold"><span>Saldo Esperado:</span> <span>R${parseFloat(openingBalance).toFixed(2)}</span></div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="closing-balance">Valor Contado (R$)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="closing-balance"
                                type="number"
                                placeholder="Valor final no caixa"
                                value={closingBalance}
                                onChange={(e) => setClosingBalance(e.target.value)}
                                className="pl-10"
                            />
                          </div>
                      </div>
                      {savedClosingChecklist.length > 0 && (
                          <div className="space-y-2 pt-2">
                              <Label>Checklist de Fechamento</Label>
                              {renderChecklist(savedClosingChecklist, closingChecklist, setClosingChecklist)}
                          </div>
                      )}
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                      <Button onClick={handleCloseCashier} className="w-full" variant="destructive" disabled={!allClosingChecked}>
                          Confirmar e Fechar Caixa
                      </Button>
                      <Button onClick={() => setView('open')} className="w-full" variant="ghost">
                          Voltar
                      </Button>
                  </CardFooter>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {selectedAppointment && (
        <PaymentMethodDialog
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onSuccess={onPaymentSuccess}
        />
      )}
      {receiptData && (
        <ReceiptDialog
          open={isReceiptOpen}
          onOpenChange={setReceiptOpen}
          receipt={receiptData}
        />
      )}
    </>
  );
}

function PaymentMethodDialog({ appointment, onClose, onSuccess }: { appointment: Appointment, onClose: () => void, onSuccess: (appointment: Appointment, paymentMethod: string) => void }) {
    const paymentMethods = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito'];
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finalizar Pagamento</DialogTitle>
                    <DialogDescription>
                        Selecione a forma de pagamento para o valor de R${(appointment.totalPrice || 0).toFixed(2)}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {paymentMethods.map(method => (
                        <Button
                            key={method}
                            variant="outline"
                            className="h-16 text-lg"
                            onClick={() => onSuccess(appointment, method)}
                        >
                            {method}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}


function WalkInSale({ shopId, services, products, customers, onSaleSuccess }: { shopId: string, services: Service[], products: Product[], customers: Customer[], onSaleSuccess: (data: { items: SaleItem[], customer: Customer | { firstName: string }, totalPrice: number, paymentMethod: string }) => void }) {
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const totalPrice = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

    const addToCart = useCallback((item: Service | Product, type: 'service' | 'product') => {
        setCart(prevCart => {
            const existingItem = prevCart.find(i => i.id === item.id && i.type === type);
            if (existingItem) {
                // For products, check stock
                if (type === 'product' && existingItem.quantity >= (item as Product).stockQuantity) {
                    toast({ variant: 'destructive', title: 'Estoque insuficiente' });
                    return prevCart;
                }
                return prevCart.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prevCart, { id: item.id, name: item.name, price: item.price, quantity: 1, type }];
        });
    }, [toast]);

    const removeFromCart = useCallback((itemId: string, itemType: 'service' | 'product') => {
        setCart(prevCart => prevCart.filter(item => !(item.id === itemId && item.type === itemType)));
    }, []);

    const handleFinalizeSale = async (paymentMethod: string) => {
        try {
            const batch = writeBatch(firestore);

            // 1. Create Financial Record
            const recordsRef = collection(firestore, 'barberShops', shopId, 'financialRecords');
            const financialRecordData = {
                barberShopId: shopId,
                date: Timestamp.fromDate(new Date()),
                type: 'income' as const,
                description: `Venda Avulsa - ${selectedCustomer?.firstName || 'Consumidor Final'}`,
                amount: totalPrice,
                category: 'Venda Avulsa',
                paymentMethod: paymentMethod,
                createdAt: serverTimestamp(),
                items: cart,
            };
            const recordDocRef = doc(recordsRef);
            batch.set(recordDocRef, financialRecordData);

            // 2. Decrement Product Stock
            cart.forEach(item => {
                if (item.type === 'product') {
                    const productRef = doc(firestore, 'barberShops', shopId, 'products', item.id);
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        batch.update(productRef, { stockQuantity: product.stockQuantity - item.quantity });
                    }
                }
            });

            await batch.commit();
            onSaleSuccess({ items: cart, customer: selectedCustomer || { firstName: 'Consumidor Final' }, totalPrice, paymentMethod });
            setCart([]);
            setSelectedCustomer(null);
            setIsFinalizeOpen(false);

        } catch (error) {
            console.error("Error finalizing walk-in sale:", error);
            toast({ variant: 'destructive', title: "Erro na Venda", description: "Não foi possível registrar a venda avulsa." });
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Catálogo</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="services">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="services">Serviços</TabsTrigger>
                            <TabsTrigger value="products">Produtos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="services">
                             <ScrollArea className="h-96">
                                <div className="space-y-2 p-1">
                                    {services.map(s => <Button key={s.id} variant="outline" className="w-full justify-start" onClick={() => addToCart(s, 'service')}>{s.name} - R${s.price.toFixed(2)}</Button>)}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="products">
                             <ScrollArea className="h-96">
                                <div className="space-y-2 p-1">
                                    {products.filter(p => p.stockQuantity > 0).map(p => <Button key={p.id} variant="outline" className="w-full justify-start" onClick={() => addToCart(p, 'product')}>{p.name} - R${p.price.toFixed(2)}</Button>)}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShoppingCart /> Carrinho</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start mb-4">
                                    {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Selecionar Cliente (Opcional)'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {customers.map((c) => (
                                                <CommandItem key={c.id} onSelect={() => { setSelectedCustomer(c); setIsCustomerPopoverOpen(false); }}>
                                                    {c.firstName} {c.lastName}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <ScrollArea className="h-64">
                            <div className="space-y-2">
                                {cart.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Carrinho vazio</p> : cart.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-muted-foreground">Qtd: {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p>R${(item.price * item.quantity).toFixed(2)}</p>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id, item.type)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Separator className="my-4" />
                        <div className="flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span>R${totalPrice.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <Button onClick={() => setIsFinalizeOpen(true)} disabled={cart.length === 0} size="lg">Finalizar Venda</Button>
            </div>
            {isFinalizeOpen && (
                 <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Finalizar Venda Avulsa</DialogTitle>
                            <DialogDescription>
                                Selecione a forma de pagamento para o valor de R${totalPrice.toFixed(2)}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito'].map(method => (
                                <Button
                                    key={method}
                                    variant="outline"
                                    className="h-16 text-lg"
                                    onClick={() => handleFinalizeSale(method)}
                                >
                                    {method}
                                </Button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
