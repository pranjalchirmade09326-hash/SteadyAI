import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { createTestUser, seedMemberDashboardFixture } from '../helpers/fixtures';

describe('Tier 2: Check-in Boundaries & Error Handling', () => {
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

  it('Duplicate check-in on the same UTC calendar day returns 409 Conflict', async () => {
    const member = await createTestUser({ slug: 'dup-checkin', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    // First check-in
    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: member.headers,
      payload: { status: 'COMPLETED' }
    });
    assert.equal(firstRes.statusCode, 201);

    // Immediate second check-in on the same day must conflict
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: member.headers,
      payload: { status: 'PARTIAL' }
    });
    assert.equal(dupRes.statusCode, 409);
    const dupBody = dupRes.json();
    assert.match(String(dupBody.error), /already submitted/i);
  });

  it('Check-in with invalid status string returns 400 Bad Request', async () => {
    const member = await createTestUser({ slug: 'inv-status', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: member.headers,
      payload: { status: 'NOT_A_VALID_STATUS' }
    });

    assert.equal(response.statusCode, 400);
    const body = response.json();
    assert.match(String(body.error), /COMPLETED|PARTIAL|SKIPPED/i);
  });

  it('Check-in attempt without active challenge participation returns 403 Forbidden', async () => {
    // User created without active challenge participation
    const userWithoutChallenge = await createTestUser({ slug: 'no-challenge', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: userWithoutChallenge.headers,
      payload: { status: 'COMPLETED' }
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.match(String(body.error), /no active challenge/i);
  });

  it('Check-in with empty request body or missing status returns 400 Bad Request', async () => {
    const member = await createTestUser({ slug: 'empty-checkin', role: UserRole.MEMBER });
    await seedMemberDashboardFixture(member.user.id);

    const emptyRes = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      headers: member.headers,
      payload: {}
    });

    assert.equal(emptyRes.statusCode, 400);
  });

  it('Check-in without authorization headers returns 401 Unauthorized', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/challenges/check-in',
      payload: { status: 'COMPLETED' }
    });

    assert.equal(response.statusCode, 401);
  });
});
