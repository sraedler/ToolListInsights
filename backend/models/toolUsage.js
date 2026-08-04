/**
 * ToolUsageRecord Data Model Helper
 * Aggregates historical BDE tool usages and future scheduled tool requirements.
 */

function aggregateToolUsage(pastUsagesCount, futureUsagesCount, threshold = 5) {
  const past = Math.max(0, parseInt(pastUsagesCount || 0, 10));
  const future = Math.max(0, parseInt(futureUsagesCount || 0, 10));
  const totalUsagesCount = past + future;

  return {
    pastUsagesCount: past,
    futureUsagesCount: future,
    totalUsagesCount,
    isStandardToolCandidate: totalUsagesCount >= threshold,
    isRemovalCandidate: past > 0 && future === 0
  };
}

function createToolUsageRecord(data) {
  const usage = aggregateToolUsage(data.pastUsagesCount, data.futureUsagesCount);

  return {
    zzIdent: String(data.zzIdent || ''),
    description: String(data.description || 'Tool Assembly'),
    machine: String(data.machine || ''),
    pastUsagesCount: usage.pastUsagesCount,
    futureUsagesCount: usage.futureUsagesCount,
    totalUsagesCount: usage.totalUsagesCount,
    isStandardToolCandidate: usage.isStandardToolCandidate,
    isRemovalCandidate: usage.isRemovalCandidate
  };
}

module.exports = {
  aggregateToolUsage,
  createToolUsageRecord
};
