
'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { Settings, Key, CreditCard } from 'lucide-react';
import { GeneralSettingsForm } from './components/general-settings-form';
import { ApiKeysForm } from './components/api-keys-form';
import { PlansForm } from './components/plans-form';

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
          <GeneralSettingsForm />
        </TabsContent>

        <TabsContent value="api_keys">
           <ApiKeysForm />
        </TabsContent>
        
        <TabsContent value="plans">
           <PlansForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
