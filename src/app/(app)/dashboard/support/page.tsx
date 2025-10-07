
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Ticket, Phone } from 'lucide-react';

export default function SupportPage() {
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
            {/* Futuramente, aqui poderá ser listado os tickets abertos */}
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
         <h2 className="text-xl font-bold font-headline">Documentos Legais</h2>
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
