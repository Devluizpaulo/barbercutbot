
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function CPanelSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Settings />
          Configurações da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Ajustes globais do sistema, integrações e mais.
        </p>
      </div>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A funcionalidade de configurações gerais da plataforma será
            implementada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
