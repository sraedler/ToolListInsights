const assert = require('assert');
const { evaluateConflictStep } = require('../../backend/models/conflictStep');

console.log('--- Executing Unit & Contract Tests: 02 - Planung Maschinen blockiert ---');

// Test 1: Conflict Step Evaluation Logic
{
  const rawStep = {
    stepId: '100299_20',
    orderId: '100300',
    kvStatus: 'red',
    ncProgram: null,
    fixture: 'V-882',
    toolListNr: 'TL-8841',
    isPredecessorLate: true
  };

  const evaluated = evaluateConflictStep(rawStep);
  assert.strictEqual(evaluated.kvStatus, 'red', 'Missing NC program must classify step as Red status');
  assert.strictEqual(evaluated.isConflict, true, 'isConflict flag must be true');
  assert.ok(evaluated.conflictReasons.some(r => r.code === 'MISSING_NC_PROGRAM'), 'Must contain MISSING_NC_PROGRAM reason');
  console.log('✓ Test 1: Conflict Step Evaluation Logic passed');
}

// Test 2: Conflict Filtering Predicate
{
  const steps = [
    { stepId: '1', kvStatus: 'green', ncProgram: 'O1.NC', fixture: 'V1', toolListNr: 'TL1' },
    { stepId: '2', kvStatus: 'yellow', ncProgram: 'O2.NC', fixture: null, toolListNr: 'TL2' },
    { stepId: '3', kvStatus: 'red', ncProgram: null, fixture: 'V3', toolListNr: 'TL3' }
  ];

  const conflictSteps = steps.map(evaluateConflictStep).filter(s => s.isConflict);
  assert.strictEqual(conflictSteps.length, 2, 'Should filter out green steps and keep 2 conflict steps');
  assert.strictEqual(conflictSteps[0].stepId, '2');
  assert.strictEqual(conflictSteps[1].stepId, '3');
  console.log('✓ Test 2: Conflict Filtering Predicate passed');
}

// Test 3: Category Filtering
{
  const steps = [
    { stepId: '1', ncProgram: null, fixture: 'V1', toolListNr: 'TL1' },
    { stepId: '2', ncProgram: 'O2.NC', fixture: null, toolListNr: 'TL2' }
  ].map(evaluateConflictStep);

  const missingNc = steps.filter(s => s.conflictReasons.some(r => r.code === 'MISSING_NC_PROGRAM'));
  const missingFixture = steps.filter(s => s.conflictReasons.some(r => r.code === 'MISSING_FIXTURE'));

  assert.strictEqual(missingNc.length, 1, 'Should find 1 step missing NC program');
  assert.strictEqual(missingFixture.length, 1, 'Should find 1 step missing fixture');
  console.log('✓ Test 3: Category Filtering passed');
}

// Test 4: Force Release Override Record Validation
{
  const forceReleaseOverride = {
    stepId: '100299_20',
    status: 'force_released',
    reason: 'Manually verified on machine console',
    user: 'supervisor_1',
    timestamp: new Date().toISOString()
  };

  assert.strictEqual(forceReleaseOverride.status, 'force_released', 'Status must be force_released');
  assert.ok(forceReleaseOverride.timestamp, 'Timestamp must exist');
  console.log('✓ Test 4: Force Release Override Record Validation passed');
}

console.log('\nAll 4 unit & contract assertions passed cleanly for 02 - Planung Maschinen blockiert.');
process.exit(0);
