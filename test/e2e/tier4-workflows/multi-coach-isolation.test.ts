import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import {
  createTestUser,
  assignMemberToCoach,
  seedMemberDashboardFixture,
  seedCoachDashboardFixture
} from '../helpers/fixtures';

describe('Tier 4 Workflow: Multi-Coach Multi-Tenant Isolation', () => {
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

  it('Strictly isolates roster, feedback queues, and member reports across distinct coaches', async () => {
    // 1. Setup Coach 1 and Coach 2
    const coach1 = await createTestUser({ slug: 'coach-tenant-1', role: UserRole.COACH });
    const coach2 = await createTestUser({ slug: 'coach-tenant-2', role: UserRole.COACH });

    // 2. Setup Members: 1A & 1B for Coach 1; 2A & 2B for Coach 2
    const member1A = await createTestUser({ slug: 'm1a', role: UserRole.MEMBER });
    const member1B = await createTestUser({ slug: 'm1b', role: UserRole.MEMBER });
    const member2A = await createTestUser({ slug: 'm2a', role: UserRole.MEMBER });
    const member2B = await createTestUser({ slug: 'm2b', role: UserRole.MEMBER });

    await assignMemberToCoach(coach1.user.id, member1A.user.id);
    await assignMemberToCoach(coach1.user.id, member1B.user.id);
    await assignMemberToCoach(coach2.user.id, member2A.user.id);
    await assignMemberToCoach(coach2.user.id, member2B.user.id);

    // Seed activities
    await seedMemberDashboardFixture(member1A.user.id);
    await seedMemberDashboardFixture(member2A.user.id);

    // Seed feedback requests
    const c1Fixture = await seedCoachDashboardFixture(coach1.user.id, [member1A.user.id]);
    const c2Fixture = await seedCoachDashboardFixture(coach2.user.id, [member2A.user.id]);

    const req1A = c1Fixture.feedbackRequestIds[0];
    const req2A = c2Fixture.feedbackRequestIds[0];

    // 3. Verify Roster Isolation
    const roster1 = await app.inject({ method: 'GET', url: '/api/coach/roster', headers: coach1.headers });
    assert.equal(roster1.statusCode, 200);
    const r1Members = roster1.json().members.map((m: any) => m.id);
    assert.ok(r1Members.includes(member1A.user.id));
    assert.ok(r1Members.includes(member1B.user.id));
    assert.ok(!r1Members.includes(member2A.user.id), 'Coach 1 roster must not contain Coach 2 member');
    assert.ok(!r1Members.includes(member2B.user.id), 'Coach 1 roster must not contain Coach 2 member');

    const roster2 = await app.inject({ method: 'GET', url: '/api/coach/roster', headers: coach2.headers });
    assert.equal(roster2.statusCode, 200);
    const r2Members = roster2.json().members.map((m: any) => m.id);
    assert.ok(r2Members.includes(member2A.user.id));
    assert.ok(r2Members.includes(member2B.user.id));
    assert.ok(!r2Members.includes(member1A.user.id), 'Coach 2 roster must not contain Coach 1 member');
    assert.ok(!r2Members.includes(member1B.user.id), 'Coach 2 roster must not contain Coach 1 member');

    // 4. Verify Individual Member Reports Isolation
    // Coach 1 accessing Member 1A -> 200
    const rep1Ok = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member1A.user.id}/reports`,
      headers: coach1.headers
    });
    assert.equal(rep1Ok.statusCode, 200);

    // Coach 1 accessing Member 2A -> 403 Forbidden
    const rep1Forbidden = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member2A.user.id}/reports`,
      headers: coach1.headers
    });
    assert.equal(rep1Forbidden.statusCode, 403);

    // Coach 2 accessing Member 2A -> 200
    const rep2Ok = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member2A.user.id}/reports`,
      headers: coach2.headers
    });
    assert.equal(rep2Ok.statusCode, 200);

    // Coach 2 accessing Member 1A -> 403 Forbidden
    const rep2Forbidden = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member1A.user.id}/reports`,
      headers: coach2.headers
    });
    assert.equal(rep2Forbidden.statusCode, 403);

    // 5. Verify Feedback Queue Isolation
    const q1 = await app.inject({ method: 'GET', url: '/api/coach/feedback-queue', headers: coach1.headers });
    assert.equal(q1.statusCode, 200);
    const q1Items = q1.json().queue.map((q: any) => q.id);
    assert.ok(q1Items.includes(req1A));
    assert.ok(!q1Items.includes(req2A), 'Coach 1 queue must not contain Coach 2 requests');

    const q2 = await app.inject({ method: 'GET', url: '/api/coach/feedback-queue', headers: coach2.headers });
    assert.equal(q2.statusCode, 200);
    const q2Items = q2.json().queue.map((q: any) => q.id);
    assert.ok(q2Items.includes(req2A));
    assert.ok(!q2Items.includes(req1A), 'Coach 2 queue must not contain Coach 1 requests');

    // 6. Verify Cross-Tenant Feedback Submission Rejection
    // Coach 1 attempting to reply to Coach 2's member request -> 403 Forbidden
    const crossReplyRes = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach1.headers,
      payload: {
        feedbackRequestId: req2A,
        reply: 'Unauthorized reply across tenant boundary'
      }
    });
    assert.equal(crossReplyRes.statusCode, 403);
  });

  it('Adversarial isolation: Coach cannot post feedback directly to unassigned member ID', async () => {
    const coach1 = await createTestUser({ slug: 'coach-adv-1', role: UserRole.COACH });
    const coach2 = await createTestUser({ slug: 'coach-adv-2', role: UserRole.COACH });
    const member2 = await createTestUser({ slug: 'member-adv-2', role: UserRole.MEMBER });

    await assignMemberToCoach(coach2.user.id, member2.user.id);

    // Coach 1 attempts to forge a feedback note directed at Coach 2's member
    const forgedPostRes = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach1.headers,
      payload: {
        memberId: member2.user.id,
        feedbackText: 'Hostile takeover coaching note',
        category: 'Weekly Check-in'
      }
    });

    assert.equal(forgedPostRes.statusCode, 403);
    const body = forgedPostRes.json();
    assert.match(String(body.error), /not assigned|forbidden/i);
  });
});
