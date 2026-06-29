const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    console.time('QueryTime');
    const result = await pool.request().query(`
      SELECT
        b.BP_IDAR as ArticleId,
        CAST(p.PSP_BEZEICHNUNG AS nvarchar(100)) as StepDesc,
        COUNT(*) as NightBookings
      FROM [D4].[dbo].[tZE_BUCH] zb
      INNER JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbb ON zbb.ZBUBW_IDZBU = zb.ID
      INNER JOIN [D4].[dbo].[tbe_Belp] b ON b.ID = zb.ZBU_IDBEBP
      INNER JOIN [D4].[dbo].[tPPS_SKKALP] p ON p.ID = zb.ZBU_IDPSKP
      WHERE DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) >= 22 OR DATEPART(hour, zbb.ZBUBW_DATUM_ZEIT_START) < 6
      GROUP BY b.BP_IDAR, CAST(p.PSP_BEZEICHNUNG AS nvarchar(100))
    `);
    console.timeEnd('QueryTime');
    console.log('Total articles with night bookings:', result.recordset.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
