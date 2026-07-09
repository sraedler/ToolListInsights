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

    const querySql = `
      ${ctePart}
      SELECT
        OuterTemp.ID as StepId,
        OuterTemp.IDBEBP as OrderId,
        OuterTemp.SPKO as SPKO,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_POSITION_NUMMER as StepPos,
        p.PSP_PP_STATUS_PRODUKTION as ProdStatus,
        p.PSP_IDMS as MachineId,
        m.MS_BEZEICHNUNG as MachineDesc,
        b.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        bk.BK_BKBE_NUMMER as ContractNumber,
        b.BP_POSITION_NUMMER as OrderPos
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON m.ID = p.PSP_IDMS
      WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND bk.BK_BKBE_NUMMER LIKE '%P202675787%'
    `;

    const result = await poolD4.request().query(querySql);
    console.log(`Found ${result.recordset.length} steps for P202675787:`);
    result.recordset.forEach(s => {
      const desc = s.StepDesc ? s.StepDesc.substring(0, 35).replace(/\r?\n/g, ' ') : 'N/A';
      console.log(`Order: ${s.ContractNumber} | Pos: ${s.OrderPos} | AS: ${s.StepPos} | StepId: ${s.StepId} | Article: ${s.ArticleDesc} | Machine: ${s.MachineDesc || 'N/A'} | SPKO: ${s.SPKO} | ProdStatus: ${s.ProdStatus} | Desc: ${desc}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
