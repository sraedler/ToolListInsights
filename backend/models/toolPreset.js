/**
 * ToolPresetJob & ComponentPickItem Data Model Helper
 * Calculates net tool assembly requirements and pre-setting duration.
 */

function calculateNetToolSetup(totalTools, magazineTools, baseSetupMin = 10, perToolMin = 5) {
  const toolsToSetupCount = Math.max(0, totalTools - magazineTools);
  const toolsAlreadyInMagazineCount = Math.min(totalTools, magazineTools);
  const estimatedSetupDurationMin = baseSetupMin + (toolsToSetupCount * perToolMin);

  return {
    toolsToSetupCount,
    toolsAlreadyInMagazineCount,
    estimatedSetupDurationMin
  };
}

function createToolPresetJob(data) {
  const totalTools = parseInt(data.totalToolsCount || 0, 10);
  const magTools = parseInt(data.toolsAlreadyInMagazineCount || 0, 10);
  const net = calculateNetToolSetup(totalTools, magTools);

  return {
    toolListNr: String(data.toolListNr || ''),
    machine: String(data.machine || ''),
    scheduledStartTime: String(data.scheduledStartTime || new Date().toISOString()),
    totalToolsCount: totalTools,
    toolsToSetupCount: net.toolsToSetupCount,
    toolsAlreadyInMagazineCount: net.toolsAlreadyInMagazineCount,
    setupStatus: data.setupStatus || 'PREPARATION_PENDING',
    estimatedSetupDurationMin: net.estimatedSetupDurationMin
  };
}

module.exports = {
  calculateNetToolSetup,
  createToolPresetJob
};
