'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/contexts/ToastContext';
import PagePreloader from '@/components/PagePreloader';
import PushNotificationManager from '@/components/PushNotificationManager';
import GlobalNotificationListener from '@/components/GlobalNotificationListener';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <PushNotificationManager />
        <GlobalNotificationListener />
        <PagePreloader />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}

