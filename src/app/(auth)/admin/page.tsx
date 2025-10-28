'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  
  // Deprecated route: redirect to the new cPanel login
  // We use a client-side replace to avoid leaving /admin in history
  // and to keep this component lightweight.
  
  // Minimal immediate redirect
  useEffect(() => {
    router.replace('/cpanel/login');
  }, [router]);

  return null;
}
