/**
 * ManualWorkstation Data Model Helper
 * Calculates workstation capacity limits and predecessor CNC completion readiness.
 */

function calculateWorkstationCapacity(workerCount, shiftHoursPerWorker = 8) {
  const count = parseInt(workerCount || 1, 10);
  const shift = parseFloat(shiftHoursPerWorker || 8);
  return {
    workerCount: count,
    shiftHoursPerWorker: shift,
    totalCapacityHours: count * shift
  };
}

function createManualJobStep(data) {
  const isCncCompleted = Boolean(data.isCncPredecessorCompleted ?? true);

  return {
    stepId: String(data.stepId || ''),
    orderId: String(data.orderId || ''),
    articleId: String(data.articleId || ''),
    articleName: String(data.articleName || ''),
    workstationCode: String(data.workstationCode || 'ENTGRATEN_1'),
    estimatedTimeMin: parseInt(data.estimatedTimeMin || 15, 10),
    isCncPredecessorCompleted: isCncCompleted,
    readinessStatus: isCncCompleted ? 'PARTS_READY' : 'WAITING_FOR_CNC'
  };
}

module.exports = {
  calculateWorkstationCapacity,
  createManualJobStep
};
