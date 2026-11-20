import { Platform } from 'react-native';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = (configuredBaseUrl || `http://${defaultHost}:3000`).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `Cannot connect to SteadyAI API at ${BASE_URL}. Set EXPO_PUBLIC_API_BASE_URL to your computer's LAN URL when using a physical device.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const payload: unknown = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
    const message = typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface NutritionEntry {
  id: string;
  rawText?: string | null;
  consumedAt: string;
  totalCalories: number | null;
  totalProteinG: number | null;
  totalCarbsG: number | null;
  totalFatG: number | null;
  items?: { id: string; name: string; calories: number; proteinG?: number | null }[];
}

export interface ReportsOverview {
  period: { days: number; from: string; to: string };
  challenge: {
    activeParticipation: boolean;
    totalCheckIns: number;
    completed: number;
    partial: number;
    skipped: number;
    completionRate: number;
    currentStreakDays: number;
  };
  nutrition: { entries: number; calories: number; proteinG: number; carbsG: number; fatG: number; avgCaloriesPerEntry: number };
  workout: { sessions: number; totalMinutes: number; avgMinutesPerSession: number; avgCompletionRate: number | null };
  community: { posts: number; reactionsGiven: number; reactionsReceived: number; repliesReceived: number };
  trends: {
    days: number;
    checkInsCompleted: { date: string; label: string; value: number }[];
    calories: { date: string; label: string; value: number }[];
    workoutMinutes: { date: string; label: string; value: number }[];
    communityPosts: { date: string; label: string; value: number }[];
  };
}

export interface WorkoutHistory {
  sessions?: number;
  totalWorkouts?: number;
  totalMinutes?: number;
  totalDurationMinutes?: number;
  avgCompletionRate?: number;
  avgDurationMinutes?: number;
  averageDurationMinutes?: number;
  lastFeedback?: 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD' | null;
  streakDays?: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (name: string, email: string, password: string, role: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    }),
  me: (token: string) => apiRequest<{ user: AuthUser }>('/api/auth/me', {}, token)
};

export const chatApi = {
  history: (token: string) =>
    apiRequest<{
      conversation: {
        id: string;
        messages: { id: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt: string }[];
      } | null;
    }>('/api/assistant/history', {}, token),
  sendMessage: (message: string, token: string, conversationId?: string | null) =>
    apiRequest<{
      reply: string;
      conversationId?: string | null;
      persistenceWarning?: string;
      workoutPlan?: unknown;
      mealPlan?: unknown;
      nutritionLog?: unknown;
      cards?: unknown[];
    }>('/api/assistant/message', {
      method: 'POST',
      body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) })
    }, token)
};

export const nutritionApi = {
  getEntries: (token: string, limit = 20) =>
    apiRequest<NutritionEntry[]>(`/api/nutrition/entries?limit=${limit}`, {}, token),
  getGoals: (token: string) =>
    apiRequest<{ dailyCalorieTarget: number; dailyProteinG: number | null; dailyCarbsG: number | null; dailyFatG: number | null; dailyWaterMl: number }>('/api/nutrition/goals', {}, token),
  logMeal: (text: string, token: string) =>
    apiRequest<NutritionEntry>('/api/nutrition/ingest', {
      method: 'POST',
      body: JSON.stringify({ rawText: text, inputType: 'TEXT' })
    }, token)
};

export const workoutApi = {
  getHistory: (token: string) => apiRequest<WorkoutHistory>('/api/workouts/history', {}, token),
  getPreferences: (token: string) => apiRequest<Record<string, unknown>>('/api/workouts/preferences', {}, token),
  saveSession: (payload: {
    userId: string;
    sessionId: string;
    completedAt: string;
    totalDurationMinutes: number;
    completedExercises: number;
    totalExercises: number;
    feedback: 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD';
    sourceApp?: string;
  }, token: string) =>
    apiRequest('/api/workouts/session-summary', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, token)
};

export const reportsApi = {
  getOverview: (token: string, days = 30) =>
    apiRequest<ReportsOverview>(`/api/reports/overview?days=${days}`, {}, token)
};

export const communityApi = {
  getFeed: (token: string, limit = 20) =>
    apiRequest<{ items?: Record<string, unknown>[]; posts?: Record<string, unknown>[] } | Record<string, unknown>[]>(`/api/community/feed?limit=${limit}`, {}, token),
  createPost: (content: string, type: 'WIN' | 'QUESTION' | 'CHECK_IN', token: string) =>
    apiRequest('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ content, type })
    }, token)
};

export const challengeApi = {
  getChallenges: (token: string) =>
    apiRequest<Record<string, unknown>[]>('/api/challenges', {}, token),
  checkIn: (status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED', token: string) =>
    apiRequest('/api/challenges/check-in', {
      method: 'POST',
      body: JSON.stringify({ status })
    }, token),
  enroll: (token: string) =>
    apiRequest('/api/challenges/enroll', { method: 'POST', body: JSON.stringify({}) }, token)
};

export const storeApi = {
  getProducts: (token?: string | null) =>
    apiRequest<{ items: Record<string, unknown>[] }>('/api/store/products', {}, token)
};

export interface MemberDashboardResponse {
  progressSummary: {
    currentStreakDays: number;
    completionRate: number;
    totalCheckIns: number;
  };
  dailyTasks: Array<{ id: string; title: string; completed: boolean }>;
  recentActivity: Array<{ id: string; type: string; description: string; timestamp: string }>;
  workouts: { sessions: number; totalMinutes: number; history: any[] };
  nutrition: { calories: number; targetCalories: number; proteinG: number; targetProteinG: number; waterMl: number; targetWaterMl: number };
  checkInStatus: { todayStatus: 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | null; latestCheckInDate: string | null };
}

export interface CoachRosterMember {
  id: string;
  name: string;
  email: string;
  primaryGoal: string;
  currentStreak: number;
  adherenceRate: number;
  lastCheckInDate: string | null;
  lastCheckInStatus: string;
  pendingFeedbackCount: number;
}

export interface CoachFeedbackItem {
  id: string;
  memberId: string;
  memberName: string;
  topic: string;
  context: string | null;
  preferredOutcome: string | null;
  status: string;
  createdAt: string;
}

export interface CoachMetricsResponse {
  totalClients: number;
  activeClients: number;
  adherenceRate: number;
  pendingReviews: number;
}

export interface MemberReportResponse {
  member: { id: string; name: string; email: string; primaryGoal: string };
  healthRecords: any[];
  workoutHistory: any[];
  nutritionOverview: any[];
  checkInHistory: any[];
  engagementSummary: { streakDays: number; totalCheckIns: number; adherenceRate: number };
}

export const memberApi = {
  getDashboard: (token: string) =>
    apiRequest<MemberDashboardResponse>('/api/member/dashboard', {}, token)
};

export const coachApi = {
  getRoster: (token: string) =>
    apiRequest<{ coachId: string; totalAssigned: number; members: CoachRosterMember[] }>('/api/coach/roster', {}, token),
  getFeedbackQueue: (token: string) =>
    apiRequest<{ total: number; queue: CoachFeedbackItem[] }>('/api/coach/feedback-queue', {}, token),
  getMetrics: (token: string) =>
    apiRequest<CoachMetricsResponse>('/api/coach/metrics', {}, token),
  sendFeedbackReply: (feedbackRequestId: string, reply: string, token: string) =>
    apiRequest<{ success: boolean }>('/api/coach/feedback', {
      method: 'POST',
      body: JSON.stringify({ feedbackRequestId, reply })
    }, token),
  getMemberReports: (memberId: string, token: string) =>
    apiRequest<MemberReportResponse>(`/api/coach/members/${memberId}/reports`, {}, token)
};

