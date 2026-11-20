import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';
import { CoachAssignmentStatus, UserRole } from '@prisma/client';

import { buildApp } from '../../src/app';
import { disconnectPrisma, getPrismaClient } from '../../src/db/prisma';
import { resetIntegrationDb } from './helpers';

describe('Auth & RBAC Integration Tests', () => {
  let app: FastifyInstance;
  let isDbConnected = false;

  // In-memory state store for offline environments
  const store = {
    users: [] as any[],
    workspaces: [] as any[],
    workspaceMembers: [] as any[],
    coachAssignments: [] as any[]
  };

  function resetStore() {
    store.users = [];
    store.workspaces = [];
    store.workspaceMembers = [];
    store.coachAssignments = [];
  }

  before(async () => {
    const prisma = getPrismaClient();

    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbConnected = true;
    } catch {
      isDbConnected = false;
    }

    if (!isDbConnected) {
      // Install in-memory mock handler on prisma instance
      const originalUser = prisma.user;
      const originalWorkspace = prisma.workspace;
      const originalWorkspaceMember = prisma.workspaceMember;
      const originalCoachAssignment = prisma.coachAssignment;
      const originalTransaction = prisma.$transaction.bind(prisma);

      (prisma as any).user = {
        create: async ({ data }: any) => {
          const user = {
            id: data.id || randomUUID(),
            email: data.email,
            username: data.username || data.email.split('@')[0],
            displayName: data.displayName || data.username || 'User',
            passwordHash: data.passwordHash || null,
            role: data.role || UserRole.MEMBER,
            onboardingCompleted: data.onboardingCompleted ?? false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          store.users.push(user);
          return { ...user };
        },
        findFirst: async ({ where }: any) => {
          return (
            store.users.find((u) => {
              if (where.email && u.email.toLowerCase() === where.email.toLowerCase()) return true;
              if (where.id && u.id === where.id) return true;
              if (where.username && u.username === where.username) return true;
              return false;
            }) || null
          );
        },
        findUnique: async ({ where, select }: any) => {
          const user = store.users.find((u) => {
            if (where.id && u.id === where.id) return true;
            if (where.email && u.email === where.email) return true;
            if (where.username && u.username === where.username) return true;
            return false;
          });
          if (!user) return null;
          if (select) {
            const res: any = {};
            for (const key of Object.keys(select)) {
              if (select[key]) res[key] = user[key];
            }
            return res;
          }
          return { ...user };
        },
        deleteMany: async () => {
          const count = store.users.length;
          store.users = [];
          return { count };
        }
      };

      (prisma as any).workspace = {
        create: async ({ data }: any) => {
          const ws = {
            id: data.id || randomUUID(),
            name: data.name,
            ownerId: data.ownerId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          store.workspaces.push(ws);
          return { ...ws };
        },
        findFirst: async ({ where }: any) => {
          return store.workspaces.find((w) => (where.id && w.id === where.id) || (where.ownerId && w.ownerId === where.ownerId)) || null;
        },
        findUnique: async ({ where }: any) => {
          return store.workspaces.find((w) => where.id && w.id === where.id) || null;
        },
        deleteMany: async () => {
          const count = store.workspaces.length;
          store.workspaces = [];
          return { count };
        }
      };

      (prisma as any).workspaceMember = {
        create: async ({ data }: any) => {
          const wm = {
            id: data.id || randomUUID(),
            workspaceId: data.workspaceId,
            userId: data.userId,
            role: data.role || UserRole.MEMBER,
            createdAt: new Date()
          };
          store.workspaceMembers.push(wm);
          return { ...wm };
        },
        findFirst: async ({ where, include }: any) => {
          const wm = store.workspaceMembers.find((m) => {
            if (where.userId && m.userId === where.userId) return true;
            if (where.workspaceId && m.workspaceId === where.workspaceId) return true;
            return false;
          });
          if (!wm) return null;
          const copy = { ...wm };
          if (include?.workspace) {
            copy.workspace = store.workspaces.find((w) => w.id === wm.workspaceId);
          }
          return copy;
        },
        deleteMany: async () => {
          const count = store.workspaceMembers.length;
          store.workspaceMembers = [];
          return { count };
        }
      };

      (prisma as any).coachAssignment = {
        create: async ({ data }: any) => {
          const ca = {
            id: data.id || randomUUID(),
            coachId: data.coachId,
            memberId: data.memberId,
            workspaceId: data.workspaceId || null,
            status: data.status || CoachAssignmentStatus.ACTIVE,
            assignedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          store.coachAssignments.push(ca);
          return { ...ca };
        },
        findFirst: async ({ where }: any) => {
          return (
            store.coachAssignments.find((a) => {
              if (where.coachId && a.coachId !== where.coachId) return false;
              if (where.memberId && a.memberId !== where.memberId) return false;
              if (where.status && a.status !== where.status) return false;
              return true;
            }) || null
          );
        },
        findMany: async ({ where }: any) => {
          return store.coachAssignments.filter((a) => {
            if (where?.coachId && a.coachId !== where.coachId) return false;
            if (where?.memberId && a.memberId !== where.memberId) return false;
            if (where?.status && a.status !== where.status) return false;
            return true;
          });
        },
        deleteMany: async () => {
          const count = store.coachAssignments.length;
          store.coachAssignments = [];
          return { count };
        }
      };

      (prisma as any).healthRecord = {
        findMany: async () => []
      };

      (prisma as any).nutritionEntry = {
        findMany: async () => []
      };

      (prisma as any).challengeParticipation = {
        findMany: async () => []
      };

      (prisma as any).coachFeedbackRequest = {
        findMany: async () => []
      };

      (prisma as any).$transaction = async (actions: any[]) => {
        const results = [];
        for (const action of actions) {
          if (typeof action?.then === 'function') {
            results.push(await action);
          } else {
            results.push(action);
          }
        }
        return results;
      };
    }

    app = await buildApp();
  });

  beforeEach(async () => {
    if (isDbConnected) {
      await resetIntegrationDb();
    } else {
      resetStore();
    }
  });

  after(async () => {
    await app.close();
    await disconnectPrisma();
  });

  // 1. POST /api/auth/register
  describe('POST /api/auth/register', () => {
    it('successfully registers a MEMBER and returns token and profile', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'member1@steady.test',
          password: 'Password123!',
          name: 'Jane Member',
          role: 'MEMBER'
        }
      });

      assert.equal(response.statusCode, 201);
      const body = response.json();

      assert.ok(body.token, 'Token must be present');
      assert.ok(body.user, 'User object must be present');
      assert.equal(body.user.email, 'member1@steady.test');
      assert.equal(body.user.role, UserRole.MEMBER);
      assert.equal(body.user.name, 'Jane Member');
    });

    it('successfully registers a COACH and returns token and profile', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'coach1@steady.test',
          password: 'CoachPassword123!',
          name: 'Coach Bob',
          role: 'COACH'
        }
      });

      assert.equal(response.statusCode, 201);
      const body = response.json();

      assert.ok(body.token, 'Token must be present');
      assert.equal(body.user.email, 'coach1@steady.test');
      assert.equal(body.user.role, UserRole.COACH);
      assert.equal(body.user.name, 'Coach Bob');
    });

    it('rejects duplicate email with 409 Conflict', async () => {
      // First registration
      const first = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate@steady.test',
          password: 'Password123!',
          name: 'Original'
        }
      });
      assert.equal(first.statusCode, 201);

      // Second registration with same email
      const second = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate@steady.test',
          password: 'Password456!',
          name: 'Duplicate'
        }
      });

      assert.equal(second.statusCode, 409);
      const body = second.json();
      assert.equal(body.error, 'Conflict');
    });

    it('rejects short passwords (< 8 characters) with 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'shortpass@steady.test',
          password: 'short',
          name: 'Short'
        }
      });

      assert.equal(response.statusCode, 400);
    });
  });

  // 2. POST /api/auth/login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'login-test@steady.test',
          password: 'CorrectPassword123!',
          name: 'Login User',
          role: 'MEMBER'
        }
      });
    });

    it('successfully logs in with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login-test@steady.test',
          password: 'CorrectPassword123!'
        }
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();

      assert.ok(body.token, 'JWT token must be returned');
      assert.ok(body.user, 'User object must be returned');
      assert.equal(body.user.email, 'login-test@steady.test');
      assert.equal(body.user.role, UserRole.MEMBER);
    });

    it('rejects invalid password with 401 Unauthorized', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login-test@steady.test',
          password: 'WrongPassword999!'
        }
      });

      assert.equal(response.statusCode, 401);
      const body = response.json();
      assert.equal(body.error, 'Unauthorized');
      assert.equal(body.message, 'Invalid email or password');
    });

    it('rejects non-existent email with 401 Unauthorized', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@steady.test',
          password: 'SomePassword123!'
        }
      });

      assert.equal(response.statusCode, 401);
      const body = response.json();
      assert.equal(body.error, 'Unauthorized');
    });
  });

  // 3. GET /api/auth/me
  describe('GET /api/auth/me', () => {
    let memberToken: string;
    let memberId: string;

    beforeEach(async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'me-user@steady.test',
          password: 'Password123!',
          name: 'Me User',
          role: 'MEMBER'
        }
      });
      const data = reg.json();
      memberToken = data.token;
      memberId = data.user.id;
    });

    it('returns current user profile with Bearer JWT token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${memberToken}`
        }
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();

      assert.equal(body.user.id, memberId);
      assert.equal(body.user.email, 'me-user@steady.test');
      assert.equal(body.user.role, UserRole.MEMBER);
      assert.ok(body.user.workspaceId, 'workspaceId should be included');
    });

    it('returns current user profile with dev header x-test-user-id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          'x-test-user-id': memberId
        }
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.user.id, memberId);
      assert.equal(body.user.email, 'me-user@steady.test');
    });

    it('rejects unauthenticated request with 401', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me'
      });

      assert.equal(response.statusCode, 401);
    });
  });

  // 4. RBAC: requireRole guard
  describe('RBAC requireRole guard', () => {
    let memberToken: string;
    let coachToken: string;
    let coachId: string;

    beforeEach(async () => {
      const memberReg = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'rbac-member@steady.test',
          password: 'Password123!',
          role: 'MEMBER'
        }
      });
      memberToken = memberReg.json().token;

      const coachReg = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'rbac-coach@steady.test',
          password: 'Password123!',
          role: 'COACH'
        }
      });
      const coachData = coachReg.json();
      coachToken = coachData.token;
      coachId = coachData.user.id;
    });

    it('returns 403 Forbidden for MEMBER accessing COACH-only route', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/coach/roster',
        headers: {
          authorization: `Bearer ${memberToken}`
        }
      });

      assert.equal(response.statusCode, 403);
      const body = response.json();
      assert.equal(body.error, 'Forbidden');
      assert.equal(body.message, 'Insufficient role permissions');
    });

    it('allows COACH accessing COACH-only route', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/coach/roster',
        headers: {
          authorization: `Bearer ${coachToken}`
        }
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.coachId, coachId);
      assert.equal(body.totalAssigned, 0);
    });

    it('allows ADMIN superuser bypass for COACH-only route via x-test-user-role', async () => {
      const adminId = randomUUID();
      const prisma = getPrismaClient();
      await prisma.user.create({
        data: {
          id: adminId,
          email: 'admin@steady.test',
          role: UserRole.ADMIN
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/coach/roster',
        headers: {
          'x-test-user-id': adminId,
          'x-test-user-role': 'ADMIN'
        }
      });

      assert.equal(response.statusCode, 200);
    });
  });

  // 5. RBAC: requireAssignedCoach guard
  describe('RBAC requireAssignedCoach guard', () => {
    let coachId: string;
    let coachToken: string;
    let otherCoachToken: string;
    let memberId: string;

    beforeEach(async () => {
      const prisma = getPrismaClient();

      // Coach 1
      const coachReg = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'assigned-coach@steady.test',
          password: 'Password123!',
          role: 'COACH'
        }
      });
      const coachData = coachReg.json();
      coachId = coachData.user.id;
      coachToken = coachData.token;

      // Coach 2 (unassigned)
      const otherCoachReg = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'unassigned-coach@steady.test',
          password: 'Password123!',
          role: 'COACH'
        }
      });
      otherCoachToken = otherCoachReg.json().token;

      // Member
      const memberReg = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'assigned-member@steady.test',
          password: 'Password123!',
          role: 'MEMBER'
        }
      });
      memberId = memberReg.json().user.id;

      // Assign Coach 1 to Member
      await prisma.coachAssignment.create({
        data: {
          coachId,
          memberId,
          status: CoachAssignmentStatus.ACTIVE
        }
      });
    });

    it('allows assigned coach to view member reports (200 OK)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/coach/members/${memberId}/reports`,
        headers: {
          authorization: `Bearer ${coachToken}`
        }
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.member.id, memberId);
    });

    it('rejects unassigned coach with 403 Forbidden', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/coach/members/${memberId}/reports`,
        headers: {
          authorization: `Bearer ${otherCoachToken}`
        }
      });

      assert.equal(response.statusCode, 403);
      const body = response.json();
      assert.equal(body.error, 'Forbidden');
      assert.equal(body.message, 'Member not assigned to this coach');
    });

    it('rejects non-coach (MEMBER) attempting to view member reports with 403 Forbidden', async () => {
      const memberReg2 = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'another-member@steady.test',
          password: 'Password123!',
          role: 'MEMBER'
        }
      });
      const member2Token = memberReg2.json().token;

      const response = await app.inject({
        method: 'GET',
        url: `/api/coach/members/${memberId}/reports`,
        headers: {
          authorization: `Bearer ${member2Token}`
        }
      });

      assert.equal(response.statusCode, 403);
      const body = response.json();
      assert.equal(body.error, 'Forbidden');
      assert.equal(body.message, 'Insufficient role permissions');
    });

    it('allows ADMIN superuser bypass for member reports', async () => {
      const adminId = randomUUID();
      const prisma = getPrismaClient();
      await prisma.user.create({
        data: {
          id: adminId,
          email: 'admin-super@steady.test',
          role: UserRole.ADMIN
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/coach/members/${memberId}/reports`,
        headers: {
          'x-test-user-id': adminId,
          'x-test-user-role': 'ADMIN'
        }
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.member.id, memberId);
    });
  });
});
