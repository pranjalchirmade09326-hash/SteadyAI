import type { User, Workspace, WorkspaceMember } from '@prisma/client';
import {
  UserRole,
  ChallengeStatus,
  ParticipationStatus,
  DailyParticipationStatus,
  CoachFeedbackStatus
} from '@prisma/client';
import { getPrismaClient } from '../../../src/db/prisma';
import { authHeadersFor, generateTestJwt } from './auth';

export interface TestUserContext {
  user: User;
  workspace: Workspace;
  membership: WorkspaceMember;
  headers: Record<string, string>;
  bearerHeaders: Record<string, string>;
  token: string;
}

export interface CreateTestUserOptions {
  slug?: string;
  role?: UserRole;
  displayName?: string;
  primaryGoal?: string;
  email?: string;
}

/**
 * Creates a unique test user with an isolated personal workspace and role membership.
 */
export async function createTestUser(options: CreateTestUserOptions = {}): Promise<TestUserContext> {
  const prisma = getPrismaClient();
  const suffix = `${options.slug || 'user'}-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  const role = options.role || UserRole.MEMBER;
  const email = options.email || `${suffix}@steady.test`;

  const user = await prisma.user.create({
    data: {
      email,
      username: suffix.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
      displayName: options.displayName || `Test User ${suffix}`,
      primaryGoal: options.primaryGoal || 'Improve Overall Fitness & Energy',
      role,
      onboardingCompleted: true
    }
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: `${user.displayName}'s Space`,
      ownerId: user.id
    }
  });

  const membership = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role
    }
  });

  const token = generateTestJwt({ sub: user.id, email: user.email, role });
  const headers = authHeadersFor({ ...user, role }, false);
  const bearerHeaders = authHeadersFor({ ...user, role }, true);

  return { user, workspace, membership, headers, bearerHeaders, token };
}

/**
 * Assigns a member to a coach in CoachAssignment (via Prisma model or raw SQL).
 */
export async function assignMemberToCoach(coachId: string, memberId: string): Promise<void> {
  const prisma = getPrismaClient();

  if ('coachAssignment' in prisma && typeof (prisma as any).coachAssignment?.create === 'function') {
    await (prisma as any).coachAssignment.create({
      data: {
        coachId,
        memberId
      }
    });
    return;
  }

  // Fallback to raw SQL insertion if Prisma model type generation is pending
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CoachAssignment" ("id", "coachId", "memberId", "assignedAt")
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, NOW())
       ON CONFLICT DO NOTHING`,
      coachId,
      memberId
    );
  } catch {
    // Model table may not be migrated yet in early test runs
  }
}

/**
 * Removes a member assignment from a coach.
 */
export async function unassignMemberFromCoach(coachId: string, memberId: string): Promise<void> {
  const prisma = getPrismaClient();

  if ('coachAssignment' in prisma && typeof (prisma as any).coachAssignment?.deleteMany === 'function') {
    await (prisma as any).coachAssignment.deleteMany({
      where: { coachId, memberId }
    });
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "CoachAssignment" WHERE "coachId" = $1::uuid AND "memberId" = $2::uuid`,
      coachId,
      memberId
    );
  } catch {
    // Table may not exist yet
  }
}

/**
 * Creates a Coach, an Assigned Member (with coach assignment), and an Unassigned Member.
 */
export async function createCoachAndMemberPair(): Promise<{
  coach: TestUserContext;
  assignedMember: TestUserContext;
  unassignedMember: TestUserContext;
}> {
  const coach = await createTestUser({
    slug: 'coach',
    role: UserRole.COACH,
    displayName: 'Coach Taylor'
  });

  const assignedMember = await createTestUser({
    slug: 'assigned-member',
    role: UserRole.MEMBER,
    displayName: 'Member Jordan'
  });

  const unassignedMember = await createTestUser({
    slug: 'unassigned-member',
    role: UserRole.MEMBER,
    displayName: 'Member Casey'
  });

  await assignMemberToCoach(coach.user.id, assignedMember.user.id);

  return {
    coach,
    assignedMember,
    unassignedMember
  };
}

/**
 * Seeds a comprehensive dataset for a Member Dashboard test:
 * - Active community group and challenge
 * - Challenge participation with multi-day check-in streak
 * - Workout health records
 * - Nutrition logs and nutrition goals
 */
