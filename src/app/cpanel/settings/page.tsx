
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Trash2, Bot, Palette, CreditCard as CreditCardIcon, FileText } from 'lucide-react';
import { CPanelLayout } from '../cpanel-layout';

export default function GlobalSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Configurações da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações globais do SaaS.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="billing">Pagamentos</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Informações básicas sobre a sua plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Nome da Plataforma</Label>
                <Input id="platform-name" defaultValue="Barbearia SaaS" />
              </div>
              <div className="flex justify-end pt-4">
                <Button><Save className="mr-2 h-4 w-4" />Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette /> Aparência</CardTitle>
              <CardDescription>
                Personalize as cores e o logo da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-2">
                    <Input type="color" defaultValue="#6d28d9" className="w-12 h-10 p-1" />
                    <Input defaultValue="#6d28d9" />
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="logo-upload">Logo da Plataforma</Label>
                <Input id="logo-upload" type="file" />
              </div>
               <div className="flex justify-end pt-4">
                <Button><Save className="mr-2 h-4 w-4" />Salvar Aparência</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
            <Card>
                <CardHeader>
                    <CardTitle  className="flex items-center gap-2"><CreditCardIcon /> Pagamentos</CardTitle>
                    <CardDescription>
                        Integre com provedores de pagamento para gerenciar as assinaturas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="space-y-4">
                        <Label>Gateway de Pagamento</Label>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-semibold">Stripe</h4>
                                <p className="text-sm text-muted-foreground">Conectado com a chave <code className="font-mono">pk_test_...1234</code></p>
                            </div>
                            <Button variant="destructive">Desconectar</Button>
                        </div>
                     </div>
                      <div className="space-y-2">
                        <Label>Chave da API</Label>
                        <Input placeholder="sk_test_... ou pk_test_..." />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Configurações
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                        <h4 className="font-semibold text-destructive">Resetar a Plataforma</h4>
                        <p className="text-sm text-destructive/80">Isto irá apagar TODAS as barbearias e dados de usuários.</p>
                    </div>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Resetar Plataforma
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
