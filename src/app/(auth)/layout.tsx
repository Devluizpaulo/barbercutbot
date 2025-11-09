
'use client';

import { useUser } from '@/firebase';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Este layout é responsável por renderizar as páginas de autenticação (login, signup, etc.).
 * Ele mostra um loader apenas enquanto o estado de autenticação está sendo determinado, para evitar um "flash"
 * do formulário de login para um usuário já autenticado que está prestes a ser redirecionado.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // A lógica de redirecionamento foi removida.
  // Este layout não deve mais redirecionar o usuário. A responsabilidade é
  // dos layouts protegidos, como (app)/layout.tsx.
  
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Se o carregamento terminou, simplesmente renderiza a página filha
  // (login, signup, setup, etc.).
  return <>{children}</>;
}
