import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { createTestUser, seedMemberDashboardFixture } from '../helpers/fixtures';

describe('Tier 1: Member Dashboard & Activity Domain (F3, F4, F5, F6)', () => {
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

  it('GET /api/member/dashboard returns 200 with full aggregated metrics schema', async () => {
    const member = await createTestUser({ slug: 'member-dash', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: member.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    // Verify progress summary
    assert.ok(body.progressSummary, 'Missing progressSummary');
    assert.ok(typeof body.progressSummary.currentStreakDays === 'number');
    assert.ok(typeof body.progressSummary.completionRate === 'number');
    assert.ok(typeof body.progressSummary.totalCheckIns === 'number');

    // Verify daily tasks
    assert.ok(Array.isArray(body.dailyTasks), 'dailyTasks must be an array');
    assert.ok(body.dailyTasks.length > 0, 'dailyTasks should contain task entries');

    // Verify recent activity
    assert.ok(Array.isArray(body.recentActivity), 'recentActivity must be an array');

    // Verify workouts section
    assert.ok(body.workouts, 'Missing workouts');
    assert.ok(typeof body.workouts.sessions === 'number');
    assert.ok(typeof body.workouts.totalMinutes === 'number');

    // Verify nutrition section
    assert.ok(body.nutrition, 'Missing nutrition');
    assert.ok(typeof body.nutrition.calories === 'number');
    assert.ok(typeof body.nutrition.proteinG === 'number');

    // Verify checkInStatus
    assert.ok(body.checkInStatus, 'Missing checkInStatus');
  });

  it('GET /api/member/dashboard reflects streak and check-in count accurately', async () => {
    const member = await createTestUser({ slug: 'streak-dash', role: UserRole.MEMBER });
    const seeded = await seedMemberDashboardFixture(member.user.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: member.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.equal(body.progressSummary.totalCheckIns, seeded.checkInCount);
    assert.ok(body.progressSummary.currentStreakDays >= seeded.checkInCount);
  });

  it('POST /api/challenges/check-in records daily check-in and updates dashboard status', async () => {
    const member = await createTestUser({ slug: 'checkin-member', role: UserRole.MEMBER });
    const seeded = await seedMemberDashboardFixture(member.user.id);

    // Verify initial dashboard
    const initialDash = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: member.headers
    });
    assert.equal(initialDash.statusCode, 200);

    // Submit check-in for today
    const checkInRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: member.headers,
      payload: {
        status: 'COMPLETED'
      }
    });

    assert.equal(checkInRes.statusCode, 201);

    // Verify updated dashboard
    const updatedDash = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: member.headers
    });
    assert.equal(updatedDash.statusCode, 200);
    const body = updatedDash.json();
    assert.equal(body.progressSummary.totalCheckIns, seeded.checkInCount + 1);
  });

  it('POST /api/nutrition/ingest logs meal and updates dashboard nutrition totals', async () => {
    const member = await createTestUser({ slug: 'nutr-member', role: UserRole.MEMBER });

    const ingestRes = await app.inject({
      method: 'POST',
      url: '/api/nutrition/ingest',
      headers: member.headers,
      payload: {
        inputType: 'TEXT',
        rawText: 'Chicken breast with brown rice',
        items: [
          {
            name: 'Chicken breast',
            calories: 350,
            proteinG: 50,
            carbsG: 0,
            fatG: 5
          },
          {
            name: 'Brown rice',
            calories: 220,
            proteinG: 5,
            carbsG: 45,
            fatG: 2
          }
        ]
      }
    });

    assert.equal(ingestRes.statusCode, 201);
    const ingestBody = ingestRes.json();
    assert.equal(ingestBody.totalCalories, 570);
    assert.equal(ingestBody.totalProteinG, 55);

    // Verify dashboard reflects logged nutrition
    const dashRes = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: member.headers
    });
    assert.equal(dashRes.statusCode, 200);
    const dashBody = dashRes.json();
    assert.ok(dashBody.nutrition.calories >= 570);
    assert.ok(dashBody.nutrition.proteinG >= 55);
  });

  it('POST /api/workouts/session-summary logs workout session and reflects in dashboard', async () => {
    const member = await createTestUser({ slug: 'workout-member', role: UserRole.MEMBER });

    const workoutRes = await app.inject({
      method: 'POST',
      url: '/api/workouts/session-summary',
      headers: member.headers,
      payload: {
        userId: member.user.id,
        sessionId: '00000000-0000-0000-0000-000000000001',
        totalDurationMinutes: 50,
        completedExercises: 5,
        totalExercises: 5,
        feedback: 'JUST_RIGHT'
      }
    });

    assert.equal(workoutRes.statusCode, 200);
    const workoutBody = workoutRes.json();
    assert.equal(workoutBody.success, true);

    // Verify dashboard reflects logged workout
    const dashRes = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: member.headers
    });
    assert.equal(dashRes.statusCode, 200);
    const dashBody = dashRes.json();
    assert.ok(dashBody.workouts.sessions >= 1);
    assert.ok(dashBody.workouts.totalMinutes >= 50);
  });

  it('GET /api/reports/overview returns multi-day trends and aggregated metrics', async () => {
    const member = await createTestUser({ slug: 'rep-overview', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/overview?days=7',
      headers: member.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(body.period);
    assert.equal(body.period.days, 7);
    assert.ok(body.challenge);
    assert.ok(body.nutrition);
    assert.ok(body.workout);
  });
});
