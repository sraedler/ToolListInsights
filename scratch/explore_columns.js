const { getPoolD4 } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const pool = await getPoolD4();
  
  // Columns for tSK_KALP
  const t1 = await pool.request().query('SELECT TOP 1 * FROM [D4].[dbo].[tSK_KALP]');
  console.log('tSK_KALP columns:', Object.keys(t1.recordset[0]));
  
  // Columns for tPPS_SKKALP
  const t2 = await pool.request().query('SELECT TOP 1 * FROM [D4].[dbo].[tPPS_SKKALP]');
  console.log('tPPS_SKKALP columns:', Object.keys(t2.recordset[0]));
  
  process.exit(0);
}
run();
