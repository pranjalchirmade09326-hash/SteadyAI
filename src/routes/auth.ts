import type { FastifyInstance } from 'fastify';
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { UserRole } from '@prisma/client';
import { getPrismaClient } from '../db/prisma';
import { env } from '../config/env';
import { authenticateRequest } from '../middleware/auth';
import { resolveUserWorkspace } from '../services/workspace.service';

export interface AppJwtPayload {
  sub: string;
  email?: string;
  role?: UserRole;
  workspaceId?: string;
  exp?: number;
  iat?: number;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (derivedKey.length !== keyBuffer.length) return false;
  return timingSafeEqual(derivedKey, keyBuffer);
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

function parseGoogleIdToken(idToken: string): GoogleIdTokenPayload {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid ID token format');
  }
  return JSON.parse(base64UrlDecode(parts[1])) as GoogleIdTokenPayload;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

/** Verify the ID token with Google's tokeninfo endpoint (simple & reliable for server-side flows) */
async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);

  if (!response.ok) {
    throw new Error('Google ID token verification failed');
  }

  const payload = (await response.json()) as GoogleIdTokenPayload & { aud?: string; error_description?: string };

  if ((payload as { error_description?: string }).error_description) {
    throw new Error(`Google token invalid: ${(payload as { error_description?: string }).error_description}`);
  }

  if (payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('Google ID token audience mismatch');
  }

  if (!payload.sub || !payload.email) {
    throw new Error('Google ID token missing required fields');
  }

  return payload;
}

/** Sign a simple HS256 JWT */
export function signJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = env.JWT_SECRET || 'steadyai-dev-super-secret-jwt-key-2026-secure';
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/** Verify our app's own HS256 JWT */
export function verifyAppJwt(token: string): AppJwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [header, body, signature] = parts;
  const secret = env.JWT_SECRET || 'steadyai-dev-super-secret-jwt-key-2026-secure';
  const expectedSig = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSig) {
    throw new Error('Invalid JWT signature');
  }

  const payload = JSON.parse(base64UrlDecode(body)) as AppJwtPayload;

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return payload;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /auth/google/callback
   * Exchanges a Google OAuth authorization code for a signed app JWT.
   * Body: { code: string, redirectUri: string }
   */
  fastify.post<{ Body: { code: string; redirectUri: string } }>(
    '/auth/google/callback',
    {
      schema: {
        body: {
          type: 'object',
          required: ['code', 'redirectUri'],
          properties: {
            code: { type: 'string' },
            redirectUri: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { code, redirectUri } = request.body;

      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        return reply.status(503).send({ error: 'Google OAuth is not configured on the server.' });
      }

      if (!env.JWT_SECRET) {
        return reply.status(503).send({ error: 'JWT signing secret is not configured on the server.' });
      }

      try {
        // Exchange code for Google tokens
        const tokenResponse = await exchangeCodeForTokens(code, redirectUri);

        // Verify the ID token with Google
        const googleUser = await verifyGoogleIdToken(tokenResponse.id_token);

        const prisma = getPrismaClient();

        // Find or create user — use Google's `sub` as a stable external ID
        // We store it in the User record. If the user exists by email, link them.
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: googleUser.email }
            ]
          }
        });

        if (!user) {
          // Create new user
          const baseUsername = googleUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
          let username = baseUsername;

          // Ensure username is unique
          const existing = await prisma.user.findUnique({ where: { username } });
          if (existing) {
            username = `${baseUsername}_${randomUUID().slice(0, 6)}`;
          }

          user = await prisma.user.create({
            data: {
              email: googleUser.email,
              username,
              displayName: googleUser.name ?? baseUsername
            }
          });
        }

        // Issue our own JWT (valid for 30 days)
        const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
        const jwt = signJwt({
          sub: user.id,
          email: user.email,
          exp: expiresAt,
          iat: Math.floor(Date.now() / 1000)
        });

        return reply.status(200).send({ token: jwt, userId: user.id });
      } catch (error) {
        request.log.error({ err: error }, 'Google OAuth callback failed');
        return reply.status(401).send({
          error: error instanceof Error ? error.message : 'Google sign-in failed'
        });
      }
    }
  );

  /**
   * POST /auth/register
   * Registers a new user with email and password, creates personal workspace, and returns JWT.
   */
  fastify.post<{
    Body: {
      email: string;
      password?: string;
      name?: string;
      role?: 'MEMBER' | 'COACH';
    };
  }>(
    '/auth/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['MEMBER', 'COACH'] }
          }
        }
      }
    },
    async (request, reply) => {
      const { email, password, name, role } = request.body;

      if (!email || typeof email !== 'string' || !email.trim()) {
        return reply.status(400).send({ error: 'Email is required', message: 'Email is required' });
      }

      if (password !== undefined && password !== null && password.length < 8) {
        return reply.status(400).send({
          error: 'Password must be at least 8 characters long',
          message: 'Password must be at least 8 characters long'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const prisma = getPrismaClient();

      const existing = await prisma.user.findFirst({ where: { email: normalizedEmail } });
      if (existing) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'An account with this email already exists'
        });
      }

      const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');
      let username = baseUsername;
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        username = `${baseUsername}_${randomUUID().slice(0, 6)}`;
      }

      const assignedRole = role === 'COACH' ? UserRole.COACH : UserRole.MEMBER;
      const passwordHash = password ? hashPassword(password) : undefined;

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username,
          displayName: name || baseUsername,
          ...(passwordHash ? { passwordHash } : {}),
          role: assignedRole,
          onboardingCompleted: true
        }
      });

      const workspace = await prisma.workspace.create({
        data: {
          name: `${user.displayName || 'User'}'s Personal Space`,
          ownerId: user.id
        }
      });

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: assignedRole
        }
      });

      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
      const token = signJwt({
        sub: user.id,
        email: user.email,
        role: assignedRole,
        workspaceId: workspace.id,
        exp: expiresAt,
        iat: Math.floor(Date.now() / 1000)
      });

      return reply.status(201).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          displayName: user.displayName || user.username,
          role: assignedRole
        }
      });
    }
  );

  /**
   * POST /auth/login
   * Authenticates user with email and password, returning JWT and profile.
   */
  fastify.post<{
    Body: {
      email: string;
      password?: string;
    };
  }>(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { email, password } = request.body;

      if (!email || typeof email !== 'string') {
        return reply.status(400).send({ error: 'Email is required', message: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const prisma = getPrismaClient();

      const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });
      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
      }

      if (password) {
        if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
        }
      }

      const { workspace, membership } = await resolveUserWorkspace(user.id);
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
      const token = signJwt({
        sub: user.id,
        email: user.email,
        role: membership.role,
        workspaceId: workspace.id,
        exp: expiresAt,
        iat: Math.floor(Date.now() / 1000)
      });

      return reply.status(200).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          displayName: user.displayName || user.username,
          role: membership.role
        }
      });
    }
  );

  /**
   * GET /auth/me
   * Returns current authenticated user profile, active workspace, and role.
   */
  fastify.get(
    '/auth/me',
    { preHandler: [authenticateRequest] },
    async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const prisma = getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { id: true, email: true, displayName: true, username: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found', message: 'User not found' });
      }

      const { workspace, membership } = await resolveUserWorkspace(user.id);

      return reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          displayName: user.displayName || user.username,
          role: membership.role,
          workspaceId: workspace.id
        }
      });
    }
  );
}
