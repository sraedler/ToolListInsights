const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res1 = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tBE_BELK_BKBE'
    `);
    console.log('=== tBE_BELK_BKBE COLUMNS ===');
    console.log(res1.recordset.map(r => r.COLUMN_NAME));

    const res2 = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tEK_BELK_ALLG'
    `);
    console.log('=== tEK_BELK_ALLG COLUMNS ===');
    console.log(res2.recordset.map(r => r.COLUMN_NAME));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
