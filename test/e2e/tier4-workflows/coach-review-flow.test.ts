import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { getTestApp, closeTestApp } from '../helpers/client';
import { assertIntegrationDbSafety, resetIntegrationDb } from '../helpers/db';
import {
  createCoachAndMemberPair,
  seedMemberDashboardFixture,
  seedCoachDashboardFixture
} from '../helpers/fixtures';

describe('Tier 4 Workflow: Coach Daily Operations & Queue Triage', () => {
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

  it('Executes complete coach daily workflow: roster check -> queue triage -> deep dive -> reply', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);
    const { feedbackRequestIds } = await seedCoachDashboardFixture(coach.user.id, [assignedMember.user.id]);
    const targetRequestId = feedbackRequestIds[0];

    // Step 1: Coach checks assigned client roster
    const rosterRes = await app.inject({
      method: 'GET',
      url: '/api/coach/roster',
      headers: coach.bearerHeaders
    });
    assert.equal(rosterRes.statusCode, 200);
    const rosterBody = rosterRes.json();
    assert.equal(rosterBody.totalAssigned, 1);
    assert.equal(rosterBody.members[0].id, assignedMember.user.id);

    // Step 2: Coach checks overall engagement metrics
    const metricsBefore = await app.inject({
      method: 'GET',
      url: '/api/coach/metrics',
      headers: coach.bearerHeaders
    });
    assert.equal(metricsBefore.statusCode, 200);
    const metricsBeforeBody = metricsBefore.json();
    assert.equal(metricsBeforeBody.totalClients, 1);
    assert.ok(metricsBeforeBody.pendingReviews >= 1);

    // Step 3: Coach triages feedback queue
    const queueRes = await app.inject({
      method: 'GET',
      url: '/api/coach/feedback-queue',
      headers: coach.bearerHeaders
    });
    assert.equal(queueRes.statusCode, 200);
    const queueBody = queueRes.json();
    assert.ok(queueBody.total >= 1);
    const pendingItem = queueBody.queue.find((q: any) => q.id === targetRequestId);
    assert.ok(pendingItem, 'Target feedback request must be in the queue');
    assert.equal(pendingItem.memberId, assignedMember.user.id);

    // Step 4: Coach inspects individual member reports before formulating reply
    const reportRes = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.bearerHeaders
    });
    assert.equal(reportRes.statusCode, 200);
    const reportBody = reportRes.json();
    assert.equal(reportBody.member.id, assignedMember.user.id);
    assert.ok(Array.isArray(reportBody.healthRecords));
    assert.ok(Array.isArray(reportBody.workoutHistory));
    assert.ok(Array.isArray(reportBody.nutritionOverview));
    assert.ok(reportBody.engagementSummary);

    // Step 5: Coach submits personalized coaching reply with adjustments
    const replyText =
      'Reviewed your logs. Great consistency! Let us bump carbohydrates by 25g on lifting days to maintain intensity.';
    const feedbackRes = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.bearerHeaders,
      payload: {
        feedbackRequestId: targetRequestId,
        reply: replyText
      }
    });
    assert.equal(feedbackRes.statusCode, 200);
    const feedbackBody = feedbackRes.json();
    assert.equal(feedbackBody.success, true);
    assert.equal(feedbackBody.updatedRequest.status, 'RESPONDED');
    assert.equal(feedbackBody.updatedRequest.coachReply, replyText);

    // Step 6: Verify queue decrements and metrics update
    const queueAfterRes = await app.inject({
      method: 'GET',
      url: '/api/coach/feedback-queue',
      headers: coach.bearerHeaders
    });
    assert.equal(queueAfterRes.statusCode, 200);
    assert.equal(queueAfterRes.json().total, 0);

    const metricsAfter = await app.inject({
      method: 'GET',
      url: '/api/coach/metrics',
      headers: coach.bearerHeaders
    });
    assert.equal(metricsAfter.statusCode, 200);
    assert.equal(metricsAfter.json().pendingReviews, 0);
  });

  it('Scenario 3: Coach Deep-Dive Member Consultation & Action Plan', async () => {
    const { coach, assignedMember } = await createCoachAndMemberPair();
    await seedMemberDashboardFixture(assignedMember.user.id);

    // 1. Coach navigates directly to /coach/members/:id/reports
    const reportRes = await app.inject({
      method: 'GET',
      url: `/api/coach/members/${assignedMember.user.id}/reports`,
      headers: coach.bearerHeaders
    });
    assert.equal(reportRes.statusCode, 200);
    const report = reportRes.json();

    assert.equal(report.member.id, assignedMember.user.id);
    assert.ok(Array.isArray(report.workoutHistory));
    assert.ok(Array.isArray(report.nutritionOverview));

    // 2. Coach formulates and dispatches personalized consultation note with calorie adjustment
    const feedbackRes = await app.inject({
      method: 'POST',
      url: '/api/coach/feedback',
      headers: coach.bearerHeaders,
      payload: {
        memberId: assignedMember.user.id,
        feedbackText: 'Comprehensive review completed. Transitioning to 4-day upper/lower split.',
        category: 'Consultation & Strategy',
        calorieAdjustmentKcal: 200
      }
    });
    assert.equal(feedbackRes.statusCode, 200);
    assert.equal(feedbackRes.json().success, true);
  });
});
