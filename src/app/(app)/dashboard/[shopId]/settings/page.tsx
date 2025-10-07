
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
import { Building, Clock, CreditCard, Link as LinkIcon, User, Trash2, Save, FileText, MapPin, Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Configurações da Barbearia
        </h1>
        <p className="text-muted-foreground">
          Gerencie as informações e preferências da sua loja.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil da Barbearia</CardTitle>
              <CardDescription>
                Atualize as informações públicas da sua barbearia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Nome da Barbearia</Label>
                <Input id="shop-name" placeholder="Ex: Barbearia Corte Clássico" defaultValue="Corte Clássico" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-doc">Documento (CNPJ/CPF)</Label>
                <Input id="shop-doc" placeholder="00.000.000/0001-00" />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                 <h3 className="text-lg font-medium">Endereço</h3>
                 <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="00000-000" className="pl-10" />
                    </div>
                    <Button type="button" variant="secondary">
                        <Search className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Buscar CEP</span>
                    </Button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="shop-street">Logradouro</Label>
                      <Input id="shop-street" placeholder="Rua das Flores" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop-number">Número</Label>
                      <Input id="shop-number" placeholder="123" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shop-neighborhood">Bairro</Label>
                      <Input id="shop-neighborhood" placeholder="Centro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop-city">Cidade</Label>
                      <Input id="shop-city" placeholder="São Paulo" />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>
                Defina os horários em que sua barbearia está aberta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => (
                     <div key={day} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex items-center gap-3">
                           <Checkbox id={`check-${day.toLowerCase()}`} defaultChecked={!['Sábado', 'Domingo'].includes(day)} />
                           <Label htmlFor={`check-${day.toLowerCase()}`} className="text-base font-medium min-w-[120px]">{day}</Label>
                        </div>
                        <div className="flex items-center gap-4">
                            <Input type="time" defaultValue="09:00" className="w-full md:w-auto"/>
                            <span className="text-muted-foreground">às</span>
                            <Input type="time" defaultValue="19:00" className="w-full md:w-auto"/>
                        </div>
                     </div>
                ))}
                 <div className="flex justify-end pt-4">
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Horários
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
            <Card>
                <CardHeader>
                    <CardTitle>Pagamentos</CardTitle>
                    <CardDescription>
                        Configure as formas de pagamento aceitas e gerencie sua assinatura.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div>
                        <h3 className="text-lg font-medium mb-4">Formas de Pagamento Aceitas</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix'].map(method => (
                                <div key={method} className="flex items-center space-x-2">
                                <Checkbox id={method.toLowerCase()} defaultChecked />
                                <Label htmlFor={method.toLowerCase()}>{method}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="pt-8 border-t">
                        <h3 className="text-lg font-medium">Plano e Assinatura</h3>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg mt-4 gap-4">
                            <div>
                                <p className="font-semibold">Plano Atual: <span className="text-primary">Pro</span></p>
                                <p className="text-sm text-muted-foreground">Sua próxima cobrança será em 15 de Agosto de 2024.</p>
                            </div>
                            <Button variant="outline">Gerenciar Assinatura</Button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Configurações de Pagamento
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Conecte sua conta a outros serviços para automatizar tarefas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                         <div className="flex-shrink-0 bg-gray-100 p-2 rounded-full">
                            <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                         </div>
                        <div>
                            <h4 className="font-semibold">Google Agenda</h4>
                            <p className="text-sm text-muted-foreground">Sincronize os agendamentos da plataforma com sua Google Agenda.</p>
                        </div>
                    </div>
                    <Button variant="secondary">Conectar</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText />
                    Documentos
                </CardTitle>
                <CardDescription>
                    Acesse os termos de serviço e outros documentos importantes da plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Termos de Uso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Contrato de Prestação de Serviços</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </p>
                    </CardContent>
                </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div>
                        <h4 className="font-semibold text-destructive">Excluir Conta</h4>
                        <p className="text-sm text-destructive/80">Isto irá apagar permanentemente todos os dados da sua barbearia.</p>
                    </div>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Minha Conta
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
