
'use client';

import { redirect } from 'next/navigation';

export default function DashboardShopsPage() {
  // Para este exemplo, estamos redirecionando para a primeira barbearia da lista.
  // Em uma aplicação real, você buscaria as barbearias do usuário
  // e redirecionaria para a apropriada.
  redirect('/dashboard/shop-1');

  // Este retorno é necessário para o componente ser válido, mas não será renderizado.
  return null;
}
