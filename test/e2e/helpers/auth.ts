process.env.JWT_SECRET = process.env.JWT_SECRET || 'steadyai-dev-super-secret-jwt-key-2026-secure';

import { createHmac } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Generates an HS256-signed JWT token for test requests.
 * Uses env.JWT_SECRET or standard test fallback.
 */
export function generateTestJwt(payload: JwtPayload, customSecret?: string): string {
  const secret = customSecret ?? (process.env.JWT_SECRET || 'steadyai-dev-super-secret-jwt-key-2026-secure');
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat ?? now,
      exp: payload.exp ?? now + 3600,
      ...payload
    })
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Generates an already expired JWT token (exp in the past).
 */
export function generateExpiredJwt(payload: JwtPayload): string {
  const past = Math.floor(Date.now() / 1000) - 3600;
  return generateTestJwt({ ...payload, exp: past, iat: past - 3600 });
}

/**
 * Generates a JWT token signed with an invalid/wrong secret key.
 */
export function generateInvalidSignatureJwt(payload: JwtPayload): string {
  return generateTestJwt(payload, 'wrong-secret-key-that-does-not-match');
}

/**
 * Returns formatted HTTP headers for authenticated requests.
 * Supports both standard Bearer JWT and dev headers.
 */
export function authHeadersFor(
  user: { id: string; email?: string; role?: string },
  useBearer = true
): Record<string, string> {
  if (useBearer) {
    const token = generateTestJwt({ sub: user.id, email: user.email, role: user.role });
    return {
      authorization: `Bearer ${token}`
    };
  }

  return {
    'x-test-user-id': user.id,
    'x-test-user-email': user.email ?? ''
  };
}
