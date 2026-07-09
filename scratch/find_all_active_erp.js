const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    const sql = `
      SELECT 
        PSP_PP_STATUS_PRODUKTION as ProdStatus,
        COUNT(*) as Count
      FROM [D4].[dbo].[tPPS_SKKALP]
      GROUP BY PSP_PP_STATUS_PRODUKTION
      ORDER BY PSP_PP_STATUS_PRODUKTION
    `;
    const result = await poolD4.request().query(sql);
    console.log('Status counts in tPPS_SKKALP:');
    console.table(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
