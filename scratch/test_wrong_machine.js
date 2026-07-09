const { getPoolD4 } = require('../backend/db');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const poolD4 = await getPoolD4();
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
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_IDMS as MachineId,
        p.PSP_IDMP as MachinePoolId
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND p.PSP_BEZEICHNUNG LIKE '%C40%'
        AND p.PSP_IDMS = 4
    `;
    const result = await poolD4.request().query(finalSql);
    console.log(`Found steps with StepDesc 'C40' and MachineId 4: ${result.recordset.length}`);
    if (result.recordset.length > 0) {
      console.log('Sample matching steps:', result.recordset.slice(0, 5));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
