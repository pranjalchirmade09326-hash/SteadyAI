'use client';

import { useAuth } from '@/auth';
import { PlatformSidebarNav } from '@/components/PlatformSidebarNav';
import { PlatformTopHeader } from '@/components/PlatformTopHeader';
import { PlatformProvider } from '@/features/platform/PlatformProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PlatformLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isHydrated, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect unauthenticated visitors to sign-in preserving intended destination
  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isAuthenticated, pathname, router]);

  if (!isHydrated) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#f7efe6]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#1d140d]">Loading your space...</p>
          <p className="text-sm text-[#7a4b28]">Please wait a moment.</p>
        </div>
      </main>
    );
  }

  return (
    <PlatformProvider>
      <div className="flex min-h-screen w-full">
        <PlatformSidebarNav />
        <div className="flex min-w-0 w-full flex-1 flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(255,240,220,0.95),_rgba(246,236,226,0.88)_38%,_rgba(244,239,232,1)_100%)]">
          <PlatformTopHeader />
          <main className="min-w-0 w-full flex-1 pb-16 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </PlatformProvider>
  );
}
