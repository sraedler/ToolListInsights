const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT TOP 20 
        ID, 
        PSP_ZEIT_UEBERLAPPUNG_PROZENT as UeberlappungProzent, 
        PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG as MaxProdTag, 
        PSP_BEZEICHNUNG as StepDesc
      FROM [D4].[dbo].[tPPS_SKKALP] 
      WHERE ISNULL(PSP_ZEIT_UEBERLAPPUNG_PROZENT, 0) > 0 
         OR ISNULL(PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG, 0) > 0
    `);
    console.log('=== OVERPLANNING D4 COLUMNS SAMPLE ===');
    console.log(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
