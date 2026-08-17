const { getPoolD4, getPoolWT } = require('../backend/db');
const fs = require('fs');
const path = require('path');

async function debugCache() {
  try {
    const poolD4 = await getPoolD4();

    // Re-run the exact query from server.js fetchActiveStepsAndMaterials
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
        bk.BK_BKBE_STATUS_BEARBEITUNG as StatusBearbeitung
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

    console.log("Running fetchActiveStepsAndMaterials query...");
    const res = await poolD4.request().query(finalSql);
    const rows = res.recordset;

    const matches75771 = rows.filter(r => String(r.ContractNumber).includes('75771'));
    console.log("Raw rows matching 75771:", matches75771.length);

    // Step 1 filter in server.js line 967:
    const filteredSteps = rows.filter(step => {
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

    const filtered75771 = filteredSteps.filter(r => String(r.ContractNumber).includes('75771'));
    console.log("Filtered steps matching 75771 in cachedSetupData.steps:", filtered75771.length);
    console.log(filtered75771.map(s => ({
      StepId: s.StepId,
      StepPos: s.StepPos,
      ContractNumber: s.ContractNumber,
      StepDesc: s.StepDesc?.replace(/\r?\n/g, ' '),
      MachineId: s.MachineId,
      MachinePoolId: s.MachinePoolId
    })));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

debugCache();
