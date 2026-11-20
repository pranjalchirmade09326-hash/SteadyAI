import type { FastifyReply, FastifyRequest } from 'fastify';
import { CoachAssignmentStatus, UserRole } from '@prisma/client';

import { getPrismaClient } from '../db/prisma';
import { resolveUserWorkspace } from '../services/workspace.service';
import { authenticateRequest } from './auth';

/**
 * Fastify preHandler enforcing user roles (e.g. COACH, MEMBER, ADMIN).
 * Returns 403 { error: 'Forbidden', message: 'Insufficient role permissions' } on rejection.
 * Allows ADMIN superuser bypass.
 */
export function requireRole(roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.userId) {
      await authenticateRequest(request, reply);
      if (reply.sent) return;
    }

    if (!request.userId) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }

    let role = request.userRole;
    if (!role) {
      try {
        const { membership, workspace } = await resolveUserWorkspace(request.userId);
        role = membership.role;
        request.userRole = role;
        request.workspaceId = workspace.id;
      } catch (error) {
        request.log.warn({ err: error, userId: request.userId }, 'Failed to resolve workspace role');
        return reply.status(401).send({ error: 'Unauthorized', message: 'User not found or invalid workspace' });
      }
    }

    // ADMIN has platform-wide superuser bypass
    if (role === UserRole.ADMIN) {
      return;
    }

    if (roles.length > 0 && !roles.includes(role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient role permissions'
      });
    }
  };
}

/**
 * Fastify preHandler enforcing that the authenticated coach is actively assigned to the target member.
 * Checks route param (default 'id').
 * Returns 403 { error: 'Forbidden', message: 'Member not assigned to this coach' } on rejection.
 * Allows ADMIN superuser bypass and self-access bypass.
 */
export function requireAssignedCoach(paramName = 'id') {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.userId) {
      await authenticateRequest(request, reply);
      if (reply.sent) return;
    }

    if (!request.userId) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const params = request.params as Record<string, string | undefined> | undefined;
    const memberId = params?.[paramName];

    if (!memberId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Missing required route parameter: ${paramName}`
      });
    }

    let role = request.userRole;
    if (!role) {
      try {
        const { membership, workspace } = await resolveUserWorkspace(request.userId);
        role = membership.role;
        request.userRole = role;
        request.workspaceId = workspace.id;
      } catch (error) {
        request.log.warn({ err: error, userId: request.userId }, 'Failed to resolve workspace role');
        return reply.status(401).send({ error: 'Unauthorized', message: 'User not found or invalid workspace' });
      }
    }

    // Admin has superuser bypass
    if (role === UserRole.ADMIN) {
      return;
    }

    if (role !== UserRole.COACH) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient role permissions'
      });
    }

    const prisma = getPrismaClient();
    const assignment = await prisma.coachAssignment.findFirst({
      where: {
        coachId: request.userId,
        memberId: memberId,
        status: CoachAssignmentStatus.ACTIVE
      }
    });

    if (!assignment) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Member not assigned to this coach'
      });
    }
  };
}
