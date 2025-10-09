
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewShopForm } from './new-shop-form';
import { Building } from 'lucide-react';

export default function NewShopPage() {
  const router = useRouter();

  const handleSuccess = (shopId: string) => {
    router.push(`/dashboard/${shopId}`);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Building className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-headline">Cadastre sua Barbearia</CardTitle>
          <CardDescription>
            Vamos começar configurando as informações básicas do seu negócio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewShopForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