export async function seedMemberDashboardFixture(userId: string): Promise<{
  groupId: string;
  challengeId: string;
  participationId: string;
  checkInCount: number;
  workoutRecordId: string;
  nutritionEntryId: string;
}> {
  const prisma = getPrismaClient();

  // 1. Group & Active Challenge
  const group = await prisma.communityGroup.create({
    data: {
      name: `Fitness Club ${Date.now()}`,
      ownerId: userId
    }
  });

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() - 14);
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 16);

  const challenge = await prisma.challenge.create({
    data: {
      groupId: group.id,
      creatorId: userId,
      title: '30-Day Fitness Ignition',
      status: ChallengeStatus.ACTIVE,
      startsAt,
      endsAt
    }
  });

  const participation = await prisma.challengeParticipation.create({
    data: {
      challengeId: challenge.id,
      userId,
      status: ParticipationStatus.JOINED
    }
  });

  // 2. Multi-day check-in streak (5 consecutive days ending yesterday: days 1 to 5 in the past)
  for (let i = 5; i >= 1; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);

    await prisma.challengeCheckIn.create({
      data: {
        challengeId: challenge.id,
        participationId: participation.id,
        checkInDate: d,
        participationStatus: DailyParticipationStatus.COMPLETED
      }
    });
  }

  // 3. Workout Health Records
  const workoutStart = new Date();
  workoutStart.setHours(workoutStart.getHours() - 2);
  const workoutEnd = new Date();
  workoutEnd.setHours(workoutEnd.getHours() - 1);

  let connection = await prisma.userHealthConnection.findFirst({
    where: { userId }
  });
  if (!connection) {
    connection = await prisma.userHealthConnection.create({
      data: {
        userId,
        provider: 'HEALTH_CONNECT',
        deviceInstallId: `test-device-${userId}`,
        grantedScopes: ['WORKOUT']
      }
    });
  }

  const workoutRecord = await prisma.healthRecord.create({
    data: {
      userId,
      connectionId: connection.id,
      externalRecordId: `workout-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      type: 'WORKOUT',
      value: 60,
      unit: 'minutes',
      sourceApp: 'MANUAL',
      startTime: workoutStart,
      endTime: workoutEnd,
      metadata: {
        completedExercises: 5,
        totalExercises: 5,
        feedback: 'JUST_RIGHT',
        name: 'Full Body Functional Strength'
      }
    }
  });

  // 4. Nutrition Goal & Entry
  await prisma.userNutritionGoal.create({
    data: {
      userId,
      dailyCalorieTarget: 2200,
      dailyProteinG: 160,
      dailyCarbsG: 220,
      dailyFatG: 70,
      dailyWaterMl: 3000
    }
  });

  const nutritionEntry = await prisma.nutritionEntry.create({
    data: {
      userId,
      inputType: 'TEXT',
      totalCalories: 650,
      totalProteinG: 45,
      totalCarbsG: 60,
      totalFatG: 18,
      status: 'PROCESSED',
      rawText: 'Grilled salmon with quinoa and steamed asparagus',
      consumedAt: new Date()
    }
  });

  return {
    groupId: group.id,
    challengeId: challenge.id,
    participationId: participation.id,
    checkInCount: 5,
    workoutRecordId: workoutRecord.id,
    nutritionEntryId: nutritionEntry.id
  };
}

/**
 * Seeds feedback requests and check-in metrics for coach review testing.
 */
export async function seedCoachDashboardFixture(
  coachId: string,
  memberIds: string[]
): Promise<{
  feedbackRequestIds: string[];
}> {
  const prisma = getPrismaClient();
  const feedbackRequestIds: string[] = [];

  // Create a default product for coach feedback request FK
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        creatorId: coachId,
        name: 'SteadyAI Coaching Review',
        description: 'Personalized coach review and feedback session',
        priceCents: 0,
        currency: 'USD',
        isActive: true
      }
    });
  }

  for (const memberId of memberIds) {
    // Seed a pending feedback request
    const req = await prisma.coachFeedbackRequest.create({
      data: {
        userId: memberId,
        productId: product.id,
        topic: 'Weekly Form & Calorie Check',
        context: 'Struggling to hit protein goal without exceeding fat allowance',
        preferredOutcome: 'Macro adjustment recommendations',
        status: CoachFeedbackStatus.REQUESTED
      }
    });
    feedbackRequestIds.push(req.id);
  }

  return { feedbackRequestIds };
}
