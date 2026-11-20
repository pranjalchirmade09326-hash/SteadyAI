import { randomUUID } from 'node:crypto';
import {
  UserRole,
  CoachAssignmentStatus,
  CoachFeedbackStatus,
  DailyParticipationStatus,
  ChallengeStatus,
  ParticipationStatus,
  NutritionInputType,
  NutritionEntryStatus,
  HealthProvider,
  SyncBatchStatus
} from '@prisma/client';

export interface InMemoryStore {
  users: any[];
  workspaces: any[];
  workspaceMembers: any[];
  coachAssignments: any[];
  communityGroups: any[];
  challenges: any[];
  challengeParticipations: any[];
  challengeCheckIns: any[];
  userHealthConnections: any[];
  healthRecords: any[];
  healthSyncBatches: any[];
  userNutritionGoals: any[];
  nutritionEntries: any[];
  nutritionItems: any[];
  nutritionImages: any[];
  nutritionAiAnalyses: any[];
  products: any[];
  coachFeedbackRequests: any[];
  exerciseMedia: any[];
  posts: any[];
  reactions: any[];
  agentRuns: any[];
  agentEvents: any[];
  purchases: any[];
  userNotificationSettings: any[];
  notificationDispatchLogs: any[];
  userApiKeys: any[];
  waterIntakeLogs: any[];
  nutritionDailySummaries: any[];
  nutritionHealthCorrelations: any[];
}

export function createFreshStore(): InMemoryStore {
  return {
    users: [],
    workspaces: [],
    workspaceMembers: [],
    coachAssignments: [],
    communityGroups: [],
    challenges: [],
    challengeParticipations: [],
    challengeCheckIns: [],
    userHealthConnections: [],
    healthRecords: [],
    healthSyncBatches: [],
    userNutritionGoals: [],
    nutritionEntries: [],
    nutritionItems: [],
    nutritionImages: [],
    nutritionAiAnalyses: [],
    products: [],
    coachFeedbackRequests: [],
    exerciseMedia: [],
    posts: [],
    reactions: [],
    agentRuns: [],
    agentEvents: [],
    purchases: [],
    userNotificationSettings: [],
    notificationDispatchLogs: [],
    userApiKeys: [],
    waterIntakeLogs: [],
    nutritionDailySummaries: [],
    nutritionHealthCorrelations: []
  };
}

let activeStore = createFreshStore();
let isInstalled = false;

export function resetInMemoryStore(): void {
  activeStore = createFreshStore();
}

export function getInMemoryStore(): InMemoryStore {
  return activeStore;
}

