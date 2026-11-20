'use client';

import { mockCoachData, CoachInsightItem } from '@/lib/mockDemoData';

interface CoachingInsightsCardProps {
  insights?: CoachInsightItem[];
  onApplyInsight?: (insight: CoachInsightItem) => void;
}

export function CoachingInsightsCard({
  insights = mockCoachData.insights,
  onApplyInsight
}: CoachingInsightsCardProps) {
  const getSeverityBadge = (severity: CoachInsightItem['severity']) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            MEDIUM PRIORITY
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            MILESTONE
          </span>
        );
    }
  };

  return (
    <section aria-labelledby="coaching-insights-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="coaching-insights-heading" className="text-xl font-bold text-[#1d140d]">
              AI Coaching Intelligence & Risk Flags
            </h3>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
              {insights.length} Alerts
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5f5145]">
            Synthesized biomechanical fatigue markers, benchmark milestones, and anomaly alerts across client logs.
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs font-semibold text-[#7a4b28] bg-[#f3e7da] px-3 py-1 rounded-full">
          Agent: coaching-synthesis
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col justify-between rounded-xl border border-[#ead9ca] bg-[#fffaf5] p-5 transition hover:border-[#7a4b28]/50 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                {getSeverityBadge(insight.severity)}
                <span className="text-[11px] text-[#7a4b28] font-medium">{insight.timestamp}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-[#1d140d] px-2 py-0.5 text-xs font-bold text-white">
                  {insight.clientName}
                </span>
                <h4 className="text-sm font-bold text-[#1d140d]">{insight.title}</h4>
              </div>

              <p className="text-xs text-[#5f5145] leading-relaxed mb-4">
                {insight.description}
              </p>

              {/* Suggested Action Box */}
              <div className="rounded-lg bg-white p-3 border border-[#ead9ca] mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a4b28] mb-1">
                  Suggested Action
                </p>
                <p className="text-xs font-medium text-[#1d140d] leading-snug">
                  {insight.suggestedAction}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onApplyInsight && onApplyInsight(insight)}
              className="w-full rounded-xl bg-[#f3e7da] px-3.5 py-2 text-xs font-bold text-[#7a4b28] transition hover:bg-[#1d140d] hover:text-white"
            >
              Draft Targeted Feedback →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
