
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Share2,
  Copy,
  Download,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const shopRef = useMemoFirebase(
    () => user ? doc(firestore, 'barberShops', shopId) : null,
    [firestore, shopId, user]
  );
  const { data: shop, isLoading } = useDoc<BarberShop>(shopRef);

  const bookingUrl = `https://flowcutspro.firebaseapp.com/book/${shopId}`;

  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!shop) {
    return <div>Negócio não encontrado.</div>;
  }
  
  const workingHours = shop.workingHours?.filter(wh => wh.enabled).map(wh => `${wh.day}: ${wh.open} - ${wh.close}`).join(' | ') || 'Horário não definido';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
    bookingUrl
  )}`;
  
  const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(bookingUrl);
        toast({
            title: 'Link copiado!',
            description: 'O link de agendamento foi copiado para sua área de transferência.',
        });
    } catch (err) {
        console.error('Failed to copy: ', err);
        toast({
            variant: 'destructive',
            title: 'Falha ao copiar',
            description: 'Não foi possível copiar o link. Tente manualmente.',
        });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agende seu horário em ${shop.name}`,
          text: `Confira os serviços de ${shop.name} e agende seu horário!`,
          url: bookingUrl,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
         toast({
          variant: 'destructive',
          title: 'Erro ao compartilhar',
          description: 'Não foi possível compartilhar o link.',
        });
      }
    } else {
       toast({
        variant: 'destructive',
        title: 'Não suportado',
        description: 'Seu navegador não suporta a função de compartilhamento.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Perfil e Divulgação
        </h1>
        <p className="text-muted-foreground">
          Compartilhe o cartão de visita digital do seu negócio para atrair
          mais clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Use os botões abaixo para divulgar seu negócio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copiar Link de Agendamento
              </Button>
              <a href={qrCodeUrl} download={`qrcode-${shop.id}.png`}>
                <Button variant="secondary" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Baixar QR Code
                </Button>
              </a>
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Compartilhar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="overflow-hidden shadow-lg">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center relative h-32">
                <h2 className="text-3xl font-bold text-white tracking-tight font-headline">{shop.name}</h2>
                <p className="text-sm text-gray-300">Negócio Premium</p>
            </div>
            
            <CardContent className="p-6 text-center -mt-16">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src={qrCodeUrl}
                  alt={`QR Code para ${shop.name}`}
                  width={128}
                  height={128}
                  className="rounded-lg border-4 border-white shadow-md bg-white"
                />
              </div>

              <p className="text-muted-foreground mb-6">
                Aponte a câmera para agendar
              </p>

              <Separator />

              <div className="space-y-4 text-left pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Endereço</h4>
                    <p className="text-muted-foreground">{shop.address || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Telefone</h4>
                    <p className="text-muted-foreground">{shop.phone || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Horário</h4>
                    <p className="text-muted-foreground text-xs">{workingHours}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted p-4">
                <Button className="w-full" asChild>
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                        Agendar Horário
                    </a>
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
