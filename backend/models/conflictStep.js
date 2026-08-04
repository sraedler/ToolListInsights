/**
 * ConflictJobStep Data Model & Factory Helper
 * Represents a blocked or warning-flagged job step in conflict mode.
 */

function createConflictReason(code, severity, message) {
  return { code, severity, message };
}

function evaluateConflictStep(step) {
  const conflictReasons = [];

  if (!step.ncProgram) {
    conflictReasons.push(createConflictReason('MISSING_NC_PROGRAM', 'CRITICAL', 'NC-Programm fehlt in WinTool / D4 Verzeichnis.'));
  }
  if (!step.fixture) {
    conflictReasons.push(createConflictReason('MISSING_FIXTURE', 'WARNING', 'Vorrichtung nicht freigegeben oder in Prüfung.'));
  }
  if (!step.toolListNr) {
    conflictReasons.push(createConflictReason('MISSING_TOOL_LIST', 'CRITICAL', 'WinTool Werkzeugliste nicht verknüpft.'));
  }
  if (step.isPredecessorLate) {
    conflictReasons.push(createConflictReason('PREDECESSOR_NOT_DONE', 'WARNING', 'Vorgänger-Arbeitsgang noch im Rückstand.'));
  }

  const isRed = step.kvStatus === 'red' || conflictReasons.some(r => r.severity === 'CRITICAL');
  const isYellow = !isRed && (step.kvStatus === 'yellow' || conflictReasons.length > 0);

  return {
    ...step,
    kvStatus: isRed ? 'red' : isYellow ? 'yellow' : 'green',
    conflictReasons,
    isConflict: isRed || isYellow
  };
}

module.exports = {
  createConflictReason,
  evaluateConflictStep
};
