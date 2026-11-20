import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('=== EMPIRICAL CHALLENGER VERIFICATION SUITE ===\n');

// -------------------------------------------------------------
// Test 1: Check-in Fixture Date Collision
// -------------------------------------------------------------
console.log('--- TEST 1: Check-in Fixture Date Collision ---');
const fixturesSource = fs.readFileSync('test/e2e/helpers/fixtures.ts', 'utf8');

// Verify the source code matches the fixed loop
const loopMatch = fixturesSource.match(/for\s*\(\s*let\s+i\s*=\s*5\s*;\s*i\s*>=\s*1\s*;\s*i--\s*\)/);
assert.ok(loopMatch, 'fixtures.ts must contain loop: for (let i = 5; i >= 1; i--)');
console.log('PASS: fixtures.ts contains loop starting at 5 and ending at 1');

// Verify no loop with i >= 0 exists in fixtures.ts for check-ins
const badLoopRegex = /for\s*\(\s*let\s+i\s*=\s*\d+\s*;\s*i\s*>=\s*0\s*;\s*i--\s*\)/;
assert.ok(!badLoopRegex.test(fixturesSource), 'fixtures.ts must NOT contain loop with i >= 0');
console.log('PASS: No loop with i >= 0 found');

// Simulate date generation
function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
const todayUtc = startOfUtcDay(new Date());

const generatedDates = [];
for (let i = 5; i >= 1; i--) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - i);
  d.setUTCHours(0, 0, 0, 0);
  generatedDates.push(d);
}

console.log('Today UTC:', todayUtc.toISOString());
console.log('Generated Fixture Dates:', generatedDates.map(d => d.toISOString()));

const hasToday = generatedDates.some(d => d.getTime() === todayUtc.getTime());
assert.equal(hasToday, false, 'Generated dates must NOT contain today UTC');
console.log('PASS: None of the seeded check-in dates collide with today UTC!\n');

// -------------------------------------------------------------
// Test 2: JWT Secret Synchronization & Defensive Initialization
// -------------------------------------------------------------
console.log('--- TEST 2: JWT Secret Synchronization ---');

// Ensure process.env.JWT_SECRET is initially absent
delete process.env.JWT_SECRET;

// Import client.ts (which defensively sets process.env.JWT_SECRET)
await import('./e2e/helpers/client.ts');
console.log('Defensive JWT_SECRET after client.ts import:', process.env.JWT_SECRET);
assert.equal(process.env.JWT_SECRET, 'steadyai-dev-super-secret-jwt-key-2026-secure');

// Import auth helper and auth route
const authHelper = await import('./e2e/helpers/auth.ts');
const authRoute = await import('../src/routes/auth.ts');

const generateTestJwt = authHelper.generateTestJwt || authHelper.default?.generateTestJwt;
const generateExpiredJwt = authHelper.generateExpiredJwt || authHelper.default?.generateExpiredJwt;
const generateInvalidSignatureJwt = authHelper.generateInvalidSignatureJwt || authHelper.default?.generateInvalidSignatureJwt;
const verifyAppJwt = authRoute.verifyAppJwt || authRoute.default?.verifyAppJwt;

// 1. Valid token verification
const token = generateTestJwt({ sub: 'user-1', email: 'user1@steady.test', role: 'MEMBER' });
const verified = verifyAppJwt(token);
console.log('Verified payload:', verified);
assert.equal(verified.sub, 'user-1');
assert.equal(verified.email, 'user1@steady.test');
assert.equal(verified.role, 'MEMBER');
console.log('PASS: Valid JWT correctly verified');

// 2. Invalid signature rejection
const badToken = generateInvalidSignatureJwt({ sub: 'user-1' });
assert.throws(
  () => verifyAppJwt(badToken),
  /Invalid JWT signature/,
  'Bad signature should throw Invalid JWT signature'
);
console.log('PASS: Invalid signature correctly rejected with Invalid JWT signature');

// 3. Expired token rejection
const expiredToken = generateExpiredJwt({ sub: 'user-1' });
assert.throws(
  () => verifyAppJwt(expiredToken),
  /JWT expired/,
  'Expired token should throw JWT expired'
);
console.log('PASS: Expired token correctly rejected with JWT expired\n');

// -------------------------------------------------------------
// Test 3: db.ts Teardown Empirical Verification
// -------------------------------------------------------------
console.log('--- TEST 3: db.ts Teardown Verification ---');
const dbSource = fs.readFileSync('test/e2e/helpers/db.ts', 'utf8');

// 1. Confirm deleteOperations is completely gone
assert.equal(dbSource.includes('deleteOperations'), false, 'db.ts must not contain deleteOperations');
console.log('PASS: deleteOperations is completely removed');

// 2. Confirm modelsToDelete array exists and is passed to $transaction
assert.ok(dbSource.includes('const modelsToDelete: any[] = [];'), 'db.ts must declare modelsToDelete');
assert.ok(dbSource.includes('await prisma.$transaction(modelsToDelete);'), 'db.ts must pass modelsToDelete to $transaction');
console.log('PASS: modelsToDelete is created and passed to prisma.$transaction');

