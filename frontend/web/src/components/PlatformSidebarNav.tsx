'use client';

import { useAuth } from '@/auth';
import { usePlatformContext } from '@/features/platform/PlatformProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const ROLE_NAV_ITEMS: Record<string, Array<{ href: string; label: string; icon: string }>> = {
  MEMBER: [
    { href: '/app', label: 'Member Dashboard', icon: '🏃' },
    { href: '/dashboard', label: 'Activity Hub', icon: '⚡' },
    { href: '/nutrition', label: 'Nutrition & Vision Log', icon: '🥗' },
    { href: '/workouts', label: 'Workout Routines', icon: '🏋️' },
    { href: '/ai-coach', label: '24/7 AI Health Copilot', icon: '🤖' },
    { href: '/reports', label: 'Health Reports', icon: '📊' },
    { href: '/challenges', label: 'Challenges', icon: '🏆' },
    { href: '/community', label: 'Community Feed', icon: '👥' },
    { href: '/check-in', label: 'Daily Check-in', icon: '✅' },
    { href: '/store', label: 'Wellness Store', icon: '🛍️' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ],
  COACH: [
    { href: '/coach/dashboard', label: 'Coach Dashboard', icon: '🩺' },
    { href: '/coach', label: 'Doctor Command Center', icon: '📋' },
    { href: '/coach/reports', label: 'Client Progress Reports', icon: '📊' },
    { href: '/coach/nutrition', label: 'Dietary Audits', icon: '🥗' },
    { href: '/coach/workouts', label: 'Exercise Library', icon: '🏋️' },
    { href: '/coach/community', label: 'Community Feed', icon: '👥' },
    { href: '/coach/settings', label: 'Settings', icon: '⚙️' },
  ],
  ADMIN: [
    { href: '/admin', label: 'Platform Operations', icon: '🛡️' },
    { href: '/admin/agentops', label: 'AgentOps Telemetry', icon: '⚡' },
    { href: '/coach', label: 'Doctor & Coach Center', icon: '🩺' },
    { href: '/dashboard', label: 'Member View Preview', icon: '🏃' },
    { href: '/settings', label: 'Platform Settings', icon: '⚙️' },
  ],
};

function isActive(pathname: string, href: string): boolean {
  if (href === '/' || href === '/coach' || href === '/admin' || href === '/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, userIdentity } = usePlatformContext();
  const { logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Strictly isolate role navigation based on workspace and active route
  const currentRole: 'MEMBER' | 'COACH' | 'ADMIN' = useMemo(() => {
    if (pathname.startsWith('/admin')) return 'ADMIN';
    if (pathname.startsWith('/coach')) return 'COACH';
    if (workspace.role === 'ADMIN') return 'ADMIN';
    if (workspace.role === 'COACH') return 'COACH';
    return 'MEMBER';
  }, [pathname, workspace.role]);

  const navItems = ROLE_NAV_ITEMS[currentRole] || ROLE_NAV_ITEMS.MEMBER;
  const mobilePrimaryHrefs: Record<typeof currentRole, string[]> = {
    MEMBER: ['/dashboard', '/ai-coach', '/reports', '/community'],
    COACH: ['/coach', '/coach/reports', '/coach/community', '/coach/nutrition'],
    ADMIN: ['/admin', '/admin/agentops', '/coach', '/dashboard']
  };
  const mobileNavItems = mobilePrimaryHrefs[currentRole]
    .map((href) => navItems.find((item) => item.href === href))
    .filter((item): item is (typeof navItems)[number] => Boolean(item));

  const handleSignOut = () => {
    logout();
    router.push('/sign-in');
  };

  const customStoredName = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.name') : null;
  const customStoredEmail = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.email') : null;
  const displayName = customStoredName || userIdentity.displayName || 'Member';
  const displayEmail = customStoredEmail || userIdentity.email || `${workspace.role.toLowerCase()}@steadyai.local`;
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-[#ead9ca] bg-[#fffaf5]/95 p-4 md:flex md:flex-col md:justify-between min-h-screen sticky top-0">
        <div>
          {/* Brand Header */}
          <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1d140d] text-white shadow-sm font-black text-sm">
              S
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#1d140d]">
                Steady<span className="text-[#c26a27]">AI</span>
              </span>
              <p suppressHydrationWarning className="text-[10px] text-[#7a4b28] uppercase tracking-wider font-bold">
                {workspace.role} Workspace
              </p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition font-medium ${
                    active
                      ? 'bg-[#1d140d] font-bold text-white shadow-sm'
                      : 'text-[#4e4035] hover:bg-[#f3e7da]'
                  }`}
                >
                  <span className="text-base">{item.icon || '📌'}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out at Bottom */}
        <div className="border-t border-[#ead9ca] pt-4 mt-6">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div suppressHydrationWarning className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8a4b22] text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p suppressHydrationWarning className="text-xs font-bold text-[#1d140d] truncate">{displayName}</p>
              <p suppressHydrationWarning className="text-[11px] text-[#7a4b28] truncate">{displayEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 hover:border-red-300 active:scale-[0.99] shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation Header with User Name Pill & Sign Out */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#ead9ca] bg-[#fffaf5]/95 px-4 py-2.5 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1d140d] text-white text-xs font-black">
            S
          </div>
          <span className="font-bold text-sm text-[#1d140d]">
            Steady<span className="text-[#c26a27]">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#ead9ca] bg-white py-1 px-2.5 text-xs font-semibold text-[#1d140d] shadow-xs active:scale-95"
            aria-label="Open mobile navigation drawer"
          >
            <div suppressHydrationWarning className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8a4b22] text-[10px] text-white font-bold">
              {initials}
            </div>
            <span suppressHydrationWarning className="truncate max-w-[100px] font-bold">
              {displayName}
            </span>
            <span className="text-gray-400">☰</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-8 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition active:scale-95 shadow-xs"
            title="Sign Out"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col justify-between bg-[#fffaf5] p-5 shadow-2xl z-10">
            <div>
              {/* User info at top of mobile drawer */}
              <div className="flex items-center justify-between border-b border-[#ead9ca] pb-4 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div suppressHydrationWarning className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8a4b22] text-white text-sm font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p suppressHydrationWarning className="text-sm font-bold text-[#1d140d] truncate">
                      {displayName}
                    </p>
                    <p suppressHydrationWarning className="text-xs text-[#7a4b28] truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1 text-[#4e4035] hover:bg-[#f3e7da]"
                  aria-label="Close drawer"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition font-medium ${
                        active
                          ? 'bg-[#1d140d] font-bold text-white shadow-sm'
                          : 'text-[#4e4035] hover:bg-[#f3e7da]'
                      }`}
                    >
                      <span className="text-base">{item.icon || '📌'}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Sign Out */}
            <div className="border-t border-[#ead9ca] pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ead9ca] bg-[#fffaf5]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-16px_40px_rgba(80,48,24,0.12)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1 items-center">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-1.5 py-1.5 text-center text-[10px] font-semibold flex flex-col items-center gap-0.5 ${
                  active ? 'bg-[#1d140d] text-white' : 'text-[#5f5145] hover:bg-[#f3e7da]'
                }`}
              >
                <span className="text-sm">{item.icon || '📌'}</span>
                <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-2xl px-1.5 py-1.5 text-center text-[10px] font-semibold flex flex-col items-center gap-0.5 text-red-600 hover:bg-red-50"
            title="Sign Out"
          >
            <span className="text-sm">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
