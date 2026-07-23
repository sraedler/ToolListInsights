const { getPoolD4 } = require('../backend/db');

async function testPlanningDaysQuery() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        bk.BK_BKBE_NUMMER AS ContractNr,
        b.BP_POSITION_NUMMER AS OrderPos,
        p.PSP_POSITION_NUMMER AS StepPos,
        CAST(p.PSP_BEZEICHNUNG AS VARCHAR(500)) AS StepDesc,
        planT.PSPP_DATUM_START AS PlannedDate,
        planT.PSPP_ZEIT AS PlannedTimeMinutes,
        p.PSP_ZEIT_TAGE_DURCHLAUFZEIT AS BaseThroughputDays
      FROM [D4].[dbo].[tPPS_SKKALP_PLAN] planT
      JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = planT.PSPP_IDPSKP
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      WHERE planT.PSPP_STATUS_PLANUNG <> 1
        AND bk.BK_BKBE_STATUS_BEARBEITUNG = 0
        AND bk.BK_BKBE_NUMMER IN ('P202584690', 'P202484348')
      ORDER BY bk.BK_BKBE_NUMMER, p.PSP_POSITION_NUMMER, planT.PSPP_DATUM_START ASC
    `);

    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

testPlanningDaysQuery();
