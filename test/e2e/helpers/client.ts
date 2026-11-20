process.env.JWT_SECRET = process.env.JWT_SECRET || 'steadyai-dev-super-secret-jwt-key-2026-secure';

import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../../src/app';
import { disconnectPrisma } from '../../../src/db/prisma';
import { probeDbConnection } from './db';

let cachedApp: FastifyInstance | null = null;

/**
 * Returns a singleton instance of the Fastify test application.
 * Fastify runs in-memory with app.inject() for complete middleware,
 * authentication, validation, and route handler pipeline execution.
 */
export async function getTestApp(): Promise<FastifyInstance> {
  await probeDbConnection();
  if (!cachedApp) {
    cachedApp = await buildApp();
  }
  return cachedApp;
}

/**
 * Closes the active Fastify test application and disconnects Prisma pool.
 */
export async function closeTestApp(): Promise<void> {
  if (cachedApp) {
    await cachedApp.close();
    cachedApp = null;
  }
  await disconnectPrisma();
}
