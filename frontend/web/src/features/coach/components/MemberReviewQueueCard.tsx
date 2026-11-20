'use client';

import { useState } from 'react';
import { mockCoachData, CoachReviewItem } from '@/lib/mockDemoData';

interface MemberReviewQueueCardProps {
  onReviewClient?: (item: CoachReviewItem) => void;
  items?: CoachReviewItem[];
}

export function MemberReviewQueueCard({ onReviewClient, items = mockCoachData.reviewQueue }: MemberReviewQueueCardProps) {
  const [filter, setFilter] = useState<'ALL' | 'WEEKLY_CHECKIN' | 'FORM_CHECK' | 'MISSED_LOGS'>('ALL');
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const filteredItems = items.filter((item) => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'WEEKLY_CHECKIN':
        return <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-600/20">Weekly Check-in</span>;
      case 'FORM_CHECK':
        return <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 ring-1 ring-purple-600/20">Form Check Video</span>;
      case 'MISSED_LOGS':
        return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20">Missed Logs Alert</span>;
      default:
        return <span className="rounded-full bg-[#f3e7da] px-2.5 py-0.5 text-xs font-bold text-[#7a4b28]">{category}</span>;
    }
  };

  const handleReviewClick = (item: CoachReviewItem) => {
    if (onReviewClient) {
      onReviewClient(item);
    } else {
      setReviewedIds((prev) => new Set(prev).add(item.id));
    }
  };

  return (
    <section aria-labelledby="review-queue-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="review-queue-heading" className="text-xl font-bold text-[#1d140d]">
              Member Review Queue
            </h3>
            <span className="rounded-full bg-[#f3e7da] px-2.5 py-0.5 text-xs font-bold text-[#7a4b28]">
              {items.length} Pending
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5f5145]">
            Athlete check-ins, exercise form assessments, and compliance alerts needing coach attention.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'WEEKLY_CHECKIN', 'FORM_CHECK', 'MISSED_LOGS'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#1d140d] text-white'
                  : 'bg-[#f3e7da] text-[#7a4b28] hover:bg-[#ead9ca]'
              }`}
            >
              {cat === 'ALL' ? 'All Reviews' : cat === 'WEEKLY_CHECKIN' ? 'Check-ins' : cat === 'FORM_CHECK' ? 'Form Checks' : 'Missed Logs'}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ead9ca] p-8 text-center text-sm text-[#5f5145]">
          No pending reviews found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isReviewed = reviewedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#ead9ca] bg-[#fffaf5] p-4 sm:p-5 transition hover:border-[#7a4b28]/40 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1d140d] text-sm font-bold text-white shadow-sm">
                      {item.avatarInitials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-[#1d140d]">{item.memberName}</h4>
                        {getCategoryBadge(item.category)}
                        <span className="text-xs text-[#7a4b28] font-medium">{item.submittedAt}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#4e4035] leading-relaxed italic bg-white/70 p-3 rounded-lg border border-[#f0e2d5]">
                        &ldquo;{item.summary}&rdquo;
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[#5f5145]">
                        {item.workoutSummary && (
                          <span className="flex items-center gap-1 font-medium">
                            <span className="font-bold text-[#1d140d]">Workout:</span> {item.workoutSummary}
                          </span>
                        )}
                        {item.nutritionAdherencePct !== undefined && (
                          <span className="flex items-center gap-1 font-medium">
                            <span className="font-bold text-[#1d140d]">Nutrition Adherence:</span>{' '}
                            <span className={item.nutritionAdherencePct >= 90 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                              {item.nutritionAdherencePct}%
                            </span>
                          </span>
                        )}
                        {item.rpeScore !== undefined && (
                          <span className="flex items-center gap-1 font-medium">
                            <span className="font-bold text-[#1d140d]">Reported RPE:</span> {item.rpeScore}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReviewClick(item)}
                      disabled={isReviewed}
                      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                        isReviewed
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-[#1d140d] text-white hover:bg-[#7a4b28]'
                      }`}
                    >
                      {isReviewed ? '✓ Feedback Dispatched' : 'Review & Dispatch Feedback'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
