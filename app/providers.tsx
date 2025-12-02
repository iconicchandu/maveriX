'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/contexts/ToastContext';
import PagePreloader from '@/components/PagePreloader';
import PWARegister from '@/components/PWARegister';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <PWARegister />
        <PWAInstallPrompt />
        <PagePreloader />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}

