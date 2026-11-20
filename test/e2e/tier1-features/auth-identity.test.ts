import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import { createTestUser } from '../helpers/fixtures';
import { generateTestJwt } from '../helpers/auth';

describe('Tier 1: Auth & Platform Identity (F1 & F2)', () => {
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

  it('POST /api/auth/register creates user with default MEMBER role and returns token', async () => {
    const email = `newmember-${Date.now()}@steady.test`;
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Jordan Member',
        email,
        password: 'password123Secure!'
      }
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();

    assert.ok(body.token, 'Expected JWT token in registration response');
    assert.ok(body.user, 'Expected user object in registration response');
    assert.equal(body.user.email, email);
    assert.equal(body.user.displayName, 'Jordan Member');
    assert.equal(body.user.role, 'MEMBER');
  });

  it('POST /api/auth/register supports explicit role assignment (COACH)', async () => {
    const email = `newcoach-${Date.now()}@steady.test`;
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Coach Sarah',
        email,
        password: 'coachPassword123!',
        role: 'COACH'
      }
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();

    assert.ok(body.token);
    assert.equal(body.user.email, email);
    assert.equal(body.user.role, 'COACH');
  });

  it('POST /api/auth/login authenticates registered user and issues valid token', async () => {
    const email = `loginuser-${Date.now()}@steady.test`;
    const password = 'loginSecret123!';

    // Register first
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Login User',
        email,
        password
      }
    });
    assert.equal(regRes.statusCode, 201);

    // Attempt login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email,
        password
      }
    });

    assert.equal(loginRes.statusCode, 200);
    const body = loginRes.json();

    assert.ok(body.token, 'Expected JWT token on successful login');
    assert.equal(body.user.email, email);
    assert.equal(body.user.displayName, 'Login User');
  });

  it('GET /api/auth/me returns profile of authenticated user session', async () => {
    const testUser = await createTestUser({ slug: 'me-user', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${testUser.token}`
      }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.ok(body.user);
    assert.equal(body.user.id, testUser.user.id);
    assert.equal(body.user.email, testUser.user.email);
    assert.equal(body.user.role, 'MEMBER');
  });

  it('GET /api/platform/context returns user identity, workspace, and enabled modules', async () => {
    const testUser = await createTestUser({ slug: 'ctx-user', role: UserRole.MEMBER });

    const response = await app.inject({
      method: 'GET',
      url: '/api/platform/context',
      headers: testUser.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.deepStrictEqual(body.userIdentity, {
      id: testUser.user.id,
      email: testUser.user.email,
      displayName: testUser.user.displayName,
      onboardingCompleted: testUser.user.onboardingCompleted
    });

    assert.ok(body.workspace);
    assert.equal(body.workspace.role, UserRole.MEMBER);
    assert.ok(Array.isArray(body.enabledModules));
  });

  it('GET /api/platform/context correctly reflects COACH role for coach user', async () => {
    const coachUser = await createTestUser({ slug: 'ctx-coach', role: UserRole.COACH });

    const response = await app.inject({
      method: 'GET',
      url: '/api/platform/context',
      headers: coachUser.headers
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();

    assert.equal(body.workspace.role, UserRole.COACH);
  });
});
