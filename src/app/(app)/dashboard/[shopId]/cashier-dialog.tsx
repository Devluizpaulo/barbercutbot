
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
import type { Appointment, Service, Barber, Customer } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddTransactionForm } from './finance/add-transaction-form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';
import { ReceiptDialog } from './receipt-dialog';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, Timestamp } from 'firebase/firestore';

interface CashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

export function CashierDialog({ open, onOpenChange, shopId }: CashierDialogProps) {
  const [isCashierSessionActive, setIsCashierSessionActive] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  
  useEffect(() => {
    if (open) {
      // Check for active session in localStorage when dialog opens
      const activeSession = localStorage.getItem(`cashier-session-${shopId}`);
      if (activeSession) {
        const sessionData = JSON.parse(activeSession);
        setIsCashierSessionActive(true);
        setOpeningBalance(sessionData.openingBalance);
      }
    }
  }, [open, shopId]);


  const handleOpenCashier = () => {
    if (parseFloat(openingBalance) >= 0) {
      localStorage.setItem(`cashier-session-${shopId}`, JSON.stringify({ openingBalance, startTime: new Date() }));
      setIsCashierSessionActive(true);
    }
  };

  const handleCloseCashier = () => {
    // Here you would typically summarize the session and save it
    console.log('Fechando caixa...');
    localStorage.removeItem(`cashier-session-${shopId}`);
    setIsCashierSessionActive(false);
    setOpeningBalance('');
    onOpenChange(false); // Close the main dialog
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciador de Caixa</DialogTitle>
            <DialogDescription>
              {isCashierSessionActive
                ? 'Finalize agendamentos, registre vendas avulsas e gerencie seu fluxo de caixa diário.'
                : 'Abra o caixa para começar a registrar as transações do dia.'}
            </DialogDescription>
          </DialogHeader>

          {!isCashierSessionActive ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <Card className="w-full max-w-sm">
                  <CardHeader>
                      <CardTitle>Abrir Caixa</CardTitle>
                      <CardDescription>Insira o valor inicial em dinheiro no caixa para começar o dia.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="opening-balance">Saldo Inicial (R$)</Label>
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
                  </CardContent>
                  <CardFooter>
                      <Button onClick={handleOpenCashier} className="w-full">
                          Abrir Caixa
                      </Button>
                  </CardFooter>
              </Card>
            </div>
          ) : (
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
                  <Button variant="destructive" onClick={handleCloseCashier}>
                      Fechar Caixa
                  </Button>
                </div>
              </DialogFooter>
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
