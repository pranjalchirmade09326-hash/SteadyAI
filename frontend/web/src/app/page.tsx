'use client';

import { useAuth } from '@/auth';
import { UserRole } from '@/lib/api';
import { DEMO_ROLE_STORAGE_KEY } from '@/lib/mockDemoData';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ============================================================================
// DATA DEFINITIONS & COPY (Grounded strictly in SteadyAI BRD, SRS & Architecture)
// ============================================================================

const keyMetrics = [
  { value: '60%', label: 'Less Coach Admin Work', sub: 'Automated AI synthesis of logs' },
  { value: '38.4k+', label: 'LLM Inferences Handled', sub: 'Gemini 2.5 & GPT-4o resilient mesh' },
  { value: '< 60s', label: 'Time-to-First Action', sub: 'Instant personalized daily habits' },
  { value: '±15%', label: 'Vision Macro Accuracy', sub: 'Instant meal photo segmentation' }
];

const roleWorkspaces = [
  {
    id: 'member',
    role: UserRole.MEMBER,
    title: 'Member Health & Fitness Hub',
    tag: 'DAILY HABITS & ADAPTIVE COACHING',
    path: '/dashboard',
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    headline: 'Your personalized workout, nutrition & recovery co-pilot.',
    description:
      'AI that remembers your injury history, daily energy levels, and food preferences. Snap meals with your camera, log workout sets in seconds, and consult your 24/7 AI Health Coach anytime.',
    bullets: [
      'Gemini Vision Meal Scanner (Instant calorie, macro & micro breakdown)',
      'Adaptive progressive overload workout plans with HD exercise demos',
      'Continuous Apple Health & Google Health Connect biometric synchronization',
      '30-Day community fitness challenges and daily streak accountability'
    ],
    stats: [
      { label: 'Daily Target', val: '1,850 kcal' },
      { label: 'Protein Goal', val: '142g' },
      { label: 'Active Streak', val: '14 Days' }
    ]
  },
  {
    id: 'coach',
    role: UserRole.COACH,
    title: 'Doctor & Coach Command Center',
    tag: 'CLINICAL & PERFORMANCE OVERSIGHT',
    path: '/coach',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    headline: 'Supervise 70+ clients with AI triage & async video form checks.',
    description:
      'Eliminate chaotic WhatsApp messages and manual spreadsheets. SteadyAI synthesizes client biometric compliance, flags metabolic plateaus, and prepares one-click clinical feedback routines.',
    bullets: [
      'Asynchronous Biomechanics Review queue (squat, bench & deadlift form checks)',
      '7-Day Client Adherence & Calorie Target Telemetry Matrix',
      'Clinical Safety Overrides (blood pressure alerts, joint contraindications)',
      '1-Click automated weekly client progress report generation'
    ],
    stats: [
      { label: 'Assigned Clients', val: '38 Active' },
      { label: 'Pending Reviews', val: '3 Today' },
      { label: 'Avg Feedback Time', val: '4.2 hrs' }
    ]
  },
  {
    id: 'admin',
    role: UserRole.ADMIN,
    title: 'Platform Operations & AgentOps',
    tag: 'SYSTEM INTEGRITY & TELEMETRY',
    path: '/admin',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    headline: 'Full enterprise observability, multi-model failover & RBAC.',
    description:
      'Monitor multi-tenant health, inspect AgentOps latency, audit token consumption across OpenAI, Gemini, and Groq, and manage role-based tenant isolation with zero data leakage.',
    bullets: [
      'Multi-model LLM failover engine (Automatic fallback under 15s latency)',
      'OpenAI Model Context Protocol (MCP) server status & telemetry',
      'Granular Role-Based Access Control (RBAC) & tenant security audits',
      'Live token burn rate, error rates, and system uptime monitoring'
    ],
    stats: [
      { label: 'System Uptime', val: '99.98%' },
      { label: 'LLM P95 Latency', val: '412ms' },
      { label: 'Active Roster', val: '1,420 Users' }
    ]
  }
];

const platformPillars = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Instant Meal Vision Scan',
    tag: 'NUTRITION & MACROS',
    desc: 'Snap a picture of your breakfast, lunch, or restaurant plate with Vision Scan. Multimodal AI segments ingredients and calculates calories and macros automatically.',
    link: '/nutrition',
    linkText: 'Explore Nutrition Hub →'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'Adaptive AI Coach',
    tag: 'INTELLIGENT PRESCRIPTION',
    desc: 'Your Adaptive AI Coach delivers progressive overload workouts, modifies routines dynamically, and answers 24/7 fitness questions.',
    link: '/ai-coach',
    linkText: 'Chat with AI Coach →'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Zero-Spreadsheet Tracking',
    tag: 'FRICTIONLESS LOGGING',
    desc: 'Zero-Spreadsheet Tracking eliminates manual formulas and fragmented apps with autonomous biometric telemetry and instant set logging.',
    link: '/workouts',
    linkText: 'Explore Workouts →'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Human Coach Reviews',
    tag: 'CLINICAL INTEGRITY',
    desc: 'Bridge AI convenience with human empathy. Certified coaches and doctors provide Human Coach Reviews for movement biomechanics and clinical safety.',
    link: '/dashboard',
    linkText: 'Member Health Hub →'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Automated Health Synthesis',
    tag: 'TRENDS & BIOMETRICS',
    desc: 'Comprehensive plain-language weekly reports linking your workout load, resting heart rate, calorie deficit, and sleep recovery.',
    link: '/reports',
    linkText: 'View Sample Report →'
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Accountability Challenges',
    tag: 'COMMUNITY SUPPORT',
    desc: 'Join focused 30-day fitness sprints with friends and peers. Stay accountable through daily check-ins without social media toxicity.',
    link: '/challenges',
    linkText: 'Explore Challenges →'
  }
];

