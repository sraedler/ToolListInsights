/**
 * TimeEvaluationRecord Data Model Helper
 * Calculates target vs actual time variances and efficiency index percentages.
 */

function calculateEfficiencyIndex(targetSetupMin, targetRunMin, actualSetupMin, actualRunMin) {
  const targetTotal = targetSetupMin + targetRunMin;
  const actualTotal = actualSetupMin + actualRunMin;

  const efficiencyPercent = actualTotal > 0
    ? Math.round((targetTotal / actualTotal) * 100)
    : 100;

  const variancePercent = targetTotal > 0
    ? Math.round(((actualTotal - targetTotal) / targetTotal) * 100)
    : 0;

  return {
    targetTotalMin: targetTotal,
    actualTotalMin: actualTotal,
    efficiencyPercent,
    variancePercent,
    isOverrunFlagged: variancePercent > 25
  };
}

function createTimeEvaluationRecord(data) {
  const targetSetup = parseInt(data.targetSetupMin || 0, 10);
  const targetRun = parseInt(data.targetRunMin || 0, 10);
  const actualSetup = parseInt(data.actualSetupMin || 0, 10);
  const actualRun = parseInt(data.actualRunMin || 0, 10);

  const metrics = calculateEfficiencyIndex(targetSetup, targetRun, actualSetup, actualRun);

  return {
    orderId: String(data.orderId || ''),
    articleId: String(data.articleId || ''),
    articleName: String(data.articleName || ''),
    machine: String(data.machine || ''),
    targetSetupMin: targetSetup,
    actualSetupMin: actualSetup,
    targetRunMin: targetRun,
    actualRunMin: actualRun,
    targetTotalMin: metrics.targetTotalMin,
    actualTotalMin: metrics.actualTotalMin,
    efficiencyPercent: metrics.efficiencyPercent,
    variancePercent: metrics.variancePercent,
    isOverrunFlagged: metrics.isOverrunFlagged
  };
}

module.exports = {
  calculateEfficiencyIndex,
  createTimeEvaluationRecord
};
