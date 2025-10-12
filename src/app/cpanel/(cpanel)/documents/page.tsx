
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function CPanelDocumentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <FileText />
          Documentos
        </h1>
        <p className="text-muted-foreground">
          Gerencie os termos de serviço, políticas de privacidade e outros
          documentos legais da plataforma.
        </p>
      </div>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de documentos será implementada
            aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
