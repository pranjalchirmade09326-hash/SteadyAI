'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { UserRole } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ExerciseProtocol {
  id: string;
  name: string;
  category: 'REHAB' | 'HYPERTROPHY' | 'CARDIO' | 'MOBILITY';
  targetMuscle: string;
  equipment: string;
  rpeTarget: string;
  contraindications: string;
  tempo: string;
  assignedCount: number;
}

const CLINICAL_PROTOCOLS: ExerciseProtocol[] = [
  {
    id: 'p-01',
    name: 'Scapular Wall Slides with Isometric Retraction',
    category: 'REHAB',
    targetMuscle: 'Serratus Anterior & Lower Trapezius',
    equipment: 'Wall / Bodyweight',
    rpeTarget: 'RPE 5 - 6',
    contraindications: 'Avoid in acute subacromial bursitis if pain > 3/10',
    tempo: '3-2-2-1',
    assignedCount: 14
  },
  {
    id: 'p-02',
    name: 'Trap-Bar Deadlift (High Handle / Neutral Spine)',
    category: 'HYPERTROPHY',
    targetMuscle: 'Glutes, Hamstrings, Erector Spinae',
    equipment: 'Trap Bar & Bumper Plates',
    rpeTarget: 'RPE 7 - 8.5',
    contraindications: 'Maintain neutral spine; substitute with rack pulls if hip flexion limited',
    tempo: '2-1-1-0',
    assignedCount: 22
  },
  {
    id: 'p-03',
    name: 'Zone 2 Steady-State Aerobic Cadence Protocol',
    category: 'CARDIO',
    targetMuscle: 'Cardiovascular / Mitochondrial Biogenesis',
    equipment: 'Rower / Stationary Ergometer',
    rpeTarget: 'RPE 4 - 5.5',
    contraindications: 'Do not exceed lactate threshold (keep nasal breathing intact)',
    tempo: 'Continuous (45 mins)',
    assignedCount: 31
  },
  {
    id: 'p-04',
    name: 'Half-Kneeling Thoracic Spine Rotation & Reach',
    category: 'MOBILITY',
    targetMuscle: 'Thoracic Mobility & Latissimus Dorsi',
    equipment: 'Foam Roller / Mat',
    rpeTarget: 'RPE 4 - 5',
    contraindications: 'Halt if cervical radiculopathy is present',
    tempo: 'Controlled hold (4s)',
    assignedCount: 18
  },
  {
    id: 'p-05',
    name: 'Bulgarian Split Squat with Dumbbell Load',
    category: 'HYPERTROPHY',
    targetMuscle: 'Quadriceps, Gluteus Medius, Adductors',
    equipment: 'Bench & Dumbbells',
    rpeTarget: 'RPE 8 - 9',
    contraindications: 'Monitor patellar tendon shear; regress to split stance on floor if necessary',
    tempo: '3-1-1-0',
    assignedCount: 19
  }
];

export default function CoachWorkoutsPage() {
  const { workspace, isLoading } = usePlatformContext();
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'REHAB' | 'HYPERTROPHY' | 'CARDIO' | 'MOBILITY'>('ALL');
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          <p className="text-sm font-medium">Loading Exercise Library...</p>
        </div>
      </div>
    );
  }

  const handlePrescribe = (protocolName: string) => {
    setActiveNotice(`Protocol "${protocolName}" opened in prescription drawer.`);
    setTimeout(() => setActiveNotice(null), 3500);
  };

  const filtered = CLINICAL_PROTOCOLS.filter((p) => {
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9e8a7b]">
            <Link href="/coach" className="hover:text-[#1d140d] transition">
              Doctor Workspace
            </Link>
            <span>/</span>
            <span className="text-amber-800 dark:text-amber-400">Exercise Library</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1d140d] dark:text-white sm:text-3xl">
            Clinical Exercise &amp; Routine Prescription Library
          </h1>
          <p className="text-sm text-[#7a6858] dark:text-[#c4b5a5]">
            Evidence-based rehabilitation protocols, strength progressions, and kinematic cue database for patient programs.
          </p>
        </div>

        <Link
          href="/coach"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#d8c4b3] bg-white px-4 py-2 text-xs font-bold text-[#1d140d] shadow-sm hover:bg-[#fbf8f5] transition"
        >
          ← Back to Command Center
        </Link>
      </div>

      {activeNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          ✓ {activeNotice}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e8d7c6] bg-white p-4 shadow-sm dark:border-[#38271e] dark:bg-[#1a1410] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search exercises by name, joint, or target muscle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#d8c4b3] bg-[#fbf8f5] px-3.5 py-2 text-xs font-medium text-[#1d140d] placeholder:text-[#9e8a7b] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'REHAB', 'HYPERTROPHY', 'CARDIO', 'MOBILITY'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                categoryFilter === cat
                  ? 'bg-[#1d140d] text-white shadow-sm'
                  : 'bg-[#f5ebe0] text-[#5f5145] hover:bg-[#ead9ca]'
              }`}
            >
              {cat === 'ALL'
                ? 'All Categories'
                : cat === 'REHAB'
                ? '🩺 Rehab'
                : cat === 'HYPERTROPHY'
                ? '🏋️ Strength'
                : cat === 'CARDIO'
                ? '❤️ Cardio'
                : '🤸 Mobility'}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Protocols Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#e8d7c6] bg-white p-5 shadow-sm transition hover:shadow-md dark:border-[#38271e] dark:bg-[#1a1410] flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    item.category === 'REHAB'
                      ? 'bg-amber-100 text-amber-900'
                      : item.category === 'HYPERTROPHY'
                      ? 'bg-sky-100 text-sky-900'
                      : item.category === 'CARDIO'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {item.category}
                </span>
                <span className="text-[11px] font-semibold text-[#8a7667]">
                  Assigned to {item.assignedCount} patients
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-[#1d140d] dark:text-white">
                {item.name}
              </h3>
              <p className="mt-1 text-xs text-[#7a6858] dark:text-[#c4b5a5]">
                <strong>Primary Target:</strong> {item.targetMuscle} • <strong>Equipment:</strong> {item.equipment}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#fbf8f5] p-2.5 text-xs dark:bg-[#15100c]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8a7667]">Target RPE</span>
                  <p className="font-bold text-[#1d140d] dark:text-white">{item.rpeTarget}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8a7667]">Prescribed Tempo</span>
                  <p className="font-bold text-[#1d140d] dark:text-white">{item.tempo}</p>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-[#7a6858] dark:text-[#a8927c]">
                <strong className="text-amber-800 dark:text-amber-400">Clinical Precaution:</strong> {item.contraindications}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e8d7c6]/60 dark:border-[#38271e]">
              <button
                type="button"
                onClick={() => handlePrescribe(item.name)}
                className="rounded-xl bg-[#1d140d] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#342417] transition dark:bg-[#f3c99f] dark:text-[#1d140d]"
              >
                + Prescribe to Patient
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
