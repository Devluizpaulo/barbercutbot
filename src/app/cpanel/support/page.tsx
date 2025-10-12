'use client';

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
import Link from 'next/link';

export default function SupportPage() {

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
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket />
              Tickets de Suporte
            </CardTitle>
            <CardDescription>
              Precisa de ajuda? Abra um chamado para nossa equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">Acompanhe e gerencie seus tickets abertos na página de tickets.</p>
          </CardContent>
          <CardFooter>
              <Button asChild>
                <Link href="/cpanel/tickets">Ver Meus Tickets</Link>
              </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone />
              Contato de Emergência
            </CardTitle>
            <CardDescription>
              Para questões urgentes que não podem esperar.
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
                Consulte os termos e condições da plataforma na seção de Documentos.
              </p>
            </CardContent>
             <CardFooter>
                <Button variant="secondary" asChild>
                    <Link href="/cpanel/documents">Ver Documentos</Link>
                </Button>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
