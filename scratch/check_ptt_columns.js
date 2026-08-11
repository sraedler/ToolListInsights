const { getPoolTL } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const poolTL = await getPoolTL();
    const res = await poolTL.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProgramToTool'
    `);
    console.log('=== ProgramToTool COLUMNS ===');
    console.log(res.recordset.map(r => r.COLUMN_NAME));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
