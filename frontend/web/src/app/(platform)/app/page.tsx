'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { useAuth } from '@/auth';
import { createApiClient } from '@/lib/api';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface MemberDashboardData {
  progressSummary: {
    currentStreakDays: number;
    completionRate: number;
    totalCheckIns: number;
  };
  dailyTasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  workouts: {
    sessions: number;
    totalMinutes: number;
    history: unknown[];
  };
  nutrition: {
    calories: number;
    targetCalories: number;
    proteinG: number;
    targetProteinG: number;
    waterMl: number;
    targetWaterMl: number;
  };
  checkInStatus: {
    todayStatus: 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | null;
    latestCheckInDate: string | null;
  };
}

export default function MemberDashboardAppPage() {
  const { userIdentity, isLoading: platformLoading } = usePlatformContext();
  const { token } = useAuth();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  const [data, setData] = useState<MemberDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<MemberDashboardData>('/api/member/dashboard');
      setData(res);
    } catch (err) {
      const errorObj = err as Error;
      console.warn('Could not load member dashboard from API, using fallback:', errorObj);
      setError(errorObj?.message || 'Failed to load live dashboard data');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      await api.post('/api/challenges/check-in', {
        body: { status: 'COMPLETED' }
      });
      setCheckInSuccess('Check-in recorded for today! Streak updated.');
      setTimeout(() => setCheckInSuccess(null), 4000);
      await fetchDashboard();
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj?.message || 'Failed to record check-in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (platformLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff7043] border-t-transparent" />
          <p className="text-sm font-medium">Loading Member Dashboard...</p>
        </div>
      </div>
    );
  }

  const d = data || {
    progressSummary: { currentStreakDays: 0, completionRate: 0, totalCheckIns: 0 },
    dailyTasks: [
      { id: '1', title: 'Daily Challenge Check-in', completed: false },
      { id: '2', title: 'Daily Workout Session', completed: false },
      { id: '3', title: 'Log Meals & Nutrition', completed: false }
    ],
    recentActivity: [],
    workouts: { sessions: 0, totalMinutes: 0, history: [] },
    nutrition: { calories: 0, targetCalories: 2200, proteinG: 0, targetProteinG: 160, waterMl: 0, targetWaterMl: 3000 },
    checkInStatus: { todayStatus: null, latestCheckInDate: null }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#ff7043]">Member Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d140d] dark:text-[#fbf9f7]">
            Welcome back, {userIdentity.displayName || 'Athlete'}
          </h1>
          <p className="text-sm text-[#8c7460] dark:text-[#c4b5a8]">
            Track your daily tasks, workout sessions, nutrition adherence, and accountability streak.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleQuickCheckIn}
            disabled={isCheckingIn || d.checkInStatus.todayStatus === 'COMPLETED'}
            className="rounded-xl bg-[#ff7043] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#f4511e] transition disabled:opacity-50"
          >
            {d.checkInStatus.todayStatus === 'COMPLETED' ? '✓ Checked In Today' : isCheckingIn ? 'Checking In...' : 'Quick Check-in'}
          </button>
        </div>
      </div>

      {checkInSuccess && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          {checkInSuccess}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          Backend sync note: {error}
        </div>
      )}

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Active Streak</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#ff7043]">{d.progressSummary.currentStreakDays}</span>
            <span className="text-sm font-semibold text-[#8c7460]">days</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Consecutive daily completions</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Total Check-ins</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1d140d] dark:text-[#fbf9f7]">{d.progressSummary.totalCheckIns}</span>
            <span className="text-sm font-semibold text-[#8c7460]">sessions</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Accountability milestones logged</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Workout Volume</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1d140d] dark:text-[#fbf9f7]">{d.workouts.totalMinutes}</span>
            <span className="text-sm font-semibold text-[#8c7460]">mins</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">{d.workouts.sessions} logged workout sessions</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Nutrition Progress</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1d140d] dark:text-[#fbf9f7]">{d.nutrition.calories}</span>
            <span className="text-sm font-semibold text-[#8c7460]">/ {d.nutrition.targetCalories} kcal</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">{d.nutrition.proteinG}g / {d.nutrition.targetProteinG}g protein target</p>
        </div>
      </div>

      {/* Main Grid: Tasks & Nutrition / Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Daily Tasks & Check-in */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Daily Tasks */}
          <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7]">Today&apos;s Focus & Tasks</h2>
            <p className="text-xs text-[#8c7460] mb-4">Complete your routine actions to maintain your active streak.</p>

            <div className="flex flex-col gap-3">
              {d.dailyTasks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition ${
                    t.completed
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-[#efe9e3] dark:border-[#332a24] bg-[#fbf9f7] dark:bg-[#201914]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        t.completed
                          ? 'bg-emerald-500 text-white'
                          : 'border border-[#d1c4b8] text-[#8c7460]'
                      }`}
                    >
                      {t.completed ? '✓' : ''}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        t.completed
                          ? 'line-through text-[#8c7460] dark:text-[#a89689]'
                          : 'text-[#1d140d] dark:text-[#fbf9f7]'
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      t.completed
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-[#ff7043]/10 text-[#ff7043]'
                    }`}
                  >
                    {t.completed ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7]">Recent Activity</h2>
            <p className="text-xs text-[#8c7460] mb-4">Live record of your workouts, meals, and check-in milestones.</p>

            {d.recentActivity.length === 0 ? (
              <p className="text-xs text-[#8c7460] italic py-4">No recent activity logged yet. Log a workout or check-in to get started!</p>
            ) : (
              <div className="divide-y divide-[#efe9e3] dark:divide-[#332a24]">
                {d.recentActivity.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1d140d] dark:text-[#fbf9f7]">{act.description}</p>
                      <span className="text-xs text-[#8c7460]">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f4ebe1] dark:bg-[#2b221b] text-[#8c7460]">
                      {act.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workouts & Nutrition Quick Links */}
        <div className="flex flex-col gap-6">
          {/* Nutrition Summary Card */}
          <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1d140d] dark:text-[#fbf9f7]">Nutrition Targets</h2>
              <Link href="/nutrition" className="text-xs font-semibold text-[#ff7043] hover:underline">
                Log Meal →
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#8c7460]">Calories</span>
                  <span>{d.nutrition.calories} / {d.nutrition.targetCalories} kcal</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#efe9e3] dark:bg-[#332a24] overflow-hidden">
                  <div
                    className="h-full bg-[#ff7043] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (d.nutrition.calories / Math.max(1, d.nutrition.targetCalories)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#8c7460]">Protein</span>
                  <span>{d.nutrition.proteinG} / {d.nutrition.targetProteinG} g</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#efe9e3] dark:bg-[#332a24] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (d.nutrition.proteinG / Math.max(1, d.nutrition.targetProteinG)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Workouts Card */}
          <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1d140d] dark:text-[#fbf9f7]">Workout History</h2>
              <Link href="/workouts" className="text-xs font-semibold text-[#ff7043] hover:underline">
                View All →
              </Link>
            </div>
            <p className="text-xs text-[#8c7460] mb-3">
              {d.workouts.sessions} total training sessions completed.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fbf9f7] dark:bg-[#201914] border border-[#efe9e3] dark:border-[#332a24]">
              <div>
                <span className="text-xs text-[#8c7460]">Recent Duration</span>
                <p className="text-sm font-bold text-[#1d140d] dark:text-[#fbf9f7]">{d.workouts.totalMinutes} Active Minutes</p>
              </div>
              <Link
                href="/workouts"
                className="text-xs px-3 py-1.5 rounded-lg bg-[#ff7043] text-white font-semibold hover:bg-[#f4511e]"
              >
                Start Workout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
