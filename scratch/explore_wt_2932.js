const { getPoolTL } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const poolTL = await getPoolTL();
  
  // Find all programs for RS2 (Id 4)
  const progs = await poolTL.request()
    .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = 4');
  
  const ids = progs.recordset.map(p => p.Id);
  if (ids.length > 0) {
    const tools = await poolTL.request().query(`
      SELECT p.ProgramName, ptt.T, ptt.ToolName
      FROM ProgramToTool ptt
      INNER JOIN MachineToProgram p ON p.Id = ptt.MachineToProgramId
      WHERE ptt.MachineToProgramId IN (${ids.join(',')})
        AND (ptt.ToolName LIKE '%2932%' OR ptt.ToolName LIKE '%HM16%')
    `);
    console.log('Matching tools in RS1:', tools.recordset);
  } else {
    console.log('No programs for RS1.');
  }
  process.exit(0);
}
run();
