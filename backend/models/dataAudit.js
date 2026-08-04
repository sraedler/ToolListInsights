/**
 * DataAudit Data Model Helper
 * Audits manufacturing steps for missing master data and computes completeness scores.
 */

function auditJobStep(step) {
  const issues = [];

  if (!step.ncProgram) {
    issues.push({ code: 'MISSING_NC', severity: 'RED', description: 'NC-Programm im Verzeichnis nicht vorhanden.' });
  } else if (step.ncMatchMode === 'fuzzy') {
    issues.push({ code: 'FUZZY_NC_MATCH', severity: 'ORANGE', description: 'NC-Programmname weicht leicht vom Standard ab (Fuzzy Match).' });
  }

  if (!step.matchedListNr && !step.toolListNr) {
    issues.push({ code: 'MISSING_TOOL_LIST', severity: 'RED', description: 'WinTool Werkzeugliste nicht verknüpft.' });
  }

  if (!step.fixture) {
    issues.push({ code: 'MISSING_FIXTURE', severity: 'YELLOW', description: 'Spannmittel / Vorrichtung im Stammblatt fehlt.' });
  }

  if (step.isWrongMachine) {
    issues.push({ code: 'WRONG_MACHINE', severity: 'RED', description: 'Arbeitsgang auf falscher Maschinengruppe eingeplant.' });
  }

  const completenessScorePercent = Math.max(0, 100 - (issues.length * 25));

  return {
    stepId: String(step.stepId || ''),
    orderId: String(step.orderId || ''),
    articleId: String(step.articleId || ''),
    articleName: String(step.articleName || ''),
    machine: String(step.machine || ''),
    issues,
    completenessScorePercent,
    hasDmsDrawing: Boolean(step.articleId)
  };
}

module.exports = {
  auditJobStep
};
