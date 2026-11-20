'use client';

import { isGoogleAuthConfigured } from '@/config/env';
import { UserRole } from '@/lib/api';
import {
  AUTH_STORAGE_KEY,
  DEMO_ROLE_STORAGE_KEY,
  DEV_USER_ID_STORAGE_KEY,
  ONBOARDING_COMPLETED_KEY
} from '@/lib/mockDemoData';
import { usePathname, useRouter } from 'next/navigation';
import { sanitizeAuthRedirect } from './routing';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  demoRole: UserRole | null;
  isDemo: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isGoogleAuthConfigured: boolean;
  isSigningInWithGoogle: boolean;
  login: (jwt: string) => void;
  loginAsDevUser: (userId: string) => void;
  loginAsDemo: (role: UserRole) => void;
  signInWithGoogle: (options?: { redirectTo?: string }) => void;
  setToken: (jwt: string | null) => void;
  logout: (options?: { redirectTo?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [demoRole, setDemoRoleState] = useState<UserRole | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const googleAuthConfigured = isGoogleAuthConfigured();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const storedUserId = window.localStorage.getItem(DEV_USER_ID_STORAGE_KEY);
    const storedDemoRole = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);

    setTokenState(stored && stored.trim() ? stored : null);
    setUserIdState(storedUserId && storedUserId.trim() ? storedUserId : null);
    if (storedDemoRole === UserRole.ADMIN || storedDemoRole === UserRole.COACH || storedDemoRole === UserRole.MEMBER) {
      setDemoRoleState(storedDemoRole);
    } else {
      setDemoRoleState(null);
    }
    setIsHydrated(true);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        const next = event.newValue && event.newValue.trim() ? event.newValue : null;
        setTokenState(next);
      }

      if (event.key === DEV_USER_ID_STORAGE_KEY) {
        const nextUserId = event.newValue && event.newValue.trim() ? event.newValue : null;
        setUserIdState(nextUserId);
      }

      if (event.key === DEMO_ROLE_STORAGE_KEY) {
        const nextDemoRole = event.newValue;
        if (nextDemoRole === UserRole.ADMIN || nextDemoRole === UserRole.COACH || nextDemoRole === UserRole.MEMBER) {
          setDemoRoleState(nextDemoRole);
        } else {
          setDemoRoleState(null);
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persistToken = useCallback((jwt: string | null) => {
    if (jwt && jwt.trim()) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, jwt.trim());
      setTokenState(jwt.trim());
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setTokenState(null);
  }, []);

  const persistDevUserId = useCallback((nextUserId: string | null) => {
    if (nextUserId && nextUserId.trim()) {
      window.localStorage.setItem(DEV_USER_ID_STORAGE_KEY, nextUserId.trim());
      setUserIdState(nextUserId.trim());
      return;
    }

    window.localStorage.removeItem(DEV_USER_ID_STORAGE_KEY);
    setUserIdState(null);
  }, []);

  const login = useCallback(
    (jwt: string) => {
      window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
      setDemoRoleState(null);
      persistToken(jwt);
    },
    [persistToken]
  );

  const loginAsDevUser = useCallback(
    (nextUserId: string) => {
      persistDevUserId(nextUserId);
    },
    [persistDevUserId]
  );

  const loginAsDemo = useCallback(
    (role: UserRole) => {
      const roleLower = role.toLowerCase();
      const mockJwt = `demo-jwt-token-${roleLower}`;
      const mockUserId = `demo-${roleLower}-usr`;

      window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
      window.localStorage.setItem(AUTH_STORAGE_KEY, mockJwt);
      window.localStorage.setItem(DEV_USER_ID_STORAGE_KEY, mockUserId);
      window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

      setDemoRoleState(role);
      setTokenState(mockJwt);
      setUserIdState(mockUserId);
    },
    []
  );

  /**
   * Redirect the browser to Google's OAuth consent page.
   * After the user authenticates, Google will redirect to /auth/callback?code=...
   */
  const signInWithGoogle = useCallback(
    (options?: { redirectTo?: string }) => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google OAuth client ID is not configured.');
      }

      setIsSigningInWithGoogle(true);

      const redirectUri = `${window.location.origin}/auth/callback`;
      const next = sanitizeAuthRedirect(options?.redirectTo || (pathname && pathname !== '/' ? pathname : '/onboarding'));

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        // Pass the intended post-auth destination via state
        state: encodeURIComponent(next)
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    [pathname]
  );

  const logout = useCallback(
    (options?: { redirectTo?: string }) => {
      persistToken(null);
      persistDevUserId(null);
      window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
      window.localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setDemoRoleState(null);

      const target = options?.redirectTo ?? '/sign-in';
      if (pathname !== target) {
        router.replace(target);
      }
    },
    [pathname, persistDevUserId, persistToken, router]
  );

  const isDemo = Boolean(demoRole);
  const isAuthenticated = Boolean(token || userId || demoRole);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userId,
      demoRole,
      isDemo,
      isAuthenticated,
      isHydrated,
      isGoogleAuthConfigured: googleAuthConfigured,
      isSigningInWithGoogle,
      login,
      loginAsDevUser,
      loginAsDemo,
      signInWithGoogle,
      setToken: persistToken,
      logout
    }),
    [
      demoRole,
      googleAuthConfigured,
      isAuthenticated,
      isDemo,
      isHydrated,
      isSigningInWithGoogle,
      login,
      loginAsDemo,
      loginAsDevUser,
      logout,
      persistToken,
      signInWithGoogle,
      token,
      userId
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }

  return context;
}

export function useRequireAuth(options?: { redirectTo?: string }) {
  const { isHydrated, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated || isAuthenticated) {
      return;
    }

    const redirectBase = options?.redirectTo ?? '/';
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
    router.replace(`${redirectBase}${next}`);
  }, [isAuthenticated, isHydrated, options?.redirectTo, pathname, router]);

  return {
    isHydrated,
    isAuthenticated,
    isAuthorized: isHydrated && isAuthenticated
  };
}
