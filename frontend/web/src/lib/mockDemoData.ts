import { PlatformContext, UserRole } from '@/lib/api/types';

export const DEMO_ROLE_STORAGE_KEY = 'steadyai.demo-role';
export const AUTH_STORAGE_KEY = 'steadyai.jwt';
export const DEV_USER_ID_STORAGE_KEY = 'steadyai.dev-user-id';
export const ONBOARDING_COMPLETED_KEY = 'steadyai.onboarding.completed';

// ==========================================
// Admin Mock Data & Types
// ==========================================

export interface AdminMetrics {
  totalMembers: number;
  totalMembersGrowthPct: number;
  activeCoaches: number;
  llmCalls24h: number;
  llmSuccessRatePct: number;
  avgLatencyMs: number;
  peakLatencyMs: number;
  dailySpendUsd: number;
  dailySpendBudgetPct: number;
  uptimePct: number;
}

export interface ModelDistributionItem {
  model: string;
  provider: string;
  percentage: number;
  callCount: number;
  color: string;
}

export interface AgentRunEvent {
  id: string;
  type: string;
  createdAt: string;
}

export interface AgentRunData {
  id: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILURE';
  startedAt: string;
  endedAt: string | null;
  agentDefinition: {
    agentId: string;
  };
  events: AgentRunEvent[];
}

export interface SystemHealthItem {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  uptimePct: number;
  portOrHost: string;
  detail: string;
}

export interface PlatformUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  assignedCoach?: string;
  lastActive: string;
  joinedAt: string;
}

export interface AdminData {
  metrics: AdminMetrics;
  modelDistribution: ModelDistributionItem[];
  agentRuns: AgentRunData[];
  systemHealth: SystemHealthItem[];
  users: PlatformUserItem[];
  hourlyRequestTrend: Array<{ hour: string; requests: number }>;
}

export const mockAdminContext: PlatformContext = {
  userIdentity: {
    id: 'demo-admin-usr',
    email: 'admin.demo@steadyai.internal',
    displayName: 'Admin Supervisor',
    onboardingCompleted: true
  },
  workspace: {
    id: 'demo-admin-ws',
    name: 'SteadyAI Operations & Systems',
    role: UserRole.ADMIN
  },
  enabledModules: ['ADMIN', 'AGENT_OPS', 'COACH', 'REPORTS', 'SETTINGS']
};

