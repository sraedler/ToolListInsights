const assert = require('assert');
const { calculateEfficiencyIndex, createTimeEvaluationRecord } = require('../../backend/models/timeEvaluation');

console.log('--- Executing Unit & Contract Tests: 05 - Zeitauswertung ---');

// Test 1: Efficiency Index Formula & Overrun Flagging
{
  // Target = 100m, Actual = 150m (+50% overrun)
  const metrics = calculateEfficiencyIndex(20, 80, 30, 120);
  assert.strictEqual(metrics.targetTotalMin, 100);
  assert.strictEqual(metrics.actualTotalMin, 150);
  assert.strictEqual(metrics.efficiencyPercent, 67, '100 / 150 = 67% efficiency');
  assert.strictEqual(metrics.variancePercent, 50, '(150 - 100) / 100 = 50% variance');
  assert.strictEqual(metrics.isOverrunFlagged, true, 'Variance 50% > 25% must flag overrun');
  console.log('✓ Test 1: Efficiency Index Formula & Overrun Flagging passed');
}

// Test 2: Baseline Zero Variance Case
{
  const metrics = calculateEfficiencyIndex(30, 90, 30, 90);
  assert.strictEqual(metrics.efficiencyPercent, 100);
  assert.strictEqual(metrics.variancePercent, 0);
  assert.strictEqual(metrics.isOverrunFlagged, false);
  console.log('✓ Test 2: Baseline Zero Variance Case passed');
}

// Test 3: Record Factory Helper
{
  const record = createTimeEvaluationRecord({
    orderId: '100305',
    articleId: 'ART-900',
    machine: 'Hermle C400',
    targetSetupMin: 40,
    targetRunMin: 160,
    actualSetupMin: 50,
    actualRunMin: 210
  });

  assert.strictEqual(record.orderId, '100305');
  assert.strictEqual(record.targetTotalMin, 200);
  assert.strictEqual(record.actualTotalMin, 260);
  assert.strictEqual(record.isOverrunFlagged, true, 'Variance 30% > 25% should flag record as overrun');
  console.log('✓ Test 3: Record Factory Helper passed');
}

console.log('\nAll 3 unit & contract assertions passed cleanly for 05 - Zeitauswertung.');
process.exit(0);
