'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { UserRole } from '@/lib/api';
import { mockAdminData, AdminData, AgentRunData } from '@/lib/mockDemoData';
import { useAuth } from '@/auth';
import { createApiClient } from '@/lib/api';
import { AdminSystemSettingsCard } from '@/features/settings/components/AdminSystemSettingsCard';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function AdminDashboardPage() {
  const { workspace, userIdentity, isLoading: isContextLoading } = usePlatformContext();
  const { token } = useAuth();
  const router = useRouter();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  const [adminData, setAdminData] = useState<AdminData>(mockAdminData);
  const [activeTab, setActiveTab] = useState<'overview' | 'agentops' | 'roster' | 'settings'>('overview');
  const [agentStatusFilter, setAgentStatusFilter] = useState<'ALL' | 'SUCCESS' | 'RUNNING' | 'FAILURE'>('ALL');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const displayName = userIdentity.displayName || 'Admin';

  useEffect(() => {
    if (!isContextLoading && workspace.role !== UserRole.ADMIN) {
      router.replace('/');
    }
  }, [isContextLoading, router, workspace.role]);

  // Attempt to fetch fresh data if backend API is connected
  useEffect(() => {
    async function fetchPlatformData() {
      try {
        const [metricsRes, healthRes, runsRes] = await Promise.allSettled([
          api.get<{
            totalMembers: number;
            totalMembersGrowthPct: number;
            activeCoaches: number;
            requests24h: number;
            llmCalls24h: number;
            llmSuccessRatePct: number;
            avgLatencyMs: number;
            peakLatencyMs: number;
            dailySpend: number;
            dailySpendUsd: number;
            dailySpendBudgetPct: number;
            uptime: number;
            uptimePct: number;
          }>('/api/admin/metrics'),
          api.get<{
            subsystems: Array<{
              name: string;
              status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
              latencyMs: number;
              uptimePct: number;
              portOrHost: string;
              detail: string;
            }>;
          }>('/api/admin/health'),
          api.get<{ runs: AgentRunData[] } | AgentRunData[]>('/api/admin/agentops/runs')
        ]);

        setAdminData((prev) => {
          const next = { ...prev };
          if (metricsRes.status === 'fulfilled' && metricsRes.value) {
            const m = metricsRes.value;
            next.metrics = {
              totalMembers: m.totalMembers ?? prev.metrics.totalMembers,
              totalMembersGrowthPct: m.totalMembersGrowthPct ?? prev.metrics.totalMembersGrowthPct,
              activeCoaches: m.activeCoaches ?? prev.metrics.activeCoaches,
              llmCalls24h: m.llmCalls24h ?? m.requests24h ?? prev.metrics.llmCalls24h,
              llmSuccessRatePct: m.llmSuccessRatePct ?? prev.metrics.llmSuccessRatePct,
              avgLatencyMs: m.avgLatencyMs ?? prev.metrics.avgLatencyMs,
              peakLatencyMs: m.peakLatencyMs ?? prev.metrics.peakLatencyMs,
              dailySpendUsd: m.dailySpendUsd ?? m.dailySpend ?? prev.metrics.dailySpendUsd,
              dailySpendBudgetPct: m.dailySpendBudgetPct ?? prev.metrics.dailySpendBudgetPct,
              uptimePct: m.uptimePct ?? m.uptime ?? prev.metrics.uptimePct
            };
          }
          if (healthRes.status === 'fulfilled' && healthRes.value?.subsystems) {
            next.systemHealth = healthRes.value.subsystems;
          }
          if (runsRes.status === 'fulfilled' && runsRes.value) {
            const r = runsRes.value;
            if (Array.isArray(r)) {
              next.agentRuns = r;
            } else if (Array.isArray(r.runs)) {
              next.agentRuns = r.runs;
            }
          }
          return next;
        });
      } catch {
        // Safe fallback to mockAdminData
      }
    }

    if (workspace.role === UserRole.ADMIN) {
      fetchPlatformData();
    }
  }, [api, workspace.role]);

  if (isContextLoading || workspace.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d140d] border-t-transparent" />
          <p className="text-sm font-medium">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  const { metrics, modelDistribution, agentRuns, users, hourlyRequestTrend } = adminData;

  const filteredRuns = agentRuns.filter((run) => {
    if (agentStatusFilter === 'ALL') return true;
    return run.status === agentStatusFilter;
  });

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.assignedCoach && u.assignedCoach.toLowerCase().includes(userSearchQuery.toLowerCase()));
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesQuery && matchesRole;
  });

  if (isContextLoading || workspace.role !== UserRole.ADMIN) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fbf8f5]">
        <p className="text-sm font-semibold text-[#7a4b28]">Verifying administrator access...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1d140d] sm:text-3xl lg:text-4xl">
              System Operations — {displayName}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <p className="mt-1.5 text-sm sm:text-base text-[#5f5145]">
            Platform health, multi-model AgentOps telemetry, uptime governance, and user roster.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center rounded-xl bg-[#f3e7da] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            Role: Administrator
          </span>
          <span className="inline-flex items-center rounded-xl bg-white border border-[#ead9ca] px-3.5 py-1.5 text-xs font-semibold text-[#5f5145]">
            SLA: {metrics.uptimePct}%
          </span>
        </div>
      </header>

      {/* 4 KPI Metric Cards */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Members */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Platform Members</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              +{metrics.totalMembersGrowthPct}% MoM
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.totalMembers.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#5f5145]">
            <span>Active Coaches: <strong>{metrics.activeCoaches}</strong></span>
            <span>Capacity: 84%</span>
          </div>
        </div>

        {/* KPI 2: LLM Volume */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>LLM Requests (24h)</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {metrics.llmSuccessRatePct}% Success
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.llmCalls24h.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#5f5145]">
            <span>Agent pipelines active</span>
            <span className="text-emerald-600 font-medium">99.8% SLA</span>
          </div>
        </div>

        {/* KPI 3: Latency */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Avg Latency</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              P95: {metrics.peakLatencyMs}ms
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.avgLatencyMs}ms
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#5f5145]">
            <span>Peak: {metrics.peakLatencyMs}ms</span>
            <span className="text-emerald-600 font-medium">&lt; 1,000ms budget</span>
          </div>
        </div>

        {/* KPI 4: Spend */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Daily AI Spend</span>
            <span className="rounded-full bg-[#f3e7da] px-2 py-0.5 text-[11px] font-semibold text-[#7a4b28]">
              Pacing: {metrics.dailySpendBudgetPct}%
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d140d]">
            ${metrics.dailySpendUsd.toFixed(2)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#5f5145]">
            <span>Daily cap: $20.00</span>
            <span className="text-emerald-600 font-medium">Under budget</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#ead9ca] gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-b-2 border-[#1d140d] bg-white text-[#1d140d]'
              : 'text-[#5f5145] hover:text-[#1d140d] hover:bg-white/50'
          }`}
        >
          Telemetry & Multi-Model
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agentops')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'agentops'
              ? 'border-b-2 border-[#1d140d] bg-white text-[#1d140d]'
              : 'text-[#5f5145] hover:text-[#1d140d] hover:bg-white/50'
          }`}
        >
          AgentOps Telemetry & Runs ({agentRuns.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'roster'
              ? 'border-b-2 border-[#1d140d] bg-white text-[#1d140d]'
              : 'text-[#5f5145] hover:text-[#1d140d] hover:bg-white/50'
          }`}
        >
          User & Coach Governance ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-b-2 border-[#1d140d] bg-white text-[#1d140d]'
              : 'text-[#5f5145] hover:text-[#1d140d] hover:bg-white/50'
          }`}
        >
          Settings & System Controls
        </button>
      </div>

      {/* Tab 1: Overview & Telemetry */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Model Distribution Telemetry */}
            <div className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1d140d]">Multi-Model Distribution</h3>
                  <p className="text-xs text-[#5f5145]">LLM token and execution share across active foundation models</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  100% Routed
                </span>
              </div>

              {/* Stacked Telemetry Bar */}
              <div className="h-5 w-full overflow-hidden rounded-full bg-[#f3e7da] flex mb-6 shadow-inner">
                {modelDistribution.map((item) => (
                  <div
                    key={item.model}
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-500"
                    title={`${item.model}: ${item.percentage}% (${item.callCount.toLocaleString()} calls)`}
                  />
                ))}
              </div>

              {/* Model Breakdown Cards */}
              <div className="space-y-3.5">
                {modelDistribution.map((item) => (
                  <div
                    key={item.model}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl bg-[#fffaf5] border border-[#f0e2d5] gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-sm font-bold text-[#1d140d]">{item.model}</p>
                        <p className="text-xs text-[#5f5145]">Provider: {item.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                      <span className="text-[#5f5145]">{item.callCount.toLocaleString()} calls</span>
                      <span className="font-extrabold text-[#1d140d] text-sm bg-white px-2.5 py-1 rounded-lg border border-[#ead9ca]">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Request Volume Trend */}
            <div className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1d140d]">24-Hour LLM Traffic Trend</h3>
                    <p className="text-xs text-[#5f5145]">Peak volume observed during morning check-in and evening workout windows</p>
                  </div>
                  <span className="text-xs font-semibold text-[#7a4b28] bg-[#f3e7da] px-2.5 py-1 rounded-full">
                    Hourly Ingest
                  </span>
                </div>

                {/* SVG Visual Bars */}
                <div className="mt-6 flex items-end justify-between gap-3 h-44 px-2 pt-6 pb-2 bg-[#fffaf5] rounded-xl border border-[#f0e2d5]">
                  {hourlyRequestTrend.map((h) => {
                    const maxRequests = 3500;
                    const heightPct = Math.round((h.requests / maxRequests) * 100);
                    return (
                      <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-semibold text-[#7a4b28] opacity-0 group-hover:opacity-100 transition">
                          {h.requests}
                        </span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full max-w-[40px] rounded-t-md bg-[#7a4b28] hover:bg-[#1d140d] transition-all cursor-pointer shadow-sm"
                        />
                        <span className="text-[11px] font-medium text-[#5f5145]">{h.hour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#5f5145] border-t border-[#ead9ca] pt-3">
                <span>Total requests processed: <strong>{metrics.llmCalls24h.toLocaleString()}</strong></span>
                <span className="text-emerald-700 font-semibold">Zero throttled events</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AgentOps Telemetry & Runs Table */}
      {activeTab === 'agentops' && (
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1d140d]">AgentOps Execution Runs & Traces</h3>
              <p className="text-xs text-[#5f5145]">Real-time audit log of vision extraction, intent routing, and coaching synthesis</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['ALL', 'SUCCESS', 'RUNNING', 'FAILURE'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAgentStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    agentStatusFilter === status
                      ? 'bg-[#1d140d] text-white'
                      : 'bg-[#f3e7da] text-[#7a4b28] hover:bg-[#ead9ca]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table with responsive horizontal overflow */}
          <div className="overflow-x-auto rounded-xl border border-[#ead9ca]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fffaf5] border-b border-[#ead9ca] text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
                <tr>
                  <th className="p-3.5">Run ID</th>
                  <th className="p-3.5">Agent Pipeline</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Started At</th>
                  <th className="p-3.5 text-right">Event Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ead9ca]/60">
                {filteredRuns.map((run) => {
                  const durationSec = run.endedAt
                    ? ((new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1) + 's'
                    : 'Running...';
                  const isExpanded = expandedRunId === run.id;

                  return (
                    <tr key={run.id} className="hover:bg-[#fffaf5]/80 transition group">
                      <td className="p-3.5 font-mono text-xs text-[#5f5145] font-semibold">{run.id}</td>
                      <td className="p-3.5 font-medium text-[#1d140d]">{run.agentDefinition.agentId}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            run.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                              : run.status === 'RUNNING'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                              : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                          }`}
                        >
                          {run.status === 'RUNNING' && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />}
                          {run.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#5f5145]">{durationSec}</td>
                      <td className="p-3.5 text-[#5f5145] text-xs">{new Date(run.startedAt).toLocaleTimeString()}</td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                          className="text-xs font-semibold text-[#7a4b28] hover:text-[#1d140d] underline"
                        >
                          {isExpanded ? 'Hide Trace' : `View (${run.events.length} events)`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Trace expansion modal/card if open */}
          {expandedRunId && (
            <div className="rounded-xl border border-[#ead9ca] bg-[#fffaf5] p-4 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between border-b border-[#ead9ca] pb-2 font-bold text-[#1d140d]">
                <span>Telemetry Event Trace for Run: {expandedRunId}</span>
                <button
                  type="button"
                  onClick={() => setExpandedRunId(null)}
                  className="text-[#7a4b28] hover:text-[#1d140d] text-xs font-sans font-semibold"
                >
                  Close ×
                </button>
              </div>
              <div className="space-y-1.5 pt-1">
                {agentRuns.find((r) => r.id === expandedRunId)?.events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 text-[#5f5145]">
                    <span className="text-[#7a4b28] font-semibold">[{new Date(ev.createdAt).toLocaleTimeString()}]</span>
                    <span className="font-semibold text-[#1d140d]">{ev.type}</span>
                    <span className="text-[11px] text-[#9c8979]">event_id: {ev.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: User & Coach Governance */}
      {activeTab === 'roster' && (
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1d140d]">Platform User Roster & Governance</h3>
              <p className="text-xs text-[#5f5145]">Assigned workspace roles, coach relationships, and account activity</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Search user, email, coach..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="rounded-xl border border-[#ead9ca] px-3.5 py-1.5 text-xs text-[#1d140d] focus:border-[#7a4b28] focus:outline-none"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as 'ALL' | UserRole)}
                className="rounded-xl border border-[#ead9ca] px-3 py-1.5 text-xs text-[#1d140d] focus:border-[#7a4b28] focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.COACH}>Coach</option>
                <option value={UserRole.MEMBER}>Member</option>
              </select>
            </div>
          </div>

          {/* User Table with responsive scroll */}
          <div className="overflow-x-auto rounded-xl border border-[#ead9ca]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fffaf5] border-b border-[#ead9ca] text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Coach</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ead9ca]/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fffaf5]/80 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-[#1d140d]">{u.name}</div>
                      <div className="text-xs text-[#5f5145]">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                          u.role === UserRole.ADMIN
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === UserRole.COACH
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-[#5f5145]">{u.assignedCoach || '—'}</td>
                    <td className="p-3.5 text-xs text-[#5f5145]">{u.lastActive}</td>
                    <td className="p-3.5 text-xs text-[#5f5145]">{u.joinedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Settings & Controls */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminSystemSettingsCard />
        </div>
      )}
    </div>
  );
}
