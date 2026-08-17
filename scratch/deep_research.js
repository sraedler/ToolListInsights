const { getPoolD4 } = require('../backend/db');
const fs = require('fs');
const path = require('path');

async function research() {
  try {
    const pool = await getPoolD4();
    console.log("=== DEEP RESEARCH FOR P202675771 ===");

    // 1. Inspect Step 433947 & 433948 in tPPS_SKKALP directly
    const resStep = await pool.request().query(`
      SELECT * FROM [D4].[dbo].[tPPS_SKKALP]
      WHERE ID IN (433947, 433948)
    `);
    console.log("\n--- tPPS_SKKALP for 433947 & 433948 ---");
    console.log(JSON.stringify(resStep.recordset, null, 2));

    // 2. Inspect tZE_BUCH (Zeiterfassung / BDE bookings) for Step 433947 & 433948
    const resZe = await pool.request().query(`
      SELECT zb.*, zbw.*
      FROM [D4].[dbo].[tZE_BUCH] zb
      LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
      WHERE zb.ZBU_IDPSKP IN (433947, 433948)
    `);
    console.log("\n--- tZE_BUCH & tZE_BUCH_BEWE for 433947 & 433948 ---");
    console.log(JSON.stringify(resZe.recordset, null, 2));

    // 3. Inspect KV_test.sql output specifically for ID 433947 & 433948
    const sqlPath = path.join(__dirname, '..', 'KV_test.sql');
    let kvSql = fs.readFileSync(sqlPath, 'utf8').replace(/\bgo\b/gi, '');
    const selectStartMatch = kvSql.match(/\)\s+SELECT\s+ID\s*,\s*IDBEBP\s*,/i);
    const selectStartIndex = selectStartMatch.index;
    const ctePart = kvSql.substring(0, selectStartIndex + 1);
    const selectPartAndSuffix = kvSql.substring(selectStartIndex + 1);
    const whereIdx = selectPartAndSuffix.lastIndexOf('WHERE ISNULL(IDBEBP, 0) <> 0');
    const selectPart = selectPartAndSuffix.substring(0, whereIdx);

    const fullSql = `
      ${ctePart}
      SELECT OuterTemp.*
      FROM (
        ${selectPart}
      ) AS OuterTemp
      WHERE OuterTemp.ID IN (433947, 433948)
    `;

    const resKv = await pool.request().query(fullSql);
    console.log("\n--- KV_test.sql output for 433947 & 433948 ---");
    console.log(JSON.stringify(resKv.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Research error:", err);
    process.exit(1);
  }
}

research();
