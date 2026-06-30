const { getPoolWT } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const pool = await getPoolWT();
  
  const t1 = await pool.request().query('SELECT TOP 1 * FROM [WTDATA].[dbo].[ToolList]');
  console.log('ToolList columns:', Object.keys(t1.recordset[0]));
  
  const t2 = await pool.request().query('SELECT TOP 1 * FROM [WTDATA].[dbo].[Tools]');
  console.log('Tools columns:', Object.keys(t2.recordset[0]));
  
  process.exit(0);
}
run();
