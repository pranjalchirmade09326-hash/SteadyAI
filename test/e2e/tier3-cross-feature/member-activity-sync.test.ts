import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import {
  createCoachAndMemberPair,
  seedMemberDashboardFixture,
  seedCoachDashboardFixture
} from '../helpers/fixtures';

describe('Tier 3: Member Activity Cross-Feature Synchronization', () => {
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

  it('Workout logged by member immediately syncs to Member Dashboard and Coach Reports', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    // Member logs 45-min workout
    const logRes = await app.inject({
      method: 'POST',
      url: '/api/workouts/session-summary',
      headers: assignedMember.headers,
      payload: {
        userId: assignedMember.user.id,
        sessionId: '00000000-0000-0000-0000-000000000099',
        totalDurationMinutes: 45,
        completedExercises: 6,
        totalExercises: 6,
        feedback: 'JUST_RIGHT'
      }
    });
    assert.equal(logRes.statusCode, 200);

    // Verify member dashboard reflects the workout
    const memberDash = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: assignedMember.headers
    });
    assert.equal(memberDash.statusCode, 200);
    const dashBody = memberDash.json();
    assert.ok(dashBody.workouts.sessions >= 1);

    // Verify coach member report reflects the exact same workout
    const coachReport = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });
    assert.equal(coachReport.statusCode, 200);
    const reportBody = coachReport.json();
    assert.ok(Array.isArray(reportBody.workoutHistory));
    assert.ok(reportBody.workoutHistory.some((w: any) => w.durationMinutes === 45 || w.duration === 45));
  });

  it('Nutrition logged by member syncs to Member Dashboard and Coach Reports', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();

    // Member logs meal
    const nutrRes = await app.inject({
      method: 'POST',
      url: '/api/nutrition/ingest',
      headers: assignedMember.headers,
      payload: {
        inputType: 'TEXT',
        rawText: 'Steak and sweet potato',
        items: [
          {
            name: 'Ribeye steak',
            calories: 600,
            proteinG: 55,
            carbsG: 0,
            fatG: 40
          }
        ]
      }
    });
    assert.equal(nutrRes.statusCode, 201);

    // Member dashboard reflects nutrition
    const dashRes = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: assignedMember.headers
    });
    assert.equal(dashRes.statusCode, 200);
    assert.ok(dashRes.json().nutrition.calories >= 600);

    // Coach reports reflects nutrition overview
    const coachReport = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });
    assert.equal(coachReport.statusCode, 200);
    const reportBody = coachReport.json();
    assert.ok(Array.isArray(reportBody.nutritionOverview));
    assert.ok(reportBody.nutritionOverview.length >= 1);
  });

  it('Member check-in updates Member Dashboard and Coach Roster adherence', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    // Member submits check-in
    const checkInRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: assignedMember.headers,
      payload: { status: 'COMPLETED' }
    });

    assert.equal(checkInRes.statusCode, 201);

    // Coach roster reflects updated last check-in status
    const rosterRes = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: coach.headers
    });
    assert.equal(rosterRes.statusCode, 200);
    const rosterBody = rosterRes.json();
    assert.equal(rosterBody.members[0].id, assignedMember.user.id);
    assert.ok(rosterBody.members[0].currentStreak >= 1);
  });

  it('Feedback request lifecycle flows seamlessly between Member and Coach', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    const { feedbackRequestIds } = await seedCoachDashboardFixture(coach.user.id, [assignedMember.user.id]);
    const reqId = feedbackRequestIds[0];

    // Coach feedback queue shows 1 pending request
    const qBefore = await app.inject({
      method: 'GET',
      url: '/api/coach/feedback-queue',
      headers: coach.headers
    });
    assert.equal(qBefore.statusCode, 200);
    assert.equal(qBefore.json().total, 1);

    // Coach submits reply
    const replyRes = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.headers,
      payload: {
        feedbackRequestId: reqId,
        reply: 'Keep progressive overload consistent and hydrate well.'
      }
    });
    assert.equal(replyRes.statusCode, 200);
    assert.equal(replyRes.json().success, true);

    // Coach feedback queue updates: 0 pending requests remaining
    const qAfter = await app.inject({
      method: 'GET',
      url: '/api/coach/feedback-queue',
      headers: coach.headers
    });
    assert.equal(qAfter.statusCode, 200);
    assert.equal(qAfter.json().total, 0);
  });

  it('Cross-feature consistency: Member Dashboard streak matches Coach Roster streak', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const [dashRes, rosterRes] = await Promise.all([
      app.inject({ method: 'GET', url: '/api/member/dashboard', headers: assignedMember.headers }),
      app.inject({ method: 'GET', url: '/api/coach/roster', headers: coach.headers })
    ]);

    assert.equal(dashRes.statusCode, 200);
    assert.equal(rosterRes.statusCode, 200);

    const dashStreak = dashRes.json().progressSummary.currentStreakDays;
    const rosterStreak = rosterRes.json().members[0].currentStreak;

    assert.equal(
      dashStreak,
      rosterStreak,
      `Streak mismatch: dashboard reported ${dashStreak}, roster reported ${rosterStreak}`
    );
  });
});
