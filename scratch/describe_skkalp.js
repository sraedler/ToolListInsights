const { getPoolD4 } = require('../backend/db');

async function run() {
  try {
    const poolD4 = await getPoolD4();
    const sql = `
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'tPPS_SKKALP'
        AND (COLUMN_NAME LIKE '%STAT%' OR COLUMN_NAME LIKE '%AKT%' OR COLUMN_NAME LIKE '%RUN%' OR COLUMN_NAME LIKE '%ARBEIT%')
    `;
    const result = await poolD4.request().query(sql);
    console.log('Status-related columns of tPPS_SKKALP:');
    console.table(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
