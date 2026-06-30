const { getPoolTL, sql } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const poolTL = await getPoolTL();
  
  const res = await poolTL.request()
    .query("SELECT mtp.Id, mtp.ProgramName, m.Name as MachineName FROM MachineToProgram mtp INNER JOIN Machines m ON m.Id = mtp.Machine WHERE mtp.ProgramName = '2932375-SP1'");
  
  console.log('Program details:', res.recordset);
  
  if (res.recordset.length > 0) {
    const tools = await poolTL.request()
      .input('progId', sql.Int, res.recordset[0].Id)
      .query('SELECT T, ToolName FROM ProgramToTool WHERE MachineToProgramId = @progId');
    console.log('Tools in 2932375-SP1:', tools.recordset);
  }
  process.exit(0);
}
run();
