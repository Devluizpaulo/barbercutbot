
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  CreditCard,
  User,
  Clock,
  Bot,
  Wallet,
  MapPin,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { BarberShop } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

import { ProfileForm } from './components/profile-form';
import { AddressForm } from './components/address-form';
import { WorkingHoursManager } from './components/working-hours-manager';
import { HolidaysManager } from './components/holidays-manager';
import { IntegrationsForm } from './components/integrations-form';
import { PaymentsForm } from './components/payments-form';
import { SubscriptionManager } from './components/subscription-manager';
import { CashierManager } from './components/cashier-manager';
import { PermissionsManager } from './components/permissions-manager';

export default function SettingsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();

  const shopRef = useMemoFirebase(
    () => doc(firestore, 'barberShops', shopId),
    [firestore, shopId]
  );
  const { data: shop, isLoading } = useDoc<BarberShop>(shopRef);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!shop) {
    return <p>Negócio não encontrado.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie as informações e preferências do seu negócio.
        </p>
      </div>

      <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col md:flex-row gap-8">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 md:w-[220px] h-auto shrink-0 items-start">
          <TabsTrigger value="profile" className="w-full justify-start text-left text-justify"> <User className="mr-2 shrink-0" /> <span className="truncate">Perfil</span> </TabsTrigger>
          <TabsTrigger value="address" className="w-full justify-start text-left text-justify"> <MapPin className="mr-2 shrink-0" /> <span className="truncate">Endereço</span> </TabsTrigger>
          <TabsTrigger value="hours" className="w-full justify-start text-left text-justify"> <Clock className="mr-2 shrink-0" /> <span className="truncate">Horários</span> </TabsTrigger>
          <TabsTrigger value="holidays" className="w-full justify-start text-left text-justify"> <Calendar className="mr-2 shrink-0" /> <span className="truncate">Feriados</span> </TabsTrigger>
          <TabsTrigger value="payments" className="w-full justify-start text-left text-justify"> <Wallet className="mr-2 shrink-0" /> <span className="truncate">Pagamentos</span> </TabsTrigger>
          <TabsTrigger value="cashier" className="w-full justify-start text-left text-justify"> <Wallet className="mr-2 shrink-0" /> <span className="truncate">Caixa</span> </TabsTrigger>
          <TabsTrigger value="permissions" className="w-full justify-start text-left text-justify"> <ShieldCheck className="mr-2 shrink-0" /> <span className="truncate">Permissões</span> </TabsTrigger>
          <TabsTrigger value="integrations" className="w-full justify-start text-left text-justify"> <Bot className="mr-2 shrink-0" /> <span className="truncate">Automação</span> </TabsTrigger>
          <TabsTrigger value="subscription" className="w-full justify-start text-left text-justify"> <CreditCard className="mr-2 shrink-0" /> <span className="truncate">Assinatura</span> </TabsTrigger>
        </TabsList>

        <div className="flex-1">
            <TabsContent value="profile">
                <ProfileForm shopId={shopId} initialData={shop} />
            </TabsContent>

            <TabsContent value="address">
                <AddressForm shopId={shopId} initialData={shop} />
            </TabsContent>

            <TabsContent value="hours">
                <WorkingHoursManager shopId={shopId} initialData={shop} />
            </TabsContent>
            
            <TabsContent value="holidays">
                <HolidaysManager shopId={shopId} initialData={shop.holidays} />
            </TabsContent>

             <TabsContent value="cashier">
                <CashierManager shopId={shopId} initialData={shop.cashierSettings} />
            </TabsContent>

            <TabsContent value="permissions">
                <PermissionsManager shopId={shopId} initialData={shop.roles} />
            </TabsContent>
            
            <TabsContent value="integrations">
                <IntegrationsForm shopId={shopId} initialData={shop} />
            </TabsContent>

            <TabsContent value="payments">
                <PaymentsForm shopId={shopId} initialData={shop} />
            </TabsContent>
            
            <TabsContent value="subscription">
                <SubscriptionManager shopId={shopId} shop={shop} />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
