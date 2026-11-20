'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { useAuth } from '@/auth';
import { createApiClient, UserRole } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AssignedMember {
  id: string;
  name: string;
  email: string;
  primaryGoal: string;
  currentStreak: number;
  adherenceRate: number;
  lastCheckInDate: string | null;
  lastCheckInStatus: string;
  pendingFeedbackCount: number;
}

interface FeedbackQueueItem {
  id: string;
  memberId: string;
  memberName: string;
  topic: string;
  context: string | null;
  preferredOutcome: string | null;
  status: string;
  createdAt: string;
}

interface CoachMetrics {
  totalClients: number;
  activeClients: number;
  adherenceRate: number;
  pendingReviews: number;
}

export default function CoachDashboardPage() {
  const { workspace, isLoading: platformLoading } = usePlatformContext();
  const { token } = useAuth();
  const router = useRouter();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackQueueItem[]>([]);
  const [metrics, setMetrics] = useState<CoachMetrics>({
    totalClients: 0,
    activeClients: 0,
    adherenceRate: 1.0,
    pendingReviews: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Response form state for feedback
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // RBAC Access Guard: Only COACH or ADMIN can view this page
  useEffect(() => {
    if (!platformLoading && workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN) {
      router.replace('/app');
    }
  }, [platformLoading, router, workspace.role]);

  const loadCoachDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rosterRes, queueRes, metricsRes] = await Promise.allSettled([
        api.get<{ coachId: string; totalAssigned: number; members: AssignedMember[] }>('/api/coach/roster'),
        api.get<{ total: number; queue: FeedbackQueueItem[] }>('/api/coach/feedback-queue'),
        api.get<CoachMetrics>('/api/coach/metrics')
      ]);

      if (rosterRes.status === 'fulfilled' && rosterRes.value?.members) {
        setMembers(rosterRes.value.members);
      }
      if (queueRes.status === 'fulfilled' && queueRes.value?.queue) {
        setFeedbackQueue(queueRes.value.queue);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value);
      }
    } catch (err) {
      const errorObj = err as Error;
      console.warn('Error loading coach dashboard:', errorObj);
      setError(errorObj?.message || 'Failed to load coach metrics');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (workspace.role === UserRole.COACH || workspace.role === UserRole.ADMIN) {
      loadCoachDashboardData();
    }
  }, [loadCoachDashboardData, workspace.role]);

  const handleSendFeedbackReply = async (feedbackRequestId: string) => {
    if (!replyText.trim()) return;
    try {
      setIsSubmittingReply(true);
      await api.post('/api/coach/feedback', {
        body: {
          feedbackRequestId,
          reply: replyText
        }
      });
      setFeedbackSuccess('Feedback response sent successfully!');
      setActiveReplyId(null);
      setReplyText('');
      setTimeout(() => setFeedbackSuccess(null), 4000);
      await loadCoachDashboardData();
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj?.message || 'Failed to send feedback reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (platformLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff7043] border-t-transparent" />
          <p className="text-sm font-medium">Loading Coach Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#ff7043]">Coach Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d140d] dark:text-[#fbf9f7]">
            Coach Command Center
          </h1>
          <p className="text-sm text-[#8c7460] dark:text-[#c4b5a8]">
            Manage client roster, review pending member check-in inquiries, and monitor adherence.
          </p>
        </div>

        <button
          onClick={loadCoachDashboardData}
          className="self-start sm:self-auto rounded-xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] px-4 py-2 text-xs font-semibold text-[#1d140d] dark:text-[#fbf9f7] hover:bg-[#fbf9f7] shadow-xs"
        >
          ↻ Refresh Roster
        </button>
      </div>

      {feedbackSuccess && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          {feedbackSuccess}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* Engagement Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Total Assigned Clients</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1d140d] dark:text-[#fbf9f7]">{metrics.totalClients}</span>
            <span className="text-sm font-semibold text-[#8c7460]">athletes</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Active client roster size</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Active Clients</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{metrics.activeClients}</span>
            <span className="text-sm font-semibold text-[#8c7460]">active</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Engaged in last 7 days</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Client Adherence Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#ff7043]">{Math.round(metrics.adherenceRate * 100)}%</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Habit and workout consistency</p>
        </div>

        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-5 shadow-xs">
          <span className="text-xs font-medium text-[#8c7460] dark:text-[#a89689]">Pending Feedback Reviews</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{metrics.pendingReviews}</span>
            <span className="text-sm font-semibold text-[#8c7460]">requests</span>
          </div>
          <p className="mt-1 text-xs text-[#8c7460]">Awaiting coach attention</p>
        </div>
      </div>

      {/* Main Sections: Client Roster & Feedback Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Roster List (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7]">Client Roster Overview</h2>
              <p className="text-xs text-[#8c7460]">Assigned members under your direct clinical oversight.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ff7043]/10 text-[#ff7043]">
              {members.length} Members
            </span>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12 text-[#8c7460]">
              <p className="text-sm font-medium">No members assigned yet.</p>
              <p className="text-xs mt-1">When members join your roster, their progress reports will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#efe9e3] dark:border-[#332a24] text-xs font-semibold uppercase text-[#8c7460]">
                    <th className="pb-3">Member</th>
                    <th className="pb-3">Goal</th>
                    <th className="pb-3">Streak</th>
                    <th className="pb-3">Adherence</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe9e3] dark:divide-[#332a24]">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-[#fbf9f7] dark:hover:bg-[#201914] transition">
                      <td className="py-3">
                        <div className="font-semibold text-[#1d140d] dark:text-[#fbf9f7]">{m.name}</div>
                        <div className="text-xs text-[#8c7460]">{m.email}</div>
                      </td>
                      <td className="py-3 text-xs text-[#8c7460]">{m.primaryGoal}</td>
                      <td className="py-3">
                        <span className="font-bold text-[#ff7043]">{m.currentStreak}</span> days
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(m.adherenceRate * 100)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/coach/members/${m.id}/reports`}
                          className="rounded-lg bg-[#ff7043]/10 px-3 py-1.5 text-xs font-bold text-[#ff7043] hover:bg-[#ff7043] hover:text-white transition"
                        >
                          View Reports →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Feedback Queue (1 Col) */}
        <div className="rounded-2xl border border-[#efe9e3] dark:border-[#332a24] bg-white dark:bg-[#1a1410] p-6 shadow-xs flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1d140d] dark:text-[#fbf9f7]">Pending Feedback Queue</h2>
            <p className="text-xs text-[#8c7460]">Inquiries submitted by assigned members.</p>
          </div>

          {feedbackQueue.length === 0 ? (
            <div className="text-center py-8 text-[#8c7460] text-xs">
              ✓ All feedback requests cleared! No pending inquiries.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {feedbackQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#efe9e3] dark:border-[#332a24] p-4 bg-[#fbf9f7] dark:bg-[#201914] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d140d] dark:text-[#fbf9f7]">{item.memberName}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1d140d] dark:text-[#fbf9f7]">{item.topic}</p>
                  {item.context && <p className="text-xs text-[#8c7460] line-clamp-2">{item.context}</p>}

                  {activeReplyId === item.id ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write feedback for member..."
                        rows={3}
                        className="w-full text-xs rounded-lg border border-[#efe9e3] dark:border-[#332a24] p-2 bg-white dark:bg-[#1a1410] text-[#1d140d] dark:text-[#fbf9f7] focus:outline-none focus:ring-1 focus:ring-[#ff7043]"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                          className="px-2.5 py-1 text-xs text-[#8c7460] hover:text-[#1d140d]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendFeedbackReply(item.id)}
                          disabled={isSubmittingReply || !replyText.trim()}
                          className="rounded-lg bg-[#ff7043] px-3 py-1 text-xs font-bold text-white hover:bg-[#f4511e] disabled:opacity-50"
                        >
                          {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActiveReplyId(item.id); setReplyText(''); }}
                      className="mt-1 self-start rounded-lg bg-white dark:bg-[#1a1410] border border-[#efe9e3] dark:border-[#332a24] px-3 py-1 text-xs font-semibold text-[#1d140d] dark:text-[#fbf9f7] hover:border-[#ff7043]"
                    >
                      Reply to Client →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
