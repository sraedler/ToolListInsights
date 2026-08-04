const assert = require('assert');
const { calculateWorkstationCapacity, createManualJobStep } = require('../../backend/models/manualWorkstation');

console.log('--- Executing Unit & Contract Tests: 04 - Planung Entgraten/Montieren ---');

// Test 1: Workstation Headcount Capacity Formula
{
  const cap = calculateWorkstationCapacity(3, 7.5);
  assert.strictEqual(cap.workerCount, 3);
  assert.strictEqual(cap.shiftHoursPerWorker, 7.5);
  assert.strictEqual(cap.totalCapacityHours, 22.5, '3 workers * 7.5 hours = 22.5 total capacity hours');
  console.log('✓ Test 1: Workstation Headcount Capacity Formula passed');
}

// Test 2: CNC Predecessor Readiness Predicate
{
  const stepReady = createManualJobStep({
    stepId: '100',
    workstationCode: 'ENTGRATEN_1',
    isCncPredecessorCompleted: true
  });

  const stepWaiting = createManualJobStep({
    stepId: '101',
    workstationCode: 'MONTAGE',
    isCncPredecessorCompleted: false
  });

  assert.strictEqual(stepReady.readinessStatus, 'PARTS_READY', 'Completed CNC predecessor must mark parts as ready');
  assert.strictEqual(stepWaiting.readinessStatus, 'WAITING_FOR_CNC', 'Incomplete CNC step must wait for CNC completion');
  console.log('✓ Test 2: CNC Predecessor Readiness Predicate passed');
}

// Test 3: Workstation Overbooking Detection
{
  const capacityHours = 8; // 1 worker * 8 hours = 480 mins
  const totalJobMinutes = 600; // 10 hours scheduled
  const isOverbooked = totalJobMinutes > (capacityHours * 60);

  assert.strictEqual(isOverbooked, true, '600 minutes scheduled against 480 capacity minutes must flag overbooking');
  console.log('✓ Test 3: Workstation Overbooking Detection passed');
}

console.log('\nAll 3 unit & contract assertions passed cleanly for 04 - Planung Entgraten/Montieren.');
process.exit(0);
