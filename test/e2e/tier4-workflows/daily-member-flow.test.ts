import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { seedMemberDashboardFixture } from '../helpers/fixtures';

describe('Tier 4 Workflow: Daily Member Journey (Registration to Completed Daily Cycle)', () => {
  let app: FastifyInstance;

  before(async () => {
    assertIntegrationDbSafety();
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetIntegrationDb();
  });

  after(async () => {
    await closeTestApp();
  });

  it('Executes end-to-end member daily journey across all domains', async () => {
    const memberEmail = `daily-flow-${Date.now()}@steady.test`;
    const password = 'memberStrongPassword123!';

    // Step 1: Member Registration
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Alex Rivera',
        email: memberEmail,
        password
      }
    });
    assert.equal(regRes.statusCode, 201, 'Registration must succeed with 201');
    const { token, user } = regRes.json();
    assert.ok(token);
    assert.ok(user.id);

    const authHeaders = { authorization: `Bearer ${token}` };

    // Step 2: Context Resolution & Personal Space Verification
    const ctxRes = await app.inject({
      method: 'GET',
      url: '/api/platform/context',
      headers: authHeaders
    });
    assert.equal(ctxRes.statusCode, 200);
    const ctxBody = ctxRes.json();
    assert.equal(ctxBody.userIdentity.id, user.id);
    assert.equal(ctxBody.workspace.role, 'MEMBER');

    // Seed active challenge participation for member daily check-in
    await seedMemberDashboardFixture(user.id);

    // Step 3: Inspect Initial Dashboard State
    const initialDash = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: authHeaders
    });
    assert.equal(initialDash.statusCode, 200);
    const initialBody = initialDash.json();
    assert.ok(initialBody.progressSummary);
    assert.ok(Array.isArray(initialBody.dailyTasks));

    // Step 4: Configure Daily Nutrition Targets
    const goalsRes = await app.inject({
      method: 'POST',
      url: '/api/nutrition/goals',
      headers: authHeaders,
      payload: {
        dailyCalorieTarget: 2300,
        dailyProteinG: 170,
        dailyCarbsG: 230,
        dailyFatG: 75,
        dailyWaterMl: 3500
      }
    });
    assert.equal(goalsRes.statusCode, 200);

    // Step 5: Ingest Nutrition (Breakfast & Lunch)
    const mealRes = await app.inject({
      method: 'POST',
      url: '/api/nutrition/ingest',
      headers: authHeaders,
      payload: {
        inputType: 'TEXT',
        rawText: 'Oatmeal, whey protein, banana, blueberries',
        items: [
          { name: 'Oatmeal', calories: 300, proteinG: 10, carbsG: 54, fatG: 5 },
          { name: 'Whey Protein', calories: 120, proteinG: 24, carbsG: 2, fatG: 1 }
        ]
      }
    });
    assert.equal(mealRes.statusCode, 201);

    // Step 6: Log Workout Session
    const workoutRes = await app.inject({
      method: 'POST',
      url: '/api/workouts/session-summary',
      headers: authHeaders,
      payload: {
        userId: user.id,
        sessionId: '00000000-0000-0000-0000-000000000101',
        totalDurationMinutes: 60,
        completedExercises: 6,
        totalExercises: 6,
        feedback: 'JUST_RIGHT'
      }
    });
    assert.equal(workoutRes.statusCode, 200);

    // Step 7: Submit Daily Challenge Check-in
    const checkInRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: authHeaders,
      payload: { status: 'COMPLETED' }
    });
    assert.equal(checkInRes.statusCode, 201);

    // Step 8: Final Verification of Complete Member Dashboard
    const finalDash = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: authHeaders
    });
    assert.equal(finalDash.statusCode, 200);
    const finalBody = finalDash.json();

    assert.ok(finalBody.progressSummary.currentStreakDays >= 1);
    assert.ok(finalBody.workouts.sessions >= 1);
    assert.ok(finalBody.workouts.totalMinutes >= 60);
    assert.ok(finalBody.nutrition.calories >= 420);
    assert.ok(finalBody.nutrition.proteinG >= 34);
    assert.ok(finalBody.dailyTasks.length > 0);
  });

  it('Scenario 5: Cross-Platform Daily Check-in & Sync Flow', async () => {
    const memberEmail = `sync-flow-${Date.now()}@steady.test`;
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Morgan CrossPlatform',
        email: memberEmail,
        password: 'passwordSync123!'
      }
    });
    assert.equal(regRes.statusCode, 201);
    const { token, user } = regRes.json();
    const authHeaders = { authorization: `Bearer ${token}` };

    await seedMemberDashboardFixture(user.id);

    // Member submits check-in (simulating mobile app payload)
    const checkInRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: authHeaders,
      payload: { status: 'COMPLETED' }
    });
    assert.equal(checkInRes.statusCode, 201);

    // Verify member dashboard reflects updated task completion and streak
    const dashRes = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: authHeaders
    });
    assert.equal(dashRes.statusCode, 200);
    const dash = dashRes.json();
    assert.ok(dash.progressSummary.currentStreakDays >= 1);
    const checkInTask = dash.dailyTasks.find((t: any) => /check-in/i.test(t.title) || /checkin/i.test(t.id));
    assert.ok(checkInTask, 'Expected daily check-in task to be present in dailyTasks');
    assert.equal(checkInTask.completed, true);
  });
});
