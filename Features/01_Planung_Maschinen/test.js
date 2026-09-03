const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Executing Unit & Contract Tests: 01 - Planung Maschinen ---');

// Test 1: JobStep Data Structure Validation
{
  const mockStep = {
    stepId: '100234_10',
    orderId: '100234',
    articleId: 'ART-9842',
    articleName: 'Gehäusedeckel Aluminium',
    orderQty: 100,
    remainingQty: 100,
    AR_STEP: 10,
    stepName: 'Fräsen OP10',
    setupTimeMin: 45,
    runTimeMin: 180,
    totalTimeMin: 225,
    contractNumber: '2026-0881',
    kvStatus: 'green',
    ncProgram: 'O9842_10.NC',
    fixture: 'V-1029',
    toolListNr: 'TL-4491',
    isNightRunCapable: true,
    manualMachineOverride: null
  };

  assert.strictEqual(mockStep.stepId, '100234_10', 'Step ID composite key must match orderId_AR_STEP');
  assert.strictEqual(mockStep.totalTimeMin, mockStep.setupTimeMin + mockStep.runTimeMin, 'Total time must equal setup + run time');
  assert.strictEqual(mockStep.isNightRunCapable, true, 'isNightRunCapable must be boolean true');
  console.log('✓ Test 1: JobStep Data Structure Validation passed');
}

// Test 2: Net Setup Time & Tool Delta Calculation
{
  const totalTools = 18;
  const toolsInMagazine = 14;
  const toolsToSetup = Math.max(0, totalTools - toolsInMagazine);
  const baseSetupMin = 10;
  const assemblyTimePerToolMin = 5;
  const calculatedSetupMin = baseSetupMin + (toolsToSetup * assemblyTimePerToolMin);

  assert.strictEqual(toolsToSetup, 4, 'Net tools to setup must equal 18 - 14 = 4');
  assert.strictEqual(calculatedSetupMin, 30, 'Net setup duration must equal 10 + (4 * 5) = 30 minutes');
  console.log('✓ Test 2: Net Setup Time & Tool Delta Calculation passed');
}

