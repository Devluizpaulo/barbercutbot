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
import { collection, doc, Timestamp, where, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { TransactionsTable } from '../transactions-table';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AddTransactionForm } from '../add-transaction-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodNavigator, type Period } from '../period-navigator';
import { calculateInterval } from '@/lib/date-utils';


export default function ExpensesPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialRecord | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialRecord | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const [dateOffset, setDateOffset] = useState(0);

  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const { start, end } = useMemo(() => calculateInterval(period, dateOffset), [period, dateOffset]);

  const transactionsQuery = useMemoFirebase(() => user ? query(
    collection(firestore, 'barberShops', shopId, 'financialRecords'),
    where('barberShopId', '==', shopId),
    where('date', '>=', start),
    where('date', '<=', end)
  ) : null, [firestore, shopId, user, start, end]);

  const { data: transactions, isLoading } = useCollection<FinancialRecord>(transactionsQuery);

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const expenseRecords = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = transactions.filter(t => t.type === 'expense');

    if (!searchTerm) return filtered;

    const lowercasedTerm = searchTerm.toLowerCase();
    return filtered.filter(t => 
      t.description.toLowerCase().includes(lowercasedTerm) ||
      t.category.toLowerCase().includes(lowercasedTerm)
    );
  }, [transactions, searchTerm]);

  const totalExpense = useMemo(() => {
    return expenseRecords.reduce((acc, record) => acc + record.amount, 0)
  }, [expenseRecords]);

  const handleDelete = (transaction: FinancialRecord) => {
    const recordRef = doc(firestore, 'barberShops', shopId, 'financialRecords', transaction.id);
    deleteDocumentNonBlocking(recordRef);
    toast({
      title: 'Transação Removida',
      description: `A despesa "${transaction.description}" foi removida.`,
    });
    setTransactionToDelete(null);
  }
  
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setDateOffset(0);
  };

  return (
     <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                    Despesas
                </h1>
                <p className="text-muted-foreground">
                    Acompanhe todas as saídas de dinheiro do seu negócio.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <PeriodNavigator
                  period={period}
                  onPeriodChange={handlePeriodChange}
                  dateOffset={dateOffset}
                  onDateOffsetChange={setDateOffset}
                />
            </div>
        </div>
        
         <Card>
          <CardHeader>
            <CardTitle>Despesa Total</CardTitle>
            <CardDescription>Soma de todas as despesas encontradas no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Despesas</CardTitle>
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar despesa..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent>
            <TransactionsTable 
              transactions={expenseRecords} 
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
              <DialogTitle>Editar Despesa</DialogTitle>
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
                  Esta ação irá remover a despesa de <strong>{transactionToDelete?.description}</strong> permanentemente.
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
