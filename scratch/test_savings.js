const { getPoolD4, getPoolWT, getPoolTL } = require('../backend/db');
const { sql } = require('../backend/db');
const fs = require('fs');
const path = require('path');

function extractNCPrograms(text) {
  if (!text) return [];
  const results = [];
  const regex = /(?:NC-)?Programm:\s*([^\r\n\t]+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let part = match[1].trim();
    const doubleSpaceIdx = part.indexOf('  ');
    if (doubleSpaceIdx !== -1) part = part.substring(0, doubleSpaceIdx).trim();
    const vorrichtungIdx = part.toLowerCase().indexOf('vorrichtung:');
    if (vorrichtungIdx !== -1) part = part.substring(0, vorrichtungIdx).trim();
    const vbzIdx = part.toLowerCase().search(/vbz\d?/);
    if (vbzIdx !== -1) part = part.substring(0, vbzIdx).trim();
    if (part) {
      part = part.replace(/[;,]$/, '').trim();
      results.push(part);
    }
  }
  return results;
}

const { findMatches } = require('../backend/matching');

async function fetchActiveStepsAndMaterials(poolD4) {
  const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
  let kvSql = fs.readFileSync(sqlPath, 'utf8');
  kvSql = kvSql.replace(/\bgo\b/gi, '');
  const selectStartMatch = kvSql.match(/\)\s+SELECT\s+ID\s*,\s*IDBEBP\s*,/i);
  const selectStartIndex = selectStartMatch.index;
  const ctePart = kvSql.substring(0, selectStartIndex + 1);
  const selectPartAndSuffix = kvSql.substring(selectStartIndex + 1);
  const whereIdx = selectPartAndSuffix.lastIndexOf('WHERE ISNULL(IDBEBP, 0) <> 0');
  const selectPart = selectPartAndSuffix.substring(0, whereIdx);
  const finalSql = `
    ${ctePart}
    SELECT
      OuterTemp.ID as StepId,
      OuterTemp.IDBEBP as OrderId,
      OuterTemp.PSP_POSITION_NUMMER as StepPos,
      CASE WHEN OuterTemp.PSP_TYP_HERKUNFT = 0 THEN OuterTemp.ID ELSE 0 END as TypHerkunft,
      OuterTemp.PSP_TYP_POSITION as StepTyp,
      OuterTemp.SPKO as SPKO,
      OuterTemp.VORGAENGER as VORGAENGER,
      b.BP_ARTIKEL_BEZEICHNUNG as OrderDesc,
      b.BP_POSITION_NUMMER as OrderPos,
      b.BP_IDAR as ArticleId,
      p.PSP_BEZEICHNUNG as StepDesc,
      p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupTime,
      p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdTime,
      p.PSP_IDMS as MachineId,
      p.PSP_IDMP as MachinePoolId,
      p.PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG as MaxProdTag,
      p.PSP_MENGE_SOLL as Quantity,
      p.PSP_PP_STATUS_PRODUKTION as StatusProduction,
      CASE
        WHEN b.BP_PP_DATUM_TERMIN IS NOT NULL THEN b.BP_PP_DATUM_TERMIN
        ELSE
          CASE
            WHEN b.BP_LI_DATUM IS NOT NULL THEN b.BP_LI_DATUM
            ELSE au.BK_BKBE_AU_LI_DATUM
          END
      END as DeliveryDate,
      CASE
        WHEN OuterTemp.PSP_TYP_HERKUNFT = 0 THEN
          (
            SELECT MIN(PSPP_DATUM_START)
            FROM tPPS_SKKALP_PLAN
            WHERE tPPS_SKKALP_PLAN.PSPP_IDPSKP = OuterTemp.ID
              AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
          )
        ELSE
          (
            SELECT MIN(PSPP_DATUM_START)
            FROM tPPS_SKKALP_PLAN
            WHERE tPPS_SKKALP_PLAN.PSPP_IDSKKP = OuterTemp.ID
              AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
          )
      END as StartDate,
      bk.BK_BKBE_NUMMER as ContractNumber
    FROM (
      ${selectPart}
    ) AS OuterTemp
    INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
    INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
    LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE_AU] au ON au.BK_BKBE_AU_IDBKBE = bk.ID
    LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
    WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
      AND bk.BK_BKBE_TYP_BELEG = 2
  `;
  const result = await poolD4.request().query(finalSql);
  return result.recordset;
}