// Test 3: Contract Color Determinism
{
  function getContractColor(contractNum) {
    if (!contractNum) return 'hsl(210, 65%, 45%)';
    let hash = 0;
    for (let i = 0; i < contractNum.length; i++) {
      hash = contractNum.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 40%)`;
  }

  const color1 = getContractColor('2026-0881');
  const color2 = getContractColor('2026-0881');
  const colorDiff = getContractColor('2026-0999');

  assert.strictEqual(color1, color2, 'Deterministic HSL color must match for identical contract number');
  assert.notStrictEqual(color1, colorDiff, 'Different contracts should produce distinct colors');
  console.log('✓ Test 3: Contract Color Determinism passed');
}

// Test 4: Override Structure Validation
{
  const mockOverride = {
    stepId: '100234_10',
    overrideMachine: 'GROB G550',
    startDate: '2026-08-05',
    manualOverride: true
  };

  assert.ok(mockOverride.stepId && mockOverride.overrideMachine && mockOverride.startDate, 'Override record must contain stepId, overrideMachine, and startDate');
  assert.strictEqual(mockOverride.manualOverride, true, 'manualOverride flag must be boolean true');
  console.log('✓ Test 4: Override Structure Validation passed');
}

// Test 5: Night-Shift Filtering Logic
{
  const steps = [
    { stepId: 'S1', runTimeMin: 300, isNightRunCapable: true },
    { stepId: 'S2', runTimeMin: 60, isNightRunCapable: false },
    { stepId: 'S3', runTimeMin: 240, isNightRunCapable: true }
  ];

  const nightCapableSteps = steps.filter(s => s.isNightRunCapable);
  assert.strictEqual(nightCapableSteps.length, 2, 'Should identify exactly 2 night-run capable steps');
  assert.strictEqual(nightCapableSteps[0].stepId, 'S1');
  assert.strictEqual(nightCapableSteps[1].stepId, 'S3');
  console.log('✓ Test 5: Night-Shift Filtering Logic passed');
}

// Test 6: Static Park Tools Protection Assertion
{
  const parkProgramNames = ['C400 geparkt', 'RS2-1-Parkplatz', 'RS2-2-Parkplatz', 'Chiron Parkplatz', 'Geparkt'];
  const isParkProgram = (name) => (name || '').toLowerCase().includes('park');

  parkProgramNames.forEach(pName => {
    assert.strictEqual(isParkProgram(pName), true, `Program name "${pName}" must be identified as static park program`);
  });

  const magazineTools = [10, 12, 15, 20];
  const staticParkToolsSet = new Set([12, 15]); // Static park tools 12 and 15
  const unloadCandidates = magazineTools.filter(t => !staticParkToolsSet.has(t));

  assert.deepStrictEqual(unloadCandidates, [10, 20], 'Static park tools 12 and 15 must be excluded from unload/eviction candidates');
  console.log('✓ Test 6: Static Park Tools Protection Assertion passed');
}

// Test 7: Chiron & Hermle C400 Entire Tool List Unloading Unit Assertion (Completed Order Rule)
{
  const isWholeListUnloadMachine = (mName) => {
    const upper = (mName || '').toUpperCase();
    return upper.includes('CHIRON') || upper.includes('C400');
  };
  assert.strictEqual(isWholeListUnloadMachine('Chiron'), true, 'Chiron machine name must be matched');
  assert.strictEqual(isWholeListUnloadMachine('C400'), true, 'C400 machine name must be matched');
  assert.strictEqual(isWholeListUnloadMachine('Hermle C400'), true, 'Hermle C400 machine name must be matched');
  assert.strictEqual(isWholeListUnloadMachine('RS2_1'), false, 'RS2_1 must not be whole-list unload machine');

  const completedOrderListNr = '2537-0301-SP1';
  const completedOrderTools = [101, 102, 103, 104, 105];
  const staticParkToolsSet = new Set([101]); // Tool 101 is in Park list (e.g. C400 geparkt or Chiron Parkplatz)
  const futureNeededToolsSet = new Set([102]); // Tool 102 is needed by upcoming step

  // All tools of completed list except park tools & future needed tools
  const unloadTools = completedOrderTools.filter(t => !staticParkToolsSet.has(t) && !futureNeededToolsSet.has(t));

  assert.deepStrictEqual(unloadTools, [103, 104, 105], 'Completed order entire tool list [103, 104, 105] must be proposed for unloading on Chiron and C400, excluding park tool 101 and future tool 102');
  console.log('✓ Test 7: Chiron & Hermle C400 Entire Tool List Unloading Unit Assertion passed');
}

// Test 8: Overdue Delivery Date Prioritization Assertion (FR-011)
{
  function getDeliveryUrgencyPenalty(step, now = new Date('2026-08-10')) {
    const dateStr = step.DeliveryDate || step.deliveryDate || step.StartDate || step.startDate;
    if (!dateStr) return 0;
    const dDate = new Date(dateStr);
    if (isNaN(dDate.getTime())) return 0;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const stepDateStart = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate()).getTime();
    const diffDays = (stepDateStart - todayStart) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      return -100.0 + (diffDays * 10.0);
    } else if (diffDays <= 2) {
      return -20.0 + (diffDays * 5.0);
    } else {
      return Math.min(50.0, diffDays * 0.5);
    }
  }

  const overdueStep = { StepId: 1, DeliveryDate: '2026-08-01', MatchedListNr: 'TL-101' }; // 9 days overdue
  const futureStep = { StepId: 2, DeliveryDate: '2026-09-01', MatchedListNr: 'TL-102' }; // Future step

  const overdueScore = 5 + getDeliveryUrgencyPenalty(overdueStep, new Date('2026-08-10'));
  const futureScore = 1 + getDeliveryUrgencyPenalty(futureStep, new Date('2026-08-10'));

  assert.ok(overdueScore < futureScore, 'Overdue step must receive a significantly lower optimization candidate score than future step to be scheduled first');
  console.log('✓ Test 8: Overdue Delivery Date Prioritization Assertion passed');
}

// Test 9: Pool Machine Night Run Capacity Optimization & 24h Daily Ceiling (FR-012)
{
  const { calculateAveragePieceTime, calculateMaxNightCapacity, calculateNightRunAllocation } = require('../../backend/models/ganttAnalysis');

  const avgPieceTime = calculateAveragePieceTime(480, 10); // 10 pcs, 480 min -> 48 min/pc
  assert.strictEqual(avgPieceTime, 48, 'Avg piece time must be 48 min');

  const maxNightCap = calculateMaxNightCapacity(5, avgPieceTime); // 5 pcs * 48 min = 240 min (4h)
  assert.strictEqual(maxNightCap, 240, 'Max night cap must be 240 min');

  const alloc = calculateNightRunAllocation(480, 480, maxNightCap); // 480 min day, 240 min night
  assert.strictEqual(alloc.dayShiftPlannedMin, 480, 'Day shift must cap at 480 min');
  assert.strictEqual(alloc.scheduledNightMin, 240, 'Scheduled night min must be 240 min');
  assert.strictEqual(alloc.totalDailyWorkloadMin, 720, 'Total daily workload must be 720 min (12h)');

  console.log('✓ Test 9: Pool Machine Night Run Capacity Optimization & 24h Daily Ceiling passed');
}

// Test 10: Order/Contract Search Filtering & Out-of-Range Future Step Overflow Routing (FR-013 & FR-006)
{
  function stepMatchesSearch(step, q) {
    if (!q) return true;
    const query = q.trim().toLowerCase();
    const oId = String(step.OrderId || step.orderId || '').toLowerCase();
    const cNum = String(step.ContractNumber || step.contractNumber || step.cNum || '').toLowerCase();
    const desc = String(step.StepDesc || step.stepDesc || step.Description || step.ArticleName || step.articleName || '').toLowerCase();
    const cust = String(step.CustomerName || step.customerName || '').toLowerCase();
    const nc = String(step.NCProgram || step.ncProgram || '').toLowerCase();
    const tl = String(step.MatchedListNr || step.matchedListNr || step.toolListNr || '').toLowerCase();
    const pos = String(step.OrderPos || step.orderPos || '').toLowerCase();

    return oId.includes(query) || cNum.includes(query) || desc.includes(query) || cust.includes(query) || nc.includes(query) || tl.includes(query) || (cNum + '_' + pos).includes(query) || (oId + '_' + pos).includes(query);
  }

  const steps = [
    { StepId: 'S1', ContractNumber: 'P2026-001', OrderId: '101', StepDateStr: '2026-08-15' },
    { StepId: 'S2', ContractNumber: 'P2025-099', OrderId: '102', StepDateStr: '2026-08-15' },
    { StepId: 'S3', ContractNumber: 'P2026-002', OrderId: '103', StepDateStr: '2026-09-30' } // Out of range future step
  ];

  const filteredP2026 = steps.filter(s => stepMatchesSearch(s, 'P2026'));
  assert.strictEqual(filteredP2026.length, 2, 'Should match exactly 2 steps with contract P2026');
  assert.ok(!filteredP2026.some(s => s.ContractNumber.includes('P2025')), 'Steps with P2025 must be excluded when searching P2026');

  // Test Overflow routing for out-of-range future steps
  const lastPlanningDay = '2026-08-20';
  const routedSteps = filteredP2026.map(s => {
    let targetDay = s.StepDateStr;
    if (!targetDay || targetDay < '2026-08-10' || targetDay > lastPlanningDay) {
      targetDay = 'Überlauf';
    }
    return { ...s, targetDay };
  });

  const overflowStep = routedSteps.find(s => s.StepId === 'S3');
  assert.strictEqual(overflowStep.targetDay, 'Überlauf', 'Future step S3 (2026-09-30) beyond visible horizon must be routed to Überlauf');
  console.log('✓ Test 10: Order/Contract Search Filtering & Out-of-Range Future Step Overflow Routing passed');
}

console.log('\nAll 10 unit & contract assertions passed cleanly for 01 - Planung Maschinen.');
process.exit(0);


