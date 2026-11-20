'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { useAuth } from '@/auth';
import { createApiClient, UserRole } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface MemberReportData {
  member: {
    id: string;
    name: string;
    email: string;
    primaryGoal: string;
  };
  healthRecords: Array<{
    id: string;
    type: string;
    value: number;
    unit: string;
    startTime: string;
    endTime: string | null;
    metadata?: Record<string, unknown>;
  }>;
  workoutHistory: Array<{
    id: string;
    durationMinutes: number;
    startTime: string;
    endTime: string | null;
    metadata?: Record<string, unknown>;
  }>;
  nutritionOverview: Array<{
    id: string;
    totalCalories: number;
    totalProteinG: number;
    totalCarbsG: number;
    totalFatG: number;
    consumedAt: string;
    rawText?: string;
  }>;
  checkInHistory: Array<{
    id: string;
    checkInDate: string;
    participationStatus: string;
    notes?: string;
  }>;
  engagementSummary: {
    streakDays: number;
    totalCheckIns: number;
    adherenceRate: number;
  };
}

export default function MemberReportsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.id as string;

  const { workspace, isLoading: platformLoading } = usePlatformContext();
  const { token } = useAuth();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  const [report, setReport] = useState<MemberReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // RBAC Access Guard: Must be COACH or ADMIN
  useEffect(() => {
    if (!platformLoading && workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN) {
      router.replace('/app');
    }
  }, [platformLoading, router, workspace.role]);

  useEffect(() => {
    if (!memberId) return;

    async function fetchMemberReport() {
      try {
        setLoading(true);
        setAuthError(null);
        const res = await api.get<MemberReportData>(`/api/coach/members/${memberId}/reports`);
        setReport(res);
      } catch (err) {
        const errorObj = err as { status?: number; message?: string };
        if (errorObj?.status === 403 || errorObj?.message?.includes('Forbidden') || errorObj?.message?.includes('not assigned')) {
          setAuthError('403 Forbidden: You are not authorized to view reports for this member because they are not assigned to your coaching roster.');
        } else {
          setAuthError(errorObj?.message || 'Failed to load member reports');
        }
      } finally {
        setLoading(false);
      }
    }

    if (workspace.role === UserRole.COACH || workspace.role === UserRole.ADMIN) {
      fetchMemberReport();
    }
  }, [api, memberId, workspace.role]);

  if (platformLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff7043] border-t-transparent" />
          <p className="text-sm font-medium">Loading Member Clinical Reports...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <Link href="/coach/dashboard" className="text-xs font-semibold text-[#ff7043] hover:underline">
          ← Back to Coach Dashboard
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-600 text-xl font-bold">
            !
          </div>
          <h2 className="mt-3 text-lg font-bold text-red-900 dark:text-red-200">Access Restricted</h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300 max-w-md mx-auto">{authError}</p>
          <div className="mt-4">
            <Link
              href="/coach/dashboard"
              className="rounded-xl bg-[#ff7043] px-4 py-2 text-xs font-bold text-white hover:bg-[#f4511e]"
            >
              Return to Assigned Roster
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-[#8c7460]">
        <p>No report data found for this member.</p>
        <Link href="/coach/dashboard" className="text-xs font-semibold text-[#ff7043] mt-2 inline-block">
          ← Back to Coach Dashboard
        </Link>
      </div>
    );
  }

  const { member, workoutHistory, nutritionOverview, checkInHistory, engagementSummary } = report;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-2">
        <Link href="/coach/dashboard" className="text-xs font-semibold text-[#ff7043] hover:underline flex items-center gap-1">
          ← Back to Coach Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff7043]">Individual Client Report</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d140d] dark:text-[#fbf9f7]">
              {member.name}
            </h1>
            <p className="text-sm text-[#8c7460] dark:text-[#c4b5a8]">
              {member.email} • Primary Goal: <strong className="text-[#1d140d] dark:text-[#fbf9f7]">{member.primaryGoal}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Engagement Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Active Streak</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#ff7043]">{engagementSummary.streakDays}</span>
            <span className="text-sm font-semibold text-[#8c7460]">days</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Continuous adherence streak</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Total Check-ins</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1d140d] dark:text-[#fbf9f7]">{engagementSummary.totalCheckIns}</span>
            <span className="text-sm font-semibold text-[#8c7460]">recorded</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Daily challenge submissions</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Adherence Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {Math.round(engagementSummary.adherenceRate * 100)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Overall consistency score</p>
        </div>
      </div>

      {/* Detailed Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout History */}
        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
          <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7] mb-1">Workout Session History</h2>
          <p className="text-xs text-[#8c7460] mb-4">Training sessions logged by member.</p>

          {workoutHistory.length === 0 ? (
            <p className="text-xs text-[#8c7460] italic py-4">No workout sessions logged yet.</p>
          ) : (
            <div className="divide-y divide-[#efe9e3] dark:divide-[#332a24]">
              {workoutHistory.map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[#1d140d] dark:text-[#fbf9f7]">
                      {(w.metadata?.name as string) || 'Workout Session'}
                    </span>
                    <p className="text-xs text-[#8c7460]">
                      {new Date(w.startTime).toLocaleDateString()} at {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ff7043]/10 text-[#ff7043]">
                    {w.durationMinutes} mins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition Overview */}
        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
          <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7] mb-1">Nutrition & Macro Logs</h2>
          <p className="text-xs text-[#8c7460] mb-4">Logged meals, caloric intake, and protein breakdown.</p>

          {nutritionOverview.length === 0 ? (
            <p className="text-xs text-[#8c7460] italic py-4">No nutrition logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#efe9e3] dark:divide-[#332a24]">
              {nutritionOverview.map((n) => (
                <div key={n.id} className="py-3 flex items-center justify-between">
                  <div className="max-w-[65%]">
                    <p className="text-sm font-semibold text-[#1d140d] dark:text-[#fbf9f7] truncate">
                      {n.rawText || 'Logged meal'}
                    </p>
                    <span className="text-xs text-[#8c7460]">
                      {new Date(n.consumedAt).toLocaleDateString()} at {new Date(n.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#ff7043]">{n.totalCalories} kcal</span>
                    <div className="text-[10px] text-[#8c7460]">{n.totalProteinG}g protein</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Check-in History */}
      <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
        <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7] mb-1">Daily Check-in History</h2>
        <p className="text-xs text-[#8c7460] mb-4">Milestone accountability check-ins.</p>

        {checkInHistory.length === 0 ? (
          <p className="text-xs text-[#8c7460] italic py-4">No daily check-ins recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {checkInHistory.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-[#efe9e3] dark:border-[#332a24] bg-[#fbf9f7] dark:bg-[#201914] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8c7460]">
                    {new Date(c.checkInDate).toLocaleDateString()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.participationStatus === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {c.participationStatus}
                  </span>
                </div>
                {c.notes && <p className="text-xs text-[#1d140d] dark:text-[#fbf9f7] italic mt-1">{c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
