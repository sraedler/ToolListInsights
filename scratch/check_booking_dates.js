const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    const sql = `
      SELECT 
        zb.ID,
        zb.ZBUBW_DATUM_ZEIT_START,
        zb.ZBUBW_DATUM_ZEIT_STOP
      FROM [D4].[dbo].[tZE_BUCH_BEWE] zb
      INNER JOIN [D4].[dbo].[tZE_BUCH] z ON z.ID = zb.ZBUBW_IDZBU
      WHERE z.ZBU_IDPSKP = 385980
    `;
    const result = await poolD4.request().query(sql);
    console.log(`Bookings for StepId 385980:`);
    console.table(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
