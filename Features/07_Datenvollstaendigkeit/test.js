const assert = require('assert');
const { auditJobStep } = require('../../backend/models/dataAudit');

console.log('--- Executing Unit & Contract Tests: 07 - Datenvollständigkeit ---');

// Test 1: Fully Complete Step Audit
{
  const step = {
    stepId: '1',
    orderId: '1001',
    articleId: 'ART-100',
    ncProgram: 'O1001.NC',
    matchedListNr: 'TL-1001',
    fixture: 'V-100',
    isWrongMachine: false
  };

  const audited = auditJobStep(step);
  assert.strictEqual(audited.completenessScorePercent, 100);
  assert.strictEqual(audited.issues.length, 0);
  console.log('✓ Test 1: Fully Complete Step Audit passed');
}

// Test 2: Incomplete Step Severity Badges
{
  const step = {
    stepId: '2',
    orderId: '1002',
    articleId: 'ART-102',
    ncProgram: null,
    matchedListNr: 'TL-1002',
    fixture: null,
    isWrongMachine: false
  };

  const audited = auditJobStep(step);
  assert.strictEqual(audited.issues.length, 2);
  assert.ok(audited.issues.some(i => i.severity === 'RED'), 'Must contain RED severity for missing NC');
  assert.ok(audited.issues.some(i => i.severity === 'YELLOW'), 'Must contain YELLOW severity for missing fixture');
  assert.strictEqual(audited.completenessScorePercent, 50);
  console.log('✓ Test 2: Incomplete Step Severity Badges passed');
}

// Test 3: Fuzzy Match Detection
{
  const step = {
    stepId: '3',
    ncProgram: 'O1003_v2.NC',
    ncMatchMode: 'fuzzy',
    matchedListNr: 'TL-1003',
    fixture: 'V-103'
  };

  const audited = auditJobStep(step);
  assert.ok(audited.issues.some(i => i.severity === 'ORANGE'), 'Must contain ORANGE severity for fuzzy NC match');
  console.log('✓ Test 3: Fuzzy Match Detection passed');
}

console.log('\nAll 3 unit & contract assertions passed cleanly for 07 - Datenvollständigkeit.');
process.exit(0);
