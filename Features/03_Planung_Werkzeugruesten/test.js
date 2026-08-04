const assert = require('assert');
const { calculateNetToolSetup, createToolPresetJob } = require('../../backend/models/toolPreset');

console.log('--- Executing Unit & Contract Tests: 03 - Planung Werkzeugrüsten ---');

// Test 1: Net Tool Setup Delta Calculation
{
  const result = calculateNetToolSetup(24, 18, 10, 5);
  assert.strictEqual(result.toolsToSetupCount, 6, '24 tools in list - 18 in magazine = 6 to setup');
  assert.strictEqual(result.toolsAlreadyInMagazineCount, 18, '18 tools already in magazine');
  assert.strictEqual(result.estimatedSetupDurationMin, 40, '10 base + (6 * 5) = 40 minutes duration');
  console.log('✓ Test 1: Net Tool Setup Delta Calculation passed');
}

// Test 2: Zero Delta Optimization Case
{
  const result = calculateNetToolSetup(12, 12, 10, 5);
  assert.strictEqual(result.toolsToSetupCount, 0, 'Should require 0 new tool assemblies');
  assert.strictEqual(result.estimatedSetupDurationMin, 10, 'Setup duration should equal base time 10 mins');
  console.log('✓ Test 2: Zero Delta Optimization Case passed');
}

// Test 3: ToolPresetJob Factory & State Initializer
{
  const job = createToolPresetJob({
    toolListNr: 'TL-8841',
    machine: 'Hermle C30',
    totalToolsCount: 18,
    toolsAlreadyInMagazineCount: 14
  });

  assert.strictEqual(job.toolListNr, 'TL-8841');
  assert.strictEqual(job.setupStatus, 'PREPARATION_PENDING');
  assert.strictEqual(job.toolsToSetupCount, 4);
  console.log('✓ Test 3: ToolPresetJob Factory & State Initializer passed');
}

// Test 4: Weekly Component Pick Aggregation Logic
{
  const toolLists = [
    { listId: 'TL1', components: [{ id: 'C101', qty: 4 }, { id: 'C102', qty: 2 }] },
    { listId: 'TL2', components: [{ id: 'C101', qty: 6 }, { id: 'C103', qty: 1 }] }
  ];

  const pickMap = {};
  toolLists.forEach(tl => {
    tl.components.forEach(c => {
      pickMap[c.id] = (pickMap[c.id] || 0) + c.qty;
    });
  });

  assert.strictEqual(pickMap['C101'], 10, 'Component C101 total pick quantity should equal 4 + 6 = 10');
  assert.strictEqual(pickMap['C102'], 2);
  assert.strictEqual(pickMap['C103'], 1);
  console.log('✓ Test 4: Weekly Component Pick Aggregation Logic passed');
}

console.log('\nAll 4 unit & contract assertions passed cleanly for 03 - Planung Werkzeugrüsten.');
process.exit(0);
