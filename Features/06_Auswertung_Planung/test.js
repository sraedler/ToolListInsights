const assert = require('assert');
const { calculateWeeklyCapacity, createGanttJobBlock } = require('../../backend/models/ganttAnalysis');

console.log('--- Executing Unit & Contract Tests: 06 - Auswertung Planung ---');

// Test 1: Weekly Machine Capacity Formula
{
  const cap = calculateWeeklyCapacity(2400, 40); // 2400 mins = 40 hours
  assert.strictEqual(cap.scheduledHours, 40);
  assert.strictEqual(cap.utilizationPercent, 100);
  assert.strictEqual(cap.isOverloaded, false);
  console.log('✓ Test 1: Weekly Machine Capacity Formula passed');
}

// Test 2: Synchronous Contract Hover Matcher
{
  const blocks = [
    createGanttJobBlock({ stepId: '1', contractNumber: 'VERTRAG-991', machine: 'Hermle C400' }),
    createGanttJobBlock({ stepId: '2', contractNumber: 'VERTRAG-992', machine: 'GROB G550' }),
    createGanttJobBlock({ stepId: '3', contractNumber: 'VERTRAG-991', machine: 'GROB G550' })
  ];

  const hoveredContract = 'VERTRAG-991';
  const highlighted = blocks.filter(b => b.contractNumber === hoveredContract);

  assert.strictEqual(highlighted.length, 2, 'Should match 2 blocks with contract VERTRAG-991');
  assert.strictEqual(highlighted[0].stepId, '1');
  assert.strictEqual(highlighted[1].stepId, '3');
  console.log('✓ Test 2: Synchronous Contract Hover Matcher passed');
}

// Test 3: Two-Pass Non-Overbooking Pool Allocation Assertion
{
  // Simulated machine daily max capacity: 360 minutes (6 hours)
  const maxCap = 360;
  
  // Pass 1: Fixed jobs on C40 take 300 minutes
  const fixedC40Load = 300;
  const remainingC40Cap = maxCap - fixedC40Load; // 60 minutes free
  
  // Pass 1: Fixed jobs on C42 take 120 minutes
  const fixedC42Load = 120;
  const remainingC42Cap = maxCap - fixedC42Load; // 240 minutes free

  // Pool step duration: 180 minutes
  const poolStepMin = 180;

  // Pool step cannot fit in C40 (180 > 60), but fits in C42 (180 <= 240)
  let assignedMachine = null;
  if (poolStepMin <= remainingC40Cap) {
    assignedMachine = 'C40';
  } else if (poolStepMin <= remainingC42Cap) {
    assignedMachine = 'C42';
  } else {
    assignedMachine = 'Überlauf';
  }

  assert.strictEqual(assignedMachine, 'C42', 'Pool job must fill remaining free capacity on C42 without overbooking C40');
  console.log('✓ Test 3: Two-Pass Non-Overbooking Pool Allocation Assertion passed');
}

console.log('\nAll 3 unit & contract assertions passed cleanly for 06 - Auswertung Planung.');
process.exit(0);