function matchFilter(record: any, where?: Record<string, any>): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    // Composite unique key handling
    if (key === 'participationId_checkInDate' && typeof val === 'object') {
      const matchP = record.participationId === val.participationId;
      const t1 = record.checkInDate instanceof Date ? record.checkInDate.getTime() : new Date(record.checkInDate).getTime();
      const t2 = val.checkInDate instanceof Date ? val.checkInDate.getTime() : new Date(val.checkInDate).getTime();
      if (!matchP || t1 !== t2) return false;
      continue;
    }

    if (key === 'connectionId_externalRecordId_type' && typeof val === 'object') {
      if (record.connectionId !== val.connectionId || record.externalRecordId !== val.externalRecordId || record.type !== val.type) {
        return false;
      }
      continue;
    }

    if (key === 'userId_provider_deviceInstallId' && typeof val === 'object') {
      if (record.userId !== val.userId || record.provider !== val.provider || record.deviceInstallId !== val.deviceInstallId) {
        return false;
      }
      continue;
    }

    // Relation filters
    if (key === 'challenge' && typeof val === 'object') {
      const ch = activeStore.challenges.find((c) => c.id === record.challengeId);
      if (!ch || !matchFilter(ch, val)) return false;
      continue;
    }

    if (key === 'participation' && typeof val === 'object') {
      const part = activeStore.challengeParticipations.find((p) => p.id === record.participationId);
      if (!part || !matchFilter(part, val)) return false;
      continue;
    }

    if (key === 'post' && typeof val === 'object') {
      const post = activeStore.posts.find((p) => p.id === record.postId);
      if (!post || !matchFilter(post, val)) return false;
      continue;
    }

    const recVal = record[key];

    if (val && typeof val === 'object' && !(val instanceof Date)) {
      if ('in' in val && Array.isArray(val.in)) {
        if (!val.in.includes(recVal)) return false;
        continue;
      }
      if ('gte' in val) {
        const dRec = recVal instanceof Date ? recVal.getTime() : new Date(recVal).getTime();
        const dGte = val.gte instanceof Date ? val.gte.getTime() : new Date(val.gte).getTime();
        if (dRec < dGte) return false;
      }
      if ('lte' in val) {
        const dRec = recVal instanceof Date ? recVal.getTime() : new Date(recVal).getTime();
        const dLte = val.lte instanceof Date ? val.lte.getTime() : new Date(val.lte).getTime();
        if (dRec > dLte) return false;
      }
      if ('gt' in val) {
        const dRec = recVal instanceof Date ? recVal.getTime() : new Date(recVal).getTime();
        const dGt = val.gt instanceof Date ? val.gt.getTime() : new Date(val.gt).getTime();
        if (dRec <= dGt) return false;
      }
      if ('lt' in val) {
        const dRec = recVal instanceof Date ? recVal.getTime() : new Date(recVal).getTime();
        const dLt = val.lt instanceof Date ? val.lt.getTime() : new Date(val.lt).getTime();
        if (dRec >= dLt) return false;
      }
      continue;
    }

    if (typeof recVal === 'string' && typeof val === 'string' && (key === 'email' || key === 'username')) {
      if (recVal.toLowerCase() !== val.toLowerCase()) return false;
      continue;
    }

    if (recVal instanceof Date && val instanceof Date) {
      if (recVal.getTime() !== val.getTime()) return false;
      continue;
    }

    if (recVal !== val) return false;
  }

  return true;
}

function applySort(list: any[], orderBy?: Record<string, 'asc' | 'desc'>): any[] {
  if (!orderBy || Object.keys(orderBy).length === 0) return list;
  const [field, direction] = Object.entries(orderBy)[0];
  const factor = direction === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];
    if (valA instanceof Date && valB instanceof Date) {
      return (valA.getTime() - valB.getTime()) * factor;
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * factor;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB) * factor;
    }
    return 0;
  });
}