const howItWorksSteps = [
  {
    step: '01',
    title: 'Define Baseline & Connect Wearables',
    desc: 'Share your fitness goals, dietary restrictions, and injury history. Sync your Apple Health or Google Health Connect wearable metrics.'
  },
  {
    step: '02',
    title: 'Autonomous Daily Prescription',
    desc: 'SteadyAI calculates your exact daily energy balance, macro targets, and a 20-minute tailored progressive workout plan.'
  },
  {
    step: '03',
    title: 'Frictionless Logging & AI Chat',
    desc: 'Snap meal photos to log calories instantly. Complete sets with simple check-offs. Ask your AI Health Copilot anytime you have questions.'
  },
  {
    step: '04',
    title: 'Clinical Oversight & Evolving Plans',
    desc: 'Weekly synthesis reports correlate your progress. Request coach video reviews whenever you want professional form calibration.'
  }
];

const testimonials = [
  {
    quote:
      'SteadyAI replaced my messy spreadsheet tracking and my disconnected fitness apps. The Gemini Vision meal scanner alone saves me 20 minutes a day.',
    author: 'Alex Rivera',
    title: 'Software Architect & Marathon Runner',
    rating: '★★★★★',
    avatar: '🏃‍♂️'
  },
  {
    quote:
      'Managing 50+ clients used to consume all my weekends. With the SteadyAI Doctor Command Center and automated client synthesis, I can provide high-touch care to twice as many athletes in half the time.',
    author: 'Dr. Sarah Chen, MD & CSCS',
    title: 'Sports Medicine Physician & Strength Coach',
    rating: '★★★★★',
    avatar: '🩺'
  },
  {
    quote:
      'The multi-model failover and Model Context Protocol (MCP) support is incredible. I can query my daily macro adherence and workouts directly from ChatGPT Plus without switching apps.',
    author: 'Marcus Vance',
    title: 'Senior Product Manager',
    rating: '★★★★★',
    avatar: '⚡'
  }
];

