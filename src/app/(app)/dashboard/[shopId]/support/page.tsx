
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
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import type { Ticket as TicketType } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface PlatformSettings {
  emergencyPhone?: string;
}

export default function SupportPage() {
  const [isTicketDialogOpen, setTicketDialogOpen] = useState(false);
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const ticketsQuery = useMemoFirebase(() => (user) ? query(collection(firestore, 'tickets'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<TicketType>(ticketsQuery);

  const settingsRef = useMemoFirebase(() => doc(firestore, 'platform/settings'), [firestore]);
  const { data: platformSettings, isLoading: isLoadingSettings } = useDoc<PlatformSettings>(settingsRef);

  const faqItems = [
    {
      question: 'Como faço para adicionar um novo barbeiro?',
      answer: 'Vá para a seção "Equipe" no menu lateral e clique no botão "Adicionar Profissional". Preencha as informações e salve.',
    },
    {
      question: 'É possível cancelar um agendamento?',
      answer: 'Sim. Na página de "Agenda", clique sobre o agendamento desejado para ver os detalhes e, em seguida, clique em "Cancelar".',
    },
    {
      question: 'Como gero um relatório financeiro?',
      answer: 'Acesse a seção "Finanças". Você pode visualizar o resumo, filtrar por data e, em breve, poderá exportar relatórios detalhados.',
    },
     {
      question: 'Como configuro o robô de agendamento do WhatsApp?',
      answer: 'Vá em "Configurações" > "Automação e IA". Lá, você poderá ativar o bot, inserir o ID da sua instância do WhatsApp e personalizar a mensagem do assistente.',
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
               {isLoadingTickets && <p className="text-sm text-muted-foreground">Carregando seus tickets...</p>}
               {!isLoadingTickets && tickets && tickets.length > 0 ? (
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
             {isLoadingSettings ? (
                <div className="space-y-2">
                    <p className="text-lg font-mono font-semibold bg-muted h-7 w-48 animate-pulse rounded-md"></p>
                    <p className="text-sm text-muted-foreground bg-muted h-4 w-40 animate-pulse rounded-md"></p>
                </div>
             ) : (
                <>
                  <p className="text-lg font-mono font-semibold">{platformSettings?.emergencyPhone || 'Não configurado'}</p>
                  <p className="text-sm text-muted-foreground">Disponível em horário comercial.</p>
                </>
             )}
          </CardContent>
           <CardFooter>
            <Button 
                variant="outline" 
                asChild
                disabled={!platformSettings?.emergencyPhone}
            >
                <a href={`tel:${platformSettings?.emergencyPhone}`}>Ligar Agora</a>
            </Button>
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
            <p className="text-sm text-muted-foreground text-justify">
             Ao utilizar nossa plataforma, você concorda com nossos termos, que regem o uso do serviço, responsabilidades da conta, pagamentos e propriedade intelectual. Você é responsável pela segurança de sua conta e pelo uso adequado do sistema. As assinaturas são recorrentes e o cancelamento impede cobranças futuras.
            </p>
             <Button variant="link" asChild className="px-0 h-auto mt-2">
                <Link href="/terms" target="_blank">Ler documento completo</Link>
             </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Política de Privacidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-justify">
             Nossa Política de Privacidade descreve como coletamos e usamos seus dados para operar e melhorar a plataforma. Comprometemo-nos a proteger suas informações e a não compartilhá-las, exceto quando necessário para a prestação do serviço ou exigido por lei, em conformidade com a LGPD.
            </p>
             <Button variant="link" asChild className="px-0 h-auto mt-2">
                <Link href="/privacy" target="_blank">Ler documento completo</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
