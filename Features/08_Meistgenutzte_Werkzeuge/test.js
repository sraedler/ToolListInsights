const assert = require('assert');
const { aggregateToolUsage, createToolUsageRecord } = require('../../backend/models/toolUsage');

console.log('--- Executing Unit & Contract Tests: 08 - Meistgenutzte Werkzeuge ---');

// Test 1: Tool Usage Summation & Standard Tool Qualification Threshold
{
  const metrics = aggregateToolUsage(3, 4); // Past = 3, Future = 4 -> Total = 7
  assert.strictEqual(metrics.totalUsagesCount, 7);
  assert.strictEqual(metrics.isStandardToolCandidate, true, '7 usages >= 5 threshold must qualify for Festbestückung');
  assert.strictEqual(metrics.isRemovalCandidate, false);
  console.log('✓ Test 1: Tool Usage Summation & Standard Tool Qualification Threshold passed');
}

// Test 2: Magazine Removal Candidate Flagging
{
  const metrics = aggregateToolUsage(4, 0); // Past = 4, Future = 0
  assert.strictEqual(metrics.isStandardToolCandidate, false, '4 usages < 5 threshold');
  assert.strictEqual(metrics.isRemovalCandidate, true, 'Past > 0 and Future = 0 must recommend magazine removal');
  console.log('✓ Test 2: Magazine Removal Candidate Flagging passed');
}

// Test 3: Tool Usage Record Factory
{
  const record = createToolUsageRecord({
    zzIdent: 'TL-9912',
    description: 'Fräser D12 Z4',
    machine: 'Hermle C400',
    pastUsagesCount: 6,
    futureUsagesCount: 2
  });

  assert.strictEqual(record.zzIdent, 'TL-9912');
  assert.strictEqual(record.totalUsagesCount, 8);
  assert.strictEqual(record.isStandardToolCandidate, true);
  console.log('✓ Test 3: Tool Usage Record Factory passed');
}

console.log('\nAll 3 unit & contract assertions passed cleanly for 08 - Meistgenutzte Werkzeuge.');
process.exit(0);
