const { getPoolTL } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const poolTL = await getPoolTL();
  
  const countRes = await poolTL.request().query('SELECT COUNT(*) as count FROM MachineToProgram');
  console.log('Total programs in MachineToProgram:', countRes.recordset[0].count);
  
  const sampleRes = await poolTL.request().query('SELECT TOP 50 * FROM MachineToProgram');
  console.log('Sample program names:', sampleRes.recordset.map(r => r.ProgramName));
  
  process.exit(0);
}
run();
