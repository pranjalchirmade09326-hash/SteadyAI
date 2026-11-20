import { createApiClient } from '@/lib/api';

const DEFAULT_ONBOARDING_ROUTE = '/onboarding';

export function sanitizeAuthRedirect(value: string | null | undefined): string {
  if (!value || !value.trim()) {
    return DEFAULT_ONBOARDING_ROUTE;
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(value, origin);
    if (typeof window !== 'undefined' && url.origin !== window.location.origin) {
      return DEFAULT_ONBOARDING_ROUTE;
    }

    return `${url.pathname}${url.search}${url.hash}` || DEFAULT_ONBOARDING_ROUTE;
  } catch {
    return value.startsWith('/') && !value.startsWith('//') ? value : DEFAULT_ONBOARDING_ROUTE;
  }
}

export async function resolvePostAuthRedirect(accessToken: string, requestedTarget?: string | null): Promise<string> {
  const target = sanitizeAuthRedirect(requestedTarget);

  try {
    const api = createApiClient(accessToken);
    const context = await api.getPlatformContext();

    if (!context.userIdentity.onboardingCompleted) {
      return DEFAULT_ONBOARDING_ROUTE;
    }

    if (target === DEFAULT_ONBOARDING_ROUTE || target.startsWith('/sign-in')) {
      if (context.workspace?.role === 'ADMIN') return '/admin';
      if (context.workspace?.role === 'COACH') return '/coach';
      return '/dashboard';
    }

    return target;
  } catch {
    return target;
  }
}
