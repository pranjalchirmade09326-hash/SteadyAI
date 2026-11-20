import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import {
  createTestUser,
  createCoachAndMemberPair,
  seedCoachDashboardFixture,
  seedMemberDashboardFixture
} from '../helpers/fixtures';

describe('Tier 1: Coach Dashboard & Operations (F7, F8, F9, F10)', () => {
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

  it('GET /api/coach/roster returns 200 with assigned members and status details', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(body.coachId);
    assert.ok(typeof body.totalAssigned === 'number');
    assert.ok(Array.isArray(body.members));
    assert.equal(body.totalAssigned, 1);
    assert.equal(body.members.length, 1);

    const member = body.members[0];
    assert.equal(member.id, assignedMember.user.id);
    assert.equal(member.email, assignedMember.user.email);
    assert.ok(typeof member.currentStreak === 'number');
    assert.ok(typeof member.adherenceRate === 'number');
  });

  it('GET /api/coach/roster returns 200 with empty list when coach has no assigned members', async () => {
    const unassignedCoach = await createTestUser({ slug: 'lonely-coach', role: UserRole.COACH });

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: unassignedCoach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.equal(body.totalAssigned, 0);
    assert.deepStrictEqual(body.members, []);
  });

  it('GET /api/coach/feedback-queue returns pending feedback requests from assigned members', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedCoachDashboardFixture(coach.user.id, [assignedMember.user.id]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/feedback-queue',
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(typeof body.total === 'number');
    assert.ok(Array.isArray(body.queue));
    assert.ok(body.total >= 1);
    assert.equal(body.queue[0].memberId, assignedMember.user.id);
    assert.equal(body.queue[0].status, 'REQUESTED');
  });

  it('POST /api/coach/feedback replies to feedback request and transitions status to RESPONDED', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    const { feedbackRequestIds } = await seedCoachDashboardFixture(coach.user.id, [assignedMember.user.id]);
    const requestId = feedbackRequestIds[0];

    const replyText = 'Great effort! Focus on increasing lean protein with Greek yogurt and egg whites.';
    const response = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.headers,
      payload: {
        feedbackRequestId: requestId,
        reply: replyText
      }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.equal(body.success, true);
    assert.ok(body.updatedRequest);
    assert.equal(body.updatedRequest.id, requestId);
    assert.equal(body.updatedRequest.status, 'RESPONDED');
    assert.equal(body.updatedRequest.coachReply, replyText);
  });

  it('POST /api/coach/feedback supports direct member feedback note with adjustments', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();

    const response = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.headers,
      payload: {
        memberId: assignedMember.user.id,
        feedbackText: 'Strong workout adherence this week. Added 150 kcal for training days.',
        category: 'Weekly Check-in',
        calorieAdjustmentKcal: 150
      }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.success, true);
  });

  it('GET /api/coach/metrics returns client totals, adherence rate, and pending reviews', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);
    await seedCoachDashboardFixture(coach.user.id, [assignedMember.user.id]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/metrics',
      headers: coach.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(typeof body.totalClients === 'number');
    assert.ok(typeof body.activeClients === 'number');
    assert.ok(typeof body.adherenceRate === 'number');
    assert.ok(typeof body.pendingReviews === 'number');
    assert.equal(body.totalClients, 1);
    assert.ok(body.pendingReviews >= 1);
  });
});
