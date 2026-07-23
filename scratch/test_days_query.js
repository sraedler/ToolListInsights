const { getPoolD4 } = require('../backend/db');

async function testPlannedAndUsedDays() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT
        p.ID as StepId,
        bk.BK_BKBE_NUMMER as ContractNumber,
        p.PSP_POSITION_NUMMER as StepPos,
        p.PSP_ZEIT_TAGE_DURCHLAUFZEIT as BaseThroughputDays,
        (
          SELECT COUNT(DISTINCT CAST(PSPP_DATUM_START AS DATE))
          FROM [D4].[dbo].[tPPS_SKKALP_PLAN]
          WHERE tPPS_SKKALP_PLAN.PSPP_IDPSKP = p.ID
            AND tPPS_SKKALP_PLAN.PSPP_STATUS_PLANUNG <> 1
        ) as PlannedDays,
        (
          SELECT COUNT(DISTINCT CAST(zbw.ZBUBW_DATUM_ZEIT_START AS DATE))
          FROM [D4].[dbo].[tZE_BUCH] zb
          LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID
            AND zbw.ZBUBW_DATUM_ZEIT_START IS NOT NULL
            AND zbw.ZBUBW_DATUM_ZEIT_START <> '1900-01-01'
        ) as UsedDays
      FROM [D4].[dbo].[tPPS_SKKALP] p
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      WHERE bk.BK_BKBE_NUMMER IN ('P202584690', 'P202484348')
      ORDER BY bk.BK_BKBE_NUMMER, p.PSP_POSITION_NUMMER
    `);

    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

testPlannedAndUsedDays();
