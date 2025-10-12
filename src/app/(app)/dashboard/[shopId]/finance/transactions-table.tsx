
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { FinancialRecord } from '@/lib/types';

interface TransactionsTableProps {
    transactions: FinancialRecord[];
    isLoading: boolean;
    onEdit: (transaction: FinancialRecord) => void;
    onDelete: (transaction: FinancialRecord) => void;
}

export function TransactionsTable({ transactions, isLoading, onEdit, onDelete }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <>
      <Table>
          <TableHeader>
              <TableRow>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[40px]"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))}
              {paginatedTransactions.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.description}</div>
                    {record.paymentMethod && <div className="text-sm text-muted-foreground md:hidden">{record.paymentMethod}</div>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{record.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{format(toDate(record.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className={`text-right font-medium ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'expense' && '-'}R${record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(record)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(record)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && paginatedTransactions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada para este período.</TableCell>
                 </TableRow>
              )}
          </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Próxima
                </Button>
            </div>
        </div>
      )}
    </>
  )
}
