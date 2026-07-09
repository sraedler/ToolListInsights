const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tSK_KALK'
    `);
    console.log('Columns in tSK_KALK:');
    result.recordset.forEach(r => console.log(r.COLUMN_NAME));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
