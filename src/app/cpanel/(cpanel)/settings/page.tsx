
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

import { Settings, Key, CreditCard } from 'lucide-react';

export default function CPanelSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Settings />
          Configurações da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Ajustes globais do sistema, integrações e informações legais.
        </p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-8 h-auto">
          <TabsTrigger value="general">
             <Settings className="mr-2" /> Geral
          </TabsTrigger>
          <TabsTrigger value="api_keys">
            <Key className="mr-2" /> Chaves de API
          </TabsTrigger>
          <TabsTrigger value="plans">
            <CreditCard className="mr-2" /> Planos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Informações gerais sobre a plataforma. (Em desenvolvimento)
              </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground">
                Aqui você poderá configurar o nome da plataforma, email de suporte, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api_keys">
           <Card>
            <CardHeader>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>
                Gerencie as chaves de integração para serviços de terceiros. (Em desenvolvimento)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta seção permitirá a configuração segura das chaves da Stripe, APIs de IA, e outros serviços.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans">
           <Card>
            <CardHeader>
              <CardTitle>Planos e Assinaturas</CardTitle>
              <CardDescription>
                Gerencie os planos oferecidos aos seus clientes. (Em desenvolvimento)
              </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground">
                Futuramente, você poderá editar preços, funcionalidades e períodos de teste dos planos diretamente daqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
