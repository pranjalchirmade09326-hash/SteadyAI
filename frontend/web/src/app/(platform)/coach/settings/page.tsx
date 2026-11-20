'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { UserRole } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CoachSettingsPage() {
  const { workspace, userIdentity, isLoading } = usePlatformContext();
  const router = useRouter();

  const [clinicName, setClinicName] = useState('Apex Performance & Clinical Wellness');
  const [specialty, setSpecialty] = useState('Sports Medicine & Preventive Cardiology');
  const [licenseNumber, setLicenseNumber] = useState('MED-CA-94821');
  const [adherenceThreshold, setAdherenceThreshold] = useState(70);
  const [missedLogsThreshold, setMissedLogsThreshold] = useState(2);
  const [acceptingPatients, setAcceptingPatients] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Role Access Guard
  useEffect(() => {
    if (!isLoading && workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN) {
      router.replace('/dashboard');
    }
  }, [isLoading, router, workspace.role]);

  if (isLoading || (workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d140d] border-t-transparent" />
          <p className="text-sm font-medium">Loading Practice Settings...</p>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice('Practice settings & clinical alert thresholds saved successfully.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9e8a7b]">
            <Link href="/coach" className="hover:text-[#1d140d] transition">
              Doctor Workspace
            </Link>
            <span>/</span>
            <span className="text-amber-800 dark:text-amber-400">Settings</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1d140d] dark:text-white sm:text-3xl">
            Doctor &amp; Practice Settings
          </h1>
          <p className="text-sm text-[#7a6858] dark:text-[#c4b5a5]">
            Configure your clinical identity, patient alert thresholds, and automated monitoring parameters.
          </p>
        </div>

        <Link
          href="/coach"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#d8c4b3] bg-white px-4 py-2 text-xs font-bold text-[#1d140d] shadow-sm hover:bg-[#fbf8f5] transition"
        >
          ← Back to Command Center
        </Link>
      </div>

      {savedNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          ✓ {savedNotice}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Practice Credentials */}
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-5 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <h2 className="text-sm font-bold text-[#1d140d] dark:text-white mb-4">
            🩺 Clinical Practice Profile
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#4e4035] dark:text-[#c4b5a5] mb-1">
                Doctor Full Name
              </label>
              <input
                type="text"
                disabled
                value={userIdentity.displayName || 'Dr. Sarah Jenkins, MD'}
                className="w-full rounded-xl border border-[#d8c4b3] bg-[#fbf8f5] px-3.5 py-2 text-xs font-semibold text-[#8a7667] dark:border-[#4a3528] dark:bg-[#15100c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4e4035] dark:text-[#c4b5a5] mb-1">
                Medical License / NPI Number
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-xl border border-[#d8c4b3] bg-white px-3.5 py-2 text-xs font-medium text-[#1d140d] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4e4035] dark:text-[#c4b5a5] mb-1">
                Clinic / Center Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full rounded-xl border border-[#d8c4b3] bg-white px-3.5 py-2 text-xs font-medium text-[#1d140d] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4e4035] dark:text-[#c4b5a5] mb-1">
                Primary Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-xl border border-[#d8c4b3] bg-white px-3.5 py-2 text-xs font-medium text-[#1d140d] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Clinical Alert Thresholds */}
        <div className="rounded-2xl border border-[#e8d7c6] bg-white p-5 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410]">
          <h2 className="text-sm font-bold text-[#1d140d] dark:text-white mb-4">
            ⚠️ Automated Monitoring &amp; Alert Thresholds
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#4e4035] dark:text-[#c4b5a5] mb-1">
                Adherence Alert Floor (%): {adherenceThreshold}%
              </label>
              <input
                type="range"
                min={50}
                max={85}
                value={adherenceThreshold}
                onChange={(e) => setAdherenceThreshold(Number(e.target.value))}
                className="w-full accent-[#1d140d]"
              />
              <p className="text-[11px] text-[#9e8a7b] mt-1">
                Flag patient as &ldquo;Needs Review&rdquo; when 7-day adherence drops below {adherenceThreshold}%.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4e4035] dark:text-[#c4b5a5] mb-1">
                Missed Meal Log Trigger: {missedLogsThreshold} days
              </label>
              <input
                type="range"
                min={1}
                max={4}
                value={missedLogsThreshold}
                onChange={(e) => setMissedLogsThreshold(Number(e.target.value))}
                className="w-full accent-[#1d140d]"
              />
              <p className="text-[11px] text-[#9e8a7b] mt-1">
                Dispatch copilot check-in nudge after {missedLogsThreshold} days without a food entry.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#e8d7c6]/60 dark:border-[#38271e] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#1d140d] dark:text-white">Accepting New Patients</p>
              <p className="text-[11px] text-[#7a6858]">Allow new member onboarding assignments to your roster</p>
            </div>
            <button
              type="button"
              onClick={() => setAcceptingPatients(!acceptingPatients)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                acceptingPatients
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-[#f5ebe0] text-[#7a6858]'
              }`}
            >
              {acceptingPatients ? '✓ Accepting' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-[#1d140d] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#342417] transition dark:bg-[#f3c99f] dark:text-[#1d140d]"
          >
            Save Practice Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