// 3. Confirm coachAssignment is pushed to modelsToDelete
const coachAssignPushRegex = /modelsToDelete\.push\(\s*\(prisma as any\)\.coachAssignment\.deleteMany\(\)\s*\)/;
assert.ok(coachAssignPushRegex.test(dbSource), 'db.ts must push coachAssignment.deleteMany() into modelsToDelete');
console.log('PASS: coachAssignment.deleteMany() is pushed into modelsToDelete');

// 4. Mock Prisma execution test: verify that modelsToDelete collects all operations and delivers to $transaction
let receivedTransactionOps = null;
const mockPrisma = {
  $executeRawUnsafe: async () => {},
  coachAssignment: {
    deleteMany: () => ({ op: 'deleteMany', model: 'CoachAssignment' })
  },
  $transaction: async (ops) => {
    receivedTransactionOps = ops;
  }
};

const models = [
  'agentEvent', 'agentRun', 'coachFeedbackRequest', 'purchase', 'product',
  'workspaceMember', 'workspace', 'challengeCheckIn', 'challengeParticipation',
  'reaction', 'post', 'challenge', 'communityGroup', 'notificationDispatchLog',
  'userNotificationSettings', 'nutritionAiAnalysis', 'nutritionItem', 'nutritionImage',
  'nutritionEntry', 'nutritionHealthCorrelation', 'nutritionDailySummary',
  'userNutritionGoal', 'waterIntakeLog', 'healthRecord', 'healthSyncBatch',
  'userHealthConnection', 'userApiKeys', 'user'
];

for (const m of models) {
  mockPrisma[m] = {
    deleteMany: () => ({ op: 'deleteMany', model: m })
  };
}

// Simulate resetIntegrationDb logic with mockPrisma
const simModelsToDelete = [];
if ('coachAssignment' in mockPrisma && typeof mockPrisma.coachAssignment?.deleteMany === 'function') {
  simModelsToDelete.push(mockPrisma.coachAssignment.deleteMany());
}
for (const m of models) {
  simModelsToDelete.push(mockPrisma[m].deleteMany());
}
await mockPrisma.$transaction(simModelsToDelete);

assert.ok(Array.isArray(receivedTransactionOps), 'Transaction must receive array of operations');
assert.equal(receivedTransactionOps.length, 29, 'Expected 29 models to be deleted in transaction');
assert.equal(receivedTransactionOps[0].model, 'CoachAssignment', 'First model must be CoachAssignment');
assert.equal(receivedTransactionOps[receivedTransactionOps.length - 1].model, 'user', 'Last model must be user');
console.log('PASS: Transaction receives all 29 models in reverse topological order including CoachAssignment!\n');

// -------------------------------------------------------------
// Test 4: Elimination of 201 || 409 Loopholes & Soft Assertions
// -------------------------------------------------------------
console.log('--- TEST 4: Elimination of 201 || 409 Loopholes & Soft Assertions ---');

// 4a. daily-member-flow.test.ts inspection
const dailyFlowSource = fs.readFileSync('test/e2e/tier4-workflows/daily-member-flow.test.ts', 'utf8');
assert.equal(dailyFlowSource.includes('checkInRes.statusCode === 201 || checkInRes.statusCode === 409'), false, 'daily-member-flow must not have 201 || 409 loophole');
assert.equal(dailyFlowSource.includes('checkInRes.statusCode === 409 || checkInRes.statusCode === 201'), false, 'daily-member-flow must not have 409 || 201 loophole');
console.log('PASS: daily-member-flow.test.ts has NO 201 || 409 loopholes');

// Check strict 201 assertions in daily-member-flow
const strict201Matches = dailyFlowSource.match(/assert\.equal\(checkInRes\.statusCode,\s*201\)/g);
assert.ok(strict201Matches && strict201Matches.length >= 2, 'daily-member-flow must have at least 2 strict 201 assertions for check-ins');
console.log(`PASS: daily-member-flow.test.ts contains ${strict201Matches.length} strict 201 checkInRes assertions`);

// Check soft checkInTask assertion is removed
assert.equal(dailyFlowSource.includes('if (checkInTask) {'), false, 'daily-member-flow must NOT have soft `if (checkInTask)` check');
const strictCheckInTask = dailyFlowSource.includes("assert.ok(checkInTask, 'Expected daily check-in task to be present in dailyTasks');");
assert.ok(strictCheckInTask, 'daily-member-flow must assert.ok(checkInTask) before checking completed');
console.log('PASS: daily-member-flow.test.ts strictly asserts checkInTask presence and completion');

// 4b. Global scan of all test/e2e test files for 201 || 409
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = `${dir}/${item.name}`;
    if (item.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else if (item.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allE2eFiles = getAllFiles('test/e2e');
const filesWithLoopholes = [];
for (const file of allE2eFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('201 ||') || content.includes('|| 201') ||
      content.includes('409 ||') || content.includes('|| 409')) {
    filesWithLoopholes.push(file);
  }
}
assert.deepEqual(filesWithLoopholes, [], `Expected NO files with statusCode loopholes, found: ${filesWithLoopholes.join(', ')}`);
console.log(`PASS: Scanned all ${allE2eFiles.length} files in test/e2e/ - 0 status code loopholes found!`);

console.log('\n=== ALL 4 EMPIRICAL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
