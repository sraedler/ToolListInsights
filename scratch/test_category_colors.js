const { getPoolD4 } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const pool = await getPoolD4();
    const res = await pool.request().query(`
      SELECT ID, KG_BEZEICHNUNG, KG_FARBE FROM [D4].[dbo].[tKAGO]
    `);
    console.log('=== ALL tKAGO CATEGORIES ===');
    console.log(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
