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
  const posQty = parseInt(data.posQuantity || data.PosQuantity || 1, 10);
  const totalProd = parseInt(data.totalStepProdTime || data.TotalStepProdTime || data.prodTime || 0, 10);
  const avgPieceTime = calculateAveragePieceTime(totalProd, posQty);
  const maxPiecesNight = parseInt(data.maxPiecesPerNight || data.MaxPiecesPerNight || 0, 10);
  const maxNightCap = calculateMaxNightCapacity(maxPiecesNight, avgPieceTime);

  return {
    stepId: String(data.stepId || ''),
    orderId: String(data.orderId || ''),
    contractNumber: String(data.contractNumber || data.orderId || ''),
    articleName: String(data.articleName || ''),
    machine: String(data.machine || ''),
    machinePoolId: data.machinePoolId !== undefined ? data.machinePoolId : null,
    startOffsetDays: parseInt(data.startOffsetDays || 0, 10),
    durationDays: Math.max(1, parseInt(data.durationDays || 1, 10)),
    setupTime: parseInt(data.setupTime || 0, 10),
    prodTime: parseInt(data.prodTime || 0, 10),
    posQuantity: posQty,
    avgPieceTime,
    maxPiecesPerNight: maxPiecesNight,
    maxNightCapacityMin: maxNightCap,
    isNightRun: Boolean(data.isNightRun),
    isOverplanned: Boolean(data.isOverplanned),
    isOnTime: Boolean(data.isOnTime ?? true)
  };
}

/**
 * Calculates average piece processing time for a step position
 */
function calculateAveragePieceTime(totalStepProdTime, posQuantity) {
  const qty = Math.max(1, parseInt(posQuantity || 1, 10));
  const prod = Math.max(0, parseInt(totalStepProdTime || 0, 10));
  return Math.round((prod / qty) * 100) / 100;
}

/**
 * Calculates maximum night run performance capacity based on piece capacity and avg processing time
 */
function calculateMaxNightCapacity(maxPiecesPerNight, avgPieceTime) {
  const pieces = Math.max(0, parseInt(maxPiecesPerNight || 0, 10));
  const avgTime = Math.max(0, parseFloat(avgPieceTime || 0));
  return Math.round(pieces * avgTime);
}

/**
 * Calculates day vs. night shift allocation subject to Day Window cap and 24h (1,440 min) daily ceiling
 */
function calculateNightRunAllocation(dayShiftPlannedMin, dayCapacityMin, maxNightCapacityMin) {
  const dayCap = Math.max(0, parseInt(dayCapacityMin || 480, 10));
  // Day shift planned time CANNOT exceed Day Window limit (DayCapacity)
  const cappedDayShift = Math.min(Math.max(0, parseInt(dayShiftPlannedMin || 0, 10)), dayCap);
  
  // Available night window is 24h (1440 min) minus Day shift planned time
  const availableNightWindow = Math.max(0, 1440 - cappedDayShift);
  
  // Night shift allocation is min(maxNightCapacity, availableNightWindow)
  const maxNightCap = Math.max(0, parseInt(maxNightCapacityMin || 0, 10));
  const scheduledNightMin = Math.min(maxNightCap, availableNightWindow);
  
  const totalDailyWorkloadMin = cappedDayShift + scheduledNightMin;

  return {
    dayShiftPlannedMin: cappedDayShift,
    scheduledNightMin,
    totalDailyWorkloadMin,
    dayCapacityMin: dayCap,
    maxDailyLimitMin: 1440,
    is24hCapped: totalDailyWorkloadMin === 1440
  };
}

/**
 * Schedules a step ensuring setup time is contiguous on Day 1 ("Rüstzeit am Stück")
 * and remaining production time splits cleanly across subsequent working days.
 */
