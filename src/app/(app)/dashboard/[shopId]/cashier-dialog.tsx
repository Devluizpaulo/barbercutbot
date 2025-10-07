
'use client';

import { useState } from 'react';
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
import { appointments } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddTransactionForm } from './finance/add-transaction-form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashierDialog({ open, onOpenChange }: CashierDialogProps) {
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');

  const handleOpenCashier = () => {
    // Here you would typically save the opening balance and timestamp
    console.log('Caixa aberto com saldo inicial de:', openingBalance);
    setIsCashierOpen(true);
  };

  const handleCloseCashier = () => {
    // Here you would run closing calculations and save the closing state
    console.log('Fechando caixa...');
    setIsCashierOpen(false);
    setOpeningBalance('');
    onOpenChange(false); // Close the dialog
  };

  const todayAppointments = appointments.filter(
    (appt) => format(appt.dateTime, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && appt.status !== 'Concluído'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciador de Caixa</DialogTitle>
          <DialogDescription>
            {isCashierOpen
              ? 'Finalize agendamentos, registre vendas avulsas e gerencie seu fluxo de caixa diário.'
              : 'Abra o caixa para começar a registrar as transações do dia.'}
          </DialogDescription>
        </DialogHeader>

        {!isCashierOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
             <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Abrir Caixa</CardTitle>
                    <CardDescription>Insira o valor inicial em dinheiro no caixa para começar o dia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="opening-balance">Saldo Inicial (R$)</Label>
                        <Input
                            id="opening-balance"
                            type="number"
                            placeholder="Ex: 150.00"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                        />
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
                    {todayAppointments.length > 0 ? todayAppointments.map(appt => (
                         <Card key={appt.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{appt.clientName}</p>
                                    <p className="text-sm text-muted-foreground">{appt.service} com {appt.barber}</p>
                                    <p className="text-sm font-mono">{format(appt.dateTime, 'HH:mm', {locale: ptBR})}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Badge variant={appt.status === 'Cancelado' ? 'destructive' : 'default'}>
                                        {appt.status}
                                     </Badge>
                                    {/* Placeholder price */}
                                    <p className="font-bold text-lg">R$50,00</p>
                                    <Button size="sm">Finalizar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
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
                        {/* Re-using the AddTransactionForm for walk-in sales. Needs shopId prop. */}
                        <AddTransactionForm shopId="shop-1" onSuccess={() => console.log("Venda avulsa registrada!")} />
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
  );
}