async function getCurrentToolsForMachine(machineName) {
  const poolTL = await getPoolTL();
  let searchName = machineName;
  const machineResult = await poolTL.request()
    .input('name', sql.VarChar, `%${searchName}%`)
    .query('SELECT Id, Name, MagazineSize FROM Machines WHERE Name LIKE @name');
  
  if (machineResult.recordset.length === 0) {
    return { toolNrs: [], magazineSize: 40 };
  }
  const machine = machineResult.recordset[0];
  const magazineSize = machine.MagazineSize || 40;
  const programResult = await poolTL.request()
    .input('machineId', sql.Int, machine.Id)
    .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @machineId');
  let activePrograms = programResult.recordset;
  let initialToolNrs = [];
  if (activePrograms.length > 0) {
    const activeProgramIds = activePrograms.map(p => p.Id);
    const toolsResult = await poolTL.request()
      .query(`SELECT ToolName FROM ProgramToTool WHERE MachineToProgramId IN (${activeProgramIds.join(',')})`);
    toolsResult.recordset.forEach(t => {
      const nameStr = t.ToolName || '';
      const idx = nameStr.lastIndexOf('-');
      const suffix = nameStr.substring(idx + 1);
      const nr = parseInt(suffix, 10);
      if (!isNaN(nr) && !initialToolNrs.includes(nr)) {
        initialToolNrs.push(nr);
      }
    });
  }
  return { toolNrs: initialToolNrs, magazineSize };
}

function findOptimalVictim(candidates, remainingSteps, listToToolsMap) {
  let bestVictim = candidates[0];
  let furthestIndex = -1;
  for (let cand of candidates) {
    let nextUse = Infinity;
    for (let k = 0; k < remainingSteps.length; k++) {
      const nextTools = listToToolsMap[remainingSteps[k].MatchedListNr || remainingSteps[k].matchedListNr] || [];
      if (nextTools.includes(cand)) {
        nextUse = k;
        break;
      }
    }
    if (nextUse > furthestIndex) {
      furthestIndex = nextUse;
      bestVictim = cand;
    }
  }
  return bestVictim;
}

function calculateToolChanges(stepsList, initialMagazine, magazineSize, listToToolsMap) {
  let currentMag = [...initialMagazine];
  let totalChanges = 0;
  stepsList.forEach((s, idx) => {
    const tools = listToToolsMap[s.MatchedListNr || s.matchedListNr] || [];
    const load = tools.filter(t => !currentMag.includes(t));
    totalChanges += load.length;

    // Simulate magazine update using Belady's MIN (optimal) eviction
    load.forEach(tNr => {
      while (currentMag.length >= magazineSize) {
        const candidates = currentMag.filter(mNr => !tools.includes(mNr));
        if (candidates.length === 0) break;
        
        const remaining = stepsList.slice(idx + 1);
        const victim = findOptimalVictim(candidates, remaining, listToToolsMap);
        currentMag = currentMag.filter(mNr => mNr !== victim);
      }
      currentMag.push(tNr);
    });
  });
  return totalChanges;
}

