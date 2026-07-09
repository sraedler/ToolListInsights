const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    const sql = `
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tPPS_MASTA'
    `;
    const result = await poolD4.request().query(sql);
    console.log('Columns of tPPS_MASTA:');
    console.table(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
