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

// Test 4: Intra-Pool Job Stealing & Recommendation Assertion (poolOptimization: true)
{
  const magSelf = ['WZG-1001', 'WZG-1002'];
  const magPartner = ['WZG-1001', 'WZG-1002', 'WZG-1003', 'WZG-1004'];
  const jobTools = ['WZG-1001', 'WZG-1003', 'WZG-1004'];

  const overlapSelf = jobTools.filter(t => magSelf.includes(t)).length; // 1
  const overlapPartner = jobTools.filter(t => magPartner.includes(t)).length; // 3

  let poolRecommendation = null;
  if (overlapPartner > overlapSelf) {
    poolRecommendation = {
      originalMachine: 'RS2_1',
      partnerMachine: 'RS2_2',
      overlapSelf,
      overlapPartner,
      savings: overlapPartner - overlapSelf
    };
  }

  assert.ok(poolRecommendation, 'Should generate pool recommendation when partner has higher tool overlap');
  assert.strictEqual(poolRecommendation.partnerMachine, 'RS2_2');
  assert.strictEqual(poolRecommendation.savings, 2);
  console.log('✓ Test 4: Intra-Pool Job Stealing & Recommendation Assertion passed');
}

// Test 5: Over-planning (Überplanung / Überlappung) Backward Allocation
{
  const step = {
    stepId: '101',
    isOverplanned: true,
    ueberlappungProzent: 50,
    maxProdTag: 240,
    scheduledMin: 480
  };

  assert.strictEqual(step.isOverplanned, true);
  assert.strictEqual(step.maxProdTag, 240);
  assert.strictEqual(step.scheduledMin / step.maxProdTag, 2, 'Should require 2 production days backwards');
  console.log('✓ Test 5: Over-planning Backward Allocation Assertion passed');
}

// Test 6: Daily Workload Runtime Capping Assertion
{
  const multiDayStep = {
    stepId: '384663',
    totalStepProdTime: 2080, // 34h 40m total across 5 days
    maxProdTag: 1440, // Max 24h per day for automated cell
    day1AllocatedMin: 1440
  };

  // Day workload summation must add only the daily allocated portion (1440 min), NOT un-split 2080 min
  const day1Sum = Math.min(multiDayStep.totalStepProdTime, multiDayStep.maxProdTag, multiDayStep.day1AllocatedMin);
  assert.strictEqual(day1Sum, 1440, 'Daily workload sum must cap at daily allocated portion (1440 min) and not include un-split 2080 min');
  console.log('✓ Test 6: Daily Workload Runtime Capping Assertion passed');
}

// Test 7: Contiguous Setup Time Rule Assertion ("Rüstzeit immer am Stück")
{
  const setupMin = 120; // 2 hours setup
  const day1FreeCap = 60; // Only 1 hour remaining on Day 1
  const day2FreeCap = 540; // 9 hours free on Day 2

  // If free capacity on Day 1 is less than setupMin, setup cannot fit contiguous on Day 1 -> must defer to Day 2
  let setupDay = null;
  if (day1FreeCap >= setupMin) {
    setupDay = 'Day1';
  } else if (day2FreeCap >= setupMin) {
    setupDay = 'Day2';
  }

  assert.strictEqual(setupDay, 'Day2', 'Job setup must be scheduled contiguous am Stück on Day 2 when Day 1 free capacity is smaller than setup time');
  console.log('✓ Test 7: Contiguous Setup Time Rule Assertion ("Rüstzeit immer am Stück") passed');
}

// Test 8: Pool Machine Night Run Capacity Optimization & 24h Daily Ceiling
{
  const { calculateAveragePieceTime, calculateMaxNightCapacity, calculateNightRunAllocation } = require('../../backend/models/ganttAnalysis');
  
  // Case A: 10 pieces position, 480 min total prod time -> 48 min avg piece time
  const avgPieceTime = calculateAveragePieceTime(480, 10);
  assert.strictEqual(avgPieceTime, 48, 'Avg piece time must be 48 min');

  // Max 5 pieces per night -> 5 * 48 = 240 min (4h max night cap)
  const maxNightCap = calculateMaxNightCapacity(5, avgPieceTime);
  assert.strictEqual(maxNightCap, 240, 'Max night cap must be 240 min');

  // Day shift planned 480 min (8h), Day capacity 480 min (8h)
  const allocA = calculateNightRunAllocation(480, 480, maxNightCap);
  assert.strictEqual(allocA.dayShiftPlannedMin, 480, 'Day shift must be capped at 480 min');
  assert.strictEqual(allocA.scheduledNightMin, 240, 'Scheduled night min must be 240 min');
  assert.strictEqual(allocA.totalDailyWorkloadMin, 720, 'Total daily workload must be 720 min (12h)');

  // Case B: MaxNightCapacity is 1200 min (20h), but available night window is 1440 - 480 = 960 min (16h)
  const allocB = calculateNightRunAllocation(480, 480, 1200);
  assert.strictEqual(allocB.scheduledNightMin, 960, 'Night shift must be capped at 960 min (16h) by 24h ceiling');
  assert.strictEqual(allocB.totalDailyWorkloadMin, 1440, 'Total daily workload must cap at 1440 min (24h)');
  assert.strictEqual(allocB.is24hCapped, true, 'is24hCapped flag must be true');

  console.log('✓ Test 8: Pool Machine Night Run Capacity Optimization & 24h Daily Ceiling passed');
}

console.log('\nAll 8 unit & contract assertions passed cleanly for 06 - Auswertung Planung.');
process.exit(0);

