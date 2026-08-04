/**
 * JobStep Data Model & Factory Helper
 * Represents a single CNC machining step on a Kanban board column.
 */

function createJobStep(data) {
  const setupTimeMin = parseInt(data.setupTimeMin || data.AR_TRU || 0, 10);
  const runTimeMin = parseInt(data.runTimeMin || data.AR_TBA || 0, 10);
  const totalTimeMin = setupTimeMin + runTimeMin;

  return {
    stepId: data.stepId || `${data.orderId}_${data.AR_STEP}`,
    orderId: String(data.orderId || ''),
    articleId: String(data.articleId || ''),
    articleName: String(data.articleName || ''),
    orderQty: parseInt(data.orderQty || 1, 10),
    remainingQty: parseInt(data.remainingQty || data.orderQty || 1, 10),
    AR_STEP: parseInt(data.AR_STEP || 10, 10),
    stepName: String(data.stepName || 'Machining'),
    setupTimeMin,
    runTimeMin,
    totalTimeMin,
    contractNumber: String(data.contractNumber || data.orderId || ''),
    kvStatus: data.kvStatus || 'green', // 'green' | 'yellow' | 'red'
    ncProgram: data.ncProgram || null,
    fixture: data.fixture || null,
    toolListNr: data.toolListNr || null,
    isNightRunCapable: Boolean(data.isNightRunCapable),
    manualMachineOverride: data.manualMachineOverride || null
  };
}

module.exports = {
  createJobStep
};
