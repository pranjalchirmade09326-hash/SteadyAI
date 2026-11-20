import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { createTestUser, createCoachAndMemberPair, seedMemberDashboardFixture } from '../helpers/fixtures';
import { generateExpiredJwt, generateInvalidSignatureJwt } from '../helpers/auth';

describe('Tier 2: RBAC Boundaries & Access Control', () => {
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

  it('Unassigned coach accessing /api/coach/members/:id/reports receives 403 Forbidden', async () => {
    const { coach, unassignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(unassignedMember.user.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${unassignedMember.user.id}/reports`,
      headers: coach.headers
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.match(String(body.error), /not assigned|forbidden/i);
  });

  it('Member user accessing GET /api/coach/roster receives 403 Forbidden', async () => {
    const member = await createTestUser({ slug: 'member-user', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: member.headers
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.match(String(body.error), /coach|forbidden/i);
  });

  it('Member user accessing GET /api/coach/feedback-queue receives 403 Forbidden', async () => {
    const member = await createTestUser({ slug: 'member-user-2', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/feedback-queue',
      headers: member.headers
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.match(String(body.error), /coach|forbidden/i);
  });

  it('Member user accessing GET /api/coach/metrics receives 403 Forbidden', async () => {
    const member = await createTestUser({ slug: 'member-user-3', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/metrics',
      headers: member.headers
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.match(String(body.error), /coach|forbidden/i);
  });

  it('Member accessing own ID via /api/coach/members/:id/reports receives 403 Forbidden', async () => {
    const member = await createTestUser({ slug: 'member-self', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${member.user.id}/reports`,
      headers: member.headers
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.match(String(body.error), /coach|forbidden/i);
  });

  it('Unauthenticated requests to coach and member routes receive 401 Unauthorized', async () => {
    const coachRes = await app.inject({
      method: 'GET',
      url: '/api/coach/roster'
    });
    assert.equal(coachRes.statusCode, 401);

    const memberRes = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard'
    });
    assert.equal(memberRes.statusCode, 401);

    const reportsRes = await app.inject({
      method: 'GET',
      url: '/api/coach/members/00000000-0000-0000-0000-000000000001/reports'
    });
    assert.equal(reportsRes.statusCode, 401);
  });

  it('Request with expired JWT token receives 401 Unauthorized', async () => {
    const user = await createTestUser({ slug: 'expired-token-user', role: UserRole.MEMBER });
    const expiredToken = generateExpiredJwt({ sub: user.user.id, email: user.user.email });

    const response = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    });

    assert.equal(response.statusCode, 401);
  });

  it('Request with invalid signature JWT receives 401 Unauthorized', async () => {
    const user = await createTestUser({ slug: 'bad-sig-user', role: UserRole.MEMBER });
    const invalidToken = generateInvalidSignatureJwt({ sub: user.user.id, email: user.user.email });

    const response = await app.inject({
      method: 'GET',
      url: '/api/member/dashboard',
      headers: {
        authorization: `Bearer ${invalidToken}`
      }
    });

    assert.equal(response.statusCode, 401);
  });
});
