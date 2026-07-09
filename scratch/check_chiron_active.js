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
        OuterTemp.ID as StepId,
        OuterTemp.IDBEBP as OrderId,
        OuterTemp.SPKO as SPKO,
        p.PSP_BEZEICHNUNG as StepDesc,
        p.PSP_PP_STATUS_PRODUKTION as ProdStatus,
        p.PSP_IDMS as MachineId,
        b.BP_ARTIKEL_BEZEICHNUNG as ArticleDesc,
        b.BP_IDAR as ArticleId
      FROM (
        ${selectPart}
      ) AS OuterTemp
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = OuterTemp.IDBEBP
      INNER JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = OuterTemp.ID AND OuterTemp.PSP_TYP_HERKUNFT = 0
      WHERE bk.BK_BKBE_STATUS_BEARBEITUNG = 0 
        AND bk.BK_BKBE_TYP_BELEG = 2
        AND p.PSP_IDMS = 21
    `;
    const result = await poolD4.request().query(finalSql);
    
    console.log(`Total Chiron steps: ${result.recordset.length}`);
    
    console.log('\n--- Active Chiron steps (ProdStatus = 2 or SPKO = 2) ---');
    const activeSteps = result.recordset.filter(s => s.ProdStatus === 2 || s.SPKO === 2);
    activeSteps.forEach(s => {
      console.log(`StepId: ${s.StepId} | OrderId: ${s.OrderId} | ArticleId: ${s.ArticleId} | Article: ${s.ArticleDesc} | SPKO: ${s.SPKO} | ProdStatus: ${s.ProdStatus} | Desc: ${s.StepDesc.substring(0, 50).replace(/\r?\n/g, ' ')}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
