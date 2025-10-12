
"use client"

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import type { FinancialRecord } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Search } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { TransactionsTable } from '../transactions-table';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AddTransactionForm } from '../add-transaction-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = 'today' | 'week' | 'month' | 'year';

export default function IncomePage() {
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialRecord | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialRecord | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(() => user ? collection(firestore, 'barberShops', shopId, 'financialRecords') : null, [firestore, shopId, user]);
  const { data: transactions, isLoading } = useCollection<FinancialRecord>(transactionsQuery);

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const incomeRecords = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = transactions.filter(t => t.type === 'income');

    const now = new Date();
    let interval: { start: Date; end: Date };

    switch (period) {
      case 'today':
        interval = { start: startOfDay(now), end: endOfDay(now) };
        break;
      case 'week':
        interval = { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
        break;
      case 'month':
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'year':
        interval = { start: startOfYear(now), end: endOfYear(now) };
        break;
    }
    
    filtered = filtered.filter(t => {
      const transactionDate = toDate(t.date);
      return isWithinInterval(transactionDate, interval);
    });

    if (!searchTerm) return filtered;

    const lowercasedTerm = searchTerm.toLowerCase();
    return filtered.filter(t => 
      t.description.toLowerCase().includes(lowercasedTerm) ||
      t.category.toLowerCase().includes(lowercasedTerm)
    );
  }, [transactions, searchTerm, period]);
  
  const totalIncome = useMemo(() => {
    return incomeRecords.reduce((acc, record) => acc + record.amount, 0)
  }, [incomeRecords]);


  const handleDelete = (transaction: FinancialRecord) => {
    const recordRef = doc(firestore, 'barberShops', shopId, 'financialRecords', transaction.id);
    deleteDocumentNonBlocking(recordRef);
    toast({
      title: 'Transação Removida',
      description: `A receita "${transaction.description}" foi removida.`,
    });
    setTransactionToDelete(null);
  }

  return (
     <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                    Receitas
                </h1>
                <p className="text-muted-foreground">
                    Acompanhe todas as entradas de dinheiro do seu negócio.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="hidden sm:block">
                  <TabsList>
                    <TabsTrigger value="today">Hoje</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                    <TabsTrigger value="year">Ano</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar receita..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
        
         <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
            <CardDescription>Soma de todas as receitas encontradas no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">R${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsTable 
              transactions={incomeRecords} 
              isLoading={isLoading} 
              onEdit={(t) => { setSelectedTransaction(t); setFormOpen(true); }}
              onDelete={setTransactionToDelete}
            />
          </CardContent>
        </Card>
      </div>

       <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedTransaction(undefined); setFormOpen(isOpen); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Receita</DialogTitle>
            </DialogHeader>
            <AddTransactionForm 
              shopId={shopId} 
              initialData={selectedTransaction}
              onSuccess={() => setFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <AlertDialog
            open={!!transactionToDelete}
            onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover a receita de <strong>{transactionToDelete?.description}</strong> permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(transactionToDelete!)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sim, remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
