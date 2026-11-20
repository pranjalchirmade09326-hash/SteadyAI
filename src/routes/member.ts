import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DailyParticipationStatus } from '@prisma/client';
import { getPrismaClient } from '../db/prisma';
import { authenticateRequest } from '../middleware/auth';

export async function memberRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/member/dashboard',
    {
      preHandler: [authenticateRequest]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
      }

      const prisma = getPrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          nutritionGoal: true
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // 1. Check-ins & Streak
      const participations = await prisma.challengeParticipation.findMany({
        where: { userId },
        include: {
          checkIns: {
            orderBy: { checkInDate: 'desc' }
          }
        }
      });

      const allCheckIns = participations.flatMap((p) => p.checkIns);
      allCheckIns.sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime());

      const completedCheckIns = allCheckIns.filter(
        (c) => c.participationStatus === DailyParticipationStatus.COMPLETED
      );
      const totalCheckIns = completedCheckIns.length;

      // Calculate streak: unique days with completed checkIns counting backwards from today or yesterday
      const uniqueDays = new Set<string>();
      for (const c of completedCheckIns) {
        const dayStr = c.checkInDate.toISOString().slice(0, 10);
        uniqueDays.add(dayStr);
      }

      let currentStreakDays = 0;
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      let checkDate = uniqueDays.has(todayStr) ? today : (uniqueDays.has(yesterdayStr) ? yesterday : null);

      if (checkDate) {
        const cursor = new Date(checkDate);
        while (true) {
          const str = cursor.toISOString().slice(0, 10);
          if (uniqueDays.has(str)) {
            currentStreakDays++;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
          } else {
            break;
          }
        }
      }

      // Completion rate (percentage between 0 and 100, or ratio 0-1)
      const completionRate = totalCheckIns > 0 ? Math.min(1.0, totalCheckIns / Math.max(1, totalCheckIns + 1)) : 0;

      // 2. Workouts
      const workouts = await prisma.healthRecord.findMany({
        where: {
          userId,
          type: 'WORKOUT'
        },
        orderBy: { startTime: 'desc' },
        take: 10
      });

      const totalWorkoutMinutes = workouts.reduce((sum, w) => {
        if (typeof w.value === 'number' && w.unit === 'minutes') {
          return sum + w.value;
        }
        if (w.metadata && typeof (w.metadata as any).totalDurationMinutes === 'number') {
          return sum + (w.metadata as any).totalDurationMinutes;
        }
        return sum + (w.value ? Number(w.value) : 0);
      }, 0);

      // 3. Nutrition (today's totals, or latest if logged today)
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const todayNutrition = await prisma.nutritionEntry.findMany({
        where: {
          userId,
          consumedAt: { gte: todayStart }
        }
      });

      // If no entries today, grab last 24 hours or recent entries
      const recentNutrition = todayNutrition.length > 0
        ? todayNutrition
        : await prisma.nutritionEntry.findMany({
            where: { userId },
            orderBy: { consumedAt: 'desc' },
            take: 5
          });

      const totalCalories = recentNutrition.reduce((sum, n) => sum + (n.totalCalories ? Number(n.totalCalories) : 0), 0);
      const totalProteinG = recentNutrition.reduce((sum, n) => sum + (n.totalProteinG ? Number(n.totalProteinG) : 0), 0);
      const targetCalories = user.nutritionGoal?.dailyCalorieTarget || 2200;
      const targetProteinG = user.nutritionGoal?.dailyProteinG || 160;
      const targetWaterMl = user.nutritionGoal?.dailyWaterMl || 3000;

      // 4. CheckInStatus
      const todayCheckIn = allCheckIns.find((c) => {
        const dStr = c.checkInDate.toISOString().slice(0, 10);
        return dStr === todayStr;
      });

      const latestCheckIn = allCheckIns[0] || null;

      // 5. Daily tasks
      const hasCheckedInToday = Boolean(todayCheckIn && todayCheckIn.participationStatus === DailyParticipationStatus.COMPLETED);
      const hasWorkoutToday = workouts.some((w) => w.startTime.toISOString().slice(0, 10) === todayStr);
      const hasNutritionToday = todayNutrition.length > 0;

      const dailyTasks = [
        {
          id: 'task-checkin',
          title: 'Daily Challenge Check-in',
          completed: hasCheckedInToday
        },
        {
          id: 'task-workout',
          title: 'Daily Workout Session',
          completed: hasWorkoutToday
        },
        {
          id: 'task-nutrition',
          title: 'Log Nutrition & Meals',
          completed: hasNutritionToday
        }
      ];

      // 6. Recent activity
      const recentActivity: Array<{ id: string; type: string; description: string; timestamp: string }> = [];

      for (const c of allCheckIns.slice(0, 3)) {
        recentActivity.push({
          id: `checkin-${c.id}`,
          type: 'CHECK_IN',
          description: `Daily check-in: ${c.participationStatus}`,
          timestamp: c.createdAt.toISOString()
        });
      }

      for (const w of workouts.slice(0, 3)) {
        const metaName = (w.metadata as any)?.name || 'Workout Session';
        recentActivity.push({
          id: `workout-${w.id}`,
          type: 'WORKOUT',
          description: `${metaName} (${w.value} ${w.unit || 'mins'})`,
          timestamp: w.startTime.toISOString()
        });
      }

      for (const n of recentNutrition.slice(0, 3)) {
        recentActivity.push({
          id: `nutrition-${n.id}`,
          type: 'NUTRITION',
          description: n.rawText || `Logged meal (${n.totalCalories} kcal)`,
          timestamp: n.consumedAt.toISOString()
        });
      }

      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return reply.send({
        progressSummary: {
          currentStreakDays,
          completionRate,
          totalCheckIns
        },
        dailyTasks,
        recentActivity: recentActivity.slice(0, 6),
        workouts: {
          sessions: workouts.length,
          totalMinutes: totalWorkoutMinutes,
          history: workouts
        },
        nutrition: {
          calories: totalCalories,
          targetCalories,
          proteinG: totalProteinG,
          targetProteinG,
          waterMl: 0,
          targetWaterMl
        },
        checkInStatus: {
          todayStatus: todayCheckIn ? todayCheckIn.participationStatus : null,
          latestCheckInDate: latestCheckIn ? latestCheckIn.checkInDate.toISOString() : null
        }
      });
    }
  );
}
