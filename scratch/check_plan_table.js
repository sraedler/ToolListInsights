const { getPoolD4 } = require('../backend/db');

async function checkPlan() {
  try {
    const pool = await getPoolD4();

    // Query tPPS_SKKALP_PLAN for Step 433948 and 433947
    const resPlan = await pool.request().query(`
      SELECT * FROM [D4].[dbo].[tPPS_SKKALP_PLAN]
      WHERE PSPP_IDPSKP IN (433947, 433948) OR PSPP_IDSKKP IN (433947, 433948)
    `);
    console.log("--- tPPS_SKKALP_PLAN for 433947 & 433948 ---");
    console.log(JSON.stringify(resPlan.recordset, null, 2));

    // Also check for ALL steps of order P202675771 in tPPS_SKKALP_PLAN
    const resPlanAll = await pool.request().query(`
      SELECT plan.*, p.PSP_POSITION_NUMMER, p.PSP_BEZEICHNUNG
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] plan
      JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = plan.PSPP_IDPSKP
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.ID = p.PSP_IDPSKKK
      JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = k.PSK_IDBEBP
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      WHERE bk.BK_BKBE_NUMMER LIKE '%75771%'
    `);
    console.log("\n--- ALL tPPS_SKKALP_PLAN entries for 75771 ---");
    console.log(JSON.stringify(resPlanAll.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPlan();