function applySelectOrInclude(record: any, modelName: string, select?: Record<string, any>, include?: Record<string, any>): any {
  if (!record) return null;
  const copy = { ...record };

  // Expand includes
  if (include) {
    if (modelName === 'user') {
      if (include.nutritionGoal) {
        copy.nutritionGoal = activeStore.userNutritionGoals.find((g) => g.userId === record.id) || null;
      }
      if (include.participations) {
        const parts = activeStore.challengeParticipations.filter((p) => p.userId === record.id);
        copy.participations = parts.map((p) => applySelectOrInclude(p, 'challengeParticipation', undefined, include.participations.include));
      }
      if (include.coachFeedbackRequests) {
        const reqs = activeStore.coachFeedbackRequests.filter((r) => {
          if (r.userId !== record.id) return false;
          if (include.coachFeedbackRequests.where && !matchFilter(r, include.coachFeedbackRequests.where)) return false;
          return true;
        });
        copy.coachFeedbackRequests = reqs.map((r) => applySelectOrInclude(r, 'coachFeedbackRequest', undefined, include.coachFeedbackRequests.include));
      }
      if (include.coachAssignments) {
        copy.coachAssignments = activeStore.coachAssignments.filter((a) => a.coachId === record.id);
      }
      if (include.memberAssignments) {
        copy.memberAssignments = activeStore.coachAssignments.filter((a) => a.memberId === record.id);
      }
    }

    if (modelName === 'workspaceMember') {
      if (include.workspace) {
        copy.workspace = activeStore.workspaces.find((w) => w.id === record.workspaceId) || null;
      }
    }

    if (modelName === 'coachAssignment') {
      if (include.member) {
        const mem = activeStore.users.find((u) => u.id === record.memberId) || null;
        copy.member = mem ? applySelectOrInclude(mem, 'user', undefined, include.member.include) : null;
      }
      if (include.coach) {
        copy.coach = activeStore.users.find((u) => u.id === record.coachId) || null;
      }
    }

    if (modelName === 'challenge') {
      if (include.group) {
        copy.group = activeStore.communityGroups.find((g) => g.id === record.groupId) || null;
      }
      if (include.creator) {
        copy.creator = activeStore.users.find((u) => u.id === record.creatorId) || null;
      }
      if (include.participations) {
        copy.participations = activeStore.challengeParticipations.filter((p) => p.challengeId === record.id);
      }
    }

    if (modelName === 'challengeParticipation') {
      if (include.challenge) {
        copy.challenge = activeStore.challenges.find((c) => c.id === record.challengeId) || null;
      }
      if (include.checkIns) {
        let chk = activeStore.challengeCheckIns.filter((c) => c.participationId === record.id);
        if (include.checkIns.orderBy) {
          chk = applySort(chk, include.checkIns.orderBy);
        }
        copy.checkIns = chk;
      }
    }

    if (modelName === 'coachFeedbackRequest') {
      if (include.user) {
        copy.user = activeStore.users.find((u) => u.id === record.userId) || null;
      }
    }

    if (modelName === 'nutritionEntry') {
      if (include.items) {
        copy.items = activeStore.nutritionItems.filter((i) => i.entryId === record.id);
      }
      if (include.images) {
        copy.images = activeStore.nutritionImages.filter((i) => i.entryId === record.id);
      }
    }
  }

  // Apply select projection if requested
  if (select) {
    const selected: Record<string, any> = {};
    for (const [k, v] of Object.entries(select)) {
      if (v) {
        selected[k] = copy[k];
      }
    }
    return selected;
  }

  return copy;
}

