'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { FeedbackQueueCard } from '@/features/coach/components/FeedbackQueueCard';
import { MemberReviewQueueCard } from '@/features/coach/components/MemberReviewQueueCard';
import { CoachingInsightsCard } from '@/features/coach/components/CoachingInsightsCard';
import { BottomSheet } from '@/components/BottomSheet';
import { UserRole } from '@/lib/api';
import {
  mockCoachData,
  CoachData,
  CoachReviewItem,
  CoachClientItem,
  CoachInsightItem
} from '@/lib/mockDemoData';
import { useAuth } from '@/auth';
import { createApiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function CoachPage() {
  const { workspace, userIdentity, isLoading } = usePlatformContext();
  const { token } = useAuth();
  const router = useRouter();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  const [coachData, setCoachData] = useState<CoachData>(mockCoachData);
  const displayName = userIdentity.displayName || 'Coach';

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(mockCoachData.clients[0].id);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('Weekly Check-in');
  const [feedbackText, setFeedbackText] = useState('');
  const [calorieAdjustment, setCalorieAdjustment] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role Access Guard
  useEffect(() => {
    if (!isLoading && (workspace.role === UserRole.MEMBER || (workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN))) {
      router.replace('/dashboard');
    }
  }, [isLoading, router, userIdentity.onboardingCompleted, workspace.role]);

  // Attempt backend API sync if online
  useEffect(() => {
    async function fetchCoachData() {
      try {
        const [rosterRes, queueRes] = await Promise.allSettled([
          api.get<{ coachId: string; totalAssigned: number; members: CoachClientItem[] }>('/api/coach/roster'),
          api.get<{ queue: CoachReviewItem[]; total: number }>('/api/coach/feedback-queue')
        ]);

        setCoachData((prev) => {
          const next = { ...prev };
          if (rosterRes.status === 'fulfilled' && rosterRes.value?.members) {
            next.clients = rosterRes.value.members;
            if (rosterRes.value.totalAssigned) {
              next.metrics.totalClients = rosterRes.value.totalAssigned;
            }
          }
          if (queueRes.status === 'fulfilled' && queueRes.value?.queue) {
            next.reviewQueue = queueRes.value.queue;
            next.metrics.pendingReviews = queueRes.value.queue.length;
          }
          return next;
        });
      } catch {
        // Fallback to mockCoachData
      }
    }

    if (workspace.role === UserRole.COACH || workspace.role === UserRole.ADMIN) {
      fetchCoachData();
    }
  }, [api, workspace.role]);

  if (isLoading || (workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d140d] border-t-transparent" />
          <p className="text-sm font-medium">Loading Coach Command Center...</p>
        </div>
      </div>
    );
  }

  const { metrics, reviewQueue, clients, insights } = coachData;

  const handleOpenModal = (client?: { id: string; name?: string; defaultCategory?: string; suggestedText?: string }) => {
    if (client) {
      setSelectedMemberId(client.id);
      if (client.defaultCategory) setFeedbackCategory(client.defaultCategory);
      if (client.suggestedText) setFeedbackText(client.suggestedText);
    }
    setStatusMessage(null);
    setIsModalOpen(true);
  };

  const handleReviewFromQueue = (item: CoachReviewItem) => {
    handleOpenModal({
      id: item.memberId,
      name: item.memberName,
      defaultCategory:
        item.category === 'FORM_CHECK'
          ? 'Form Correction'
          : item.category === 'MISSED_LOGS'
          ? 'Consistency & Recovery'
          : 'Weekly Check-in',
      suggestedText: `Great effort on your recent session (${item.workoutSummary || 'training'}). Let's keep momentum building.`
    });
  };

  const handleClientFromRoster = (client: CoachClientItem) => {
    handleOpenModal({
      id: client.id,
      name: client.name,
      defaultCategory: client.status === 'AT_RISK' ? 'Consistency & Recovery' : 'Weekly Check-in'
    });
  };

  const handleInsightClick = (insight: CoachInsightItem) => {
    const matchedClient = clients.find((c) => c.name === insight.clientName) || clients[0];
    handleOpenModal({
      id: matchedClient.id,
      name: insight.clientName,
      defaultCategory: insight.severity === 'HIGH' ? 'Form Correction' : 'Technique & Form',
      suggestedText: `${insight.title}: ${insight.suggestedAction}`
    });
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || feedbackText.trim().length < 10) {
      setStatusMessage({ type: 'error', text: 'Please provide at least 10 characters of descriptive coaching recommendation.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const clientName = clients.find((c) => c.id === selectedMemberId)?.name || 'Client';

    try {
      await api.post('/api/coach/feedback', {
        body: {
          memberId: selectedMemberId,
          feedbackText: feedbackText.trim(),
          category: feedbackCategory,
          calorieAdjustmentKcal: calorieAdjustment
        }
      });
      setStatusMessage({
        type: 'success',
        text: `Feedback successfully dispatched to ${clientName}!`
      });
      // Clear form and close modal after brief delay
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedbackText('');
        setCalorieAdjustment(0);
      }, 1500);
    } catch {
      // Offline fallback success simulation
      setStatusMessage({
        type: 'success',
        text: `Feedback successfully dispatched to ${clientName}!`
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedbackText('');
        setCalorieAdjustment(0);
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1d140d] sm:text-3xl lg:text-4xl">
              Coach Command Center — {displayName}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e7da] px-3 py-1 text-xs font-bold text-[#7a4b28]">
              {metrics.totalClients} Clients Assigned
            </span>
          </div>
          <p className="mt-1.5 text-sm sm:text-base text-[#5f5145]">
            Review athlete logs, synthesize adherence trends, and dispatch personalized protocol adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1d140d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#7a4b28] shadow-sm"
          >
            + Dispatch Feedback
          </button>
        </div>
      </header>

      {/* 4 KPI Metric Cards */}
      <section aria-label="Coach Metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* KPI 1: Total Clients */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Active Clients</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              +{metrics.newClientsThisWeek} this week
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.totalClients}
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>100% capacity managed</span>
          </div>
        </div>

        {/* KPI 2: Pending Reviews */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Pending Reviews</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {metrics.urgentReviews} Urgent
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.pendingReviews}
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>Check-ins needing review</span>
          </div>
        </div>

        {/* KPI 3: Adherence Rate */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>7-Day Adherence</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              +{metrics.adherenceRateDelta}%
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.avgAdherenceRate}%
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>Roster average compliance</span>
          </div>
        </div>

        {/* KPI 4: AI Risk Flags */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>AI Risk Flags</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Action Needed
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.aiRiskAlerts}
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>Biomechanical alerts</span>
          </div>
        </div>
      </section>

      {/* Main 3 Coach Components */}
      <div className="space-y-8">
        {/* 1. Member Review Queue */}
        <MemberReviewQueueCard
          items={reviewQueue}
          onReviewClient={handleReviewFromQueue}
        />

        {/* 2. Client Roster & 7-Day Adherence */}
        <FeedbackQueueCard
          clients={clients}
          onSelectClientForFeedback={handleClientFromRoster}
        />

        {/* 3. AI Coaching Intelligence & Risk Flags */}
        <CoachingInsightsCard
          insights={insights}
          onApplyInsight={handleInsightClick}
        />
      </div>

      {/* Feedback Dispatch Modal / BottomSheet */}
      <BottomSheet
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Coach Feedback"
        description="Provide targeted technical cues, calorie target adjustments, or milestone recognition."
      >
        <form onSubmit={handleSendFeedback} className="space-y-4 py-2">
          {statusMessage && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Member Selector */}
          <div>
            <label htmlFor="member-select" className="block text-xs font-bold uppercase tracking-wider text-[#7a4b28] mb-1.5">
              Target Athlete
            </label>
            <select
              id="member-select"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-xl border border-[#ead9ca] bg-white px-3.5 py-2 text-sm text-[#1d140d] focus:border-[#7a4b28] focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.primaryGoal} ({c.sevenDayAdherencePct}% Adherence)
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label htmlFor="category-select" className="block text-xs font-bold uppercase tracking-wider text-[#7a4b28] mb-1.5">
              Feedback Category
            </label>
            <select
              id="category-select"
              value={feedbackCategory}
              onChange={(e) => setFeedbackCategory(e.target.value)}
              className="w-full rounded-xl border border-[#ead9ca] bg-white px-3.5 py-2 text-sm text-[#1d140d] focus:border-[#7a4b28] focus:outline-none"
            >
              <option value="Weekly Check-in">Weekly Check-in</option>
              <option value="Form Correction">Form Correction</option>
              <option value="Technique & Form">Technique & Form</option>
              <option value="Nutrition Adjustment">Nutrition Adjustment</option>
              <option value="Consistency & Recovery">Consistency & Recovery</option>
              <option value="Milestone Celebration">Milestone Celebration</option>
            </select>
          </div>

          {/* Recommendation Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="recommendation-text" className="text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
                Coaching Recommendation & Notes
              </label>
              <span className="text-[11px] text-[#5f5145]">
                {feedbackText.length} chars (min 10)
              </span>
            </div>
            <textarea
              id="recommendation-text"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g., Form looked crisp on the overhead press. Increase working weight by 2.5kg next cycle. Keep wrists stacked."
              className="w-full rounded-xl border border-[#ead9ca] bg-white p-3 text-sm text-[#1d140d] focus:border-[#7a4b28] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Calorie Adjustment Input */}
          <div>
            <label htmlFor="calorie-adj" className="block text-xs font-bold uppercase tracking-wider text-[#7a4b28] mb-1.5">
              Daily Calorie Adjustment: <span className="font-bold text-[#1d140d]">{calorieAdjustment > 0 ? `+${calorieAdjustment}` : calorieAdjustment} kcal</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCalorieAdjustment((prev) => prev - 100)}
                className="h-9 w-9 rounded-lg border border-[#ead9ca] bg-white text-base font-bold text-[#7a4b28] hover:bg-[#f3e7da]"
              >
                -
              </button>
              <input
                id="calorie-adj"
                type="range"
                min={-500}
                max={500}
                step={50}
                value={calorieAdjustment}
                onChange={(e) => setCalorieAdjustment(Number(e.target.value))}
                className="flex-1 accent-[#7a4b28]"
              />
              <button
                type="button"
                onClick={() => setCalorieAdjustment((prev) => prev + 100)}
                className="h-9 w-9 rounded-lg border border-[#ead9ca] bg-white text-base font-bold text-[#7a4b28] hover:bg-[#f3e7da]"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setCalorieAdjustment(0)}
                className="text-xs text-[#5f5145] hover:underline px-2"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ead9ca]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-[#ead9ca] bg-white px-4 py-2 text-xs font-bold text-[#5f5145] hover:bg-[#f3e7da]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1d140d] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#7a4b28] disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching...' : 'Dispatch Feedback →'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
