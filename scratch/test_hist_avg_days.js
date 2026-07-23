const { getPoolD4 } = require('../backend/db');

async function testHistoricalAvgDays() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        b.BP_IDAR as ArticleId,
        p.PSP_POSITION_NUMMER as StepPos,
        COUNT(DISTINCT p.ID) as TotalCompletedOrders,
        AVG(CAST(StepDays.UsedDays AS FLOAT)) as AvgHistoricalDays
      FROM [D4].[dbo].[tPPS_SKKALP] p
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      CROSS APPLY (
        SELECT COUNT(DISTINCT CAST(zbw.ZBUBW_DATUM_ZEIT_START AS DATE)) as UsedDays
        FROM [D4].[dbo].[tZE_BUCH] zb
        JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
        WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
      ) StepDays
      WHERE StepDays.UsedDays > 0
      GROUP BY b.BP_IDAR, p.PSP_POSITION_NUMMER
      HAVING COUNT(DISTINCT p.ID) >= 1
    `);

    console.log(`Successfully calculated historical average throughput days for ${result.recordset.length} article-step combinations.`);
    console.log('Sample results:', JSON.stringify(result.recordset.slice(0, 10), null, 2));
  } catch (err) {
    console.error('Error querying historical averages:', err);
  } finally {
    process.exit(0);
  }
}

testHistoricalAvgDays();
