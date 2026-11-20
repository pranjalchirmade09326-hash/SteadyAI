'use client';

import { useAuth } from '@/auth';
import { createApiClient, type PlatformContext, UserRole } from '@/lib/api';
import {
  DEMO_ROLE_STORAGE_KEY,
  ONBOARDING_COMPLETED_KEY,
  getMockPlatformContext
} from '@/lib/mockDemoData';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface IPlatformContext extends PlatformContext {
    isLoading: boolean;
    error: string | null;
}

const PlatformContext = createContext<IPlatformContext | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
    const { token, demoRole } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const api = useMemo(() => createApiClient(token ?? undefined), [token]);
    const [context, setContext] = useState<PlatformContext | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      async function fetchContext() {
        let activeDemoRole =
          demoRole ||
          (typeof window !== 'undefined'
            ? (window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as UserRole | null)
            : null);

        if (pathname.startsWith('/admin') && activeDemoRole !== UserRole.ADMIN) {
          activeDemoRole = UserRole.ADMIN;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, UserRole.ADMIN);
          }
        } else if (pathname.startsWith('/coach') && activeDemoRole !== UserRole.COACH && activeDemoRole !== UserRole.ADMIN) {
          activeDemoRole = UserRole.COACH;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, UserRole.COACH);
          }
        } else if (pathname.startsWith('/dashboard') && activeDemoRole !== UserRole.MEMBER) {
          activeDemoRole = UserRole.MEMBER;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, UserRole.MEMBER);
          }
        }

        const isRealUserSession = Boolean(token && !token.startsWith('demo-jwt-token-'));

        if (
          !isRealUserSession &&
          activeDemoRole &&
          (activeDemoRole === UserRole.ADMIN ||
            activeDemoRole === UserRole.COACH ||
            activeDemoRole === UserRole.MEMBER)
        ) {
          const mockCtx = getMockPlatformContext(activeDemoRole);
          const customName = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.name') : null;
          const customEmail = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.email') : null;
          if (customName && customName.trim()) {
            mockCtx.userIdentity.displayName = customName.trim();
          }
          if (customEmail && customEmail.trim()) {
            mockCtx.userIdentity.email = customEmail.trim();
          }
          setContext({ ...mockCtx });
          setIsLoading(false);
          setError(null);
          return;
        }

        if (!token) {
          setContext(null);
          setIsLoading(false);
          return;
        }
        try {
            setIsLoading(true);
            const platformContext = await api.getPlatformContext();
            if (platformContext.userIdentity.onboardingCompleted) {
                window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
                if (pathname.startsWith('/onboarding')) {
                    const dest = platformContext.workspace?.role === UserRole.ADMIN ? '/admin' : platformContext.workspace?.role === UserRole.COACH ? '/coach' : '/dashboard';
                    router.replace(dest);
                }
            } else if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/admin') && !pathname.startsWith('/coach') && !pathname.startsWith('/dashboard')) {
                router.replace('/onboarding');
            }
            setContext(platformContext);
        } catch {
            // Graceful offline fallback: load context with user's stored name and role
            const customName = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.name') : null;
            const customEmail = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.email') : null;
            const customRole = (typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.role') : null) as UserRole | null;
            const fallbackRole = customRole || activeDemoRole || UserRole.MEMBER;
            const mockCtx = getMockPlatformContext(fallbackRole);
            if (customName && customName.trim()) {
              mockCtx.userIdentity.displayName = customName.trim();
            }
            if (customEmail && customEmail.trim()) {
              mockCtx.userIdentity.email = customEmail.trim();
            }
            setContext({ ...mockCtx });
            setError(null);
        } finally {
            setIsLoading(false);
        }
      }
      fetchContext();
    }, [api, demoRole, pathname, router, token]);

    const value: IPlatformContext = useMemo(() => ({
        ...(context || {
            userIdentity: { id: '', email: '', displayName: '', onboardingCompleted: false },
            workspace: { id: '', name: '', role: UserRole.MEMBER },
            enabledModules: []
        }),
        isLoading,
        error,
    }), [context, isLoading, error]);

    return (
        <PlatformContext.Provider value={value}>
            {children}
        </PlatformContext.Provider>
    );
}

export function usePlatformContext() {
    const context = useContext(PlatformContext);
    if (context === undefined) {
        throw new Error('usePlatformContext must be used within a PlatformProvider');
    }
    return context;
}
