
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export default function CPanelTicketsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Ticket />
          Tickets de Suporte
        </h1>
        <p className="text-muted-foreground">
          Gerencie e responda às solicitações de suporte dos seus clientes.
        </p>
      </div>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de tickets de suporte será
            implementada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
