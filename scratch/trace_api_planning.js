const { getPoolD4, getPoolWT } = require('../backend/db');
const { extractNCPrograms, findMatches } = require('../backend/matching');
const fs = require('fs');
const path = require('path');

async function trace() {
  try {
    const poolD4 = await getPoolD4();
    const poolWT = await getPoolWT();

    // 1. ToolLists
    const resWT = await poolWT.request().query('SELECT Nr, Ident, NCP, Descript, MachineNr FROM [WTDATA].[dbo].[ToolLists]');
    const cachedToolLists = resWT.recordset;
    const listToMachineMap = {};
    cachedToolLists.forEach(tl => {
      listToMachineMap[tl.Nr] = tl.MachineNr;
    });

    // 2. Query steps
    const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
    let kvSql = fs.readFileSync(sqlPath, 'utf8').replace(/\bgo\b/gi, '');
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
        (
          SELECT ISNULL(SUM(
            CASE
              WHEN zbw.ZBUBW_DATUM_ZEIT_START IS NOT NULL AND zbw.ZBUBW_DATUM_ZEIT_START <> '1900-01-01' THEN
                CASE 
                  WHEN zbw.ZBUBW_DATUM_ZEIT_STOP IS NOT NULL AND zbw.ZBUBW_DATUM_ZEIT_STOP <> '1900-01-01' THEN
                    CASE
                      WHEN zbw.ZBUBW_TYP_PRODUKTION = 1 THEN
                        ROUND(CAST(DATEDIFF(second, zbw.ZBUBW_DATUM_ZEIT_START, zbw.ZBUBW_DATUM_ZEIT_STOP) AS FLOAT) / 60, 4)
                      ELSE
                        ROUND(CAST(DATEDIFF(minute, zbw.ZBUBW_DATUM_ZEIT_START, zbw.ZBUBW_DATUM_ZEIT_STOP) AS FLOAT), 4)
                    END
                  ELSE
                    CASE
                      WHEN zbw.ZBUBW_TYP_PRODUKTION = 1 THEN
                        ROUND(CAST(DATEDIFF(second, zbw.ZBUBW_DATUM_ZEIT_START, GETDATE()) AS FLOAT) / 60, 4)
                      ELSE
                        ROUND(CAST(DATEDIFF(minute, zbw.ZBUBW_DATUM_ZEIT_START, GETDATE()) AS FLOAT), 4)
                    END
                END
              ELSE 0
            END
          ), 0)
          FROM [D4].[dbo].[tZE_BUCH] zb
          LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = OuterTemp.ID
        ) as BookedTime,
        p.PSP_IDMS as MachineId,
        p.PSP_IDMP as MachinePoolId,
        p.PSP_PP_STATUS_PRODUKTION as StatusProduction,
        bk.BK_BKBE_NUMMER as ContractNumber,
        bk.BK_BKBE_TYP_BELEG_ART as BelegArt,
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
        END as StartDate
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND LTRIM(RTRIM(ISNULL(bk.BK_BKBE_NUMMER, ''))) <> '990001'
        AND ISNULL(OuterTemp.IDBEBP, 0) <> 990001
    `;

    const res = await poolD4.request().query(finalSql);
    const rows = res.recordset;

    // Filter steps as in server.js line 967
    const steps = rows.filter(step => {
      const cNrStr = String(step.ContractNumber || '').trim();
      const oIdStr = String(step.OrderId || '').trim();
      if (cNrStr === '990001' || oIdStr === '990001' || cNrStr.includes('990001')) return false;
      if (step.SPKO === 4) return false;
      if (step.TypHerkunft !== 0 || step.StepTyp !== 0) return false;

      const desc = (step.StepDesc || '').toLowerCase();
      const isDeburringAssembly = 
        step.MachineId === 15 || desc.includes('ur5') ||
        step.MachineId === 16 || desc.includes('laser') ||
        step.MachineId === 17 || desc.includes('messmaschine') || desc.includes('zeiss') || desc.includes('kmg') ||
        desc.includes('versand') || desc.includes('verpacken') || desc.includes('etikett') ||
        desc.includes('montage') || desc.includes('gewindeeinsatz') || desc.includes('zapfen brechen') ||
        desc.includes('prüf') || desc.includes('abnahme') || desc.includes('serienprüfung') || desc.includes('stempeln') ||
        desc.includes('entgrat');

      const isMachining = (step.SetupTime > 0 || step.SPKO === 2) &&
        ((step.MachineId !== null && step.MachineId !== 0) || (step.MachinePoolId !== null && step.MachinePoolId !== 0));

      return isDeburringAssembly || isMachining;
    });

    // Tool matching
    steps.forEach(step => {
      const progs = extractNCPrograms(step.StepDesc);
      if (progs.length > 0) {
        step.NCProgram = progs[0];
        const matches = findMatches(progs[0], cachedToolLists, 0.70);
        if (matches.length > 0) {
          step.MatchedListNr = matches[0].Nr;
        }
      }
    });

    // Compute realSPKO and color
    const ordersMap = {};
    steps.forEach(s => {
      if (!ordersMap[s.OrderId]) ordersMap[s.OrderId] = [];
      ordersMap[s.OrderId].push(s);
    });

    Object.keys(ordersMap).forEach(oId => {
      const group = ordersMap[oId];
      group.sort((a, b) => (parseInt(a.StepPos || 0, 10) - parseInt(b.StepPos || 0, 10)));
      group.forEach(s => {
        if (s.StatusProduction === 4 || s.SPKO === 4 || (s.BookedTime && s.BookedTime > 0)) {
          if (s.StatusProduction === 4 || s.SPKO === 4) s.realSPKO = 4;
          else s.realSPKO = 2;
        } else s.realSPKO = 1;
      });

      const normPos = (p) => {
        if (p === null || p === undefined) return null;
        const cleaned = String(p).replace(/[^0-9]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
      };

      group.forEach((step, idx) => {
        if (step.realSPKO === 2) { step.color = 'Green'; return; }
        let predPos = null;
        let vgRaw = (step.VORGAENGER || '').trim();
        if (vgRaw.startsWith('|')) vgRaw = vgRaw.replace('|', '').trim();
        if (vgRaw === '') { if (idx > 0) predPos = group[idx - 1].StepPos; }
        else predPos = vgRaw;

        let predStep = null;
        if (predPos !== null) {
          const targetNorm = normPos(predPos);
          predStep = group.find(s => normPos(s.StepPos) === targetNorm && s.StepId !== step.StepId);
        }
        if (!predStep) step.color = 'Green';
        else {
          if (predStep.realSPKO === 2) step.color = 'Yellow';
          else if (predStep.realSPKO === 1 || predStep.realSPKO === 0) step.color = 'Red';
          else if (predStep.realSPKO === 4) step.color = 'Green';
          else step.color = 'Green';
        }
      });
    });

    // Now simulate /api/planning placement for greenSteps
    const greenSteps = steps.filter(s => s.color === 'Green');

    const defaultStartStr = new Date().toISOString().substring(0, 10);
    const planningDays = [defaultStartStr, '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'];
    const lastPlanningDay = planningDays[planningDays.length - 1];

    const board = {};
    ['Brother', 'Chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2'].forEach(m => {
      board[m] = {};
      planningDays.forEach(d => board[m][d] = []);
      board[m]['Überlauf'] = [];
    });

    greenSteps.forEach(step => {
      let stepDateStr = step.StartDate ? new Date(step.StartDate).toISOString().substring(0, 10) : null;
      if (!stepDateStr || stepDateStr < planningDays[0] || stepDateStr > lastPlanningDay) {
        stepDateStr = 'Überlauf';
      }

      let targetM = null;
      if (step.MachineId === 8) targetM = 'Brother';
      else if (step.MachineId === 21) targetM = 'Chiron';
      else if (step.MachineId === 2) targetM = 'C400';
      else if (step.MachineId === 4) targetM = 'C40';
      else if (step.MachineId === 25) targetM = 'C42';
      else if (step.MachineId === 5) targetM = 'RS2_1';
      else if (step.MachineId === 6) targetM = 'RS2_2';
      else if (!step.MachineId || step.MachineId === 0) {
        let assignedMachine = null;
        if (step.MatchedListNr && listToMachineMap[step.MatchedListNr] !== undefined) {
          const wtMachine = String(listToMachineMap[step.MatchedListNr]);
          if (step.MachinePoolId === 9 || step.MachinePoolId === 12) {
            if (wtMachine === '17') assignedMachine = 'RS2_1';
            else if (wtMachine === '18') assignedMachine = 'RS2_2';
          }
        }
        targetM = assignedMachine;
      }

      if (step.StepId === 433948) {
        console.log("Trace Step 433948:", {
          StepId: step.StepId,
          ContractNumber: step.ContractNumber,
          MatchedListNr: step.MatchedListNr,
          wtMachine: listToMachineMap[step.MatchedListNr],
          targetM,
          stepDateStr,
          color: step.color
        });
      }

      if (targetM && board[targetM]) {
        const targetDay = planningDays.includes(stepDateStr) ? stepDateStr : 'Überlauf';
        board[targetM][targetDay].push(step);
      }
    });

    console.log("Items in board RS2_1 Überlauf:", board['RS2_1']['Überlauf'].map(s => s.StepId));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

trace();
