const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        p.PSP_PP_STATUS_PRODUKTION as StatusVal,
        COUNT(*) as Count
      FROM [D4].[dbo].[tPPS_SKKALP] p
      GROUP BY p.PSP_PP_STATUS_PRODUKTION
    `);
    
    console.log('Production Status Values:');
    result.recordset.forEach(row => {
      console.log(`Status: ${row.StatusVal}, Count: ${row.Count}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
