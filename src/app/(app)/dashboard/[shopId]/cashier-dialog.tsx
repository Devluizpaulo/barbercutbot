
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import type { Appointment, Service, Barber, Customer, BarberShop, ChecklistItem } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddTransactionForm } from './finance/add-transaction-form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, CheckSquare, Square, XSquare } from 'lucide-react';
import { ReceiptDialog } from './receipt-dialog';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, Timestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

export function CashierDialog({ open, onOpenChange, shopId }: CashierDialogProps) {
  const [isCashierSessionActive, setIsCashierSessionActive] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const [view, setView] = useState<'closed' | 'open' | 'closing'>('closed');
  
  const [openingChecklist, setOpeningChecklist] = useState<Record<string, boolean>>({});
  const [closingChecklist, setClosingChecklist] = useState<Record<string, boolean>>({});

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const shopRef = useMemoFirebase(() => (user && shopId) ? doc(firestore, 'barberShops', shopId) : null, [firestore, shopId, user]);
  const { data: shop } = useDoc<BarberShop>(shopRef);

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
    // Here you would typically summarize the session and save it
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
    setReceiptOpen(true);
  };

  const appointmentsQuery = useMemoFirebase(() => (user && shopId) ? query(
    collection(firestore, 'barberShops', shopId, 'appointments')
  ) : null, [firestore, shopId, user]);
  const { data: allAppointments } = useCollection<Appointment>(appointmentsQuery);
  
  const todayAppointments = allAppointments?.filter(appt => isSameDay(toDate(appt.startTime), new Date()));


  const servicesQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'services') : null, [firestore, shopId, user]);
  const { data: allServices } = useCollection<Service>(servicesQuery);

  const barbersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'barbers') : null, [firestore, shopId, user]);
  const { data: allBarbers } = useCollection<Barber>(barbersQuery);
  
  const customersQuery = useMemoFirebase(() => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'customers') : null, [firestore, shopId, user]);
  const { data: allCustomers } = useCollection<Customer>(customersQuery);

  const getAssociatedData = (appt: Appointment) => {
    const barber = allBarbers?.find(b => appt.items.some(i => i.barberId === b.id));
    const customer = allCustomers?.find(c => c.id === appt.customerId);
    return { barber, customer };
  };

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

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
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
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

                        return (
                          <Card key={appt.id}>
                              <CardContent className="p-4 flex items-center justify-between">
                                  <div>
                                      <p className="font-semibold">{customer?.firstName || 'Cliente'}</p>
                                      <p className="text-sm text-muted-foreground">{servicesNames || 'Serviço'} com {barber?.firstName || 'Barbeiro'}</p>
                                      <p className="text-sm font-mono">{format(toDate(appt.startTime), 'HH:mm', {locale: ptBR})}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <Badge variant={appt.status === 'cancelled' ? 'destructive' : (appt.status === 'completed' ? 'secondary' : 'default')}>
                                          {appt.status}
                                      </Badge>
                                      {appt.totalPrice && <p className="font-bold text-lg">R${appt.totalPrice.toFixed(2)}</p>}
                                      <Button size="sm" onClick={() => handleFinalizeAppointment(appt)} disabled={appt.status === 'completed'}>
                                        Finalizar
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
                  <Card>
                      <CardHeader>
                          <CardTitle>Registrar Venda Avulsa</CardTitle>
                          <CardDescription>Use para serviços ou produtos vendidos sem agendamento prévio.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <AddTransactionForm shopId={shopId} onSuccess={() => console.log("Venda avulsa registrada!")} />
                      </CardContent>
                  </Card>
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
                      <CardDescription>Confirme o valor final em caixa e complete o checklist.</CardDescription>
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
        <ReceiptDialog
          open={isReceiptOpen}
          onOpenChange={setReceiptOpen}
          appointment={selectedAppointment}
        />
      )}
    </>
  );
}
