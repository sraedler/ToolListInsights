const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        bk.BK_BKBE_TYP_BELEG as TypBeleg,
        COUNT(DISTINCT bk.BK_BKBE_NUMMER) as UniqueOrdersCount,
        COUNT(*) as TotalStepsCount
      FROM [D4].[dbo].[tbe_Belp] b
      INNER JOIN [D4].[dbo].[tPPS_SKKALK] k ON k.PSK_IDBEBP = b.ID
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.PSP_IDPSKKK = k.ID
      LEFT JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON bk.BK_BKBE_IDBEBK = b.BP_IDBEBK
      WHERE p.PSP_TYP_POSITION = 0
      GROUP BY bk.BK_BKBE_TYP_BELEG
    `);
    
    console.log('Document Types in D4 Steps:');
    console.log(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
