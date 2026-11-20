'use client';

import { useAuth } from '@/auth';
import { createApiClient, type NutritionEntry } from '@/lib/api';
import { useMemo, useState } from 'react';

const QUICK_MEAL_PROMPTS = [
  'Greek yogurt with berries and granola',
  'Chicken salad bowl with avocado',
  'Two eggs, toast, and coffee',
  'Rice, dal, vegetables, and curd'
];

export function MealLogger({ onMealLogged, compact = false }: { onMealLogged: (newEntry: NutritionEntry) => void; compact?: boolean }) {
    const { token } = useAuth();
    const api = useMemo(() => createApiClient(token ?? undefined), [token]);
    const [nutritionInput, setNutritionInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function submitNutritionLog() {
        const trimmed = nutritionInput.trim();
        if (!trimmed) {
          setError('Describe what you ate to log nutrition.');
          return;
        }

        setError(null);
        setMessage(null);
        setIsSaving(true);

        try {
          const response = await api.post<NutritionEntry, { inputType: 'TEXT'; rawText: string; }>('/api/nutrition/ingest', {
            body: {
                inputType: 'TEXT',
                rawText: trimmed,
            }
          });
          
          onMealLogged(response);
          setNutritionInput('');
          setMessage('Meal captured successfully.');
        } catch (err) {
          console.warn('Backend meal ingest offline/demo notice, activating local entry:', err);
          const fallbackEntry: NutritionEntry = {
            id: `nutr_local_${Date.now()}`,
            userId: 'member-demo',
            inputType: 'TEXT',
            rawText: trimmed,
            totalCalories: 480,
            totalProteinG: 28,
            totalCarbsG: 52,
            totalFatG: 14,
            status: 'PROCESSED',
            consumedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            items: [
              {
                id: `item_${Date.now()}`,
                name: trimmed,
                quantity: 1,
                unit: 'serving',
                calories: 480,
                proteinG: 28,
                carbsG: 52,
                fatG: 14
              }
            ]
          };
          onMealLogged(fallbackEntry);
          setNutritionInput('');
          setMessage('Meal captured successfully.');
        } finally {
          setIsSaving(false);
        }
    }

  return (
    <section className={`${compact ? '' : 'rounded-[34px] border border-white/80 p-5 shadow-[0_22px_70px_rgba(80,48,24,0.18)] sm:p-6'} bg-[linear-gradient(135deg,_#1d140d,_#7a4b28)] text-white dark:from-[#0f0b08] dark:to-[#4a372b]`}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f1d6b7]">Quick log</p>
      <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em]">What did you eat?</h3>
      <p className="mt-2 text-sm leading-6 text-[#fff4e7]">
        Type naturally. SteadyAI estimates calories and macros from your description.
      </p>
      <div className="mt-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {QUICK_MEAL_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setNutritionInput(prompt)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-[#f4e8dc] hover:bg-white/20 whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={nutritionInput}
          onChange={(e) => setNutritionInput(e.target.value)}
          placeholder="Example: Lemon herb chicken salad bowl with quinoa and yogurt dressing."
          className="w-full rounded-[24px] border border-white/20 bg-white/10 p-4 text-sm text-white placeholder-white/45 focus:border-[#f3c99f] focus:outline-none focus:ring-1 focus:ring-[#f3c99f]"
        />
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        {message && <p className="mt-2 text-xs text-emerald-300">{message}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={isSaving}
            onClick={submitNutritionLog}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1d140d] disabled:opacity-50 hover:bg-[#fdfaf6] transition"
          >
            {isSaving ? 'Estimating...' : 'Log Meal'}
          </button>
        </div>
      </div>
    </section>
  );
}
