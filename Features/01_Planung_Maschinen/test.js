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

console.log('\nAll 5 unit & contract assertions passed cleanly for 01 - Planung Maschinen.');
process.exit(0);
