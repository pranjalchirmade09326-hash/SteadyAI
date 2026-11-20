import { getPrismaClient } from '../../../src/db/prisma';
import { installInMemoryDatabase, resetInMemoryStore } from './in-memory-db';

let isLiveDbChecked = false;
let isLiveDb = false;

export async function probeDbConnection(): Promise<boolean> {
  if (isLiveDbChecked) return isLiveDb;
  const prisma = getPrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    isLiveDb = true;
  } catch {
    isLiveDb = false;
    installInMemoryDatabase(prisma);
  }
  isLiveDbChecked = true;
  return isLiveDb;
}

/**
 * Asserts that the integration test suite is executing against an authorized
 * test database, preventing accidental execution against staging or production.
 */
export function assertIntegrationDbSafety(): void {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
  const activeDatabaseUrl = process.env.DATABASE_URL?.trim();

  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for integration and E2E tests.');
  }

  if (!activeDatabaseUrl || activeDatabaseUrl !== testDatabaseUrl) {
    throw new Error('DATABASE_URL must be set to TEST_DATABASE_URL for integration and E2E tests.');
  }

  if (!/test/i.test(testDatabaseUrl) && process.env.ALLOW_INTEGRATION_DB_RESET !== '1') {
    throw new Error(
      'Refusing to run E2E tests: TEST_DATABASE_URL does not look like a test database. ' +
        'Set ALLOW_INTEGRATION_DB_RESET=1 to bypass if this is intentional.'
    );
  }
}

/**
 * Resets the integration database state in strict reverse topological order
 * (leaf records first, parents last) to avoid foreign key constraint failures.
 */
export async function resetIntegrationDb(): Promise<void> {
  const isLive = await probeDbConnection();
  if (!isLive) {
    resetInMemoryStore();
    return;
  }

  const prisma = getPrismaClient();

  // Attempt raw truncate cascade first for high-performance atomic reset if PostgreSQL allows
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CoachAssignment') THEN
          TRUNCATE TABLE "CoachAssignment" CASCADE;
        END IF;
      END $$;
    `);
  } catch {
    // Continue with transaction-based reset if raw query is not supported
  }

  const modelsToDelete: any[] = [];

  // Delete dynamic CoachAssignment if present in Prisma client
  if ('coachAssignment' in prisma && typeof (prisma as any).coachAssignment?.deleteMany === 'function') {
    modelsToDelete.push((prisma as any).coachAssignment.deleteMany());
  }

  // Deletion in reverse topological order (foreign key holders before referenced tables)
  modelsToDelete.push(
    prisma.agentEvent.deleteMany(),
    prisma.agentRun.deleteMany(),
    prisma.coachFeedbackRequest.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.product.deleteMany(),
    prisma.workspaceMember.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.challengeCheckIn.deleteMany(),
    prisma.challengeParticipation.deleteMany(),
    prisma.reaction.deleteMany(),
    prisma.post.deleteMany(),
    prisma.challenge.deleteMany(),
    prisma.communityGroup.deleteMany(),
    prisma.notificationDispatchLog.deleteMany(),
    prisma.userNotificationSettings.deleteMany(),
    prisma.nutritionAiAnalysis.deleteMany(),
    prisma.nutritionItem.deleteMany(),
    prisma.nutritionImage.deleteMany(),
    prisma.nutritionEntry.deleteMany(),
    prisma.nutritionHealthCorrelation.deleteMany(),
    prisma.nutritionDailySummary.deleteMany(),
    prisma.userNutritionGoal.deleteMany(),
    prisma.waterIntakeLog.deleteMany(),
    prisma.healthRecord.deleteMany(),
    prisma.healthSyncBatch.deleteMany(),
    prisma.userHealthConnection.deleteMany(),
    prisma.userApiKeys.deleteMany(),
    prisma.user.deleteMany()
  );

  await prisma.$transaction(modelsToDelete);
}
