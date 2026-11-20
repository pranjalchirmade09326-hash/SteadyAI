'use client';

import { useAuth } from '@/auth';
import { UserRole } from '@/lib/api';
import { DEMO_ROLE_STORAGE_KEY, exitDemoSession, launchDemoSession } from '@/lib/mockDemoData';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DemoStatusBar() {
  const router = useRouter();
  const { demoRole, loginAsDemo, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [localRole, setLocalRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    if (stored === UserRole.ADMIN || stored === UserRole.COACH || stored === UserRole.MEMBER) {
      setLocalRole(stored);
    } else {
      setLocalRole(null);
    }
  }, [demoRole]);

  if (!mounted) {
    return null;
  }

  const activeRole = demoRole || localRole;
  if (!activeRole) {
    return null;
  }

  const handleRoleSwitch = (newRole: UserRole) => {
    if (newRole === activeRole) {
      return;
    }
    const { redirectPath } = launchDemoSession(newRole);
    loginAsDemo(newRole);
    setLocalRole(newRole);
    router.replace(redirectPath);
  };

  const handleExitDemo = () => {
    exitDemoSession();
    logout({ redirectTo: '/sign-in' });
  };

  const roleBadgeColors: Record<UserRole, { badge: string; text: string; bg: string; dot: string }> = {
    [UserRole.ADMIN]: {
      badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      text: 'Admin (Operations)',
      bg: 'border-emerald-600/30',
      dot: 'bg-emerald-400'
    },
    [UserRole.COACH]: {
      badge: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      text: 'Doctor / Coach (Sarah J.)',
      bg: 'border-amber-600/30',
      dot: 'bg-amber-400'
    },
    [UserRole.MEMBER]: {
      badge: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
      text: 'Member (Alex M.)',
      bg: 'border-sky-600/30',
      dot: 'bg-sky-400'
    }
  };

  const currentMeta = roleBadgeColors[activeRole] || roleBadgeColors[UserRole.MEMBER];

  return (
    <aside
      data-testid="demo-status-bar"
      aria-label="Demo Mode Controls"
      className="sticky top-0 z-50 w-full border-b border-[#3b2b22] bg-[#1d140d]/95 backdrop-blur-md px-3 py-2 text-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Indicator */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full animate-ping" />
          <span className={`inline-block h-2 w-2 rounded-full ${currentMeta.dot}`} />
          <span className="font-semibold uppercase tracking-wider text-[#d8c0ad] hidden sm:inline">
            Demo Mode:
          </span>
          <span
            data-testid="demo-role-pill"
            className={`rounded-full border px-2.5 py-0.5 font-bold uppercase tracking-wide ${currentMeta.badge}`}
          >
            {currentMeta.text}
          </span>
          <span className="text-[11px] text-[#9e8a7b] hidden md:inline">
            (Client-side dummy data)
          </span>
        </div>

        {/* Center: Quick Switch */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#9e8a7b] hidden lg:inline">
            Switch:
          </span>
          <div className="inline-flex rounded-full bg-white/10 p-0.5 border border-white/10">
            <button
              type="button"
              data-testid="demo-switch-admin"
              onClick={() => handleRoleSwitch(UserRole.ADMIN)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-h-7 ${
                activeRole === UserRole.ADMIN
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-[#d8c0ad] hover:text-white hover:bg-white/10'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              data-testid="demo-switch-coach"
              onClick={() => handleRoleSwitch(UserRole.COACH)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-h-7 ${
                activeRole === UserRole.COACH
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-[#d8c0ad] hover:text-white hover:bg-white/10'
              }`}
            >
              Coach
            </button>
            <button
              type="button"
              data-testid="demo-switch-member"
              onClick={() => handleRoleSwitch(UserRole.MEMBER)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-h-7 ${
                activeRole === UserRole.MEMBER
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'text-[#d8c0ad] hover:text-white hover:bg-white/10'
              }`}
            >
              Member
            </button>
          </div>
        </div>

        {/* Right: Exit Demo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="demo-exit-btn"
            onClick={handleExitDemo}
            className="flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/25 hover:border-red-500/60 transition active:scale-95 min-h-7"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Exit Demo</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
