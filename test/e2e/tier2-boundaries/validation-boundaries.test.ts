import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { createTestUser, createCoachAndMemberPair } from '../helpers/fixtures';

describe('Tier 2: Validation Boundaries & Payload Handling', () => {
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

  it('GET /api/coach/roster gracefully handles empty roster with 200 and empty array', async () => {
    const coachWithNoClients = await createTestUser({ slug: 'zero-clients', role: UserRole.COACH });

    const response = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: coachWithNoClients.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.totalAssigned, 0);
    assert.ok(Array.isArray(body.members));
    assert.equal(body.members.length, 0);
  });

  it('POST /api/coach/feedback missing both feedbackRequestId and memberId returns 400 Bad Request', async () => {
    const coach = await createTestUser({ slug: 'coach-feedback-err', role: UserRole.COACH });

    const response = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.headers,
      payload: {
        reply: 'Valid reply text without target'
      }
    });

    assert.equal(response.statusCode, 400);
    const body = response.json();
    assert.match(String(body.error), /required|feedbackRequestId|memberId/i);
  });

  it('POST /api/coach/feedback with empty or whitespace-only reply returns 400 Bad Request', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();

    const response = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.headers,
      payload: {
        memberId: assignedMember.user.id,
        feedbackText: '   '
      }
    });

    assert.equal(response.statusCode, 400);
  });

  it('GET /api/coach/members/:id/reports with nonexistent member UUID returns 403 or 404', async () => {
    const coach = await createTestUser({ slug: 'coach-nonexistent', role: UserRole.COACH });
    const nonexistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    const response = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${nonexistentId}/reports`,
      headers: coach.headers
    });

    // 403 Forbidden (assignment check failed) or 404 Not Found (member does not exist)
    assert.ok(
      response.statusCode === 403 || response.statusCode === 404,
      `Expected 403 or 404, received ${response.statusCode}`
    );
  });

  it('POST /api/auth/register with missing required fields returns 400 Bad Request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Incomplete User'
        // Missing email and password
      }
    });

    assert.equal(response.statusCode, 400);
  });

  it('POST /api/auth/register with short password (<6 chars) returns 400 Bad Request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Short PW User',
        email: `shortpw-${Date.now()}@steady.test`,
        password: '123'
      }
    });

    assert.equal(response.statusCode, 400);
    const body = response.json();
    assert.match(String(body.error), /password|length|6/i);
  });

  it('POST /api/auth/register with already registered email returns 409 Conflict', async () => {
    const existingEmail = `dupemail-${Date.now()}@steady.test`;

    // First registration
    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'First User',
        email: existingEmail,
        password: 'password123Secure!'
      }
    });
    assert.equal(firstRes.statusCode, 201);

    // Duplicate registration attempt
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Second User',
        email: existingEmail,
        password: 'anotherPassword456!'
      }
    });

    assert.equal(dupRes.statusCode, 409);
    const body = dupRes.json();
    assert.match(String(body.error), /already registered|conflict/i);
  });

  it('POST /api/auth/login with incorrect password returns 401 Unauthorized', async () => {
    const email = `wrongpw-${Date.now()}@steady.test`;

    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Auth User',
        email,
        password: 'correctPassword123!'
      }
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email,
        password: 'incorrectPassword!'
      }
    });

    assert.equal(loginRes.statusCode, 401);
    const body = loginRes.json();
    assert.match(String(body.error), /invalid|unauthorized/i);
  });
});
