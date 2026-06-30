const { getPoolTL } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const poolTL = await getPoolTL();
  
  const res = await poolTL.request().query('SELECT TOP 100 * FROM ProgramToTool');
  console.log('Sample tools in ProgramToTool:', res.recordset.map(r => r.ToolName));
  
  process.exit(0);
}
run();
