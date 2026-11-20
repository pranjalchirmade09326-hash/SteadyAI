'use client';

import { AgentInteractionPanel } from '@/features/ai-coach';
import type { AssistantIntent } from '@/features/ai-coach/types';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';


function mapIntentToFocus(intent: AssistantIntent): string {
    switch (intent) {
      case 'FITNESS':
        return '/workouts';
      case 'NUTRITION':
        return '/nutrition';
      case 'TRACKING':
        return '/settings';
      case 'CHECK_IN':
        return '/check-in';
      case 'COMMUNITY':
        return '/community';
      case 'REPORTS':
        return '/reports';
      case 'STORE':
        return '/store';
      case 'EDUCATION':
      default:
        return '/ai-coach';
    }
}

export function CoachingFocusCard() {
    const router = useRouter();

    function handleAssistantIntent(intent: AssistantIntent) {
        const nextPath = mapIntentToFocus(intent);
        startTransition(() => {
            router.push(nextPath);
        });
    }

    return (
        <div className="rounded-2xl border border-white/70 bg-white/50 p-4 shadow-sm">
             <h3 className="text-lg font-semibold mb-4">Coaching Focus</h3>
            <AgentInteractionPanel embedded onIntentDetected={handleAssistantIntent} />
        </div>
    );
}
