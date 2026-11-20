import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { createCoachAndMemberPair, seedMemberDashboardFixture } from '../helpers/fixtures';

describe('Tier 1: Individual Member Reports (F11 & F12)', () => {
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

  it('GET /api/coach/members/:id/reports returns 200 with member identity and profile', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(body.member, 'Missing member identity');
    assert.equal(body.member.id, assignedMember.user.id);
    assert.equal(body.member.email, assignedMember.user.email);
    assert.ok(body.member.primaryGoal);
  });

  it('GET /api/coach/members/:id/reports includes historical health records', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(Array.isArray(body.healthRecords), 'healthRecords must be an array');
    assert.ok(body.healthRecords.length >= 1, 'healthRecords should contain recorded sessions');
    assert.equal(body.healthRecords[0].type, 'WORKOUT');
  });

  it('GET /api/coach/members/:id/reports includes workout session history', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(Array.isArray(body.workoutHistory), 'workoutHistory must be an array');
    assert.ok(body.workoutHistory.length >= 1);
    assert.ok(typeof body.workoutHistory[0].durationMinutes === 'number');
  });

  it('GET /api/coach/members/:id/reports includes nutrition overview and macro breakdowns', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(Array.isArray(body.nutritionOverview), 'nutritionOverview must be an array');
    assert.ok(body.nutritionOverview.length >= 1);
    assert.ok(typeof body.nutritionOverview[0].totalCalories === 'number');
    assert.ok(typeof body.nutritionOverview[0].totalProteinG === 'number');
  });

  it('GET /api/coach/members/:id/reports includes check-in history and engagement summary', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(Array.isArray(body.checkInHistory), 'checkInHistory must be an array');
    assert.ok(body.checkInHistory.length >= 1);
    assert.ok(body.engagementSummary, 'Missing engagementSummary');
    assert.ok(typeof body.engagementSummary.streakDays === 'number');
    assert.ok(typeof body.engagementSummary.totalCheckIns === 'number');
    assert.ok(typeof body.engagementSummary.adherenceRate === 'number');
  });
});
