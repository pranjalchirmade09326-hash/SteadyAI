import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CoachAssignmentStatus, CoachFeedbackStatus, DailyParticipationStatus, UserRole } from '@prisma/client';
import { getPrismaClient } from '../db/prisma';
import { authenticateRequest } from '../middleware/auth';
import { requireAssignedCoach, requireRole } from '../middleware/rbac';

export async function coachRoutes(fastify: FastifyInstance): Promise<void> {
  // 1. GET /coach/roster
  fastify.get(
    '/coach/roster',
    {
      preHandler: [authenticateRequest, requireRole([UserRole.COACH, UserRole.ADMIN])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const coachId = request.userId;
      if (!coachId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const prisma = getPrismaClient();

      const assignments = await prisma.coachAssignment.findMany({
        where: {
          coachId,
          status: CoachAssignmentStatus.ACTIVE
        },
        include: {
          member: {
            include: {
              participations: {
                include: {
                  checkIns: {
                    orderBy: { checkInDate: 'desc' }
                  }
                }
              },
              coachFeedbackRequests: {
                where: {
                  status: CoachFeedbackStatus.REQUESTED
                }
              }
            }
          }
        }
      });

      const members = assignments.map((a) => {
        const m = a.member;
        const allCheckIns = m.participations.flatMap((p) => p.checkIns);
        allCheckIns.sort((x, y) => y.checkInDate.getTime() - x.checkInDate.getTime());

        const completedCheckIns = allCheckIns.filter(
          (c) => c.participationStatus === DailyParticipationStatus.COMPLETED
        );

        // Calculate streak
        const uniqueDays = new Set<string>();
        for (const c of completedCheckIns) {
          uniqueDays.add(c.checkInDate.toISOString().slice(0, 10));
        }

        let currentStreak = 0;
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        const checkDate = uniqueDays.has(todayStr) ? today : (uniqueDays.has(yesterdayStr) ? yesterday : null);
        if (checkDate) {
          const cursor = new Date(checkDate);
          while (true) {
            const str = cursor.toISOString().slice(0, 10);
            if (uniqueDays.has(str)) {
              currentStreak++;
              cursor.setUTCDate(cursor.getUTCDate() - 1);
            } else {
              break;
            }
          }
        }

        const latestCheckIn = allCheckIns[0];
        const adherenceRate = allCheckIns.length > 0 ? completedCheckIns.length / allCheckIns.length : 1.0;

        return {
          id: m.id,
          name: m.displayName || m.username,
          email: m.email,
          primaryGoal: m.primaryGoal || 'Improve Overall Fitness',
          currentStreak,
          adherenceRate,
          lastCheckInDate: latestCheckIn ? latestCheckIn.checkInDate.toISOString() : null,
          lastCheckInStatus: latestCheckIn ? latestCheckIn.participationStatus : 'NONE',
          pendingFeedbackCount: m.coachFeedbackRequests.length
        };
      });

      return reply.send({
        coachId,
        totalAssigned: members.length,
        members
      });
    }
  );

  // 2. GET /coach/feedback-queue
  fastify.get(
    '/coach/feedback-queue',
    {
      preHandler: [authenticateRequest, requireRole([UserRole.COACH, UserRole.ADMIN])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const coachId = request.userId;
      if (!coachId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const prisma = getPrismaClient();

      const assignments = await prisma.coachAssignment.findMany({
        where: {
          coachId,
          status: CoachAssignmentStatus.ACTIVE
        },
        select: { memberId: true }
      });

      const memberIds = assignments.map((a) => a.memberId);

      const requests = await prisma.coachFeedbackRequest.findMany({
        where: {
          userId: { in: memberIds },
          status: { in: [CoachFeedbackStatus.REQUESTED, CoachFeedbackStatus.IN_REVIEW] }
        },
        include: {
          user: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const queue = requests.map((r) => ({
        id: r.id,
        memberId: r.userId,
        memberName: r.user.displayName || r.user.username,
        topic: r.topic,
        context: r.context,
        preferredOutcome: r.preferredOutcome,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }));

      return reply.send({
        total: queue.length,
        queue
      });
    }
  );

  // 3. POST /coach/feedback
  fastify.post(
    '/coach/feedback',
    {
      preHandler: [authenticateRequest, requireRole([UserRole.COACH, UserRole.ADMIN])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const coachId = request.userId;
      if (!coachId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const body = request.body as any;
      const prisma = getPrismaClient();

      if (!body?.feedbackRequestId && !body?.memberId) {
        return reply.status(400).send({
          error: 'feedbackRequestId or memberId is required',
          message: 'Must provide either feedbackRequestId or memberId'
        });
      }

      if (body?.reply !== undefined && typeof body.reply === 'string' && !body.reply.trim()) {
        return reply.status(400).send({
          error: 'reply cannot be empty or whitespace only',
          message: 'reply cannot be empty or whitespace only'
        });
      }

      if (body?.feedbackText !== undefined && typeof body.feedbackText === 'string' && !body.feedbackText.trim()) {
        return reply.status(400).send({
          error: 'feedbackText cannot be empty or whitespace only',
          message: 'feedbackText cannot be empty or whitespace only'
        });
      }

      if (body?.feedbackRequestId) {
        const req = await prisma.coachFeedbackRequest.findUnique({
          where: { id: body.feedbackRequestId }
        });

        if (!req) {
          return reply.status(404).send({ error: 'Not Found', message: 'Feedback request not found' });
        }

        if (request.userRole !== UserRole.ADMIN) {
          const assignment = await prisma.coachAssignment.findFirst({
            where: {
              coachId,
              memberId: req.userId,
              status: CoachAssignmentStatus.ACTIVE
            }
          });
          if (!assignment) {
            return reply.status(403).send({ error: 'Forbidden', message: 'Member not assigned to this coach' });
          }
        }

        const updated = await prisma.coachFeedbackRequest.update({
          where: { id: body.feedbackRequestId },
          data: {
            status: CoachFeedbackStatus.RESPONDED,
            coachReply: body.reply || 'Feedback provided',
            respondedAt: new Date()
          }
        });

        return reply.send({
          success: true,
          updatedRequest: updated
        });
      }

      if (body?.memberId) {
        if (request.userRole !== UserRole.ADMIN) {
          const assignment = await prisma.coachAssignment.findFirst({
            where: {
              coachId,
              memberId: body.memberId,
              status: CoachAssignmentStatus.ACTIVE
            }
          });
          if (!assignment) {
            return reply.status(403).send({ error: 'Forbidden', message: 'Member not assigned to this coach' });
          }
        }

        // Direct feedback note to member
        if (body.calorieAdjustmentKcal && typeof body.calorieAdjustmentKcal === 'number') {
          const goal = await prisma.userNutritionGoal.findUnique({
            where: { userId: body.memberId }
          });
          if (goal) {
            await prisma.userNutritionGoal.update({
              where: { userId: body.memberId },
              data: {
                dailyCalorieTarget: goal.dailyCalorieTarget + body.calorieAdjustmentKcal
              }
            });
          }
        }

        return reply.send({
          success: true,
          message: 'Member feedback saved successfully'
        });
      }

      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Must provide either feedbackRequestId or memberId'
      });
    }
  );

  // 4. GET /coach/metrics
  fastify.get(
    '/coach/metrics',
    {
      preHandler: [authenticateRequest, requireRole([UserRole.COACH, UserRole.ADMIN])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const coachId = request.userId;
      if (!coachId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const prisma = getPrismaClient();

      const assignments = await prisma.coachAssignment.findMany({
        where: {
          coachId,
          status: CoachAssignmentStatus.ACTIVE
        },
        include: {
          member: {
            include: {
              participations: {
                include: {
                  checkIns: true
                }
              },
              coachFeedbackRequests: {
                where: {
                  status: { in: [CoachFeedbackStatus.REQUESTED, CoachFeedbackStatus.IN_REVIEW] }
                }
              }
            }
          }
        }
      });

      const totalClients = assignments.length;
      let totalCompleted = 0;
      let totalAll = 0;
      let pendingReviews = 0;

      for (const a of assignments) {
        pendingReviews += a.member.coachFeedbackRequests.length;
        const allCheckIns = a.member.participations.flatMap((p) => p.checkIns);
        totalAll += allCheckIns.length;
        totalCompleted += allCheckIns.filter(
          (c) => c.participationStatus === DailyParticipationStatus.COMPLETED
        ).length;
      }

      const adherenceRate = totalAll > 0 ? totalCompleted / totalAll : 1.0;
      const activeClients = assignments.length;

      return reply.send({
        totalClients,
        activeClients,
        adherenceRate,
        pendingReviews
      });
    }
  );

  // 5. GET /coach/members/:id/reports
  fastify.get(
    '/coach/members/:id/reports',
    {
      preHandler: [authenticateRequest, requireAssignedCoach('id')]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };
      const memberId = params.id;

      const prisma = getPrismaClient();

      const member = await prisma.user.findUnique({
        where: { id: memberId },
        include: {
          nutritionGoal: true
        }
      });

      if (!member) {
        return reply.status(404).send({ error: 'Not Found', message: 'Member not found' });
      }

      // Health records
      const healthRecords = await prisma.healthRecord.findMany({
        where: { userId: memberId },
        orderBy: { startTime: 'desc' }
      });

      // Workout history
      const workouts = healthRecords.filter((h) => h.type === 'WORKOUT');
      const workoutHistory = workouts.map((w) => ({
        id: w.id,
        durationMinutes: typeof w.value === 'number' ? w.value : (w.metadata as any)?.totalDurationMinutes || (w.value ? Number(w.value) : 45),
        startTime: w.startTime.toISOString(),
        endTime: w.endTime ? w.endTime.toISOString() : null,
        metadata: w.metadata
      }));

      // Nutrition overview
      const nutritionEntries = await prisma.nutritionEntry.findMany({
        where: { userId: memberId },
        orderBy: { consumedAt: 'desc' }
      });

      const nutritionOverview = nutritionEntries.map((n) => ({
        id: n.id,
        totalCalories: n.totalCalories ? Number(n.totalCalories) : 0,
        totalProteinG: n.totalProteinG ? Number(n.totalProteinG) : 0,
        totalCarbsG: n.totalCarbsG ? Number(n.totalCarbsG) : 0,
        totalFatG: n.totalFatG ? Number(n.totalFatG) : 0,
        consumedAt: n.consumedAt.toISOString(),
        rawText: n.rawText
      }));

      // Check-in history
      const participations = await prisma.challengeParticipation.findMany({
        where: { userId: memberId },
        include: {
          checkIns: {
            orderBy: { checkInDate: 'desc' }
          }
        }
      });

      const checkInHistory = participations.flatMap((p) => p.checkIns);
      checkInHistory.sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime());

      const completedCheckIns = checkInHistory.filter(
        (c) => c.participationStatus === DailyParticipationStatus.COMPLETED
      );

      // Streak
      const uniqueDays = new Set<string>();
      for (const c of completedCheckIns) {
        uniqueDays.add(c.checkInDate.toISOString().slice(0, 10));
      }

      let streakDays = 0;
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const checkDate = uniqueDays.has(todayStr) ? today : (uniqueDays.has(yesterdayStr) ? yesterday : null);
      if (checkDate) {
        const cursor = new Date(checkDate);
        while (true) {
          const str = cursor.toISOString().slice(0, 10);
          if (uniqueDays.has(str)) {
            streakDays++;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
          } else {
            break;
          }
        }
      }

      const adherenceRate = checkInHistory.length > 0 ? completedCheckIns.length / checkInHistory.length : 1.0;

      return reply.send({
        member: {
          id: member.id,
          name: member.displayName || member.username,
          email: member.email,
          primaryGoal: member.primaryGoal || 'Improve Overall Fitness'
        },
        healthRecords,
        workoutHistory,
        nutritionOverview,
        checkInHistory,
        engagementSummary: {
          streakDays,
          totalCheckIns: completedCheckIns.length,
          adherenceRate
        }
      });
    }
  );
}
