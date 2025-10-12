
'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Ticket, Phone, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddTicketForm } from './add-ticket-form';
import { useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Ticket as TicketType } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function SupportPage() {
  const [isTicketDialogOpen, setTicketDialogOpen] = useState(false);
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const ticketsQuery = useMemoFirebase(() => (user && shopId) ? query(collection(firestore, 'tickets'), where('shopId', '==', shopId)) : null, [firestore, shopId, user]);
  const { data: tickets, isLoading } = useCollection<TicketType>(ticketsQuery);

  const faqItems = [
    {
      question: 'Como faço para adicionar um novo barbeiro?',
      answer: 'Vá para a seção "Barbeiros" no menu lateral e clique no botão "Adicionar Barbeiro". Preencha as informações e salve.',
    },
    {
      question: 'É possível cancelar um agendamento?',
      answer: 'Sim. Na página de "Agendamentos", encontre o agendamento desejado, clique no menu de ações (três pontos) e selecione "Cancelar".',
    },
    {
      question: 'Como gero um relatório financeiro?',
      answer: 'Acesse a seção "Finanças". Você pode visualizar o resumo, filtrar por data e em breve poderá exportar relatórios detalhados.',
    },
     {
      question: 'Posso integrar minha agenda com a Google Agenda?',
      answer: 'Sim! Vá em "Configurações" > "Integrações" e siga as instruções para conectar sua conta do Google.',
    }
  ];

  const toDate = (timestamp: Timestamp | Date | string): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const getStatusVariant = (status: TicketType['status']) => {
    switch (status) {
        case 'Aberto': return 'destructive';
        case 'Em Andamento': return 'default';
        case 'Fechado': return 'secondary';
        default: return 'outline';
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <LifeBuoy />
          Central de Suporte
        </h1>
        <p className="text-muted-foreground">
          Encontre ajuda, acesse documentos e entre em contato conosco.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dialog open={isTicketDialogOpen} onOpenChange={setTicketDialogOpen}>
            <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Ticket />
                Meus Tickets de Suporte
                </CardTitle>
                <CardDescription>
                Acompanhe o andamento dos seus chamados.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               {isLoading && <p className="text-sm text-muted-foreground">Carregando seus tickets...</p>}
               {!isLoading && tickets && tickets.length > 0 ? (
                    tickets.map(ticket => (
                        <div key={ticket.id} className="flex justify-between items-center p-2 rounded-md border">
                            <div>
                                <p className="font-medium text-sm">{ticket.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                    Atualizado em {format(toDate(ticket.lastUpdatedAt), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                            </div>
                            <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                        </div>
                    ))
               ) : (
                <p className="text-sm text-muted-foreground">Você não possui nenhum chamado aberto no momento.</p>
               )}
            </CardContent>
            <CardFooter>
                <DialogTrigger asChild>
                    <Button>Abrir Novo Ticket</Button>
                </DialogTrigger>
            </CardFooter>
            </Card>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                <DialogTitle>Abrir Novo Ticket de Suporte</DialogTitle>
                <DialogDescription>
                    Descreva seu problema ou dúvida abaixo. Nossa equipe responderá o mais rápido possível.
                </DialogDescription>
                </DialogHeader>
                <AddTicketForm
                    shopId={shopId}
                    onSuccess={() => setTicketDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone />
              Contato de Emergência
            </CardTitle>
            <CardDescription>
              Para questões urgentes que não podem esperar, utilize nosso contato direto.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <p className="text-lg font-mono font-semibold">+55 (11) 99999-9999</p>
             <p className="text-sm text-muted-foreground">Disponível de Seg. a Sex. das 9h às 18h.</p>
          </CardContent>
           <CardFooter>
            <Button variant="outline">Ligar Agora</Button>
          </CardFooter>
        </Card>
      </div>
      
       <div className="space-y-6">
        <h2 className="text-xl font-bold font-headline">Perguntas Frequentes (FAQ)</h2>
         <Card>
           <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index+1}`} key={index}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
           </CardContent>
         </Card>
      </div>


      <div className="space-y-6">
         <h2 className="text-xl font-bold font-headline flex items-center gap-2"><FileText /> Documentos Legais</h2>
        <Card>
          <CardHeader>
            <CardTitle>Termos de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contrato de Prestação de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