function scheduleStepWithContiguousSetup(step, availableCapacityPerDay, maxProdTagPerDay = {}) {
  const setupTime = Math.max(0, parseInt(step.setupTime || step.SetupTime || 0, 10));
  const prodTime = Math.max(0, parseInt(step.prodTime || step.ProdTime || 0, 10));
  const days = Object.keys(availableCapacityPerDay);
  const allocations = [];

  if (days.length === 0) return allocations;

  // 1. Find candidate day D where free capacity >= setupTime
  let startDayIdx = 0;
  while (startDayIdx < days.length && (availableCapacityPerDay[days[startDayIdx]] || 0) < setupTime) {
    startDayIdx++;
  }

  if (startDayIdx >= days.length) {
    // If no single day fits setup contiguous, place on overflow
    const overflowDay = days[days.length - 1] || 'Überlauf';
    allocations.push({
      dateStr: overflowDay,
      splitPart: 1,
      setupTime,
      prodTime,
      scheduledMin: setupTime + prodTime,
      isContiguousSetup: true,
      isSplit: false
    });
    return allocations;
  }

  // 2. Day 1 Allocation (100% Contiguous Setup + Initial Prod)
  const day1 = days[startDayIdx];
  const day1FreeCap = Math.max(0, availableCapacityPerDay[day1] || 0);
  const day1MaxProd = maxProdTagPerDay[day1] || 1440;
  
  const freeCapAfterSetup = Math.max(0, day1FreeCap - setupTime);
  const day1Prod = Math.min(prodTime, freeCapAfterSetup, day1MaxProd);

  allocations.push({
    dateStr: day1,
    splitPart: 1,
    setupTime,
    prodTime: day1Prod,
    scheduledMin: setupTime + day1Prod,
    isContiguousSetup: true,
    isSplit: prodTime > day1Prod
  });

  // 3. Subsequent Days Splitting (splitPart 2+)
  let remainingProd = prodTime - day1Prod;
  let currentDayIdx = startDayIdx + 1;
  let splitPart = 2;

  while (remainingProd > 0 && currentDayIdx < days.length) {
    const day = days[currentDayIdx];
    const freeCap = Math.max(0, availableCapacityPerDay[day] || 0);
    const maxProd = maxProdTagPerDay[day] || 1440;

    const allocatedProd = Math.min(remainingProd, freeCap, maxProd);
    if (allocatedProd > 0) {
      allocations.push({
        dateStr: day,
        splitPart,
        setupTime: 0,
        prodTime: allocatedProd,
        scheduledMin: allocatedProd,
        isContiguousSetup: true,
        isSplit: true
      });
      remainingProd -= allocatedProd;
      splitPart++;
    }
    currentDayIdx++;
  }

  // If any prod time remains beyond available days, put remainder into Überlauf
  if (remainingProd > 0) {
    allocations.push({
      dateStr: 'Überlauf',
      splitPart,
      setupTime: 0,
      prodTime: remainingProd,
      scheduledMin: remainingProd,
      isContiguousSetup: true,
      isSplit: true
    });
  }

  return allocations;
}

/**
 * Schedules over-planned steps (isOverplanned: true) backwards from target end date
 */
function scheduleOverplannedStep(step, targetEndDateStr, availableCapacityPerDay, maxProdTag = 240) {
  const totalMin = Math.max(0, parseInt(step.scheduledMin || step.ScheduledMin || step.prodTime || 0, 10));
  const dailyCap = Math.max(1, parseInt(step.maxProdTag || maxProdTag || 240, 10));
  const days = Object.keys(availableCapacityPerDay);
  const allocations = [];

  let endIdx = days.indexOf(targetEndDateStr);
  if (endIdx === -1) endIdx = days.length - 1;

  let remainingMin = totalMin;
  let currentIdx = endIdx;
  let splitPart = 1;

  while (remainingMin > 0 && currentIdx >= 0) {
    const day = days[currentIdx];
    const alloc = Math.min(remainingMin, dailyCap);
    
    allocations.push({
      dateStr: day,
      splitPart,
      setupTime: 0,
      prodTime: alloc,
      scheduledMin: alloc,
      isOverplanned: true,
      isSplit: remainingMin > alloc
    });

    remainingMin -= alloc;
    currentIdx--;
    splitPart++;
  }

  if (remainingMin > 0) {
    allocations.push({
      dateStr: 'Überlauf',
      splitPart,
      setupTime: 0,
      prodTime: remainingMin,
      scheduledMin: remainingMin,
      isOverplanned: true,
      isSplit: true
    });
  }

  return allocations.reverse();
}

module.exports = {
  calculateWeeklyCapacity,
  createGanttJobBlock,
  calculateAveragePieceTime,
  calculateMaxNightCapacity,
  calculateNightRunAllocation,
  scheduleStepWithContiguousSetup,
  scheduleOverplannedStep
};


