const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query('SELECT TOP 10 * FROM [D4].[dbo].[tZE_BUCH_BEWE]');
    console.log('--- tZE_BUCH_BEWE Columns ---');
    if (result.recordset.length > 0) {
      console.log(Object.keys(result.recordset[0]));
      console.log(result.recordset[0]);
    } else {
      console.log('No movements found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
