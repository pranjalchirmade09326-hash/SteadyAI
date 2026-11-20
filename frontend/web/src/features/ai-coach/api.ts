import { createApiClient } from '@/lib/api';
import type { AssistantCard, AssistantIntent, ChatMessage, MealPlan, NutritionLog, ReasoningStep, WorkoutPlan } from './types';

interface AgentReplyResponse {
  reply: string;
  routedTo: string;
  intent?: AssistantIntent;
  conversationId?: string | null;
  persistenceWarning?: string;
  toolInvocations: string[];
  disclaimer?: string;
  cards?: AssistantCard[];
  workoutPlan?: WorkoutPlan;
  mealPlan?: MealPlan;
  nutritionLog?: NutritionLog;
}

const AGENT_REQUEST_TIMEOUT_MS = 30000;

export type WorkoutFeedback = 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD';

export async function requestAgentReply(
  prompt: string,
  token?: string | null,
  conversationId?: string | null
): Promise<{
  text: string;
  intent?: AssistantIntent;
  conversationId?: string | null;
  persistenceWarning?: string;
  reasoning?: ReasoningStep[];
  cards?: AssistantCard[];
  workoutPlan?: WorkoutPlan;
  mealPlan?: MealPlan;
  nutritionLog?: NutritionLog;
}> {
  const api = createApiClient(token ?? undefined);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), AGENT_REQUEST_TIMEOUT_MS);

  try {
    const response = await api.post<AgentReplyResponse, { message: string; conversationId?: string }>('/api/assistant/message', {
      body: {
        message: prompt,
        ...(conversationId ? { conversationId } : {})
      },
      signal: controller.signal
    });
    const reasoning = (response.cards || [])
      .filter((card) => card.type === 'reasoning')
      .flatMap((card) => (card.items || []).map((item) => {
        const split = item.split(':');
        if (split.length < 2) {
          return { title: 'Note', detail: item };
        }
        return { title: split[0].trim(), detail: split.slice(1).join(':').trim() };
      }));

    return {
      text: response.reply,
      intent: response.intent,
      conversationId: response.conversationId,
      persistenceWarning: response.persistenceWarning,
      reasoning,
      cards: response.cards,
      workoutPlan: response.workoutPlan,
      mealPlan: response.mealPlan,
      nutritionLog: response.nutritionLog
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getAssistantHistory(token?: string | null): Promise<{
  conversationId: string | null;
  messages: ChatMessage[];
}> {
  const api = createApiClient(token ?? undefined);
  const response = await api.get<{
    conversation: {
      id: string;
      messages: Array<{
        id: string;
        role: 'USER' | 'ASSISTANT';
        content: string;
        createdAt: string;
      }>;
    } | null;
  }>('/api/assistant/history');

  return {
    conversationId: response.conversation?.id ?? null,
    messages: (response.conversation?.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role === 'USER' ? 'user' : 'agent',
      text: message.content,
      createdAt: message.createdAt
    }))
  };
}

export async function logWorkoutPlanSession(options: {
  plan: WorkoutPlan;
  token?: string | null;
  userId?: string | null;
  feedback: WorkoutFeedback;
}): Promise<void> {
  if (!options.userId) {
    throw new Error('A signed-in user profile is required to log workouts.');
  }

  const api = createApiClient(options.token ?? undefined);
  const completedAt = new Date().toISOString();

  await api.post('/api/workouts/session-summary', {
    body: {
      userId: options.userId,
      sessionId: `assistant-${options.plan.planId}-${completedAt.slice(0, 10)}`,
      completedAt,
      totalDurationMinutes: options.plan.estimatedTotalMin,
      completedExercises: options.plan.exercises.length,
      totalExercises: options.plan.exercises.length,
      feedback: options.feedback,
      workoutPlan: options.plan,
      sourceApp: 'steadyai-assistant-chat'
    }
  });
}
