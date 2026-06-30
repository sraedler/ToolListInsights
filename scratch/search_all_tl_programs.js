const { getPoolTL } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  try {
    const poolTL = await getPoolTL();
    
    // Find all programs in Toollist DB
    const res = await poolTL.request().query(`
      SELECT mtp.Id, mtp.ProgramName, m.Name as MachineName
      FROM MachineToProgram mtp
      INNER JOIN Machines m ON m.Id = mtp.Machine
      WHERE mtp.ProgramName LIKE '%L117%' OR mtp.ProgramName LIKE '%155%'
    `);
    
    console.log('--- Programs matching L117 / 155 in Toollist DB ---');
    console.log(res.recordset);
    
    // Let's also check all tools in ProgramToTool for these programs
    if (res.recordset.length > 0) {
      const ids = res.recordset.map(p => p.Id);
      const toolsRes = await poolTL.request().query(`
        SELECT ptt.MachineToProgramId, ptt.T, ptt.ToolName, ptt.Comment
        FROM ProgramToTool ptt
        WHERE ptt.MachineToProgramId IN (${ids.join(',')})
      `);
      console.log('\n--- Tools inside these programs ---');
      console.log(toolsRes.recordset);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
