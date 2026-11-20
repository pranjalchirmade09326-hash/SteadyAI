'use client';

import { useEffect, type ReactNode } from 'react';
import { AuthProvider } from '@/auth';
import { PwaLifecycle } from '@/components/PwaLifecycle';
import { ThemeProvider } from '@/features/settings/components/ThemeCard';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Automatically recover from stale webpack dev chunks after file edits
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      if (
        reason?.name === 'ChunkLoadError' ||
        (typeof reason?.message === 'string' && reason.message.includes('Loading chunk'))
      ) {
        event.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <PwaLifecycle />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
