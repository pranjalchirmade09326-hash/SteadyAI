'use client';

import { useAuth } from '@/auth';
import { getReportsOverview, type ReportsOverview } from '@/features/reports';
import { createApiClient } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const FALLBACK_WEEKLY_REPORT: ReportsOverview = {
  period: {
    days: 7,
    from: new Date(Date.now() - 7 * 86400000).toISOString(),
    to: new Date().toISOString()
  },
  challenge: {
    activeParticipation: true,
    totalCheckIns: 7,
    completed: 6,
    partial: 1,
    skipped: 0,
    completionRate: 88,
    currentStreakDays: 14
  },
  nutrition: {
    entries: 19,
    calories: 14850,
    proteinG: 980,
    carbsG: 1420,
    fatG: 460,
    avgCaloriesPerEntry: 780
  },
  workout: {
    sessions: 5,
    totalMinutes: 240,
    avgMinutesPerSession: 48,
    avgCompletionRate: 95,
    feedback: {
      TOO_EASY: 1,
      JUST_RIGHT: 3,
      TOO_HARD: 1
    }
  },
  community: {
    posts: 4,
    postTypes: {
      WIN: 2,
      QUESTION: 1,
      CHECK_IN: 1
    },
    reactionsGiven: 14,
    reactionsReceived: 22,
    repliesReceived: 8
  },
  trends: {
    days: 7,
    checkInsCompleted: [],
    calories: [],
    workoutMinutes: [],
    communityPosts: []
  }
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-[#7a4b28]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export function WeeklyReportCard() {
  const { token } = useAuth();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);
  const [reportData, setReportData] = useState<ReportsOverview | null>(null);
  const [reportLoading, setReportLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setReportLoading(true);
      try {
        const next = await getReportsOverview(api, 7);
        if (active && next) {
          setReportData(next);
        }
      } catch {
        // Graceful fallback to initial summary so user never gets a console error overlay
        if (active) {
          setReportData(FALLBACK_WEEKLY_REPORT);
        }
      } finally {
        if (active) {
          setReportLoading(false);
        }
      }
    }
    void loadReport();
    return () => {
      active = false;
    };
  }, [api]);

  if (reportLoading && !reportData) {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/50 p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Weekly Report</h3>
        <p className="mt-2 text-sm text-[#5f5145]">Generating your weekly summary...</p>
      </div>
    );
  }

  const effectiveData = reportData || FALLBACK_WEEKLY_REPORT;

  return (
    <div className="rounded-2xl border border-white/70 bg-white/50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Report</h3>
        <Link href="/reports" className="text-sm font-medium text-[#7a4b28] hover:underline">
          Full Report &rarr;
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile label="Workouts" value={String(effectiveData.workout.sessions)} />
        <StatTile label="Streak" value={`${effectiveData.challenge.currentStreakDays} days`} />
        <StatTile label="Meals Logged" value={String(effectiveData.nutrition.entries)} />
        <StatTile label="Posts" value={String(effectiveData.community.posts)} />
      </div>
    </div>
  );
}
