const { getPoolD4 } = require('../backend/db');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const poolD4 = await getPoolD4();

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
        bk.BK_BKBE_NUMMER as ContractNumber
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE OuterTemp.ID = 433948
    `;

    const res = await poolD4.request().query(finalSql);
    const row = res.recordset[0];
    console.log("Raw Row 433948:", row);

    row.originalSetupTime = row.SetupTime || 0;
    row.originalProdTime = row.ProdTime || 0;
    if (row.BookedTime && row.BookedTime > 0) {
      const totalSoll = (row.SetupTime || 0) + (row.ProdTime || 0);
      const remaining = Math.max(0, totalSoll - row.BookedTime);
      row.SetupTime = 0;
      row.prodTime = remaining;
    } else {
      row.prodTime = row.ProdTime || 0;
    }
    row.setupTime = row.SetupTime || 0;
    row.scheduledMin = (row.setupTime || 0) + (row.prodTime || 0);

    const isMachiningOld = (row.SetupTime > 0 || row.SPKO === 2) &&
      ((row.MachineId !== null && row.MachineId !== 0) || (row.MachinePoolId !== null && row.MachinePoolId !== 0));

    const isMachiningFixed = (row.originalSetupTime > 0 || row.setupTime > 0 || row.scheduledMin > 0 || row.realSPKO === 2 || row.SPKO === 2) &&
      ((row.MachineId !== null && row.MachineId !== 0) || (row.MachinePoolId !== null && row.MachinePoolId !== 0));

    console.log("row.SetupTime after mutation:", row.SetupTime);
    console.log("row.BookedTime:", row.BookedTime);
    console.log("isMachiningOld:", isMachiningOld);
    console.log("isMachiningFixed:", isMachiningFixed);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
