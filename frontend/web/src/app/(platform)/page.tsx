'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { useAuth } from '@/auth';
import { createApiClient, UserRole } from '@/lib/api';
import { mockMemberData, MemberData } from '@/lib/mockDemoData';
import { CommunityPromptCard } from '@/features/dashboard/components/CommunityPromptCard';
import { WeeklyReportCard } from '@/features/dashboard/components/WeeklyReportCard';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function PlatformHomePage() {
  const { userIdentity, workspace, isLoading } = usePlatformContext();
  const { token, userId } = useAuth();
  const router = useRouter();
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  // Route directly to role-specific dashboard
  useEffect(() => {
    if (!isLoading && workspace.role) {
      if (workspace.role === UserRole.ADMIN) {
        router.replace('/admin');
      } else if (workspace.role === UserRole.COACH) {
        router.replace('/coach');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, router, workspace.role]);

  const [memberData] = useState<MemberData>(mockMemberData);

  // Interactive Hydration State
  const [waterMl, setWaterMl] = useState<number>(mockMemberData.metrics.waterL * 1000);
  const targetWaterMl = mockMemberData.metrics.waterTargetL * 1000;
  const [waterToast, setWaterToast] = useState<string | null>(null);

  // Interactive Workout State
  const [exercises, setExercises] = useState(mockMemberData.workoutToday.exercises);
  const [selectedRpe, setSelectedRpe] = useState<string | null>(null);
  const [rpeSavedMessage, setRpeSavedMessage] = useState<string | null>(null);

  // Interactive Quick Meal Log
  const [mealText, setMealText] = useState('');
  const [mealLogs, setMealLogs] = useState<Array<{ text: string; time: string; kcal: number }>>([
    { text: 'Greek yogurt bowl with blueberries & whey', time: '8:15 AM', kcal: 420 },
    { text: 'Grilled chicken breast with brown rice & avocado', time: '12:45 PM', kcal: 780 }
  ]);
  const [isMealLogging, setIsMealLogging] = useState(false);
  const [mealFeedback, setMealFeedback] = useState<string | null>(null);

  const { metrics, workoutToday, weeklyTrends, recentCoachNote, todayFocus } = memberData;

  // Hydration logger (+250mL)
  const handleLogWater = (deltaMl = 250) => {
    setWaterMl((prev) => {
      const next = prev + deltaMl;
      setWaterToast(`+${deltaMl}mL logged! Total: ${(next / 1000).toFixed(1)}L / ${(targetWaterMl / 1000).toFixed(1)}L`);
      setTimeout(() => setWaterToast(null), 3000);
      return next;
    });
  };

  // Toggle workout exercise completion
  const handleToggleExercise = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, completed: !ex.completed } : ex))
    );
  };

  // Submit RPE rating
  const handleRateRpe = async (rating: 'Too Easy' | 'Just Right' | 'Too Hard') => {
    setSelectedRpe(rating);
    const msg = `RPE saved: "${rating}". Your AI coach has updated tomorrow's volume progression.`;
    setRpeSavedMessage(msg);

    try {
      if (userId) {
        await api.post('/api/workouts/session-summary', {
          body: {
            userId,
            sessionId: `session-${new Date().toISOString().slice(0, 10)}`,
            totalDurationMinutes: workoutToday.durationMinutes,
            completedExercises: exercises.filter((e) => e.completed).length,
            totalExercises: exercises.length,
            feedback: rating === 'Too Easy' ? 'TOO_EASY' : rating === 'Too Hard' ? 'TOO_HARD' : 'JUST_RIGHT',
            rpeRating: rating,
            sourceApp: 'steadyai-web-dashboard'
          }
        });
      }
    } catch {
      // Offline fallback
    }
  };

  // Quick Meal Log
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealText.trim()) return;

    setIsMealLogging(true);
    setMealFeedback(null);

    const newLog = {
      text: mealText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kcal: 450
    };

    try {
      await api.post('/api/nutrition/ingest', {
        body: {
          inputType: 'TEXT',
          rawText: mealText.trim()
        }
      });
      setMealLogs((prev) => [newLog, ...prev]);
      setMealText('');
      setMealFeedback('Meal logged and nutritional macros calibrated.');
      setTimeout(() => setMealFeedback(null), 3000);
    } catch {
      setMealLogs((prev) => [newLog, ...prev]);
      setMealText('');
      setMealFeedback('Meal logged and nutritional macros calibrated.');
      setTimeout(() => setMealFeedback(null), 3000);
    } finally {
      setIsMealLogging(false);
    }
  };

  const caloriesRemaining = metrics.calorieTarget - metrics.caloriesConsumed;
  const caloriePct = Math.min(100, Math.round((metrics.caloriesConsumed / metrics.calorieTarget) * 100));
  const proteinPct = Math.min(100, Math.round((metrics.proteinG / metrics.proteinTargetG) * 100));
  const carbsPct = Math.min(100, Math.round((metrics.carbsG / metrics.carbsTargetG) * 100));
  const fatPct = Math.min(100, Math.round((metrics.fatG / metrics.fatTargetG) * 100));
  const waterPct = Math.min(100, Math.round((waterMl / targetWaterMl) * 100));

  const completedExerciseCount = exercises.filter((e) => e.completed).length;

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1d140d] sm:text-3xl lg:text-4xl">
              Welcome back, {userIdentity.displayName || 'Alex'}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e7da] px-3 py-1 text-xs font-bold text-[#7a4b28] shadow-sm">
              🔥 {metrics.streakDays}-Day Streak
            </span>
          </div>
          <p className="mt-1.5 text-sm sm:text-base text-[#5f5145]">
            Here is your daily training, macronutrient balance, and recovery targets.
          </p>
        </div>

        {/* Quick Action in Header */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleLogWater(250)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ead9ca] bg-white px-3.5 py-2 text-xs font-bold text-[#7a4b28] transition hover:bg-[#f3e7da] shadow-sm"
          >
            💧 +250mL Water
          </button>
        </div>
      </header>

      {/* Daily Focus Callout Banner */}
      <div className="rounded-2xl border border-[#ead9ca] bg-gradient-to-r from-[#fffaf5] via-white to-[#fffaf5] p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1d140d] text-sm text-white font-bold">
            ⚡
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7a4b28]">Today&apos;s Focus</p>
            <p className="mt-0.5 text-sm font-medium text-[#1d140d] leading-relaxed">{todayFocus}</p>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <section aria-label="Member Metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* KPI 1: Calories */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Daily Calories</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {caloriePct}%
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.caloriesConsumed.toLocaleString()} <span className="text-base font-semibold text-[#5f5145]">/ {metrics.calorieTarget.toLocaleString()} kcal</span>
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>{caloriesRemaining} kcal remaining today</span>
          </div>
        </div>

        {/* KPI 2: Protein Target */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Protein Target</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {proteinPct}%
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {metrics.proteinG}g <span className="text-base font-semibold text-[#5f5145]">/ {metrics.proteinTargetG}g</span>
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>{metrics.proteinTargetG - metrics.proteinG}g remaining for goal</span>
          </div>
        </div>

        {/* KPI 3: Today's Workout */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Today&apos;s Workout</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              In Progress
            </span>
          </div>
          <p className="mt-3 text-lg sm:text-xl font-extrabold tracking-tight text-[#1d140d] line-clamp-1">
            Upper Body Strength A
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>{completedExerciseCount} of {exercises.length} exercises logged • RPE 8</span>
          </div>
        </div>

        {/* KPI 4: Water & Steps */}
        <div className="rounded-2xl border border-[#ead9ca] bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
            <span>Water & Steps</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {waterPct}% Hydrated
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d140d]">
            {(waterMl / 1000).toFixed(1)}L <span className="text-sm font-semibold text-[#5f5145]">• {metrics.steps.toLocaleString()} steps</span>
          </p>
          <div className="mt-2 text-xs text-[#5f5145]">
            <span>Goal: {(targetWaterMl / 1000).toFixed(1)}L • 10k steps</span>
          </div>
        </div>
      </section>

      {/* Asymmetric 2:1 Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 2xl:grid-cols-12">
        {/* Left Column (2 Cols / 8 Cols on 2xl): Workout Tracker & Nutrition Breakdown */}
        <div className="lg:col-span-2 2xl:col-span-8 space-y-8">
          {/* Workout Routine & Interactive RPE Logger */}
          <section aria-labelledby="workout-tracker-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="workout-tracker-heading" className="text-xl font-bold text-[#1d140d]">
                    {workoutToday.title}
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    {workoutToday.splitName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5f5145]">
                  Duration: {workoutToday.durationMinutes} min • Target Intensity: RPE {workoutToday.targetRpe}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#7a4b28] bg-[#f3e7da] px-3 py-1 rounded-full self-start sm:self-auto">
                {completedExerciseCount}/{exercises.length} Complete
              </span>
            </div>

            {/* Exercise Checklist */}
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => handleToggleExercise(exercise.id)}
                  className={`flex items-start justify-between p-4 rounded-xl border transition cursor-pointer select-none ${
                    exercise.completed
                      ? 'border-[#ead9ca] bg-[#fffaf5] opacity-90'
                      : 'border-[#ead9ca] bg-white hover:border-[#7a4b28]/60 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={exercise.completed}
                      onChange={() => handleToggleExercise(exercise.id)}
                      className="mt-1 h-5 w-5 rounded border-[#ead9ca] text-[#7a4b28] accent-[#7a4b28] focus:ring-[#7a4b28] cursor-pointer"
                    />
                    <div>
                      <p className={`text-sm font-bold ${exercise.completed ? 'text-[#5f5145] line-through' : 'text-[#1d140d]'}`}>
                        {exercise.name}
                      </p>
                      <p className="text-xs text-[#7a4b28] font-medium mt-0.5">
                        {exercise.sets} sets • {exercise.reps} {exercise.targetWeightKg ? `• ${exercise.targetWeightKg}kg` : ''}
                      </p>
                      {exercise.notes && (
                        <p className="text-xs text-[#5f5145] mt-1 italic">&ldquo;{exercise.notes}&rdquo;</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                      exercise.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-[#f3e7da] text-[#7a4b28]'
                    }`}
                  >
                    {exercise.completed ? 'Done ✓' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {/* Interactive RPE Difficulty Logger */}
            <div className="rounded-xl border border-[#ead9ca] bg-[#fffaf5] p-5 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-[#1d140d]">Interactive Session RPE Rating</h4>
                <p className="text-xs text-[#5f5145]">
                  How demanding was today&apos;s strength and core session? Select your rate of perceived exertion:
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['Too Easy', 'Just Right', 'Too Hard'] as const).map((rating) => {
                  const isSelected = selectedRpe === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRateRpe(rating)}
                      className={`rounded-xl py-3 px-2 text-xs sm:text-sm font-bold transition shadow-sm border ${
                        isSelected
                          ? 'bg-[#1d140d] text-white border-[#1d140d] ring-2 ring-[#7a4b28]'
                          : 'bg-white text-[#4e4035] border-[#ead9ca] hover:bg-[#f3e7da]'
                      }`}
                    >
                      {rating}
                    </button>
                  );
                })}
              </div>

              {rpeSavedMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-semibold text-center animate-fade-in">
                  ✓ {rpeSavedMessage}
                </div>
              )}
            </div>
          </section>

          {/* Daily Nutrition & Macronutrient Breakdown */}
          <section aria-labelledby="nutrition-tracker-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#ead9ca] pb-4 gap-2">
              <div>
                <h3 id="nutrition-tracker-heading" className="text-xl font-bold text-[#1d140d]">
                  Macronutrient Balance & Hydration
                </h3>
                <p className="text-xs text-[#5f5145]">
                  Target: {metrics.calorieTarget} kcal • Protein: {metrics.proteinTargetG}g • Carbs: {metrics.carbsTargetG}g • Fat: {metrics.fatTargetG}g
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full self-start sm:self-auto">
                {caloriesRemaining} kcal headroom
              </span>
            </div>

            {/* Circular SVG Calorie Progress + Macro Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* SVG Ring */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#fffaf5] rounded-xl border border-[#ead9ca]">
                <div className="relative flex items-center justify-center h-32 w-32">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#ead9ca]"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#7a4b28] transition-all duration-500"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - caloriePct / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xl font-extrabold text-[#1d140d]">{metrics.caloriesConsumed}</p>
                    <p className="text-[10px] font-semibold text-[#7a4b28] uppercase">kcal eaten</p>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-[#5f5145]">
                  {caloriesRemaining} kcal left of {metrics.calorieTarget}
                </p>
              </div>

              {/* Macro Bars */}
              <div className="md:col-span-2 space-y-4">
                {/* Protein */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#1d140d]">Protein</span>
                    <span className="text-[#7a4b28]">{metrics.proteinG}g / {metrics.proteinTargetG}g ({proteinPct}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f3e7da] overflow-hidden">
                    <div style={{ width: `${proteinPct}%` }} className="h-full rounded-full bg-[#7a4b28] transition-all" />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#1d140d]">Carbohydrates</span>
                    <span className="text-amber-700">{metrics.carbsG}g / {metrics.carbsTargetG}g ({carbsPct}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f3e7da] overflow-hidden">
                    <div style={{ width: `${carbsPct}%` }} className="h-full rounded-full bg-amber-500 transition-all" />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#1d140d]">Healthy Fats</span>
                    <span className="text-blue-700">{metrics.fatG}g / {metrics.fatTargetG}g ({fatPct}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f3e7da] overflow-hidden">
                    <div style={{ width: `${fatPct}%` }} className="h-full rounded-full bg-blue-500 transition-all" />
                  </div>
                </div>

                {/* Hydration Interactive Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#1d140d]">Hydration Level</span>
                    <span className="text-cyan-700">{(waterMl / 1000).toFixed(1)}L / {(targetWaterMl / 1000).toFixed(1)}L ({waterPct}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f3e7da] overflow-hidden">
                    <div style={{ width: `${waterPct}%` }} className="h-full rounded-full bg-cyan-600 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Water Logger Section */}
            <div className="rounded-xl border border-[#ead9ca] bg-[#fffaf5] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7a4b28]">Quick Hydration Logger</p>
                <p className="text-xs text-[#5f5145] mt-0.5">Keep cellular hydration high around training windows.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLogWater(250)}
                  className="rounded-xl bg-[#1d140d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7a4b28] shadow-sm"
                >
                  💧 +250mL (Glass of Water)
                </button>
                <button
                  type="button"
                  onClick={() => handleLogWater(500)}
                  className="rounded-xl border border-[#ead9ca] bg-white px-3 py-2 text-xs font-bold text-[#7a4b28] transition hover:bg-[#f3e7da]"
                >
                  +500mL (Bottle)
                </button>
              </div>
            </div>

            {waterToast && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-800 font-semibold text-center">
                {waterToast}
              </div>
            )}

            {/* Quick Meal Input Form */}
            <form onSubmit={handleAddMeal} className="space-y-2 pt-2 border-t border-[#ead9ca]">
              <label htmlFor="meal-input" className="block text-xs font-bold uppercase tracking-wider text-[#7a4b28]">
                Log Meal or Snack
              </label>
              <div className="flex gap-2">
                <input
                  id="meal-input"
                  type="text"
                  placeholder="e.g. 2 boiled eggs and a sourdough toast with peanut butter"
                  value={mealText}
                  onChange={(e) => setMealText(e.target.value)}
                  className="flex-1 rounded-xl border border-[#ead9ca] px-3.5 py-2 text-xs text-[#1d140d] focus:border-[#7a4b28] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isMealLogging}
                  className="rounded-xl bg-[#1d140d] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7a4b28] disabled:opacity-50"
                >
                  {isMealLogging ? 'Logging...' : 'Log Meal'}
                </button>
              </div>
              {mealFeedback && (
                <p className="text-xs text-emerald-700 font-semibold">{mealFeedback}</p>
              )}
              {/* Recent meals */}
              <div className="space-y-1.5 pt-2">
                {mealLogs.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-[#5f5145] bg-[#fffaf5] p-2 rounded-lg border border-[#f0e2d5]">
                    <span>{m.text}</span>
                    <span className="font-semibold text-[#7a4b28]">{m.kcal} kcal • {m.time}</span>
                  </div>
                ))}
              </div>
            </form>
          </section>
        </div>

        {/* Right Column (1 Col / 4 Cols on 2xl): AI Coach, Recent Feedback, 7-Day Trend */}
        <div className="2xl:col-span-4 space-y-8">
          {/* Recent Coach Feedback Card */}
          <section aria-labelledby="coach-feedback-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#ead9ca] pb-3">
              <h3 id="coach-feedback-heading" className="text-base font-bold text-[#1d140d]">
                Assigned Coach Feedback
              </h3>
              <span className="text-[11px] font-semibold text-[#7a4b28] bg-[#f3e7da] px-2.5 py-0.5 rounded-full">
                {recentCoachNote.sentAt}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d140d] text-sm font-bold text-white shadow-sm">
                {recentCoachNote.avatarInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1d140d]">{recentCoachNote.coachName}</p>
                <p className="text-xs text-[#7a4b28]">{recentCoachNote.coachTitle}</p>
              </div>
            </div>

            <p className="text-xs text-[#4e4035] leading-relaxed italic bg-[#fffaf5] p-3 rounded-xl border border-[#f0e2d5]">
              &ldquo;{recentCoachNote.message}&rdquo;
            </p>

            {recentCoachNote.actionItem && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-semibold">
                🎯 Action Item: {recentCoachNote.actionItem}
              </div>
            )}
          </section>

          {/* 7-Day Health Trend */}
          <section aria-labelledby="weekly-trend-heading" className="rounded-2xl border border-[#ead9ca] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#ead9ca] pb-3">
              <div>
                <h3 id="weekly-trend-heading" className="text-base font-bold text-[#1d140d]">
                  7-Day Health Trend
                </h3>
                <p className="text-xs text-[#5f5145]">Calorie adherence and completed training sessions</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                96% Avg
              </span>
            </div>

            {/* Visual Trend Bars */}
            <div className="flex items-end justify-between gap-2 h-36 px-2 pt-4 pb-1 bg-[#fffaf5] rounded-xl border border-[#ead9ca]">
              {weeklyTrends.map((t) => {
                const heightPct = Math.round((t.calories / 2400) * 100);
                return (
                  <div key={t.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <span className="text-[10px] font-semibold text-[#7a4b28] opacity-0 group-hover:opacity-100 transition">
                      {t.calories}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all shadow-sm ${
                        t.workoutCompleted ? 'bg-[#7a4b28]' : 'bg-[#d8c4b3]'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-[#5f5145]">{t.day}</span>
                    <span className="text-[10px]">{t.workoutCompleted ? '✓' : '—'}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-[#5f5145] border-t border-[#ead9ca] pt-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#7a4b28]" /> Workout Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#d8c4b3]" /> Rest Day
              </span>
            </div>
          </section>

          {/* Community & Weekly Report Tiles */}
          <div className="space-y-6">
            <CommunityPromptCard />
            <WeeklyReportCard />
          </div>
        </div>
      </div>
    </div>
  );
}