export function installInMemoryDatabase(prisma: any): void {
  if (isInstalled) return;
  isInstalled = true;

  // 1. User
  prisma.user = {
    create: async ({ data, select, include }: any) => {
      const user = {
        id: data.id || randomUUID(),
        email: data.email,
        username: data.username || data.email.split('@')[0],
        displayName: data.displayName || data.username || 'User',
        passwordHash: data.passwordHash || null,
        role: data.role || UserRole.MEMBER,
        primaryGoal: data.primaryGoal || 'Improve Overall Fitness & Energy',
        experienceLevel: data.experienceLevel || 'Beginner',
        dietaryPreferences: data.dietaryPreferences || [],
        timeAvailability: data.timeAvailability || '45 min/day',
        onboardingCompleted: data.onboardingCompleted ?? false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.users.push(user);
      return applySelectOrInclude(user, 'user', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const u = activeStore.users.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(u, 'user', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const u = activeStore.users.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(u, 'user', select, include);
    },
    findMany: async ({ where, orderBy, take, select, include }: any = {}) => {
      let list = activeStore.users.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      if (take && take > 0) list = list.slice(0, take);
      return list.map((u) => applySelectOrInclude(u, 'user', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.users.filter((rec) => matchFilter(rec, where)).length;
    },
    update: async ({ where, data, select, include }: any) => {
      const idx = activeStore.users.findIndex((rec) => matchFilter(rec, where));
      if (idx === -1) throw new Error('User not found for update');
      const updated = { ...activeStore.users[idx], ...data, updatedAt: new Date() };
      activeStore.users[idx] = updated;
      return applySelectOrInclude(updated, 'user', select, include);
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.users.length;
      activeStore.users = activeStore.users.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.users.length };
    }
  };

  // 2. Workspace
  prisma.workspace = {
    create: async ({ data, select, include }: any) => {
      const ws = {
        id: data.id || randomUUID(),
        name: data.name,
        ownerId: data.ownerId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.workspaces.push(ws);
      return applySelectOrInclude(ws, 'workspace', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const ws = activeStore.workspaces.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ws, 'workspace', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const ws = activeStore.workspaces.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ws, 'workspace', select, include);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.workspaces.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.workspaces.length;
      activeStore.workspaces = activeStore.workspaces.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.workspaces.length };
    }
  };

  // 3. WorkspaceMember
  prisma.workspaceMember = {
    create: async ({ data, select, include }: any) => {
      const wm = {
        id: data.id || randomUUID(),
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role || UserRole.MEMBER,
        createdAt: new Date()
      };
      activeStore.workspaceMembers.push(wm);
      return applySelectOrInclude(wm, 'workspaceMember', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const wm = activeStore.workspaceMembers.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(wm, 'workspaceMember', select, include);
    },
    findMany: async ({ where, select, include }: any) => {
      const list = activeStore.workspaceMembers.filter((rec) => matchFilter(rec, where));
      return list.map((wm) => applySelectOrInclude(wm, 'workspaceMember', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.workspaceMembers.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.workspaceMembers.length;
      activeStore.workspaceMembers = activeStore.workspaceMembers.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.workspaceMembers.length };
    }
  };

  // 4. CoachAssignment
  prisma.coachAssignment = {
    create: async ({ data, select, include }: any) => {
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
      activeStore.coachAssignments.push(ca);
      return applySelectOrInclude(ca, 'coachAssignment', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const ca = activeStore.coachAssignments.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ca, 'coachAssignment', select, include);
    },
    findMany: async ({ where, select, include }: any) => {
      const list = activeStore.coachAssignments.filter((rec) => matchFilter(rec, where));
      return list.map((ca) => applySelectOrInclude(ca, 'coachAssignment', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.coachAssignments.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.coachAssignments.length;
      activeStore.coachAssignments = activeStore.coachAssignments.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.coachAssignments.length };
    }
  };

  // 5. CommunityGroup
  prisma.communityGroup = {
    create: async ({ data, select, include }: any) => {
      const cg = {
        id: data.id || randomUUID(),
        name: data.name,
        description: data.description || '',
        ownerId: data.ownerId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.communityGroups.push(cg);
      return applySelectOrInclude(cg, 'communityGroup', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const cg = activeStore.communityGroups.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(cg, 'communityGroup', select, include);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.communityGroups.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.communityGroups.length;
      activeStore.communityGroups = activeStore.communityGroups.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.communityGroups.length };
    }
  };

  // 6. Challenge
  prisma.challenge = {
    create: async ({ data, select, include }: any) => {
      const ch = {
        id: data.id || randomUUID(),
        groupId: data.groupId,
        creatorId: data.creatorId,
        title: data.title,
        description: data.description || '',
        dailyTaskDescription: data.dailyTaskDescription || '',
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        endsAt: data.endsAt ? new Date(data.endsAt) : new Date(Date.now() + 30 * 86400000),
        status: data.status || ChallengeStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.challenges.push(ch);
      return applySelectOrInclude(ch, 'challenge', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const ch = activeStore.challenges.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ch, 'challenge', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const ch = activeStore.challenges.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ch, 'challenge', select, include);
    },
    findMany: async ({ where, orderBy, take, select, include }: any = {}) => {
      let list = activeStore.challenges.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      if (take && take > 0) list = list.slice(0, take);
      return list.map((ch) => applySelectOrInclude(ch, 'challenge', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.challenges.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.challenges.length;
      activeStore.challenges = activeStore.challenges.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.challenges.length };
    }
  };

  // 7. ChallengeParticipation
  prisma.challengeParticipation = {
    create: async ({ data, select, include }: any) => {
      const cp = {
        id: data.id || randomUUID(),
        challengeId: data.challengeId,
        userId: data.userId,
        status: data.status || ParticipationStatus.JOINED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.challengeParticipations.push(cp);
      return applySelectOrInclude(cp, 'challengeParticipation', select, include);
    },
    findFirst: async ({ where, orderBy, select, include }: any) => {
      let list = activeStore.challengeParticipations.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      const cp = list[0] || null;
      return applySelectOrInclude(cp, 'challengeParticipation', select, include);
    },
    findMany: async ({ where, orderBy, select, include }: any) => {
      let list = activeStore.challengeParticipations.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      return list.map((cp) => applySelectOrInclude(cp, 'challengeParticipation', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.challengeParticipations.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.challengeParticipations.length;
      activeStore.challengeParticipations = activeStore.challengeParticipations.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.challengeParticipations.length };
    }
  };

  // 8. ChallengeCheckIn
  prisma.challengeCheckIn = {
    create: async ({ data, select, include }: any) => {
      const d = data.checkInDate ? new Date(data.checkInDate) : new Date();
      const ci = {
        id: data.id || randomUUID(),
        challengeId: data.challengeId,
        participationId: data.participationId,
        checkInDate: d,
        participationStatus: data.participationStatus || DailyParticipationStatus.COMPLETED,
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.challengeCheckIns.push(ci);
      return applySelectOrInclude(ci, 'challengeCheckIn', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const ci = activeStore.challengeCheckIns.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ci, 'challengeCheckIn', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const ci = activeStore.challengeCheckIns.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(ci, 'challengeCheckIn', select, include);
    },
    findMany: async ({ where, orderBy, select, include }: any) => {
      let list = activeStore.challengeCheckIns.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      return list.map((ci) => applySelectOrInclude(ci, 'challengeCheckIn', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.challengeCheckIns.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.challengeCheckIns.length;
      activeStore.challengeCheckIns = activeStore.challengeCheckIns.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.challengeCheckIns.length };
    }
  };

  // 9. UserHealthConnection
  prisma.userHealthConnection = {
    create: async ({ data, select, include }: any) => {
      const uhc = {
        id: data.id || randomUUID(),
        userId: data.userId,
        provider: data.provider || HealthProvider.HEALTH_CONNECT,
        status: data.status || 'ACTIVE',
        deviceInstallId: data.deviceInstallId || `device-${Date.now()}`,
        grantedScopes: data.grantedScopes || [],
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.userHealthConnections.push(uhc);
      return applySelectOrInclude(uhc, 'userHealthConnection', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const uhc = activeStore.userHealthConnections.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(uhc, 'userHealthConnection', select, include);
    },
    upsert: async ({ where, create, update, select, include }: any) => {
      const idx = activeStore.userHealthConnections.findIndex((rec) => matchFilter(rec, where));
      if (idx !== -1) {
        const updated = { ...activeStore.userHealthConnections[idx], ...update, updatedAt: new Date() };
        activeStore.userHealthConnections[idx] = updated;
        return applySelectOrInclude(updated, 'userHealthConnection', select, include);
      }
      const created = {
        id: create.id || randomUUID(),
        ...create,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.userHealthConnections.push(created);
      return applySelectOrInclude(created, 'userHealthConnection', select, include);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.userHealthConnections.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.userHealthConnections.length;
      activeStore.userHealthConnections = activeStore.userHealthConnections.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.userHealthConnections.length };
    }
  };

  // 10. HealthRecord
  prisma.healthRecord = {
    create: async ({ data, select, include }: any) => {
      const hr = {
        id: data.id || randomUUID(),
        userId: data.userId,
        connectionId: data.connectionId,
        externalRecordId: data.externalRecordId || `ext-${Date.now()}`,
        type: data.type || 'WORKOUT',
        value: data.value,
        unit: data.unit || 'minutes',
        sourceApp: data.sourceApp || 'MANUAL',
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : null,
        metadata: data.metadata || {},
        syncBatchId: data.syncBatchId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.healthRecords.push(hr);
      return applySelectOrInclude(hr, 'healthRecord', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const hr = activeStore.healthRecords.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(hr, 'healthRecord', select, include);
    },
    findMany: async ({ where, orderBy, take, select, include }: any) => {
      let list = activeStore.healthRecords.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      if (take && take > 0) {
        list = list.slice(0, take);
      }
      return list.map((hr) => applySelectOrInclude(hr, 'healthRecord', select, include));
    },
    upsert: async ({ where, create, update, select, include }: any) => {
      const idx = activeStore.healthRecords.findIndex((rec) => matchFilter(rec, where));
      if (idx !== -1) {
        const updated = { ...activeStore.healthRecords[idx], ...update, updatedAt: new Date() };
        activeStore.healthRecords[idx] = updated;
        return applySelectOrInclude(updated, 'healthRecord', select, include);
      }
      const created = {
        id: create.id || randomUUID(),
        ...create,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.healthRecords.push(created);
      return applySelectOrInclude(created, 'healthRecord', select, include);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.healthRecords.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.healthRecords.length;
      activeStore.healthRecords = activeStore.healthRecords.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.healthRecords.length };
    }
  };

  // 11. HealthSyncBatch
  prisma.healthSyncBatch = {
    create: async ({ data }: any) => {
      const batch = {
        id: data.id || randomUUID(),
        connectionId: data.connectionId,
        status: data.status || SyncBatchStatus.COMPLETED,
        recordsReceived: data.recordsReceived || 1,
        completedAt: new Date(),
        createdAt: new Date()
      };
      activeStore.healthSyncBatches.push(batch);
      return { ...batch };
    },
    count: async () => activeStore.healthSyncBatches.length,
    deleteMany: async () => ({ count: 0 })
  };

  // 12. UserNutritionGoal
  prisma.userNutritionGoal = {
    create: async ({ data, select, include }: any) => {
      const goal = {
        id: data.id || randomUUID(),
        userId: data.userId,
        dailyCalorieTarget: data.dailyCalorieTarget || 2200,
        dailyProteinG: data.dailyProteinG || 160,
        dailyCarbsG: data.dailyCarbsG || 220,
        dailyFatG: data.dailyFatG || 70,
        dailyWaterMl: data.dailyWaterMl || 3000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.userNutritionGoals.push(goal);
      return applySelectOrInclude(goal, 'userNutritionGoal', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const g = activeStore.userNutritionGoals.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(g, 'userNutritionGoal', select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const g = activeStore.userNutritionGoals.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(g, 'userNutritionGoal', select, include);
    },
    update: async ({ where, data, select, include }: any) => {
      const idx = activeStore.userNutritionGoals.findIndex((rec) => matchFilter(rec, where));
      if (idx === -1) throw new Error('Nutrition goal not found for update');
      const updated = { ...activeStore.userNutritionGoals[idx], ...data, updatedAt: new Date() };
      activeStore.userNutritionGoals[idx] = updated;
      return applySelectOrInclude(updated, 'userNutritionGoal', select, include);
    },
    upsert: async ({ where, create, update, select, include }: any) => {
      const idx = activeStore.userNutritionGoals.findIndex((rec) => matchFilter(rec, where));
      if (idx !== -1) {
        const updated = { ...activeStore.userNutritionGoals[idx], ...update, updatedAt: new Date() };
        activeStore.userNutritionGoals[idx] = updated;
        return applySelectOrInclude(updated, 'userNutritionGoal', select, include);
      }
      const created = {
        id: create.id || randomUUID(),
        ...create,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.userNutritionGoals.push(created);
      return applySelectOrInclude(created, 'userNutritionGoal', select, include);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.userNutritionGoals.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.userNutritionGoals.length;
      activeStore.userNutritionGoals = activeStore.userNutritionGoals.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.userNutritionGoals.length };
    }
  };

  // 13. NutritionEntry
  prisma.nutritionEntry = {
    create: async ({ data, select, include }: any) => {
      const entryId = data.id || randomUUID();
      const entry = {
        id: entryId,
        userId: data.userId,
        inputType: data.inputType || NutritionInputType.TEXT,
        totalCalories: data.totalCalories || 0,
        totalProteinG: data.totalProteinG || 0,
        totalCarbsG: data.totalCarbsG || 0,
        totalFatG: data.totalFatG || 0,
        status: data.status || NutritionEntryStatus.PROCESSED,
        rawText: data.rawText || '',
        consumedAt: data.consumedAt ? new Date(data.consumedAt) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.nutritionEntries.push(entry);

      if (data.items?.create && Array.isArray(data.items.create)) {
        for (const item of data.items.create) {
          activeStore.nutritionItems.push({
            id: randomUUID(),
            entryId,
            ...item
          });
        }
      }

      if (data.images?.create && Array.isArray(data.images.create)) {
        for (const img of data.images.create) {
          activeStore.nutritionImages.push({
            id: randomUUID(),
            entryId,
            ...img
          });
        }
      }

      return applySelectOrInclude(entry, 'nutritionEntry', select, include);
    },
    findMany: async ({ where, orderBy, take, select, include }: any) => {
      let list = activeStore.nutritionEntries.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      if (take && take > 0) {
        list = list.slice(0, take);
      }
      return list.map((ne) => applySelectOrInclude(ne, 'nutritionEntry', select, include));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.nutritionEntries.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.nutritionEntries.length;
      activeStore.nutritionEntries = activeStore.nutritionEntries.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.nutritionEntries.length };
    }
  };

  // 14. Product
  prisma.product = {
    create: async ({ data }: any) => {
      const p = {
        id: data.id || randomUUID(),
        creatorId: data.creatorId,
        name: data.name,
        description: data.description || '',
        priceCents: data.priceCents || 0,
        currency: data.currency || 'USD',
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.products.push(p);
      return { ...p };
    },
    findFirst: async ({ where }: any = {}) => {
      return activeStore.products.find((rec) => matchFilter(rec, where)) || null;
    },
    findUnique: async ({ where }: any) => {
      return activeStore.products.find((rec) => matchFilter(rec, where)) || null;
    },
    findMany: async ({ where, orderBy }: any = {}) => {
      let list = activeStore.products.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      return list.map((p) => ({ ...p }));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.products.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async () => {
      const count = activeStore.products.length;
      activeStore.products = [];
      return { count };
    }
  };

  // 15. CoachFeedbackRequest
  prisma.coachFeedbackRequest = {
    create: async ({ data, select, include }: any) => {
      const cfr = {
        id: data.id || randomUUID(),
        userId: data.userId,
        productId: data.productId,
        topic: data.topic,
        context: data.context || '',
        preferredOutcome: data.preferredOutcome || '',
        status: data.status || CoachFeedbackStatus.REQUESTED,
        coachReply: data.coachReply || null,
        respondedAt: data.respondedAt || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.coachFeedbackRequests.push(cfr);
      return applySelectOrInclude(cfr, 'coachFeedbackRequest', select, include);
    },
    findUnique: async ({ where, select, include }: any) => {
      const cfr = activeStore.coachFeedbackRequests.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(cfr, 'coachFeedbackRequest', select, include);
    },
    findMany: async ({ where, orderBy, select, include }: any) => {
      let list = activeStore.coachFeedbackRequests.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      return list.map((cfr) => applySelectOrInclude(cfr, 'coachFeedbackRequest', select, include));
    },
    update: async ({ where, data, select, include }: any) => {
      const idx = activeStore.coachFeedbackRequests.findIndex((rec) => matchFilter(rec, where));
      if (idx === -1) throw new Error('CoachFeedbackRequest not found for update');
      const updated = { ...activeStore.coachFeedbackRequests[idx], ...data, updatedAt: new Date() };
      activeStore.coachFeedbackRequests[idx] = updated;
      return applySelectOrInclude(updated, 'coachFeedbackRequest', select, include);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.coachFeedbackRequests.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async ({ where }: any = {}) => {
      const prev = activeStore.coachFeedbackRequests.length;
      activeStore.coachFeedbackRequests = activeStore.coachFeedbackRequests.filter((rec) => !matchFilter(rec, where));
      return { count: prev - activeStore.coachFeedbackRequests.length };
    }
  };

  // 16. Post
  prisma.post = {
    create: async ({ data, select }: any) => {
      const post = {
        id: data.id || randomUUID(),
        authorId: data.authorId,
        groupId: data.groupId || null,
        title: data.title || null,
        content: data.content || '',
        type: data.type || 'STATUS',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      activeStore.posts.push(post);
      return applySelectOrInclude(post, 'post', select);
    },
    findMany: async ({ where, orderBy, select }: any = {}) => {
      let list = activeStore.posts.filter((rec) => matchFilter(rec, where));
      if (orderBy) list = applySort(list, orderBy);
      return list.map((p) => applySelectOrInclude(p, 'post', select));
    },
    findUnique: async ({ where, select }: any) => {
      const post = activeStore.posts.find((rec) => matchFilter(rec, where));
      return applySelectOrInclude(post, 'post', select);
    },
    count: async ({ where }: any = {}) => {
      return activeStore.posts.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async () => {
      const count = activeStore.posts.length;
      activeStore.posts = [];
      return { count };
    }
  };

  // 17. Reaction
  prisma.reaction = {
    create: async ({ data }: any) => {
      const r = {
        id: data.id || randomUUID(),
        postId: data.postId,
        userId: data.userId,
        type: data.type || 'LIKE',
        createdAt: new Date()
      };
      activeStore.reactions.push(r);
      return { ...r };
    },
    findMany: async ({ where }: any = {}) => {
      return activeStore.reactions.filter((rec) => matchFilter(rec, where)).map((r) => ({ ...r }));
    },
    count: async ({ where }: any = {}) => {
      return activeStore.reactions.filter((rec) => matchFilter(rec, where)).length;
    },
    deleteMany: async () => {
      const count = activeStore.reactions.length;
      activeStore.reactions = [];
      return { count };
    }
  };

  // 18. ExerciseMedia
  prisma.exerciseMedia = {
    findMany: async () => [],
    count: async () => 0
  };

  // 19. Stubs for other models
  const dummyModels = [
    'agentRun',
    'agentEvent',
    'purchase',
    'userNotificationSettings',
    'notificationDispatchLog',
    'userApiKeys',
    'waterIntakeLog',
    'nutritionDailySummary',
    'nutritionHealthCorrelation',
    'nutritionAiAnalysis',
    'nutritionItem',
    'nutritionImage'
  ];

  for (const model of dummyModels) {
    prisma[model] = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async ({ data }: any) => ({ id: randomUUID(), ...data }),
      count: async () => 0,
      deleteMany: async () => ({ count: 0 })
    };
  }

  // 20. Transactions and Raw queries
  prisma.$transaction = async (actions: any) => {
    if (typeof actions === 'function') {
      return await actions(prisma);
    }
    const results = [];
    for (const action of actions) {
      if (action && typeof action.then === 'function') {
        results.push(await action);
      } else {
        results.push(action);
      }
    }
    return results;
  };

  prisma.$executeRawUnsafe = async () => 0;
  prisma.$queryRaw = async () => [];
}