const faqs = [
  {
    question: 'How do I get started with SteadyAI?',
    answer:
      'You can create your account in under 60 seconds with your email or Google account. Choose between a Member account for personal fitness & nutrition intelligence, or a Doctor/Coach account to manage patient & client rosters.'
  },
  {
    question: 'How accurate is the Gemini Vision meal scanner?',
    answer:
      'Our multimodal vision pipeline segments plate ingredients and estimates volume against verified USDA food composition tables. In real-world validation tests, it achieves within ±15% variance of manual nutritional laboratory estimation, eliminating tedious barcode scanning and manual search.'
  },
  {
    question: 'What is the role of certified doctors and coaches on the platform?',
    answer:
      'While SteadyAI uses advanced AI for daily workout planning and macro calculations, human experts provide critical clinical oversight. Members can submit asynchronous form-check videos for biomechanics audits, and physicians can set medical contraindication rules (such as heart rate caps or knee flexion limits).'
  },
  {
    question: 'How does SteadyAI integrate with ChatGPT via Model Context Protocol (MCP)?',
    answer:
      'SteadyAI exposes compliant MCP endpoints. If you use ChatGPT Plus or Claude desktop, you can securely connect SteadyAI as a tool to log meals, ask about your historical recovery trends, or retrieve today’s exercise program directly in natural language.'
  },
  {
    question: 'Is my personal health and biometric data secure?',
    answer:
      'SteadyAI is built with HIPAA and GDPR architectural readiness. All health logs and biometric metrics are encrypted at rest using AES-256 and transmitted via TLS 1.3. Each tenant’s data is strictly isolated with row-level security, and we never resell health data or train public foundation models on private user logs.'
  }
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MarketingLandingPage() {
  const { isAuthenticated, token, demoRole, loginAsDemo, logout } = useAuth();
  const [localRole, setLocalRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState<'member' | 'coach' | 'admin'>('member');
  const [isAnnualBilling, setIsAnnualBilling] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? (window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as UserRole | null)
        : null;
    setLocalRole(stored);
  }, [demoRole]);

  const activeRole = demoRole || localRole;
  const myDashboardPath =
    activeRole === UserRole.ADMIN
      ? '/admin'
      : activeRole === UserRole.COACH
      ? '/coach'
      : '/dashboard';
  const roleName =
    activeRole === UserRole.ADMIN
      ? 'Admin'
      : activeRole === UserRole.COACH
      ? 'Doctor / Coach'
      : 'Member';

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
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
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
    const roleLabel = activeRole === UserRole.ADMIN ? 'Admin' : activeRole === UserRole.COACH ? 'Doctor / Coach' : 'Member';
    setUserName(roleLabel);
  }, [isAuthenticated, token, activeRole]);

  const currentWorkspace =
    roleWorkspaces.find((w) => w.id === selectedRoleTab) || roleWorkspaces[0];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fbf8f5] text-[#1d140d] transition-colors duration-200 dark:bg-[#120d09] dark:text-[#fff7ed]">
      {/* ========================================================
          STICKY HEADER / NAVIGATION
      ======================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e8d7c6]/70 bg-[#fffaf5]/90 backdrop-blur-md dark:border-[#38271e] dark:bg-[#15100c]/90">
        <div className="mx-auto max-w-7xl flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d140d] to-[#3a281c] text-white shadow-md transition group-hover:scale-105 dark:from-[#f3c99f] dark:to-[#c26a27] dark:text-[#1d140d]">
              <span className="text-xl font-black">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#1d140d] dark:text-white leading-none">
                Steady<span className="text-[#c26a27] dark:text-[#f3c99f]">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8a7667] dark:text-[#a8927c]">
                Health &amp; Wellness OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex lg:flex text-xs font-semibold text-[#5f5145] dark:text-[#d6c2ae]">
            <Link href="#roles" className="min-h-11 inline-flex items-center hover:text-[#1d140d] dark:hover:text-white transition">
              Role Workspaces
            </Link>
            <Link href="#features" className="min-h-11 inline-flex items-center hover:text-[#1d140d] dark:hover:text-white transition">
              Capabilities
            </Link>
            <Link href="#coaching" className="min-h-11 inline-flex items-center hover:text-[#1d140d] dark:hover:text-white transition flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Doctor &amp; Coach Oversight
            </Link>
            <Link href="#architecture" className="min-h-11 inline-flex items-center hover:text-[#1d140d] dark:hover:text-white transition">
              Architecture &amp; MCP
            </Link>
            <Link href="#pricing" className="min-h-11 inline-flex items-center hover:text-[#1d140d] dark:hover:text-white transition">
              Pricing
            </Link>
            <Link href="#faq" className="min-h-11 inline-flex items-center hover:text-[#1d140d] dark:hover:text-white transition">
              FAQ
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e7da] dark:bg-[#231914] border border-[#d9c4af] dark:border-[#4a372b] px-3.5 py-1.5 text-xs font-bold text-[#1d140d] dark:text-[#f3c99f]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Welcome, {userName || 'Member'}
                </span>
                <Link
                  href={myDashboardPath}
                  className="inline-flex items-center justify-center rounded-full bg-[#1d140d] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#38271e] transition active:scale-[0.98] dark:bg-[#f3c99f] dark:text-[#1d140d]"
                >
                  Go to Dashboard →
                </Link>
                <button
                  type="button"
                  onClick={() => logout({ redirectTo: '/' })}
                  className="inline-flex items-center justify-center rounded-full border border-[#d9c4af] px-3.5 py-2 text-xs font-semibold text-[#4e4035] hover:bg-[#ede0d4]/60 transition dark:border-[#4a372b] dark:text-[#d6c2ae] dark:hover:bg-[#2a1d15]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-[#1d140d] hover:bg-[#ede0d4]/60 transition dark:text-white dark:hover:bg-[#2a1d15]"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-full bg-[#1d140d] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#38271e] transition active:scale-[0.98] dark:bg-[#f3c99f] dark:text-[#1d140d] dark:hover:bg-[#ffe2c4]"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 min-h-11 items-center justify-center rounded-xl border border-[#d8c4b3] transition active:scale-95 dark:border-[#4a372b] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-[#e8d7c6] bg-[#fffaf5] px-4 py-4 lg:hidden shadow-xl animate-in fade-in dark:border-[#38271e] dark:bg-[#15100c]">
            <div className="flex flex-col gap-2.5">
              <Link
                href="#roles"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 flex items-center px-3 py-2 text-sm font-semibold text-[#4e4035] hover:bg-[#f6ece1] rounded-xl dark:text-[#d6c2ae] dark:hover:bg-[#231914]"
              >
                Role Workspaces (Doctor, Admin, Member)
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 flex items-center px-3 py-2 text-sm font-semibold text-[#4e4035] hover:bg-[#f6ece1] rounded-xl dark:text-[#d6c2ae] dark:hover:bg-[#231914]"
              >
                Platform Capabilities
              </Link>
              <Link
                href="#coaching"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 flex items-center px-3 py-2 text-sm font-semibold text-amber-900 bg-amber-50 rounded-xl dark:bg-amber-950/40 dark:text-amber-300"
              >
                🩺 Doctor &amp; Coach Oversight
              </Link>
              <Link
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 flex items-center px-3 py-2 text-sm font-semibold text-[#4e4035] hover:bg-[#f6ece1] rounded-xl dark:text-[#d6c2ae] dark:hover:bg-[#231914]"
              >
                Multi-Model Architecture &amp; MCP
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 flex items-center px-3 py-2 text-sm font-semibold text-[#4e4035] hover:bg-[#f6ece1] rounded-xl dark:text-[#d6c2ae] dark:hover:bg-[#231914]"
              >
                Pricing Plans
              </Link>

              {isAuthenticated ? (
                <div className="pt-3 border-t border-[#e8d7c6] dark:border-[#38271e] flex flex-col gap-2">
                  <div className="rounded-xl bg-[#f3e7da] dark:bg-[#231914] px-3 py-2 text-xs font-bold text-[#1d140d] dark:text-[#f3c99f] flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Welcome, {userName || 'Member'}</span>
                  </div>
                  <Link
                    href={myDashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-11 flex items-center justify-center rounded-xl bg-[#1d140d] px-3 py-2.5 text-center text-xs font-bold text-white dark:bg-[#f3c99f] dark:text-[#1d140d]"
                  >
                    Go to Dashboard →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout({ redirectTo: '/' });
                    }}
                    className="min-h-11 flex items-center justify-center rounded-xl border border-[#d9c4af] px-3 py-2 text-center text-xs font-semibold text-[#4e4035] dark:text-[#d6c2ae] dark:border-[#4a372b]"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-[#e8d7c6] dark:border-[#38271e] grid grid-cols-2 gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-11 flex items-center justify-center rounded-xl border border-[#d9c4af] px-3 py-2.5 text-center text-xs font-semibold text-[#4e4035] dark:text-[#d6c2ae] dark:border-[#4a372b]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-11 flex items-center justify-center rounded-xl bg-[#1d140d] px-3 py-2.5 text-center text-xs font-bold text-white dark:bg-[#f3c99f] dark:text-[#1d140d]"
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Active Session Notification Banner if Logged In */}
      {isAuthenticated && (
        <div className="bg-[#1d140d] text-white px-4 py-2.5 border-b border-[#f3c99f]/30">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Active Session: <strong>{roleName}</strong> mode
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={myDashboardPath}
                className="rounded-full bg-[#f3c99f] text-[#1d140d] px-3.5 py-1 font-bold hover:bg-[#ffe2c4] transition"
              >
                Go to {roleName} Dashboard →
              </Link>
              {activeRole !== UserRole.MEMBER && (
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo(UserRole.MEMBER);
                    window.location.href = '/dashboard';
                  }}
                  className="rounded-full bg-sky-500 text-white px-3 py-1 font-bold hover:bg-sky-400 transition"
                >
                  Switch to Member View 🏃
                </button>
              )}
              <button
                type="button"
                onClick={() => logout({ redirectTo: '/' })}
                className="rounded-full border border-white/30 px-3 py-1 text-white hover:bg-white/10 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          HERO SECTION (High-Converting SaaS Presentation)
      ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28 min-h-[680px]">
        {/* High-Resolution Fitness Photography Background & Modern Dark Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-[#0c0806]">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2070&q=80"
            alt="SteadyAI Fitness & Health Platform"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Vertical directional dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0806]/92 via-[#160f0b]/85 to-[#0a0604]/96" />
          {/* Horizontal darkening for desktop text contrast */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#0c0806]/95 via-[#0c0806]/85 to-[#0c0806]/60" />
          {/* Signature SteadyAI ambient radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(243,201,159,0.18),rgba(255,255,255,0))]" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f3c99f]/30 bg-[#f3c99f]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#f3c99f] shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Health Intelligence • Clinical Oversight
            </div>

            {/* Headline */}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              The Clinical-Grade AI Health Copilot with{' '}
              <span className="bg-gradient-to-r from-[#c26a27] via-[#d97c36] to-[#e78d3c] bg-clip-text text-transparent">
                Real Doctor &amp; Coach Oversight.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#d8c0ad]">
              Unifying multimodal Gemini Vision meal logging, progressive overload exercise science, 24/7 AI wellness assistance, and dedicated command centers for certified physicians and trainers.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3.5">
              <button
                type="button"
                onClick={() => {
                  loginAsDemo(UserRole.MEMBER);
                  window.location.href = '/dashboard';
                }}
                className="min-h-11 inline-flex items-center justify-center rounded-full bg-[#f3c99f] px-8 py-4 text-sm font-bold text-[#1d140d] shadow-xl hover:bg-[#ffe2c4] transition active:scale-[0.98]"
              >
                Open Member Dashboard →
              </button>
              <Link
                href="/sign-up"
                className="min-h-11 inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-bold text-white shadow-xs hover:bg-white/20 transition backdrop-blur-sm"
              >
                Start Free Plan
              </Link>
              <Link
                href="/sign-in"
                className="min-h-11 inline-flex items-center justify-center rounded-full border border-white/20 bg-black/30 px-6 py-4 text-sm font-semibold text-[#d8c0ad] hover:text-white hover:bg-white/10 transition backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs text-[#d8c0ad]">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Enterprise AI Health Mesh</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>HIPAA &amp; GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>ChatGPT MCP Ready</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Mockup Showcase Card */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#150f0b]/85 p-6 shadow-2xl backdrop-blur-xl text-white">
              {/* Header inside Mockup */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">
                    SteadyAI Telemetry Live
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#d8c0ad]">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-500/30">
                    Gemini 2.5 Active
                  </span>
                  <span>42ms</span>
                </div>
              </div>

              {/* Mockup Card 1: Daily Target & Calorie Ring */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xs backdrop-blur-md text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#d8c0ad]">
                      Today&apos;s Nutrition Balance
                    </span>
                    <h4 className="text-lg font-bold text-white">
                      1,850 kcal target <span className="text-xs font-normal text-emerald-400">(1,420 logged)</span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#f3c99f]">76% Completed</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#c26a27] to-[#e78d3c]" style={{ width: '76%' }} />
                </div>
                <div className="mt-2.5 flex justify-between text-[11px] text-[#d8c0ad]">
                  <span>Protein: 115g / 142g</span>
                  <span>Carbs: 160g / 210g</span>
                  <span>Fats: 38g / 52g</span>
                </div>
              </div>

              {/* Mockup Card 2: AI Health Copilot Snippet */}
              <div className="mt-3.5 rounded-2xl border border-sky-400/30 bg-sky-950/40 p-4 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white font-bold text-xs">
                    AI
                  </div>
                  <div className="text-xs text-sky-200">
                    <p className="font-semibold text-sky-300">24/7 AI Health Copilot</p>
                    <p className="mt-1 leading-relaxed">
                      &ldquo;Great push on today&apos;s 4-set Romanian deadlifts! I noticed your resting heart rate recovered to 58 bpm. I&apos;ve added a high-potassium recovery smoothie suggestion to your dinner log.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Mockup Card 3: Doctor Biomechanics Notification */}
              <div className="mt-3.5 rounded-2xl border border-amber-400/30 bg-amber-950/40 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🩺</span>
                    <div>
                      <p className="text-xs font-bold text-amber-200">
                        Dr. Sarah Chen, MD • Video Review Approved
                      </p>
                      <p className="text-[11px] text-amber-300">
                        Squat Form Check: Knee tracking verified at 90° parallel.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-amber-200">
                    Verified
                  </span>
                </div>
              </div>

              {/* Role Indicator Tags */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 py-2.5 text-center text-xs font-semibold text-amber-200">
                  Doctor &amp; Coach
                </div>
                <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 py-2.5 text-center text-xs font-semibold text-sky-200">
                  Member Portal
                </div>
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-2.5 text-center text-xs font-semibold text-emerald-200">
                  Platform Admin
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          KEY METRICS STRIP (Impact & Social Proof)
      ======================================================== */}
      <section className="border-y border-[#e8d7c6]/70 bg-white/70 py-10 backdrop-blur-xs dark:border-[#38271e] dark:bg-[#15100c]/70">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {keyMetrics.map((m) => (
              <div key={m.label} className="border-l-2 border-[#c26a27] pl-4 dark:border-[#f3c99f]">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1d140d] dark:text-white tracking-tight">
                  {m.value}
                </div>
                <div className="mt-1 text-sm font-bold text-[#1d140d] dark:text-[#f3c99f]">{m.label}</div>
                <div className="text-xs text-[#705e50] dark:text-[#a8927c]">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          INTERACTIVE ROLE WORKSPACE SHOWCASE (Member, Coach, Admin)
      ======================================================== */}
      <section id="roles" className="py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] bg-[#c26a27]/10 px-3.5 py-1 rounded-full border border-[#c26a27]/20 dark:text-[#f3c99f]">
              Multi-Role Workspace Architecture
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d140d] dark:text-white tracking-tight">
              Three Dedicated Command Centers. One Unified Ecosystem.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#5f5145] dark:text-[#d6c2ae]">
              Unlike generic single-user fitness trackers, SteadyAI provides tailored, role-isolated interfaces for doctors, fitness coaches, platform admins, and everyday members.
            </p>
          </div>

          {/* Interactive Role Switcher Tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setSelectedRoleTab('coach')}
              className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                selectedRoleTab === 'coach'
                  ? 'bg-amber-800 text-white shadow-md dark:bg-amber-500 dark:text-[#1d140d]'
                  : 'bg-white border border-[#ead9ca] text-[#5f5145] hover:bg-[#fffaf5] dark:bg-[#1f1712] dark:border-[#38271e] dark:text-[#c4b3a3]'
              }`}
            >
              <span>🩺</span> Doctor / Coach Command Center
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleTab('member')}
              className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                selectedRoleTab === 'member'
                  ? 'bg-sky-800 text-white shadow-md dark:bg-sky-500 dark:text-[#1d140d]'
                  : 'bg-white border border-[#ead9ca] text-[#5f5145] hover:bg-[#fffaf5] dark:bg-[#1f1712] dark:border-[#38271e] dark:text-[#c4b3a3]'
              }`}
            >
              <span>🏃</span> Member Health &amp; Daily Tracking
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleTab('admin')}
              className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                selectedRoleTab === 'admin'
                  ? 'bg-emerald-800 text-white shadow-md dark:bg-emerald-500 dark:text-[#1d140d]'
                  : 'bg-white border border-[#ead9ca] text-[#5f5145] hover:bg-[#fffaf5] dark:bg-[#1f1712] dark:border-[#38271e] dark:text-[#c4b3a3]'
              }`}
            >
              <span>🛡️</span> Admin Operations &amp; AgentOps
            </button>
          </div>

          {/* Active Role Content Card */}
          <div className="mt-8 rounded-3xl border border-[#ead9ca] bg-white p-6 sm:p-10 shadow-lg dark:border-[#38271e] dark:bg-[#1c1511]">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${currentWorkspace.badgeColor}`}>
                  {currentWorkspace.tag}
                </div>
                <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#1d140d] dark:text-white">
                  {currentWorkspace.title}
                </h3>
                <p className="mt-2 text-base font-semibold text-[#8a4b22] dark:text-[#f3c99f]">
                  {currentWorkspace.headline}
                </p>
                <p className="mt-3 text-sm sm:text-base text-[#5f5145] dark:text-[#d6c2ae] leading-relaxed">
                  {currentWorkspace.description}
                </p>

                <div className="mt-6 space-y-3">
                  {currentWorkspace.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm text-[#4e4035] dark:text-[#d6c2ae] font-medium">
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {selectedRoleTab === 'member' ? (
                    <button
                      type="button"
                      onClick={() => {
                        loginAsDemo(UserRole.MEMBER);
                        window.location.href = '/dashboard';
                      }}
                      className="rounded-full bg-[#1d140d] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#38271e] transition active:scale-[0.98] dark:bg-[#f3c99f] dark:text-[#1d140d]"
                    >
                      Launch Member Dashboard →
                    </button>
                  ) : (
                    <Link
                      href={currentWorkspace.path}
                      className="rounded-full bg-[#1d140d] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#38271e] transition active:scale-[0.98] dark:bg-[#f3c99f] dark:text-[#1d140d]"
                    >
                      Explore {currentWorkspace.title} →
                    </Link>
                  )}
                  <Link
                    href="/sign-in"
                    className="rounded-full border border-[#d9c4af] px-5 py-3 text-xs sm:text-sm font-semibold text-[#4e4035] hover:bg-[#fffaf5] transition dark:border-[#4a372b] dark:text-[#d6c2ae]"
                  >
                    Sign In to Portal
                  </Link>
                </div>
              </div>

              {/* Workspace Mock Telemetry Panel */}
              <div className="rounded-2xl border border-[#ead9ca] bg-[#fffaf5] p-6 dark:border-[#38271e] dark:bg-[#231914]">
                <div className="flex items-center justify-between border-b border-[#e8d7c6] pb-3 dark:border-[#38271e]">
                  <span className="text-xs font-bold text-[#1d140d] dark:text-white">
                    Live Telemetry Status
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ● Real-Time Connected
                  </span>
                </div>

                {/* Key stats for this role */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {currentWorkspace.stats.map((s) => (
                    <div key={s.label} className="rounded-xl border border-[#ead9ca] bg-white p-3 text-center dark:border-[#38271e] dark:bg-[#1a130e]">
                      <div className="text-sm sm:text-base font-bold text-[#1d140d] dark:text-white">{s.val}</div>
                      <div className="mt-0.5 text-[10px] text-[#705e50] dark:text-[#a8927c] font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Visual context illustration */}
                <div className="mt-4 flex items-center justify-center p-4 bg-white/60 dark:bg-black/20 rounded-xl">
                  {selectedRoleTab === 'coach' && (
                    <Image
                      src="/illustrations/coach-orbit.svg"
                      alt="Doctor & Coach Center"
                      width={320}
                      height={180}
                      className="h-36 w-auto object-contain"
                    />
                  )}
                  {selectedRoleTab === 'member' && (
                    <Image
                      src="/illustrations/workout-flow.svg"
                      alt="Member Workout & Nutrition"
                      width={320}
                      height={180}
                      className="h-36 w-auto object-contain"
                    />
                  )}
                  {selectedRoleTab === 'admin' && (
                    <Image
                      src="/illustrations/nutrition-board.svg"
                      alt="Admin Platform Operations"
                      width={320}
                      height={180}
                      className="h-36 w-auto object-contain"
                    />
                  )}
                </div>

                <div className="mt-4 text-[11px] text-center text-[#705e50] dark:text-[#a8927c]">
                  Connected to high-performance real-time health intelligence telemetry.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          CORE CAPABILITIES GRID (The 6 Pillars)
      ======================================================== */}
      <section id="features" className="border-t border-[#e8d7c6]/60 bg-white/60 py-20 backdrop-blur-xs dark:border-[#38271e] dark:bg-[#15100c]/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] dark:text-[#f3c99f]">
              Platform Modules &amp; Capabilities
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d140d] dark:text-white tracking-tight">
              Engineered for Sustainable Health Progress
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#5f5145] dark:text-[#d6c2ae]">
              Comprehensive platform modules covering Fitness &amp; Strength, Nutrition, Clinical Oversight, and Recovery.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platformPillars.map((p) => (
              <div
                key={p.title}
                className="group relative rounded-3xl border border-[#ead9ca] bg-[#fffaf5] p-7 shadow-xs hover:shadow-md transition hover:-translate-y-1 dark:border-[#38271e] dark:bg-[#1c1511]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d140d] text-white shadow-xs dark:bg-[#f3c99f] dark:text-[#1d140d]">
                  {p.icon}
                </div>
                <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-[#c26a27] dark:text-[#f3c99f]">
                  {p.tag}
                </span>
                <h3 className="mt-1 text-xl font-bold text-[#1d140d] dark:text-white">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#5f5145] dark:text-[#c4b3a3]">{p.desc}</p>
                <div className="mt-5 pt-4 border-t border-[#ead9ca]/60 dark:border-[#38271e]">
                  <Link
                    href={p.link}
                    className="text-xs font-bold text-[#c26a27] hover:text-[#1d140d] transition dark:text-[#f3c99f] dark:hover:text-white"
                  >
                    {p.linkText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          DOCTOR & COACH OVERSIGHT (The Key Focus in User's Image)
      ======================================================== */}
      <section id="coaching" className="py-20 lg:py-28 bg-[#1d140d] text-white relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#c26a27]/20 blur-3xl" />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-14 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f3c99f]/30 bg-[#f3c99f]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#f3c99f]">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Certified Human Coaching &amp; Clinical Safety
              </span>

              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Doctor &amp; Coach oversight whenever you need it.
              </h2>

              <p className="mt-5 text-base sm:text-lg text-[#d6c2ae] leading-relaxed">
                AI plans your daily workouts and macros. Certified human coaches and health professionals review your biomechanics, adjust medical targets, and keep you safe.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/coach"
                  className="rounded-full bg-[#f3c99f] text-[#1d140d] px-7 py-3 text-xs sm:text-sm font-bold shadow-lg hover:bg-[#ffe2c4] transition active:scale-[0.98]"
                >
                  Explore Doctor / Coach Center →
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full border border-white/30 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  Join as Coach / Practitioner
                </Link>
              </div>

              {/* Medical safety rule note */}
              <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-4 text-xs text-[#d6c2ae] leading-relaxed">
                <span className="font-bold text-[#f3c99f]">Medical Disclaimer (BR-02): </span>
                SteadyAI provides health and fitness guidance for educational and wellness purposes. Certified health professionals supervise trajectory data to ensure safe progression.
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="mt-10 lg:mt-0 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:border-[#f3c99f]/40">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#f3c99f]">
                    COACH ASYNC VIDEO REVIEWS
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-400">Within 24 Hours</span>
                </div>
                <p className="mt-2 text-sm text-[#fff7ed] leading-relaxed">
                  Upload squat, bench, or deadlift videos directly from your phone. Certified strength coaches review barbell path, lumbar stability, and depth, returning timestamped biomechanical feedback.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:border-[#f3c99f]/40">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#f3c99f]">
                    CUSTOM MEAL &amp; MACRO AUDITS
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-400">Personalized</span>
                </div>
                <p className="mt-2 text-sm text-[#fff7ed] leading-relaxed">
                  Nutrition coaches audit your weekly food logs and suggest practical macro swaps without forcing you into bland chicken and broccoli diets.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:border-[#f3c99f]/40">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#f3c99f]">
                    CLINICAL METRIC CALIBRATION
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-400">Doctor Guardrails</span>
                </div>
                <p className="mt-2 text-sm text-[#fff7ed] leading-relaxed">
                  Physicians can establish safe cardiovascular thresholds, manage post-injury orthopedic rehabilitation regimens, and prevent overtraining syndrome.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          HOW IT WORKS (Step-by-step Loop)
      ======================================================== */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] dark:text-[#f3c99f]">
              Frictionless Journey
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d140d] dark:text-white">
              How SteadyAI works for you
            </h2>
            <p className="mt-3 text-base text-[#5f5145] dark:text-[#d6c2ae]">
              A continuous 4-step loop designed around consistency rather than extreme restriction.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((s) => (
              <div
                key={s.step}
                className="relative rounded-3xl border border-[#ead9ca] bg-white/80 p-7 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511]"
              >
                <span className="text-4xl font-black text-[#e8d7c6] dark:text-[#38271e]">{s.step}</span>
                <h3 className="mt-3 text-lg font-bold text-[#1d140d] dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-[#5f5145] dark:text-[#c4b3a3] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          SYSTEM ARCHITECTURE & MCP (Enterprise Grade)
      ======================================================== */}
      <section id="architecture" className="border-t border-[#e8d7c6]/60 bg-[#fffaf5] py-20 dark:border-[#38271e] dark:bg-[#15100c]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] dark:text-[#f3c99f]">
              Infrastructure &amp; Compliance
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d140d] dark:text-white tracking-tight">
              Enterprise-Grade AI Architecture
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#5f5145] dark:text-[#d6c2ae]">
              Built for 99.9% uptime, zero hallucination danger, and seamless connectivity with modern LLM ecosystems.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#ead9ca] bg-white p-7 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511]">
              <div className="text-2xl">🤖</div>
              <h3 className="mt-4 text-lg font-bold text-[#1d140d] dark:text-white">Multi-Model LLM Failover</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#5f5145] dark:text-[#c4b3a3] leading-relaxed">
                If the primary provider encounters rate limits or latency &gt;15s, SteadyAI automatically routes traffic between Gemini 2.5, OpenAI GPT-4o, and Groq Llama 3 with zero user disruption.
              </p>
            </div>

            <div className="rounded-3xl border border-[#ead9ca] bg-white p-7 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511]">
              <div className="text-2xl">🔌</div>
              <h3 className="mt-4 text-lg font-bold text-[#1d140d] dark:text-white">Model Context Protocol (MCP)</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#5f5145] dark:text-[#c4b3a3] leading-relaxed">
                SteadyAI implements OpenAI&apos;s open MCP standard. Query your health history, log meals, or adjust your progressive overload sets directly inside ChatGPT Plus or Claude desktop.
              </p>
            </div>

            <div className="rounded-3xl border border-[#ead9ca] bg-white p-7 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511]">
              <div className="text-2xl">🔒</div>
              <h3 className="mt-4 text-lg font-bold text-[#1d140d] dark:text-white">HIPAA &amp; GDPR Ready</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#5f5145] dark:text-[#c4b3a3] leading-relaxed">
                Row-level tenant isolation, AES-256 encryption at rest, TLS 1.3 in transit, and role-based access control (RBAC). Biometrics and meal photos remain private and confidential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          TESTIMONIALS & RESULTS
      ======================================================== */}
      <section className="py-20 lg:py-28 border-t border-[#e8d7c6]/60 dark:border-[#38271e]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] dark:text-[#f3c99f]">
              Member &amp; Coach Stories
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#1d140d] dark:text-white tracking-tight">
              Trusted by Doctors, Coaches &amp; Athletes
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-3xl border border-[#ead9ca] bg-white p-7 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511] flex flex-col justify-between"
              >
                <div>
                  <div className="text-amber-500 text-sm tracking-widest">{t.rating}</div>
                  <p className="mt-4 text-sm text-[#4e4035] dark:text-[#d6c2ae] italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-[#ead9ca]/60 dark:border-[#38271e]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4ebe1] dark:bg-[#2a1d15] text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1d140d] dark:text-white">{t.author}</h4>
                    <p className="text-[11px] text-[#705e50] dark:text-[#a8927c]">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          TRANSPARENT PRICING
      ======================================================== */}
      <section id="pricing" className="border-t border-[#e8d7c6]/60 bg-white/50 py-20 dark:border-[#38271e] dark:bg-[#15100c]/50">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] dark:text-[#f3c99f]">
              Transparent Pricing
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d140d] dark:text-white tracking-tight">
              Invest in Sustainable Health
            </h2>
            <p className="mt-4 text-base text-[#5f5145] dark:text-[#d6c2ae]">
              Start free with our instant sandbox or unlock full coaching and clinical tools.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-8 inline-flex items-center rounded-full border border-[#ead9ca] bg-[#fffaf5] p-1.5 dark:border-[#38271e] dark:bg-[#1c1511]">
              <button
                type="button"
                onClick={() => setIsAnnualBilling(false)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  !isAnnualBilling
                    ? 'bg-[#1d140d] text-white dark:bg-[#f3c99f] dark:text-[#1d140d]'
                    : 'text-[#5f5145] dark:text-[#a8927c]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnualBilling(true)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  isAnnualBilling
                    ? 'bg-[#1d140d] text-white dark:bg-[#f3c99f] dark:text-[#1d140d]'
                    : 'text-[#5f5145] dark:text-[#a8927c]'
                }`}
              >
                Annual <span className="text-[10px] text-emerald-500 font-extrabold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {/* Starter Tier */}
            <div className="rounded-3xl border border-[#ead9ca] bg-[#fffaf5] p-8 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a7667] dark:text-[#a8927c]">
                  STARTER SANDBOX
                </span>
                <h3 className="mt-2 text-2xl font-bold text-[#1d140d] dark:text-white">Free Member</h3>
                <p className="mt-2 text-xs text-[#5f5145] dark:text-[#c4b3a3]">
                  Essential workout tracking and community challenge access.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1d140d] dark:text-white">$0</span>
                  <span className="text-xs text-[#705e50] dark:text-[#a8927c]">forever free</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[#4e4035] dark:text-[#d6c2ae]">
                  <li className="flex items-center gap-2">✓ Daily progressive workout generator</li>
                  <li className="flex items-center gap-2">✓ Basic meal text logging</li>
                  <li className="flex items-center gap-2">✓ Community 30-day fitness challenges</li>
                  <li className="flex items-center gap-2">✓ Progress telemetry &amp; habit tracking</li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/sign-up"
                  className="block w-full rounded-full border border-[#d9c4af] py-3 text-center text-xs font-bold text-[#1d140d] hover:bg-white transition dark:border-[#4a372b] dark:text-white"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="relative rounded-3xl border-2 border-[#c26a27] bg-white p-8 shadow-xl dark:border-[#f3c99f] dark:bg-[#231914] flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#c26a27] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs dark:bg-[#f3c99f] dark:text-[#1d140d]">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#c26a27] dark:text-[#f3c99f]">
                  MEMBER PRO + AI COPILOT
                </span>
                <h3 className="mt-2 text-2xl font-bold text-[#1d140d] dark:text-white">Pro Fitness OS</h3>
                <p className="mt-2 text-xs text-[#5f5145] dark:text-[#d6c2ae]">
                  Complete autonomous nutrition scanning, 24/7 AI coaching &amp; wearable sync.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1d140d] dark:text-white">
                    {isAnnualBilling ? '$15' : '$19'}
                  </span>
                  <span className="text-xs text-[#705e50] dark:text-[#a8927c]">/ user / month</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[#4e4035] dark:text-[#d6c2ae]">
                  <li className="flex items-center gap-2 font-semibold">✓ Everything in Free, plus:</li>
                  <li className="flex items-center gap-2">✓ Unlimited Gemini Vision meal scans</li>
                  <li className="flex items-center gap-2">✓ 24/7 Conversational AI Health Copilot</li>
                  <li className="flex items-center gap-2">✓ Wearable biometrics sync (Apple Health / Google)</li>
                  <li className="flex items-center gap-2">✓ Automated weekly health synthesis reports</li>
                  <li className="flex items-center gap-2">✓ OpenAI MCP integration for ChatGPT Plus</li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/sign-up"
                  className="block w-full rounded-full bg-[#1d140d] py-3 text-center text-xs font-bold text-white shadow-md hover:bg-[#38271e] transition active:scale-[0.98] dark:bg-[#f3c99f] dark:text-[#1d140d]"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Doctor & Coach Studio Tier */}
            <div className="rounded-3xl border border-[#ead9ca] bg-[#fffaf5] p-8 shadow-xs dark:border-[#38271e] dark:bg-[#1c1511] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  CLINIC &amp; COACHING
                </span>
                <h3 className="mt-2 text-2xl font-bold text-[#1d140d] dark:text-white">Doctor Command</h3>
                <p className="mt-2 text-xs text-[#5f5145] dark:text-[#c4b3a3]">
                  For certified health practitioners and performance coaches managing client rosters.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1d140d] dark:text-white">
                    {isAnnualBilling ? '$63' : '$79'}
                  </span>
                  <span className="text-xs text-[#705e50] dark:text-[#a8927c]">/ coach / month</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[#4e4035] dark:text-[#d6c2ae]">
                  <li className="flex items-center gap-2">✓ Manage up to 75 active client rosters</li>
                  <li className="flex items-center gap-2">✓ Asynchronous video biomechanics queue</li>
                  <li className="flex items-center gap-2">✓ 7-day client adherence &amp; metabolic telemetry</li>
                  <li className="flex items-center gap-2">✓ Clinical safety overrides &amp; custom exercise sets</li>
                  <li className="flex items-center gap-2">✓ 1-click client progress summary export</li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/coach"
                  className="block w-full rounded-full border border-amber-400 bg-amber-500/10 py-3 text-center text-xs font-bold text-amber-900 hover:bg-amber-500/20 transition dark:text-amber-200"
                >
                  Explore Coach Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          FREQUENTLY ASKED QUESTIONS (Accordion)
      ======================================================== */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c26a27] dark:text-[#f3c99f]">
              Got Questions?
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d140d] dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5f5145] dark:text-[#d6c2ae]">
              Everything you need to know about the platform, security, and medical oversight.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-[#ead9ca] bg-white transition dark:border-[#38271e] dark:bg-[#1c1511]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-[#1d140d] dark:text-white"
                  >
                    <span>{faq.question}</span>
                    <span className="ml-4 text-lg font-normal text-[#8a7667] dark:text-[#a8927c]">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#5f5145] dark:text-[#c4b3a3] leading-relaxed border-t border-[#ead9ca]/50 dark:border-[#38271e] pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          FINAL CALL TO ACTION BANNER
      ======================================================== */}
      <section className="border-t border-[#e8d7c6]/60 bg-gradient-to-b from-[#fffaf5] to-[#f4e6d7]/60 py-20 text-center dark:border-[#38271e] dark:from-[#15100c] dark:to-[#1a110a]">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-[#c26a27]/10 px-4 py-1 text-xs font-bold text-[#c26a27] border border-[#c26a27]/20 dark:text-[#f3c99f]">
            Start Today • Zero Friction
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1d140d] dark:text-white">
            Ready to experience the future of health?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#5f5145] dark:text-[#d6c2ae]">
            Create your personalized account in under 60 seconds and experience continuous health intelligence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/sign-up"
              className="rounded-full bg-[#1d140d] px-8 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[#38271e] transition active:scale-[0.98] dark:bg-[#f3c99f] dark:text-[#1d140d] dark:hover:bg-[#ffe2c4]"
            >
              Start Free 14-Day Trial →
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-[#cda77f] bg-white px-8 py-3.5 text-sm font-bold text-[#1d140d] hover:bg-[#fffaf5] transition shadow-xs dark:border-[#4a372b] dark:bg-[#231914] dark:text-[#fff7ed]"
            >
              Sign In to Account
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#8a7667] dark:text-[#a8927c]">
            No credit card required • Cancel anytime • HIPAA &amp; GDPR Ready
          </p>
        </div>
      </section>

      {/* ========================================================
          POLISHED MULTI-COLUMN FOOTER
      ======================================================== */}
      <footer className="border-t border-[#e8d7c6]/70 bg-[#fffaf5] py-14 text-xs text-[#705e50] dark:border-[#38271e] dark:bg-[#120d09] dark:text-[#8a7667]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            {/* Col 1: Brand Info */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1d140d] text-white font-bold text-sm dark:bg-[#f3c99f] dark:text-[#1d140d]">
                  S
                </div>
                <span className="text-base font-bold text-[#1d140d] dark:text-white">
                  Steady<span className="text-[#c26a27] dark:text-[#f3c99f]">AI</span>
                </span>
              </Link>
              <p className="mt-3 text-xs text-[#5f5145] dark:text-[#a8927c] max-w-sm leading-relaxed">
                The modular, clinical-grade digital health and fitness platform uniting autonomous AI copilot intelligence with real doctor and certified coach oversight.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8a7667] dark:text-[#a8927c]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>All Systems Operational (99.98% Uptime)</span>
              </div>
            </div>

            {/* Col 2: Role Workspaces */}
            <div>
              <h5 className="font-bold uppercase tracking-wider text-[#1d140d] dark:text-white text-xs">
                Role Workspaces
              </h5>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/coach" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    🩺 Doctor / Coach Center
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    🏃 Member Fitness Hub
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    🛡️ Admin Operations
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    ✨ Get Started Free
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Platform Features */}
            <div>
              <h5 className="font-bold uppercase tracking-wider text-[#1d140d] dark:text-white text-xs">
                Capabilities
              </h5>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/nutrition" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    Gemini Vision Food Scan
                  </Link>
                </li>
                <li>
                  <Link href="/workouts" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    Adaptive Workouts
                  </Link>
                </li>
                <li>
                  <Link href="/ai-coach" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    24/7 AI Health Copilot
                  </Link>
                </li>
                <li>
                  <Link href="/challenges" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    30-Day Challenges
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    Health Synthesis Reports
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Legal */}
            <div>
              <h5 className="font-bold uppercase tracking-wider text-[#1d140d] dark:text-white text-xs">
                Governance &amp; Trust
              </h5>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#1d140d] dark:hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <span className="text-[#8a7667] dark:text-[#a8927c]">HIPAA &amp; GDPR Ready</span>
                </li>
                <li>
                  <span className="text-[#8a7667] dark:text-[#a8927c]">BR-02 Medical Disclaimer</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#e8d7c6]/60 dark:border-[#38271e] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-[#8a7667] dark:text-[#a8927c]">
            <p>© {new Date().getFullYear()} SteadyAI Platform. All rights reserved. Powered by Google DeepMind &amp; OpenAI MCP.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/sign-in" className="hover:underline">Sign In</Link>
              <Link href="/sign-up" className="hover:underline">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
