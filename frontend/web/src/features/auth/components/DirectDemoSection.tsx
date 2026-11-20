'use client';

import { useAuth } from '@/auth';
import { UserRole } from '@/lib/api';
import { launchDemoSession } from '@/lib/mockDemoData';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DirectDemoSectionProps {
  className?: string;
  variant?: 'dark' | 'light';
}

interface DemoRoleOption {
  role: UserRole;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  path: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

const DEMO_OPTIONS: DemoRoleOption[] = [
  {
    role: UserRole.ADMIN,
    label: 'Admin Demo',
    badge: 'Platform Ops',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Explore 38.4k LLM telemetry calls, AgentOps latency, system health & user management.',
    path: '/admin',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    role: UserRole.COACH,
    label: 'Doctor / Coach Demo',
    badge: 'Doctor & Coach Command',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Manage 38 assigned clients, review pending check-ins, medical & dietary progress.',
    path: '/coach',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    role: UserRole.MEMBER,
    label: 'Member Demo',
    badge: 'Daily Action Hub',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Track daily 1,850 kcal nutrition rings, upper-body workout plan & 14-day streak.',
    path: '/dashboard',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
];

export function DirectDemoSection({ className = '', variant = 'dark' }: DirectDemoSectionProps) {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [launchingRole, setLaunchingRole] = useState<UserRole | null>(null);

  const handleLaunch = (role: UserRole) => {
    setLaunchingRole(role);
    // Set localStorage keys and update AuthProvider state
    const { redirectPath } = launchDemoSession(role);
    loginAsDemo(role);

    // Direct routing without credentials
    router.replace(redirectPath);
  };

  const isDark = variant === 'dark';

  return (
    <div
      data-testid="direct-demo-section"
      className={`rounded-[28px] border p-5 sm:p-6 transition-all ${
        isDark
          ? 'border-[#f3c99f]/30 bg-gradient-to-br from-[#2a1d15] to-[#1d140d] text-white shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
          : 'border-[#ead9ca] bg-[#fffaf5] text-[#1d140d] shadow-[0_12px_40px_rgba(80,48,24,0.08)]'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${
              isDark
                ? 'bg-[#f3c99f]/15 text-[#f3c99f] border-[#f3c99f]/30'
                : 'bg-[#8a4b22]/10 text-[#8a4b22] border-[#8a4b22]/20'
            }`}
          >
            Instant Demo Access • No Account Required
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-[#d8c0ad]' : 'text-[#7a6857]'}`}>
          Zero credentials • Client-side preview
        </p>
      </div>

      <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-[#e5d5c5]' : 'text-[#5f5145]'}`}>
        Jump straight into complete, functional dashboards with rich realistic data:
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DEMO_OPTIONS.map((option) => {
          const isLaunching = launchingRole === option.role;
          const IconComponent = option.icon;

          return (
            <button
              key={option.role}
              type="button"
              data-testid={`demo-launch-${option.role.toLowerCase()}`}
              disabled={launchingRole !== null}
              onClick={() => handleLaunch(option.role)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all min-h-12 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#f3c99f] ${
                isDark
                  ? 'border-white/10 bg-white/[0.05] hover:border-[#f3c99f]/60 hover:bg-white/[0.1] text-white'
                  : 'border-[#ead9ca] bg-white hover:border-[#7a4b28]/60 hover:bg-[#f7efe6]/60 text-[#1d140d]'
              } ${isLaunching ? 'opacity-75 cursor-wait' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      isDark
                        ? 'bg-white/10 text-[#f3c99f] group-hover:bg-[#f3c99f] group-hover:text-[#1d140d]'
                        : 'bg-[#f3e7da] text-[#7a4b28] group-hover:bg-[#7a4b28] group-hover:text-white'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                </div>

                <h3 className="font-bold text-base tracking-tight mb-1">
                  {option.label}
                </h3>
                <p className={`text-xs leading-5 line-clamp-2 ${isDark ? 'text-[#bfa996]' : 'text-[#6e5d50]'}`}>
                  {option.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-xs font-semibold">
                <span className={isDark ? 'text-[#f3c99f]' : 'text-[#8a4b22]'}>
                  {isLaunching ? 'Launching...' : 'Launch Dashboard →'}
                </span>
                <span className="text-[10px] opacity-60">
                  {option.path}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
