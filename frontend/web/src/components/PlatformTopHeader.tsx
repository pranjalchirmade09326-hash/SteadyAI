'use client';

import { useAuth } from '@/auth';
import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { usePathname, useRouter } from 'next/navigation';

const ROUTE_METAS: Record<string, { title: string; icon: string }> = {
  '/dashboard': { title: 'Member Dashboard', icon: '🏃' },
  '/nutrition': { title: 'Nutrition & Vision Log', icon: '🥗' },
  '/workouts': { title: 'Workout Routines', icon: '🏋️' },
  '/ai-coach': { title: '24/7 AI Health Copilot', icon: '🤖' },
  '/reports': { title: 'Health Synthesis Reports', icon: '📊' },
  '/challenges': { title: 'Community Challenges', icon: '🏆' },
  '/community': { title: 'Community Discussions', icon: '👥' },
  '/check-in': { title: 'Daily Check-in', icon: '✅' },
  '/store': { title: 'Wellness Store', icon: '🛍️' },
  '/coach': { title: 'Doctor & Coach Command Center', icon: '🩺' },
  '/admin': { title: 'Platform Operations', icon: '🛡️' },
  '/settings': { title: 'Settings & Integrations', icon: '⚙️' }
};

export function PlatformTopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, userIdentity } = usePlatformContext();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push('/sign-in');
  };

  const customStoredName = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.name') : null;
  const displayName = customStoredName || userIdentity.displayName || 'Member';
  const roleName = workspace.role === 'ADMIN' ? 'Admin' : workspace.role === 'COACH' ? 'Doctor / Coach' : 'Member';

  const currentKey = Object.keys(ROUTE_METAS).find(k => pathname === k || pathname.startsWith(`${k}/`));
  const currentMeta = currentKey ? ROUTE_METAS[currentKey] : { title: 'Workspace', icon: '⚡' };

  return (
    <header className="hidden md:flex sticky top-0 z-30 w-full items-center justify-between border-b border-[#ead9ca] bg-[#fffaf5]/90 px-6 py-2.5 backdrop-blur-md">
      {/* Left: Breadcrumb / Section Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{currentMeta.icon}</span>
        <h2 className="text-sm font-bold text-[#1d140d] tracking-tight">
          {currentMeta.title}
        </h2>
        <span className="rounded-full bg-[#f3e7da] px-2.5 py-0.5 text-[10px] font-bold text-[#7a4b28] uppercase tracking-wider">
          {roleName}
        </span>
      </div>

      {/* Right: User Display Name & Top-Right Sign Out Button! */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[#ead9ca] bg-white py-1 px-3 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-[#1d140d]">
            {displayName}
          </span>
        </div>

        {/* Top-Right Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50/90 px-3.5 py-1.5 text-xs font-bold text-red-700 shadow-xs hover:bg-red-100 hover:border-red-400 active:scale-95 transition cursor-pointer"
          title="Sign Out of SteadyAI"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
