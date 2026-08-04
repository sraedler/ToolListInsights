/**
 * GanttAnalysis Data Model Helper
 * Handles multi-week timeline offsets and weekly machine load calculations.
 */

function calculateWeeklyCapacity(scheduledMinutes, totalCapacityHoursPerWeek = 40) {
  const scheduledHours = Math.round((scheduledMinutes / 60) * 10) / 10;
  const utilizationPercent = Math.min(100, Math.round((scheduledHours / totalCapacityHoursPerWeek) * 100));

  return {
    scheduledHours,
    availableCapacityHours: totalCapacityHoursPerWeek,
    utilizationPercent,
    isOverloaded: scheduledHours > totalCapacityHoursPerWeek
  };
}

function createGanttJobBlock(data) {
  return {
    stepId: String(data.stepId || ''),
    orderId: String(data.orderId || ''),
    contractNumber: String(data.contractNumber || data.orderId || ''),
    articleName: String(data.articleName || ''),
    machine: String(data.machine || ''),
    startOffsetDays: parseInt(data.startOffsetDays || 0, 10),
    durationDays: Math.max(1, parseInt(data.durationDays || 1, 10)),
    isNightRun: Boolean(data.isNightRun),
    isOnTime: Boolean(data.isOnTime ?? true)
  };
}

module.exports = {
  calculateWeeklyCapacity,
  createGanttJobBlock
};
