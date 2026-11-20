'use client';

import { useState } from 'react';
import { mockCoachData, CoachClientItem } from '@/lib/mockDemoData';

interface FeedbackQueueCardProps {
  onSelectClientForFeedback?: (client: CoachClientItem) => void;
  clients?: CoachClientItem[];
}

export function FeedbackQueueCard({
  onSelectClientForFeedback,
  clients = mockCoachData.clients
}: FeedbackQueueCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_TRACK' | 'NEEDS_REVIEW' | 'AT_RISK'>('ALL');

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primaryGoal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: CoachClientItem['status']) => {
    switch (status) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ON TRACK
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            NEEDS REVIEW
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            AT RISK
          </span>
        );
    }
  };

  const getAdherenceBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <section aria-labelledby="client-roster-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="client-roster-heading" className="text-xl font-bold text-[#1d140d]">
              Active Client Roster & Adherence
            </h3>
            <span className="rounded-full bg-[#f3e7da] px-2.5 py-0.5 text-xs font-bold text-[#7a4b28]">
              {clients.length} Total Athletes
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5f5145]">
            Real-time compliance monitoring, 7-day adherence scoring, and direct coach feedback triggers.
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Search athlete or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-[#ead9ca] px-3.5 py-1.5 text-xs text-[#1d140d] focus:border-[#7a4b28] focus:outline-none"
          />
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'ON_TRACK', 'NEEDS_REVIEW', 'AT_RISK'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#1d140d] text-white'
                    : 'bg-[#f3e7da] text-[#7a4b28] hover:bg-[#ead9ca]'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ON_TRACK' ? 'On Track' : st === 'NEEDS_REVIEW' ? 'Needs Review' : 'At Risk'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Table with smooth horizontal scroll for mobile */}
      <div className="overflow-x-auto rounded-xl border border-[#ead9ca]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fffaf5] border-b border-[#ead9ca] text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <tr>
              <th className="p-3.5">Athlete</th>
              <th className="p-3.5">Primary Goal</th>
              <th className="p-3.5 min-w-[170px]">7-Day Adherence</th>
              <th className="p-3.5">Target / Streak</th>
              <th className="p-3.5">Last Log</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ead9ca]/60">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-[#fffaf5]/80 transition group">
                {/* Athlete identity */}
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3e7da] text-xs font-bold text-[#7a4b28]">
                      {client.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#1d140d]">{client.name}</div>
                      <div className="text-xs text-[#5f5145]">{client.email}</div>
                    </div>
                  </div>
                </td>

                {/* Goal */}
                <td className="p-3.5 text-xs text-[#4e4035] font-medium">{client.primaryGoal}</td>

                {/* 7-Day Adherence Bar */}
                <td className="p-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#1d140d]">{client.sevenDayAdherencePct}%</span>
                      <span className="text-[11px] text-[#5f5145]">7-Day Score</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3e7da]">
                      <div
                        style={{ width: `${client.sevenDayAdherencePct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${getAdherenceBarColor(
                          client.sevenDayAdherencePct
                        )}`}
                      />
                    </div>
                  </div>
                </td>

                {/* Target & Streak */}
                <td className="p-3.5 text-xs text-[#5f5145]">
                  <div className="font-medium text-[#1d140d]">{client.targetCalories.toLocaleString()} kcal</div>
                  <div className="text-[11px] text-[#7a4b28] font-bold">🔥 {client.currentStreakDays}-day streak</div>
                </td>

                {/* Last active */}
                <td className="p-3.5 text-xs text-[#5f5145]">{client.lastActive}</td>

                {/* Status pill */}
                <td className="p-3.5">{getStatusPill(client.status)}</td>

                {/* Action button */}
                <td className="p-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectClientForFeedback && onSelectClientForFeedback(client)}
                    className="inline-flex items-center rounded-lg border border-[#ead9ca] bg-white px-3 py-1.5 text-xs font-bold text-[#7a4b28] transition hover:bg-[#1d140d] hover:text-white shadow-sm"
                  >
                    Feedback
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClients.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#ead9ca] p-6 text-center text-xs text-[#5f5145] mt-4">
          No athletes matched the selected search or status criteria.
        </div>
      )}
    </section>
  );
}
