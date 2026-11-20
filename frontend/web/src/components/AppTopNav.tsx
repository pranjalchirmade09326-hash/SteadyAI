'use client';

import { useAuth } from '@/auth';
import { UserRole } from '@/lib/api';
import { DEMO_ROLE_STORAGE_KEY } from '@/lib/mockDemoData';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppTopNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, token, demoRole, logout } = useAuth();
  const [localRole, setLocalRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as UserRole | null) : null;
    setLocalRole(stored);
  }, [demoRole]);

  const activeRole = demoRole || localRole;
  const myDashboardPath = activeRole === UserRole.ADMIN ? '/admin' : activeRole === UserRole.COACH ? '/coach' : '/dashboard';
  const roleName = activeRole === UserRole.ADMIN ? 'Admin' : activeRole === UserRole.COACH ? 'Doctor / Coach' : 'Member';

  useEffect(() => {
    if (!isAuthenticated) {
      setUserName('');
      return;
    }
    if (token) {
      const storedCustomName = typeof window !== 'undefined' ? window.localStorage.getItem('steadyai.user.name') : null;
      if (storedCustomName && storedCustomName.trim()) {
        setUserName(storedCustomName.trim());
        return;
      }
      if (token.startsWith('demo-jwt-token-')) {
        const role = token.replace('demo-jwt-token-', '').toLowerCase();
        if (role === 'coach') setUserName('Dr. Sarah Chen');
        else if (role === 'admin') setUserName('Elena Rostova');
        else setUserName('Alex Mercer');
        return;
      }
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))));
          const name = payload.displayName || payload.name || (payload.email ? payload.email.split('@')[0] : '');
          if (name) {
            setUserName(name);
            return;
          }
        }
      } catch {
        // fallback
      }
    }
    setUserName(roleName);
  }, [isAuthenticated, token, roleName]);

  // Do not show duplicate top nav if inside admin or coach or dashboard when sidebar is active
  const isPlatformShell = pathname.startsWith('/admin') || pathname.startsWith('/coach') || pathname.startsWith('/dashboard') || pathname.startsWith('/workouts') || pathname.startsWith('/nutrition') || pathname.startsWith('/ai-coach');
  if (pathname === '/' || isPlatformShell) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#ead9ca] bg-[#fffaf5]/95 backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <Link href="/" className="flex items-center gap-3 text-[#1d140d]">
          <Image src="/brand/steadyai-logo.svg" alt="SteadyAI logo" width={40} height={40} priority className="h-10 w-10 rounded-[14px]" />
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#1d140d]">SteadyAI</p>
            <p className="text-xs text-[#7a4b28]">Health & Medical Platform</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 lg:flex">
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                isActive(pathname, '/') ? 'bg-[#1d140d] text-white' : 'text-[#4e4035] hover:bg-[#f3e7da]'
              }`}
            >
              Home
            </Link>
          </nav>

          <div className="h-5 w-px bg-[#ead9ca] mx-2" />

          {/* Auth Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e7da] border border-[#d9c4af] px-3 py-1 text-xs font-bold text-[#1d140d]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {userName || 'Member'}
              </span>
              <Link
                href={myDashboardPath}
                className="rounded-full bg-[#1d140d] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#342417] transition"
              >
                Go to {roleName} Dashboard →
              </Link>
              <button
                type="button"
                onClick={() => logout({ redirectTo: '/' })}
                className="rounded-full border border-[#d9c4af] px-3 py-1.5 text-xs font-medium text-[#4e4035] hover:bg-[#f3e7da] transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-full border border-[#d9c4af] px-4 py-1.5 text-xs font-semibold text-[#4e4035] hover:bg-[#f3e7da] transition"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-[#1d140d] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#342417] transition"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="rounded-full border border-[#d9c4af] px-3.5 py-1.5 text-xs font-semibold text-[#4e4035] lg:hidden hover:bg-[#f3e7da]"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="top-nav-menu"
        >
          {isOpen ? 'Close' : 'Menu ▾'}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen ? (
        <nav id="top-nav-menu" className="border-t border-[#ead9ca] bg-[#fffaf5] px-4 py-3 lg:hidden shadow-lg animate-in fade-in">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#4e4035] hover:bg-[#f3e7da]"
            >
              🏠 Home
            </Link>

            <div className="h-px bg-[#ead9ca] my-1" />

            {isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-1">
                <div className="rounded-xl bg-[#f3e7da] border border-[#d9c4af] px-3 py-2 text-xs font-bold text-[#1d140d] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Welcome, {userName || 'Member'}</span>
                </div>
                <Link
                  href={myDashboardPath}
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-[#1d140d] px-4 py-2 text-center text-sm font-bold text-white shadow-sm"
                >
                  Go to {roleName} Dashboard →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    logout({ redirectTo: '/' });
                  }}
                  className="rounded-xl border border-[#d9c4af] px-4 py-2 text-sm font-semibold text-[#4e4035]"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-[#d9c4af] px-3 py-2 text-center text-xs font-semibold text-[#4e4035]"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-[#1d140d] px-3 py-2 text-center text-xs font-bold text-white"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
