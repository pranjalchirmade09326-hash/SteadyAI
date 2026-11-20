'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { UserRole } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MealAuditItem {
  id: string;
  patientName: string;
  initials: string;
  timeAgo: string;
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number;
  flag?: string;
  status: 'PENDING' | 'APPROVED' | 'ADJUSTED';
  notes?: string;
}

const INITIAL_AUDITS: MealAuditItem[] = [
  {
    id: 'audit-01',
    patientName: 'Alex Mercer',
    initials: 'AM',
    timeAgo: '15 mins ago',
    mealName: 'Grilled Lemon Herb Chicken Bowl with Quinoa & Steamed Broccoli',
    calories: 680,
    proteinG: 54,
    carbsG: 62,
    fatG: 18,
    confidence: 96,
    status: 'PENDING',
    notes: 'Post-workout meal. Felt good energy and satiety.'
  },
  {
    id: 'audit-02',
    patientName: 'Jordan Hayes',
    initials: 'JH',
    timeAgo: '1 hour ago',
    mealName: 'Glazed Pastry & Sugared Cappuccino (Skipped scheduled high-protein breakfast)',
    calories: 490,
    proteinG: 6,
    carbsG: 72,
    fatG: 22,
    confidence: 92,
    flag: 'LOW_PROTEIN',
    status: 'PENDING',
    notes: 'Rushed morning before flight. Missed protein target by 30g.'
  },
  {
    id: 'audit-03',
    patientName: 'Maya Lin',
    initials: 'ML',
    timeAgo: '3 hours ago',
    mealName: 'Grass-fed Sirloin Steak with Roasted Sweet Potatoes & Asparagus',
    calories: 820,
    proteinG: 62,
    carbsG: 55,
    fatG: 34,
    confidence: 98,
    status: 'APPROVED',
    notes: 'Heavy training day refeed.'
  },
  {
    id: 'audit-04',
    patientName: 'Priya Patel',
    initials: 'PP',
    timeAgo: '4 hours ago',
    mealName: 'Triple Egg White Omelet with Avocado, Spinach, and Whole Grain Sourdough',
    calories: 450,
    proteinG: 38,
    carbsG: 28,
    fatG: 19,
    confidence: 95,
    status: 'APPROVED',
    notes: 'Optimal macronutrient balance for metabolic conditioning phase.'
  },
  {
    id: 'audit-05',
    patientName: 'David Kim',
    initials: 'DK',
    timeAgo: 'Yesterday, 8:15 PM',
    mealName: 'Takeout Noodle Bowl with Crispy Tofu & Sesame Oil Dressing',
    calories: 910,
    proteinG: 24,
    carbsG: 115,
    fatG: 38,
    confidence: 89,
    flag: 'HIGH_SODIUM_SURPLUS',
    status: 'PENDING',
    notes: 'Exceeded daily carbohydrate ceiling by 40g.'
  }
];

