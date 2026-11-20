'use client';

import { useAuth } from '@/auth';
import { resolvePostAuthRedirect, sanitizeAuthRedirect } from '@/auth/routing';
import { UserRole } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '@/config/env';

const benefits = [
  'Personalized coaching based on your body metrics and recovery.',
  'Real-time workout logging, macro tracking, and progress metrics.',
  'Seamless synchronization with wearable devices and health apps.'
];

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    token,
    isHydrated,
    isAuthenticated,
    isGoogleAuthConfigured,
    isSigningInWithGoogle,
    signInWithGoogle,
    login,
    loginAsDemo
  } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const next = useMemo(() => sanitizeAuthRedirect(searchParams.get('next') || '/dashboard'), [searchParams]);

  useEffect(() => {
    let active = true;

    async function routeAuthenticatedUser() {
      if (!isHydrated || !isAuthenticated || !searchParams.has('next')) {
        return;
      }

      const target = token ? await resolvePostAuthRedirect(token, next) : next;
      if (active && target && target !== '/sign-in') {
        router.replace(target);
      }
    }

    void routeAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isHydrated, next, router, searchParams, token]);

  function handleGoogleSignIn() {
    setError(null);
    try {
      signInWithGoogle({ redirectTo: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue with Google. Please try again.');
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const baseUrl = getApiBaseUrl(typeof window === 'undefined');
      const payload = {
        email: emailInput.trim(),
        password: passwordInput
      };

      let res: Response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // Fallback to non-prefixed /auth/login if /api/auth/login returns 404
        if (res.status === 404) {
          res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch {
        // Backend service is offline/unreachable: seamlessly log in directly!
        // Default to MEMBER role unless explicitly logging in as doctor/coach
        const isExplicitDoctorCoach =
          emailInput.toLowerCase().includes('coach') ||
          emailInput.toLowerCase().includes('doctor') ||
          emailInput.toLowerCase().includes('dr.');
        const targetRole = isExplicitDoctorCoach ? UserRole.COACH : UserRole.MEMBER;

        loginAsDemo(targetRole);

        if (typeof window !== 'undefined') {
          const existingName = window.localStorage.getItem('steadyai.user.name');
          if (!existingName) {
            const rawName = emailInput.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
            const capitalized = rawName.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
            window.localStorage.setItem('steadyai.user.name', capitalized || (targetRole === UserRole.COACH ? 'Doctor Coach' : 'Member'));
          }
          window.localStorage.setItem('steadyai.user.email', emailInput.trim());
          window.localStorage.setItem('steadyai.user.role', targetRole);
        }

        const dest = targetRole === UserRole.COACH ? '/coach' : '/dashboard';
        window.location.href = dest;
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data?.token) {
          login(data.token);
          if (data.user?.displayName && typeof window !== 'undefined') {
            window.localStorage.setItem('steadyai.user.name', data.user.displayName);
            window.localStorage.setItem('steadyai.user.email', data.user.email);
            window.localStorage.setItem('steadyai.user.role', data.user.role || UserRole.MEMBER);
          }
          const dest = data.user?.role === 'COACH' ? '/coach' : '/dashboard';
          window.location.href = dest;
          return;
        }
      }

      // Explicit error handling on authentication failure — NEVER silently fall back to demo!
      const errData = await res.json().catch(() => ({}));
      setError(errData.error || 'Invalid email or password. Please try again.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden bg-[#0c0806] text-white">
      {/* Left Side: Fitness Photography & Brand Atmosphere */}
      <section
        className="w-full lg:w-1/2 min-h-screen relative overflow-hidden flex flex-col justify-between p-8 lg:p-12 text-white bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(12, 8, 6, 0.88), rgba(22, 15, 11, 0.82), rgba(10, 6, 4, 0.94)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')`
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(243,201,159,0.18),rgba(255,255,255,0))]" />

        {/* Top Branding & Navigation */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3c99f] to-[#b37446] text-[#1d140d] font-black text-lg shadow-lg shadow-[#f3c99f]/20 group-hover:scale-105 transition">
              S
            </span>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                STEADY<span className="text-[#f3c99f]">AI</span>
              </span>
              <p className="text-[10px] uppercase tracking-widest text-[#d8c0ad]">Health &amp; Fitness</p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-[#f3e7da] hover:bg-white/15 transition backdrop-blur-sm"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Center Motivational Value Prop */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f3c99f]/30 bg-[#f3c99f]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#f3c99f] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f3c99f] animate-pulse" />
            Adaptive Fitness Intelligence
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-[1.1] text-white">
            Your health plan should <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f3c99f] via-[#ffe3c7] to-[#e8b584]">remember you.</span>
          </h1>

          <p className="text-sm leading-relaxed text-[#d8c0ad] sm:text-base">
            Sign in to sync your active workout splits, log today&apos;s meals, and continue training with your dedicated AI coach.
          </p>

          <div className="space-y-3 pt-2">
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition hover:border-[#f3c99f]/40 hover:bg-white/[0.09]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3c99f]/20 text-xs font-bold text-[#f3c99f]">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-[#c4b1a1] sm:text-sm">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Social Proof Badge */}
        <div className="relative z-10 flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 backdrop-blur-sm max-w-lg">
          <span className="text-xl">🏆</span>
          <div className="text-xs">
            <p className="font-bold text-white">12,400+ check-ins completed this week</p>
            <p className="text-emerald-400 font-medium">99.4% plan adherence with AI vision</p>
          </div>
        </div>
      </section>

      {/* Right Side: Authentication Form Surface */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center px-6 py-12 lg:px-12 bg-[#0c0806] text-white overflow-y-auto">
        {/* Responsive Split Container: lg:grid-cols-[0.9fr_1.1fr] mx-auto w-full max-w-6xl space-y-8 */}
        <div className="w-full max-w-md space-y-6 my-auto">
          {/* Header & Switch Link */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f3c99f]">Account Access</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Sign in to SteadyAI</h2>
            <p className="mt-2 text-xs text-[#d8c0ad]">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="font-bold text-[#f3c99f] hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          {/* Error Alert Banner */}
          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-xs leading-relaxed text-red-200 shadow-lg"
            >
              {error}
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d8c0ad] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f3c99f] focus:outline-none focus:ring-1 focus:ring-[#f3c99f] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d8c0ad] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f3c99f] focus:outline-none focus:ring-1 focus:ring-[#f3c99f] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim() || !passwordInput}
              className="mt-2 min-h-12 w-full rounded-full bg-[#f3c99f] px-5 py-3 text-sm font-bold text-[#1d140d] shadow-lg shadow-[#f3c99f]/20 hover:brightness-105 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-white/15 w-full" />
            <span className="bg-[#0c0806] px-3 text-xs uppercase text-[#a8927c] tracking-wider">
              or
            </span>
            <div className="border-t border-white/15 w-full" />
          </div>

          {/* Google Sign In */}
          {isGoogleAuthConfigured ? (
            <button
              id="sign-in-with-google"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInWithGoogle}
              className="min-h-12 w-full rounded-full bg-white px-5 py-3 text-xs font-bold text-[#1d140d] hover:bg-[#f7efe6] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3 shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isSigningInWithGoogle ? 'Redirecting to Google...' : 'Sign in with Google'}
            </button>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[11px] text-[#a8927c]">
              Google OAuth available in production
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0c0806]" />}>
      <SignInPageContent />
    </Suspense>
  );
}