// Helper to get next 5 working days from start date
function getNext5WorkingDays(startDateStr) {
  const dates = [];
  let current = new Date(startDateStr);
  while (dates.length < 5) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Skip Sat, Sun
      dates.push(current.toISOString().substring(0, 10));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

async function run() {
  try {
    const poolD4 = await getPoolD4();
    const poolWT = await getPoolWT();
    const allSteps = await fetchActiveStepsAndMaterials(poolD4);

    const wtListsRes = await poolWT.request().query('SELECT Nr, Ident, NCP, Descript, MachineNr FROM [WTDATA].[dbo].[ToolLists]');
    const cachedToolLists = wtListsRes.recordset;

    const mappingResult = await poolWT.request().query('SELECT ToolListNr, ToolNr FROM [WTDATA].[dbo].[ToolList] WHERE ToolNr IS NOT NULL');
    const listToToolsMap = {};
    mappingResult.recordset.forEach(row => {
      if (!listToToolsMap[row.ToolListNr]) {
        listToToolsMap[row.ToolListNr] = [];
      }
      listToToolsMap[row.ToolListNr].push(row.ToolNr);
    });

    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const planningDays = getNext5WorkingDays(todayStr);

    const mName = 'Chiron';
    const { toolNrs, magazineSize } = await getCurrentToolsForMachine(mName);
    console.log(`Chiron Initial Tools count: ${toolNrs.length}`);

    // Mock board populate and lookahead candidates
    const board = [];
    const lookaheadCandidates = [];

    const lastPlanningDay = planningDays[planningDays.length - 1];
    const lookaheadLimit = new Date(lastPlanningDay);
    lookaheadLimit.setDate(lookaheadLimit.getDate() + 14);

    allSteps.forEach(step => {
      if (step.MachineId === 21) {
        // NC match
        const progs = extractNCPrograms(step.StepDesc);
        if (progs.length > 0) {
          const prog = progs[0];
          step.NCProgram = prog;
          const matches = findMatches(prog, cachedToolLists, 0.6);
          if (matches.length > 0) {
            step.MatchedListNr = matches[0].Nr;
            step.MatchedListIdent = matches[0].Ident;
          }
        }

        const stepDate = step.StartDate || step.DeliveryDate;
        if (!stepDate) return;
        let stepDateStr = new Date(stepDate).toISOString().substring(0, 10);
        if (stepDateStr < planningDays[0]) stepDateStr = planningDays[0];

        if (planningDays.includes(stepDateStr)) {
          board.push(step);
        } else if (stepDateStr > lastPlanningDay && new Date(stepDateStr) <= lookaheadLimit) {
          lookaheadCandidates.push(step);
        }
      }
    });

    console.log(`Chiron Board Steps: ${board.length}, Chiron Lookahead Candidates: ${lookaheadCandidates.length}`);

    // Simulate lookahead scheduling (mock)
    // Let's assume we pulled forward 2 lookahead steps that match board tools
    const scheduledSteps = [...board];
    const lookaheadStep = lookaheadCandidates.find(s => {
      const tools = listToToolsMap[s.MatchedListNr] || [];
      return tools.length > 0;
    });

    if (lookaheadStep) {
      console.log(`Pulling forward lookahead step: ${lookaheadStep.StepId} (original start: ${lookaheadStep.StartDate})`);
      lookaheadStep.isLookahead = true;
      scheduledSteps.push(lookaheadStep);
    }

    // Now calculate optChanges (on all scheduled steps)
    const optChanges = calculateToolChanges(scheduledSteps, toolNrs, magazineSize, listToToolsMap);

    // Calculate origChanges:
    // 1. Unoptimized baseline: ONLY contains the non-lookahead steps
    const origScheduledSteps = scheduledSteps.filter(s => !s.isLookahead);
    let origChanges = calculateToolChanges(origScheduledSteps, toolNrs, magazineSize, listToToolsMap);

    // 2. Add future reload penalty for lookahead steps
    const lookaheadSteps = scheduledSteps.filter(s => s.isLookahead);
    lookaheadSteps.forEach(s => {
      const tools = listToToolsMap[s.MatchedListNr] || [];
      const misses = tools.filter(t => !toolNrs.includes(t));
      origChanges += misses.length;
      console.log(`Adding Lookahead Penalty: +${misses.length} changes`);
    });

    console.log(`Final Before Changes (Baseline): ${origChanges}`);
    console.log(`Final After Changes (Optimized): ${optChanges}`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
