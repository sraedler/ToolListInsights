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
      OuterTemp.PSP_TYP_HERKUNFT as TypHerkunft,
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

// Map Toollist machine names to D4 identifiers
function mapToollistMachineToD4(machineName) {
  const cachedMachines = [
    { type: 'machine', dbId: 2, number: 'C400', name: 'Hermle C400' }
  ];
  const nameUpper = machineName.toUpperCase().trim();
  const matched = cachedMachines.filter(m => {
    const numUpper = m.number.toUpperCase();
    const nmUpper = m.name.toUpperCase();
    return numUpper.includes(nameUpper) || nmUpper.includes(nameUpper);
  });
  return {
    machineIds: matched.filter(m => m.type === 'machine').map(m => m.dbId),
    poolIds: matched.filter(m => m.type === 'pool').map(m => m.dbId)
  };
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
    const tools = listToToolsMap[s.MatchedListNr] || [];
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

    console.log('Fetching steps...');
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

    // Run color assignment
    const ordersMap = {};
    allSteps.forEach(row => {
      if (!ordersMap[row.OrderId]) {
        ordersMap[row.OrderId] = [];
      }
      ordersMap[row.OrderId].push(row);
    });

    Object.keys(ordersMap).forEach(orderId => {
      const stepsGroup = ordersMap[orderId];
      stepsGroup.sort((a, b) => parseInt(a.StepPos || 0, 10) - parseInt(b.StepPos || 0, 10));
      stepsGroup.forEach((step, idx) => {
        if (step.SPKO === 2 || step.SPKO === 4) {
          step.color = 'Green';
          return;
        }
        let predPos = null;
        let vgRaw = (step.VORGAENGER || '').trim();
        if (vgRaw.startsWith('|')) {
          vgRaw = vgRaw.replace('|', '').trim();
        }
        if (vgRaw === '') {
          if (idx > 0) {
            predPos = stepsGroup[idx - 1].StepPos;
          }
        } else {
          predPos = vgRaw;
        }
        let predStep = null;
        if (predPos !== null) {
          predStep = stepsGroup.find(s => s.StepPos === predPos);
        }
        if (!predStep) {
          step.color = 'Green';
        } else {
          if (predStep.SPKO === 2) {
            step.color = 'Yellow';
          } else if (predStep.SPKO === 1) {
            step.color = 'Red';
          } else if (predStep.SPKO === 4) {
            step.color = 'Green';
          } else {
            step.color = 'Green';
          }
        }
      });
    });

    const greenSteps = allSteps.filter(s => s.color === 'Green');

    greenSteps.forEach(step => {
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
    });

    const name = 'C400';
    const { toolNrs, magazineSize } = await getCurrentToolsForMachine(name);
    const mapping = mapToollistMachineToD4(name);
    
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const planningDays = getNext5WorkingDays(todayStr);

    const board = [];
    greenSteps.forEach(step => {
      const stepDate = step.StartDate || step.DeliveryDate;
      if (!stepDate) return;
      let stepDateStr = new Date(stepDate).toISOString().substring(0, 10);
      if (stepDateStr < planningDays[0]) {
        stepDateStr = planningDays[0];
      }
      if (!planningDays.includes(stepDateStr)) return;

      if (mapping.machineIds.includes(step.MachineId) || mapping.poolIds.includes(step.MachinePoolId)) {
        board.push(step);
      }
    });

    // Mock scheduled steps (e.g. sorted optimized order)
    const optScheduledSteps = [...board].sort((a, b) => {
      // Just some optimized mock sorting
      return (a.MatchedListNr || 0) - (b.MatchedListNr || 0);
    });

    const origChanges = calculateToolChanges(board, toolNrs, magazineSize, listToToolsMap);
    const optChanges = calculateToolChanges(optScheduledSteps, toolNrs, magazineSize, listToToolsMap);

    console.log(`Original Changes: ${origChanges}`);
    console.log(`Optimized Changes (using calculateToolChanges): ${optChanges}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
