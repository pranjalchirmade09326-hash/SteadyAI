import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import {
  createTestUser,
  assignMemberToCoach,
  unassignMemberFromCoach,
  seedMemberDashboardFixture,
  seedCoachDashboardFixture
} from '../helpers/fixtures';

describe('Tier 3: Coach Assignment Lifecycle & Dynamic RBAC', () => {
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

  it('Newly assigned member immediately appears in coach roster', async () => {
    const coach = await createTestUser({ slug: 'coach-lifecycle-1', role: UserRole.COACH });
    const member = await createTestUser({ slug: 'member-lifecycle-1', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    // Initial check: 0 members in roster
    const initialRosterRes = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: coach.headers
    });
    assert.equal(initialRosterRes.statusCode, 200);
    assert.equal(initialRosterRes.json().totalAssigned, 0);

    // Perform assignment
    await assignMemberToCoach(coach.user.id, member.user.id);

    // Post-assignment check: member appears immediately
    const updatedRosterRes = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: coach.headers
    });
    assert.equal(updatedRosterRes.statusCode, 200);
    const body = updatedRosterRes.json();
    assert.equal(body.totalAssigned, 1);
    assert.equal(body.members[0].id, member.user.id);
  });

  it('Assignment grants immediate access to individual member reports', async () => {
    const coach = await createTestUser({ slug: 'coach-rep-access', role: UserRole.COACH });
    const member = await createTestUser({ slug: 'member-rep-access', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    // Before assignment: 403 Forbidden
    const unassignedRes = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: coach.headers
    });
    assert.equal(unassignedRes.statusCode, 403);

    // Assign member
    await assignMemberToCoach(coach.user.id, member.user.id);

    // After assignment: 200 OK
    const assignedRes = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: coach.headers
    });
    assert.equal(assignedRes.statusCode, 200);
    const body = assignedRes.json();
    assert.equal(body.member.id, member.user.id);
  });

  it('Reassignment immediately transfers RBAC access from Coach A to Coach B', async () => {
    const coachA = await createTestUser({ slug: 'coach-a', role: UserRole.COACH });
    const coachB = await createTestUser({ slug: 'coach-b', role: UserRole.COACH });
    const member = await createTestUser({ slug: 'shared-member', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    // Initial state: Assigned to Coach A
    await assignMemberToCoach(coachA.user.id, member.user.id);

    const coachABefore = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: coachA.headers
    });
    assert.equal(coachABefore.statusCode, 200);

    const coachBBefore = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: coachB.headers
    });
    assert.equal(coachBBefore.statusCode, 403);

    // Reassign: Unassign from Coach A, assign to Coach B
    await unassignMemberFromCoach(coachA.user.id, member.user.id);
    await assignMemberToCoach(coachB.user.id, member.user.id);

    // Post-reassignment: Coach A revoked (403), Coach B granted (200)
    const coachAAfter = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: coachA.headers
    });
    assert.equal(coachAAfter.statusCode, 403);

    const coachBAfter = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: coachB.headers
    });
    assert.equal(coachBAfter.statusCode, 200);
  });

  it('Feedback queue dynamically updates when member is reassigned', async () => {
    const coachA = await createTestUser({ slug: 'coach-fq-a', role: UserRole.COACH });
    const coachB = await createTestUser({ slug: 'coach-fq-b', role: UserRole.COACH });
    const member = await createTestUser({ slug: 'member-fq', role: UserRole.MEMBER });

    await assignMemberToCoach(coachA.user.id, member.user.id);
    await seedCoachDashboardFixture(coachA.user.id, [member.user.id]);

    // Coach A sees 1 request; Coach B sees 0
    const qA1 = await app.inject({ method: 'GET', url: '/api/coach/feedback-queue', headers: coachA.headers });
    assert.equal(qA1.statusCode, 200);
    assert.equal(qA1.json().total, 1);

    const qB1 = await app.inject({ method: 'GET', url: '/api/coach/feedback-queue', headers: coachB.headers });
    assert.equal(qB1.statusCode, 200);
    assert.equal(qB1.json().total, 0);

    // Reassign member to Coach B
    await unassignMemberFromCoach(coachA.user.id, member.user.id);
    await assignMemberToCoach(coachB.user.id, member.user.id);

    // Coach A now sees 0; Coach B now sees 1
    const qA2 = await app.inject({ method: 'GET', url: '/api/coach/feedback-queue', headers: coachA.headers });
    assert.equal(qA2.statusCode, 200);
    assert.equal(qA2.json().total, 0);

    const qB2 = await app.inject({ method: 'GET', url: '/api/coach/feedback-queue', headers: coachB.headers });
    assert.equal(qB2.statusCode, 200);
    assert.equal(qB2.json().total, 1);
  });

  it('Coach engagement metrics dynamically update with assignment changes', async () => {
    const coach = await createTestUser({ slug: 'coach-metrics-dyn', role: UserRole.COACH });
    const member1 = await createTestUser({ slug: 'm-dyn-1', role: UserRole.MEMBER });
    const member2 = await createTestUser({ slug: 'm-dyn-2', role: UserRole.MEMBER });

    // Initial: 0 clients
    const m0 = await app.inject({ method: 'GET', url: '/api/coach/metrics', headers: coach.headers });
    assert.equal(m0.statusCode, 200);
    assert.equal(m0.json().totalClients, 0);

    // Assign Member 1: totalClients = 1
    await assignMemberToCoach(coach.user.id, member1.user.id);
    const m1 = await app.inject({ method: 'GET', url: '/api/coach/metrics', headers: coach.headers });
    assert.equal(m1.statusCode, 200);
    assert.equal(m1.json().totalClients, 1);

    // Assign Member 2: totalClients = 2
    await assignMemberToCoach(coach.user.id, member2.user.id);
    const m2 = await app.inject({ method: 'GET', url: '/api/coach/metrics', headers: coach.headers });
    assert.equal(m2.statusCode, 200);
    assert.equal(m2.json().totalClients, 2);

    // Unassign Member 1: totalClients decrements to 1
    await unassignMemberFromCoach(coach.user.id, member1.user.id);
    const m3 = await app.inject({ method: 'GET', url: '/api/coach/metrics', headers: coach.headers });
    assert.equal(m3.statusCode, 200);
    assert.equal(m3.json().totalClients, 1);
  });
});
