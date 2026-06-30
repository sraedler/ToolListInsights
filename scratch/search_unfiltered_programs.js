const { getPoolTL } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  const poolTL = await getPoolTL();
  
  // Find all programs where name contains 'L117' or '155' or '2932'
  const res = await poolTL.request().query(`
    SELECT Id, ProgramName, Machine
    FROM MachineToProgram
    WHERE ProgramName LIKE '%L117%' 
       OR ProgramName LIKE '%155%' 
       OR ProgramName LIKE '%2932%'
  `);
  console.log('Programs:', res.recordset);
  
  // Let's also check all tools in ProgramToTool that have '2932' in ToolName
  const tools = await poolTL.request().query(`
    SELECT MachineToProgramId, T, ToolName
    FROM ProgramToTool
    WHERE ToolName LIKE '%2932%'
  `);
  console.log('Tools matching 2932:', tools.recordset);
  
  process.exit(0);
}
run();