export const mockAdminData: AdminData = {
  metrics: {
    totalMembers: 2845,
    totalMembersGrowthPct: 14.2,
    activeCoaches: 48,
    llmCalls24h: 38420,
    llmSuccessRatePct: 99.8,
    avgLatencyMs: 642,
    peakLatencyMs: 1120,
    dailySpendUsd: 8.42,
    dailySpendBudgetPct: 42,
    uptimePct: 99.98
  },
  modelDistribution: [
    {
      model: 'OpenAI GPT-4o',
      provider: 'OpenAI',
      percentage: 68,
      callCount: 26125,
      color: '#10a37f'
    },
    {
      model: 'Gemini 2.0 Flash',
      provider: 'Google',
      percentage: 24,
      callCount: 9220,
      color: '#1a73e8'
    },
    {
      model: 'Groq Llama 3',
      provider: 'Groq',
      percentage: 8,
      callCount: 3075,
      color: '#f97316'
    }
  ],
  agentRuns: [
    {
      id: 'run-801',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 2.8 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'nutrition-vision-extractor' },
      events: [
        { id: 'ev-1', type: 'IMAGE_RECEIVED', createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
        { id: 'ev-2', type: 'OCR_BOUNDING_BOXES', createdAt: new Date(Date.now() - 2.9 * 60 * 1000).toISOString() },
        { id: 'ev-3', type: 'MACRO_ESTIMATION_COMPLETED', createdAt: new Date(Date.now() - 2.8 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-802',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 6.6 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'intent-router' },
      events: [
        { id: 'ev-4', type: 'QUERY_RECEIVED', createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
        { id: 'ev-5', type: 'INTENT_CLASSIFIED_WORKOUT', createdAt: new Date(Date.now() - 6.8 * 60 * 1000).toISOString() },
        { id: 'ev-6', type: 'DISPATCHED_TO_PLANNER', createdAt: new Date(Date.now() - 6.6 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-803',
      status: 'RUNNING',
      startedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      endedAt: null,
      agentDefinition: { agentId: 'coaching-synthesis' },
      events: [
        { id: 'ev-7', type: 'CHECKIN_FETCHED', createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString() },
        { id: 'ev-8', type: 'COMPILING_RECOVERY_INSIGHTS', createdAt: new Date(Date.now() - 0.4 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-804',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 17.2 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'workout-planner-v2' },
      events: [
        { id: 'ev-9', type: 'PROFILE_LOADED', createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
        { id: 'ev-10', type: 'EXERCISE_VOLUME_SCALED', createdAt: new Date(Date.now() - 17.6 * 60 * 1000).toISOString() },
        { id: 'ev-11', type: 'SCHEDULE_COMMITTED', createdAt: new Date(Date.now() - 17.2 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-805',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 31.4 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'health-sync-batch' },
      events: [
        { id: 'ev-12', type: 'APPLE_HEALTH_PULL', createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString() },
        { id: 'ev-13', type: 'INGEST_NORMALIZED', createdAt: new Date(Date.now() - 31.4 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-806',
      status: 'FAILURE',
      startedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 54.8 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'barcode-lookup-engine' },
      events: [
        { id: 'ev-14', type: 'QUERY_INIT', createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
        { id: 'ev-15', type: 'UPC_NOT_FOUND', createdAt: new Date(Date.now() - 54.8 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-807',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 74.2 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'form-analysis-cv' },
      events: [
        { id: 'ev-16', type: 'VIDEO_FRAMES_PARSED', createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString() },
        { id: 'ev-17', type: 'HIP_HINGE_METRICS_COMPUTED', createdAt: new Date(Date.now() - 74.2 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'run-808',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 109.5 * 60 * 1000).toISOString(),
      agentDefinition: { agentId: 'adherence-anomaly-detector' },
      events: [
        { id: 'ev-18', type: 'LOG_TIMESERIES_SCANNED', createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString() },
        { id: 'ev-19', type: 'NO_CRITICAL_DEVIATION', createdAt: new Date(Date.now() - 109.5 * 60 * 1000).toISOString() }
      ]
    }
  ],
  systemHealth: [
    {
      name: 'Fastify API Server',
      status: 'HEALTHY',
      latencyMs: 14,
      uptimePct: 99.99,
      portOrHost: 'port 3000',
      detail: 'Responding smoothly with active connection pool'
    },
    {
      name: 'PostgreSQL Database',
      status: 'HEALTHY',
      latencyMs: 8,
      uptimePct: 99.98,
      portOrHost: 'Pool 18/20',
      detail: 'Prisma client connected, query latency < 12ms'
    },
    {
      name: 'Supabase Storage',
      status: 'HEALTHY',
      latencyMs: 42,
      uptimePct: 99.95,
      portOrHost: 'Bucket steadyai-assets',
      detail: 'CDN cached media serving active'
    },
    {
      name: 'AgentOps MCP Server',
      status: 'HEALTHY',
      latencyMs: 28,
      uptimePct: 99.92,
      portOrHost: 'IPC Daemon',
      detail: 'Bidirectional telemetry pipeline stream online'
    }
  ],
  users: [
    {
      id: 'usr-101',
      name: 'Sarah Jenkins',
      email: 'sarah.coach@steadyai.internal',
      role: UserRole.COACH,
      status: 'ACTIVE',
      lastActive: '5 mins ago',
      joinedAt: '2026-01-15'
    },
    {
      id: 'usr-102',
      name: 'Marcus Vance',
      email: 'marcus.vance@steadyai.internal',
      role: UserRole.COACH,
      status: 'ACTIVE',
      lastActive: '12 mins ago',
      joinedAt: '2026-02-01'
    },
    {
      id: 'usr-103',
      name: 'Alex Mercer',
      email: 'alex.mercer@steadyai.internal',
      role: UserRole.MEMBER,
      status: 'ACTIVE',
      assignedCoach: 'Sarah Jenkins',
      lastActive: 'Just now',
      joinedAt: '2026-03-10'
    },
    {
      id: 'usr-104',
      name: 'Maya Lin',
      email: 'maya.lin@steadyai.internal',
      role: UserRole.MEMBER,
      status: 'ACTIVE',
      assignedCoach: 'Sarah Jenkins',
      lastActive: '1 hour ago',
      joinedAt: '2026-03-14'
    },
    {
      id: 'usr-105',
      name: 'Jordan Hayes',
      email: 'jordan.hayes@steadyai.internal',
      role: UserRole.MEMBER,
      status: 'ACTIVE',
      assignedCoach: 'Marcus Vance',
      lastActive: 'Yesterday',
      joinedAt: '2026-04-02'
    },
    {
      id: 'usr-106',
      name: 'Priya Patel',
      email: 'priya.patel@steadyai.internal',
      role: UserRole.MEMBER,
      status: 'ACTIVE',
      assignedCoach: 'Sarah Jenkins',
      lastActive: '3 hours ago',
      joinedAt: '2026-04-08'
    }
  ],
  hourlyRequestTrend: [
    { hour: '00:00', requests: 420 },
    { hour: '04:00', requests: 280 },
    { hour: '08:00', requests: 1840 },
    { hour: '12:00', requests: 2950 },
    { hour: '16:00', requests: 3410 },
    { hour: '20:00', requests: 2780 }
  ]
};

// ==========================================
// Coach Mock Data & Types
// ==========================================

export interface CoachMetrics {
  totalClients: number;
  newClientsThisWeek: number;
  pendingReviews: number;
  urgentReviews: number;
  avgAdherenceRate: number;
  adherenceRateDelta: number;
  aiRiskAlerts: number;
}

export interface CoachReviewItem {
  id: string;
  memberId: string;
  memberName: string;
  avatarInitials: string;
  submittedAt: string;
  category: 'WEEKLY_CHECKIN' | 'FORM_CHECK' | 'MISSED_LOGS';
  summary: string;
  workoutSummary?: string;
  nutritionAdherencePct?: number;
  rpeScore?: number;
  status: 'PENDING' | 'REVIEWED';
}

export interface CoachClientItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  primaryGoal: string;
  sevenDayAdherencePct: number;
  lastActive: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'NEEDS_REVIEW';
  targetCalories: number;
  currentStreakDays: number;
  notesCount: number;
}

export interface CoachInsightItem {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  clientName: string;
  description: string;
  suggestedAction: string;
  timestamp: string;
}

export interface CoachData {
  metrics: CoachMetrics;
  reviewQueue: CoachReviewItem[];
  clients: CoachClientItem[];
  insights: CoachInsightItem[];
}

export const mockCoachContext: PlatformContext = {
  userIdentity: {
    id: 'demo-coach-usr',
    email: 'sarah.coach@steadyai.internal',
    displayName: 'Coach Sarah Jenkins',
    onboardingCompleted: true
  },
  workspace: {
    id: 'demo-coach-ws',
    name: 'Performance Coaching Hub',
    role: UserRole.COACH
  },
  enabledModules: ['COACH', 'CLIENTS', 'REPORTS', 'COMMUNITY', 'SETTINGS']
};

export const mockCoachData: CoachData = {
  metrics: {
    totalClients: 38,
    newClientsThisWeek: 4,
    pendingReviews: 6,
    urgentReviews: 2,
    avgAdherenceRate: 87.4,
    adherenceRateDelta: 3.2,
    aiRiskAlerts: 3
  },
  reviewQueue: [
    {
      id: 'rev-01',
      memberId: 'usr-103',
      memberName: 'Alex Mercer',
      avatarInitials: 'AM',
      submittedAt: 'Today, 8:45 AM',
      category: 'WEEKLY_CHECKIN',
      summary: 'Logged 4/4 workouts this week. Feeling slight left shoulder tightness after Monday overhead press.',
      workoutSummary: 'Upper Body A completed (RPE 8)',
      nutritionAdherencePct: 92,
      rpeScore: 8,
      status: 'PENDING'
    },
    {
      id: 'rev-02',
      memberId: 'usr-104',
      memberName: 'Maya Lin',
      avatarInitials: 'ML',
      submittedAt: 'Today, 7:15 AM',
      category: 'FORM_CHECK',
      summary: 'Uploaded deadlift form check video at 95kg. Requesting cue on hip hinge and lockout.',
      workoutSummary: 'Lower Body Strength & Core (RPE 9)',
      nutritionAdherencePct: 88,
      rpeScore: 9,
      status: 'PENDING'
    },
    {
      id: 'rev-03',
      memberId: 'usr-105',
      memberName: 'Jordan Hayes',
      avatarInitials: 'JH',
      submittedAt: 'Yesterday, 6:30 PM',
      category: 'MISSED_LOGS',
      summary: 'Missed nutrition log for 2 consecutive days. Training frequency dropped below target.',
      workoutSummary: 'Cardio Intervals (Completed partially)',
      nutritionAdherencePct: 62,
      rpeScore: 6,
      status: 'PENDING'
    },
    {
      id: 'rev-04',
      memberId: 'usr-106',
      memberName: 'Priya Patel',
      avatarInitials: 'PP',
      submittedAt: 'Yesterday, 2:10 PM',
      category: 'WEEKLY_CHECKIN',
      summary: 'Hit 6-week adherence streak! Ready to increase calorie target by +150 kcal for lean mass.',
      workoutSummary: 'Full Body Push/Pull B (RPE 7.5)',
      nutritionAdherencePct: 96,
      rpeScore: 7.5,
      status: 'PENDING'
    },
    {
      id: 'rev-05',
      memberId: 'usr-107',
      memberName: 'David Kim',
      avatarInitials: 'DK',
      submittedAt: '2 days ago',
      category: 'FORM_CHECK',
      summary: 'Front squat knee valgus check with 80kg.',
      workoutSummary: 'Leg Hypertrophy A',
      nutritionAdherencePct: 84,
      rpeScore: 8,
      status: 'PENDING'
    },
    {
      id: 'rev-06',
      memberId: 'usr-108',
      memberName: 'Elena Rostova',
      avatarInitials: 'ER',
      submittedAt: '2 days ago',
      category: 'WEEKLY_CHECKIN',
      summary: 'Half-marathon training progression week 4 reflection.',
      workoutSummary: '16km Zone 2 Long Run',
      nutritionAdherencePct: 91,
      rpeScore: 7,
      status: 'PENDING'
    }
  ],
  clients: [
    {
      id: 'usr-103',
      name: 'Alex Mercer',
      email: 'alex.mercer@steadyai.internal',
      initials: 'AM',
      primaryGoal: 'Hypertrophy & Strength',
      sevenDayAdherencePct: 92,
      lastActive: '12 mins ago',
      status: 'ON_TRACK',
      targetCalories: 2200,
      currentStreakDays: 14,
      notesCount: 8
    },
    {
      id: 'usr-104',
      name: 'Maya Lin',
      email: 'maya.lin@steadyai.internal',
      initials: 'ML',
      primaryGoal: 'Powerlifting / Deadlift PR',
      sevenDayAdherencePct: 88,
      lastActive: '1 hour ago',
      status: 'NEEDS_REVIEW',
      targetCalories: 2450,
      currentStreakDays: 19,
      notesCount: 12
    },
    {
      id: 'usr-105',
      name: 'Jordan Hayes',
      email: 'jordan.hayes@steadyai.internal',
      initials: 'JH',
      primaryGoal: 'Fat Loss & Conditioning',
      sevenDayAdherencePct: 62,
      lastActive: 'Yesterday',
      status: 'AT_RISK',
      targetCalories: 1900,
      currentStreakDays: 2,
      notesCount: 5
    },
    {
      id: 'usr-106',
      name: 'Priya Patel',
      email: 'priya.patel@steadyai.internal',
      initials: 'PP',
      primaryGoal: 'Lean Muscle & Energy',
      sevenDayAdherencePct: 96,
      lastActive: '3 hours ago',
      status: 'ON_TRACK',
      targetCalories: 2150,
      currentStreakDays: 42,
      notesCount: 15
    },
    {
      id: 'usr-107',
      name: 'David Kim',
      email: 'david.kim@steadyai.internal',
      initials: 'DK',
      primaryGoal: 'Mobility & Hypertrophy',
      sevenDayAdherencePct: 84,
      lastActive: '5 hours ago',
      status: 'ON_TRACK',
      targetCalories: 2300,
      currentStreakDays: 9,
      notesCount: 4
    },
    {
      id: 'usr-108',
      name: 'Elena Rostova',
      email: 'elena.rostova@steadyai.internal',
      initials: 'ER',
      primaryGoal: 'Endurance & Half-Marathon',
      sevenDayAdherencePct: 94,
      lastActive: 'Today, 6:00 AM',
      status: 'ON_TRACK',
      targetCalories: 2600,
      currentStreakDays: 28,
      notesCount: 11
    },
    {
      id: 'usr-109',
      name: 'Liam Chen',
      email: 'liam.chen@steadyai.internal',
      initials: 'LC',
      primaryGoal: 'Body Recomposition',
      sevenDayAdherencePct: 71,
      lastActive: '2 days ago',
      status: 'AT_RISK',
      targetCalories: 2050,
      currentStreakDays: 3,
      notesCount: 7
    },
    {
      id: 'usr-110',
      name: 'Samantha Ray',
      email: 'sam.ray@steadyai.internal',
      initials: 'SR',
      primaryGoal: 'Core Strength & Posture',
      sevenDayAdherencePct: 90,
      lastActive: '4 hours ago',
      status: 'ON_TRACK',
      targetCalories: 1850,
      currentStreakDays: 16,
      notesCount: 6
    }
  ],
  insights: [
    {
      id: 'ins-01',
      severity: 'HIGH',
      title: 'Fatigue & Volume Alert',
      clientName: 'Alex Mercer',
      description: 'Reported shoulder discomfort following overhead press after 3 successive high-RPE sessions.',
      suggestedAction: 'Substitute neutral-grip dumbbell press and add rotator cuff warm-up.',
      timestamp: 'Today, 8:46 AM'
    },
    {
      id: 'ins-02',
      severity: 'MEDIUM',
      title: 'Benchmark Passed (+5kg)',
      clientName: 'Maya Lin',
      description: 'Deadlift set volume reached 5x 95kg with clean bar speed, surpassing Phase 1 milestone.',
      suggestedAction: 'Advance program to Phase 2 strength block with 100kg target.',
      timestamp: 'Today, 7:16 AM'
    },
    {
      id: 'ins-03',
      severity: 'INFO',
      title: 'Consistency Milestone (6 Weeks)',
      clientName: 'Priya Patel',
      description: 'Maintained >95% macro and workout adherence for 42 consecutive days.',
      suggestedAction: 'Send congratulatory voice/video feedback and approve calorie bump.',
      timestamp: 'Yesterday, 2:12 PM'
    }
  ]
};

// ==========================================
// Member Mock Data & Types
// ==========================================

export interface MemberMetrics {
  caloriesConsumed: number;
  calorieTarget: number;
  proteinG: number;
  proteinTargetG: number;
  carbsG: number;
  carbsTargetG: number;
  fatG: number;
  fatTargetG: number;
  waterL: number;
  waterTargetL: number;
  steps: number;
  stepsTarget: number;
  streakDays: number;
}

export interface MemberWorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  targetWeightKg?: number;
  completed: boolean;
  notes?: string;
}

export interface MemberWorkoutToday {
  title: string;
  splitName: string;
  durationMinutes: number;
  targetRpe: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  exercises: MemberWorkoutExercise[];
}

export interface MemberWeeklyTrendDay {
  day: string;
  calories: number;
  targetCalories: number;
  workoutCompleted: boolean;
  adherencePct: number;
}

export interface MemberCoachNote {
  coachName: string;
  coachTitle: string;
  avatarInitials: string;
  sentAt: string;
  message: string;
  actionItem?: string;
}

export interface MemberData {
  metrics: MemberMetrics;
  workoutToday: MemberWorkoutToday;
  weeklyTrends: MemberWeeklyTrendDay[];
  recentCoachNote: MemberCoachNote;
  todayFocus: string;
}

export const mockMemberContext: PlatformContext = {
  userIdentity: {
    id: 'demo-member-usr',
    email: 'alex.mercer@steadyai.internal',
    displayName: 'Alex Mercer',
    onboardingCompleted: true
  },
  workspace: {
    id: 'demo-member-ws',
    name: "Alex's Fitness Space",
    role: UserRole.MEMBER
  },
  enabledModules: ['NUTRITION', 'WORKOUTS', 'AI_COACH', 'REPORTS', 'COMMUNITY', 'SETTINGS']
};

export const mockMemberData: MemberData = {
  metrics: {
    caloriesConsumed: 1850,
    calorieTarget: 2200,
    proteinG: 145,
    proteinTargetG: 175,
    carbsG: 160,
    carbsTargetG: 220,
    fatG: 52,
    fatTargetG: 70,
    waterL: 2.4,
    waterTargetL: 3.0,
    steps: 8420,
    stepsTarget: 10000,
    streakDays: 14
  },
  workoutToday: {
    title: 'Upper Body Strength & Core A',
    splitName: 'Hypertrophy Block Week 3',
    durationMinutes: 45,
    targetRpe: 8,
    status: 'IN_PROGRESS',
    exercises: [
      {
        id: 'ex-01',
        name: 'Barbell Bench Press',
        sets: 4,
        reps: '6-8 reps',
        targetWeightKg: 85,
        completed: true,
        notes: 'Felt solid on sets 1-3. Paused at chest.'
      },
      {
        id: 'ex-02',
        name: 'Incline Dumbbell Press',
        sets: 3,
        reps: '8-10 reps',
        targetWeightKg: 28,
        completed: true,
        notes: 'Good stretch at bottom.'
      },
      {
        id: 'ex-03',
        name: 'Neutral Grip Chest-Supported Row',
        sets: 4,
        reps: '10-12 reps',
        targetWeightKg: 32,
        completed: false,
        notes: 'Focus on lat contraction and scapular pull.'
      },
      {
        id: 'ex-04',
        name: 'Cable Tricep Pushdown + Face Pulls',
        sets: 3,
        reps: '12-15 reps superset',
        completed: false,
        notes: 'Hold lockout for 1 second.'
      }
    ]
  },
  weeklyTrends: [
    { day: 'Mon', calories: 2180, targetCalories: 2200, workoutCompleted: true, adherencePct: 98 },
    { day: 'Tue', calories: 2210, targetCalories: 2200, workoutCompleted: true, adherencePct: 100 },
    { day: 'Wed', calories: 2050, targetCalories: 2200, workoutCompleted: false, adherencePct: 92 },
    { day: 'Thu', calories: 2230, targetCalories: 2200, workoutCompleted: true, adherencePct: 99 },
    { day: 'Fri', calories: 2190, targetCalories: 2200, workoutCompleted: true, adherencePct: 98 },
    { day: 'Sat', calories: 2260, targetCalories: 2200, workoutCompleted: false, adherencePct: 96 },
    { day: 'Sun', calories: 1850, targetCalories: 2200, workoutCompleted: true, adherencePct: 84 }
  ],
  recentCoachNote: {
    coachName: 'Coach Sarah Jenkins',
    coachTitle: 'Head Strength & Nutrition Specialist',
    avatarInitials: 'SJ',
    sentAt: 'Today at 9:15 AM',
    message: "Great consistency on your bench press! Let's increase target weight next week to 87.5kg. Remember to keep adequate carbs around your workout window.",
    actionItem: 'Log your post-workout meal within 45 mins.'
  },
  todayFocus: 'Upper Body Power & Hydration: Prioritize hitting your 175g protein target and keep shoulder warm-up thorough.'
};

// ==========================================
// Demo Session Management Helpers
// ==========================================

export function getDemoRole(): UserRole | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const role = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
  if (role === UserRole.ADMIN || role === UserRole.COACH || role === UserRole.MEMBER) {
    return role;
  }
  return null;
}

export function isDemoMode(): boolean {
  return getDemoRole() !== null;
}

export function getMockPlatformContext(role?: UserRole | null): PlatformContext {
  const activeRole = role ?? getDemoRole() ?? UserRole.MEMBER;
  switch (activeRole) {
    case UserRole.ADMIN:
      return mockAdminContext;
    case UserRole.COACH:
      return mockCoachContext;
    case UserRole.MEMBER:
    default:
      return mockMemberContext;
  }
}

export function launchDemoSession(role: UserRole): { redirectPath: string } {
  if (typeof window === 'undefined') {
    return { redirectPath: '/' };
  }

  const roleLower = role.toLowerCase();
  window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
  window.localStorage.setItem(AUTH_STORAGE_KEY, `demo-jwt-token-${roleLower}`);
  window.localStorage.setItem(DEV_USER_ID_STORAGE_KEY, `demo-${roleLower}-usr`);
  window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

  let redirectPath = '/dashboard';
  if (role === UserRole.ADMIN) {
    redirectPath = '/admin';
  } else if (role === UserRole.COACH) {
    redirectPath = '/coach';
  } else {
    redirectPath = '/dashboard';
  }

  return { redirectPath };
}

export function exitDemoSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(DEV_USER_ID_STORAGE_KEY);
  window.localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
}
