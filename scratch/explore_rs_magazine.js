const { getPoolTL, getPoolWT, sql } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  try {
    const poolTL = await getPoolTL();
    const poolWT = await getPoolWT();
    
    // Find all machines in Toollist DB to see their exact names
    const mRes = await poolTL.request().query("SELECT Id, Name FROM Machines");
    console.log('--- Machines in Toollist DB ---');
    console.log(mRes.recordset);
    
    // Let's get the current tools in the magazine of BOTH RS2-1 (Id 5) and RS2-2 (Id 6) or any machine starting with RS
    for (let machine of mRes.recordset) {
      if (machine.Name.includes('RS') || machine.Name.includes('BAZ1')) {
        const progRes = await poolTL.request()
          .input('mId', sql.Int, machine.Id)
          .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @mId');
          
        console.log(`\nMachine: ${machine.Name} (Id: ${machine.Id}), Programs:`, progRes.recordset);
        
        if (progRes.recordset.length > 0) {
          const progIds = progRes.recordset.map(p => p.Id);
          const toolsRes = await poolTL.request().query(`
            SELECT T, ToolName, Comment FROM ProgramToTool WHERE MachineToProgramId IN (${progIds.join(',')})
          `);
          console.log(`Unique tools loaded on ${machine.Name}: ${toolsRes.recordset.length}`);
          
          // Let's check if tool 2932 is in this list!
          const has2932 = toolsRes.recordset.filter(t => t.ToolName.includes('2932'));
          if (has2932.length > 0) {
            console.log(`  -> FOUND T2932! Details:`, has2932);
          } else {
            console.log(`  -> T2932 NOT found on this machine.`);
          }
        }
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
