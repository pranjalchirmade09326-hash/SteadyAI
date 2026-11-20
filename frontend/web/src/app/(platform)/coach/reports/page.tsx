'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { UserRole } from '@/lib/api';
import { mockCoachData, CoachClientItem } from '@/lib/mockDemoData';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

export default function CoachReportsPage() {
  const { workspace, isLoading } = usePlatformContext();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ON_TRACK' | 'NEEDS_REVIEW' | 'AT_RISK'>('ALL');
  const [selectedClient, setSelectedClient] = useState<CoachClientItem | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Role Access Guard
  useEffect(() => {
    if (!isLoading && workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN) {
      router.replace('/dashboard');
    }
  }, [isLoading, router, workspace.role]);

  const filteredClients = useMemo(() => {
    return mockCoachData.clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.primaryGoal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filterStatus]);

  if (isLoading || (workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d140d] border-t-transparent" />
          <p className="text-sm font-medium">Loading Clinical Reports...</p>
        </div>
      </div>
    );
  }

  const handleExportSummary = (clientName: string) => {
    setExportNotice(`Clinical Progress PDF for ${clientName} generated & downloaded successfully.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9e8a7b]">
            <Link href="/coach" className="hover:text-[#1d140d] transition">
              Doctor Workspace
            </Link>
            <span>/</span>
            <span className="text-amber-800 dark:text-amber-400">Clinical Reports</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1d140d] dark:text-white sm:text-3xl">
            Client Progress &amp; Adherence Reports
          </h1>
          <p className="text-sm text-[#7a6858] dark:text-[#c4b5a5]">
            Review longitudinal patient adherence, caloric consistency, metabolic recovery, and export clinical summaries.
          </p>
        </div>

        <Link
          href="/coach"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#d8c4b3] bg-white px-4 py-2 text-xs font-bold text-[#1d140d] shadow-sm hover:bg-[#fbf8f5] transition"
        >
          ← Back to Command Center
        </Link>
      </div>

      {exportNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          ✓ {exportNotice}
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Average Adherence</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1d140d] dark:text-white">{mockCoachData.metrics.avgAdherenceRate}%</span>
            <span className="text-xs font-bold text-emerald-600">+{mockCoachData.metrics.adherenceRateDelta}%</span>
          </div>
          <p className="text-[11px] text-[#9e8a7b]">7-day cohort average</p>
        </div>

        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Active Patients</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1d140d] dark:text-white">{mockCoachData.metrics.totalClients}</span>
            <span className="text-xs font-bold text-amber-700">+{mockCoachData.metrics.newClientsThisWeek} new</span>
          </div>
          <p className="text-[11px] text-[#9e8a7b]">Monitored clinical roster</p>
        </div>

        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">Action Required</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{mockCoachData.metrics.pendingReviews}</span>
            <span className="text-xs font-bold text-red-600">{mockCoachData.metrics.urgentReviews} urgent</span>
          </div>
          <p className="text-[11px] text-[#9e8a7b]">Check-ins awaiting sign-off</p>
        </div>

        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a7667]">AI Risk Alerts</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{mockCoachData.metrics.aiRiskAlerts}</span>
            <span className="text-xs font-bold text-purple-600">Active</span>
          </div>
          <p className="text-[11px] text-[#9e8a7b]">Biometric anomaly alerts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search patient by name or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#d8c4b3] bg-[#fbf8f5] px-3.5 py-2 text-xs font-medium text-[#1d140d] placeholder:text-[#9e8a7b] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ON_TRACK', 'NEEDS_REVIEW', 'AT_RISK'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterStatus === status
                  ? 'bg-[#1d140d] text-white shadow-sm'
                  : 'bg-[#f5ebe0] text-[#5f5145] hover:bg-[#ead9ca]'
              }`}
            >
              {status === 'ALL' ? 'All Patients' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Progress Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e8d7c6] bg-white shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
        <div className="border-b border-[#e8d7c6] px-5 py-3.5 dark:border-[#38271e]">
          <h2 className="text-sm font-bold text-[#1d140d] dark:text-white">
            Monitored Patients ({filteredClients.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e8d7c6]/60 bg-[#fbf8f5] text-[11px] font-bold uppercase tracking-wider text-[#8a7667] dark:bg-[#15100c] dark:border-[#38271e]">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Clinical Goal</th>
                <th className="px-5 py-3">7-Day Adherence</th>
                <th className="px-5 py-3">Daily Calorie Target</th>
                <th className="px-5 py-3">Streak</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8d7c6]/60 dark:divide-[#38271e]">
              {filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <tr
                    key={client.id}
                    className={`hover:bg-[#fbf8f5] dark:hover:bg-[#201813] transition ${
                      isSelected ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d140d] text-[11px] font-black text-white dark:bg-[#f3c99f] dark:text-[#1d140d]">
                          {client.initials}
                        </div>
                        <div>
                          <p className="font-bold text-[#1d140d] dark:text-white">{client.name}</p>
                          <p className="text-[11px] text-[#9e8a7b]">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#4e4035] dark:text-[#c4b5a5]">
                      {client.primaryGoal}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-[#ead9ca] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              client.sevenDayAdherencePct >= 90
                                ? 'bg-emerald-500'
                                : client.sevenDayAdherencePct >= 75
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${client.sevenDayAdherencePct}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#1d140d] dark:text-white">
                          {client.sevenDayAdherencePct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#1d140d] dark:text-white">
                      {client.targetCalories} kcal
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f5ebe0] px-2 py-0.5 font-bold text-[#7a4b28] text-[11px]">
                        🔥 {client.currentStreakDays}d
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          client.status === 'ON_TRACK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : client.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {client.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedClient(isSelected ? null : client)}
                          className="rounded-lg border border-[#d8c4b3] px-2.5 py-1 font-semibold text-[#1d140d] hover:bg-[#ede0d4]/50 transition"
                        >
                          {isSelected ? 'Close' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportSummary(client.name)}
                          className="rounded-lg bg-[#1d140d] px-2.5 py-1 font-bold text-white hover:bg-[#342417] transition dark:bg-[#f3c99f] dark:text-[#1d140d]"
                        >
                          Export PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Client Detailed Breakdown Drawer */}
      {selectedClient && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 animate-in fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d140d] font-black text-white">
                {selectedClient.initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d140d] dark:text-white">
                  {selectedClient.name} — Detailed Clinical Progress File
                </h3>
                <p className="text-xs text-[#7a6858]">
                  Goal: {selectedClient.primaryGoal} • Last active {selectedClient.lastActive}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/coach"
                className="rounded-xl bg-amber-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-900 transition"
              >
                Send Prescription / Feedback →
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e8d7c6] bg-white p-3 dark:border-[#38271e] dark:bg-[#1a1410]">
              <span className="text-[11px] font-bold text-[#8a7667]">CALORIC TARGET</span>
              <p className="text-lg font-black text-[#1d140d] dark:text-white">{selectedClient.targetCalories} kcal/day</p>
              <p className="text-[11px] text-emerald-600">Stable compliance (±5%)</p>
            </div>
            <div className="rounded-xl border border-[#e8d7c6] bg-white p-3 dark:border-[#38271e] dark:bg-[#1a1410]">
              <span className="text-[11px] font-bold text-[#8a7667]">RECORDED NOTES</span>
              <p className="text-lg font-black text-[#1d140d] dark:text-white">{selectedClient.notesCount} Clinical Entries</p>
              <p className="text-[11px] text-[#7a6858]">Form checks &amp; diet reviews</p>
            </div>
            <div className="rounded-xl border border-[#e8d7c6] bg-white p-3 dark:border-[#38271e] dark:bg-[#1a1410]">
              <span className="text-[11px] font-bold text-[#8a7667]">AI COPILOT ASSESSMENT</span>
              <p className="text-xs font-bold text-emerald-700 mt-1">✓ Steady positive adaptation</p>
              <p className="text-[11px] text-[#7a6858]">No acute fatigue or joint inflammation reported</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