export default function CoachNutritionPage() {
  const { workspace, isLoading } = usePlatformContext();
  const router = useRouter();

  const [audits, setAudits] = useState<MealAuditItem[]>(INITIAL_AUDITS);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FLAGGED' | 'APPROVED'>('ALL');
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  // Role Access Guard
  useEffect(() => {
    if (!isLoading && workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN) {
      router.replace('/dashboard');
    }
  }, [isLoading, router, workspace.role]);

  if (isLoading || (workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d140d] border-t-transparent" />
          <p className="text-sm font-medium">Loading Dietary Audits...</p>
        </div>
      </div>
    );
  }

  const handleApprove = (id: string, patientName: string) => {
    setAudits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
    setActiveNotice(`Meal log for ${patientName} signed off as clinically approved.`);
    setTimeout(() => setActiveNotice(null), 3500);
  };

  const handleFlagAdjustment = (id: string, patientName: string) => {
    setAudits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'ADJUSTED' } : item))
    );
    setActiveNotice(`Clinical dietary recommendation dispatched to ${patientName}.`);
    setTimeout(() => setActiveNotice(null), 3500);
  };

  const filteredAudits = audits.filter((item) => {
    if (filter === 'PENDING') return item.status === 'PENDING';
    if (filter === 'FLAGGED') return !!item.flag;
    if (filter === 'APPROVED') return item.status === 'APPROVED';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9e8a7b]">
            <Link href="/coach" className="hover:text-[#1d140d] transition">
              Doctor Workspace
            </Link>
            <span>/</span>
            <span className="text-amber-800 dark:text-amber-400">Dietary Audits</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1d140d] dark:text-white sm:text-3xl">
            Patient Dietary Audits &amp; Macro Reviews
          </h1>
          <p className="text-sm text-[#7a6858] dark:text-[#c4b5a5]">
            Review patient meal logs, verify AI vision nutrition estimations, identify nutrient deficits, and calibrate caloric targets.
          </p>
        </div>

        <Link
          href="/coach"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#d8c4b3] bg-white px-4 py-2 text-xs font-bold text-[#1d140d] shadow-sm hover:bg-[#fbf8f5] transition"
        >
          ← Back to Command Center
        </Link>
      </div>

      {activeNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          ✓ {activeNotice}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Weekly Audited Meals</p>
          <p className="mt-1 text-2xl font-black text-[#1d140d] dark:text-white">142</p>
          <p className="text-[11px] text-emerald-600 font-semibold">96.4% AI vision accuracy</p>
        </div>
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Macro Compliance</p>
          <p className="mt-1 text-2xl font-black text-[#1d140d] dark:text-white">89.2%</p>
          <p className="text-[11px] text-[#9e8a7b]">Within prescribed bands</p>
        </div>
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Flagged Deficits</p>
          <p className="mt-1 text-2xl font-black text-amber-700">3</p>
          <p className="text-[11px] text-amber-800 font-medium">Protein &amp; electrolyte alerts</p>
        </div>
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Avg Daily Protein</p>
          <p className="mt-1 text-2xl font-black text-[#1d140d] dark:text-white">158g</p>
          <p className="text-[11px] text-[#9e8a7b]">1.8g / kg target achieved</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'PENDING', 'FLAGGED', 'APPROVED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filter === tab
                ? 'bg-[#1d140d] text-white shadow-sm'
                : 'bg-white border border-[#e8d7c6] text-[#5f5145] hover:bg-[#fbf8f5]'
            }`}
          >
            {tab === 'ALL'
              ? 'All Meal Logs'
              : tab === 'PENDING'
              ? 'Awaiting Audit'
              : tab === 'FLAGGED'
              ? '⚠️ Flagged Anomalies'
              : 'Signed Off'}
          </button>
        ))}
      </div>

      {/* Audit Log Cards */}
      <div className="flex flex-col gap-3">
        {filteredAudits.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-[#1a1410] ${
              item.flag
                ? 'border-amber-300 dark:border-amber-800'
                : 'border-[#e8d7c6] dark:border-[#38271e]'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1d140d] text-xs font-black text-white dark:bg-[#f3c99f] dark:text-[#1d140d]">
                  {item.initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#1d140d] dark:text-white">{item.patientName}</span>
                    <span className="text-[11px] text-[#9e8a7b]">• {item.timeAgo}</span>
                    {item.flag && (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        ⚠️ {item.flag.replace(/_/g, ' ')}
                      </span>
                    )}
                    {item.status === 'APPROVED' && (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        ✓ Approved
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#342417] dark:text-[#fbeee2]">
                    {item.mealName}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-[#7a6858] italic dark:text-[#a8927c]">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {item.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(item.id, item.patientName)}
                    className="rounded-xl bg-[#1d140d] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#342417] transition dark:bg-[#f3c99f] dark:text-[#1d140d]"
                  >
                    ✓ Sign Off &amp; Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleFlagAdjustment(item.id, item.patientName)}
                  className="rounded-xl border border-[#d8c4b3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1d140d] hover:bg-[#fbf8f5] transition"
                >
                  Adjust Prescription
                </button>
              </div>
            </div>

            {/* Macros Bar */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#fbf8f5] p-3 text-xs dark:bg-[#15100c] sm:grid-cols-5">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#8a7667]">Calories</span>
                <p className="font-bold text-[#1d140d] dark:text-white">{item.calories} kcal</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700">Protein</span>
                <p className="font-bold text-[#1d140d] dark:text-white">{item.proteinG}g</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700">Carbs</span>
                <p className="font-bold text-[#1d140d] dark:text-white">{item.carbsG}g</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-700">Fat</span>
                <p className="font-bold text-[#1d140d] dark:text-white">{item.fatG}g</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase text-purple-700">AI Confidence</span>
                <p className="font-bold text-[#1d140d] dark:text-white">{item.confidence}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
