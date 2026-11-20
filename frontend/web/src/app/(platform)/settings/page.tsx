'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/auth';
import { useRouter } from 'next/navigation';
import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { createApiClient, type PlatformContext } from '@/lib/api';
import { getMockPlatformContext } from '@/lib/mockDemoData';
import { ProfileCard } from '@/features/settings/components/ProfileCard';
import { LegalLinksCard } from '@/features/settings/components/LegalLinksCard';
import { PrivacyCard } from '@/features/settings/components/PrivacyCard';
import { ConnectedServicesCard } from '@/features/settings/components/ConnectedServicesCard';
import { NotificationsCard } from '@/features/settings/components/NotificationsCard';
import { ThemeCard } from '@/features/settings/components/ThemeCard';
import { ApiKeysCard } from '@/features/settings/components/ApiKeysCard';
import { BmiCalculatorCard } from '@/features/settings/components/BmiCalculatorCard';
import { AdminSystemSettingsCard } from '@/features/settings/components/AdminSystemSettingsCard';
import { UserRole } from '@/lib/api';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="px-1 text-xs font-bold uppercase tracking-[0.24em] text-[#8a4b22] dark:text-[#f3c99f]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { workspace, userIdentity } = usePlatformContext();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);
  const [context, setContext] = useState<PlatformContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchContext() {
      try {
        setLoading(true);
        // Connect to backend for real platform context
        const platformContext = await api.getPlatformContext();
        if (isMounted && platformContext) {
          setContext(platformContext);
        }
      } catch {
        // Fallback to active platform context from provider or mock role
        if (isMounted) {
          const fallback = getMockPlatformContext(workspace.role);
          setContext(fallback);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchContext();
    return () => {
      isMounted = false;
    };
  }, [api, workspace.role]);

  const effectiveContext: PlatformContext = context || {
    userIdentity: {
      id: userIdentity.id || 'usr_member',
      email: userIdentity.email || `${workspace.role.toLowerCase()}@steadyai.local`,
      displayName: userIdentity.displayName || 'Alex Rivera',
      onboardingCompleted: true
    },
    workspace: {
      id: workspace.id || 'ws_steady',
      name: workspace.name || 'Personal Space',
      role: workspace.role
    },
    enabledModules: ['HOME', 'COACHING', 'WORKOUTS', 'NUTRITION', 'REPORTS', 'COMMUNITY', 'STORE', 'SETTINGS']
  };

  const handleSignOut = () => {
    logout();
    router.push('/sign-in');
  };

  if (loading && !context) {
    return <SettingsLoading />;
  }

  return (
    <div className="w-full min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-6">
      <header className="rounded-[34px] border border-white/80 bg-[#fffaf5]/84 p-5 shadow-[0_18px_70px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_70px_rgba(0,0,0,0.28)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#8a4b22] dark:text-[#f3c99f]">Account controls</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.05em] text-[#1d140d] dark:text-[#fff7ed] sm:text-4xl">Settings</h1>
            <p className="mt-1 text-sm leading-6 text-[#5f5145] dark:text-[#d6c2ae] sm:text-base">
              Manage your profile, connected devices, AI keys, privacy, and account session.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 shadow-sm"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Admin System Controls - Active for Administrators */}
      {effectiveContext.workspace.role === UserRole.ADMIN ? (
        <SettingsSection title="Administrator & System Controls">
          <AdminSystemSettingsCard />
        </SettingsSection>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#ead9ca] bg-[#fffaf5]/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#5f5145]">
          <div>
            <span className="font-bold text-[#1d140d]">Administrator Settings:</span> You are currently viewing as {effectiveContext.workspace.role}. Switch to the Administrator role to configure feature flags, LLM routing, cache maintenance, and system health.
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="shrink-0 rounded-xl bg-[#1d140d] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#3d2a1d] transition shadow-sm"
          >
            Open Admin Console & Settings →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <SettingsSection title="Account & Identity">
            <ProfileCard context={effectiveContext} />
            <div className="rounded-[24px] border border-red-200 bg-red-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
              <div>
                <p className="text-sm font-bold text-red-900">Sign Out of SteadyAI</p>
                <p className="text-xs text-red-700 mt-0.5">Disconnect this active browser session and return to the login screen.</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 shadow-sm active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </SettingsSection>

          <SettingsSection title="AI Configuration">
            <ApiKeysCard token={token} />
          </SettingsSection>

          <SettingsSection title="Body Metrics">
            <BmiCalculatorCard />
          </SettingsSection>

          <SettingsSection title="Notifications">
            <NotificationsCard />
          </SettingsSection>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SettingsSection title="Appearance">
            <ThemeCard />
          </SettingsSection>

          <SettingsSection title="Privacy & Data Governance">
            <PrivacyCard />
          </SettingsSection>

          <SettingsSection title="Connected Services & Wearables">
            <ConnectedServicesCard />
          </SettingsSection>
        </div>
      </div>

      <div className="mt-6">
        <SettingsSection title="Legal & Compliance">
          <LegalLinksCard />
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="w-full min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-6">
      <div className="animate-pulse rounded-[34px] border border-white/80 bg-white/60 p-5">
        <div className="h-4 w-36 rounded-full bg-[#ead9ca]" />
        <div className="mt-4 h-8 w-44 rounded-full bg-[#ead9ca]" />
        <div className="mt-3 h-4 w-2/3 rounded-full bg-[#f3e7da]" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-56 animate-pulse rounded-[32px] border border-white/80 bg-white/60 p-5">
            <div className="h-4 w-28 rounded-full bg-[#ead9ca]" />
            <div className="mt-4 space-y-3">
              <div className="h-14 rounded-[20px] bg-[#f3e7da]" />
              <div className="h-14 rounded-[20px] bg-[#f3e7da]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
