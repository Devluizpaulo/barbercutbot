
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
              Sistema de Tickets
            </CardTitle>
            <CardDescription>
              Tem alguma dúvida ou problema? Abra um chamado e nossa equipe responderá em breve.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">Você não possui nenhum chamado aberto no momento.</p>
          </CardContent>
          <CardFooter>
            <Button>Abrir Novo Ticket</Button>
          </CardFooter>
        </Card>
        
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
