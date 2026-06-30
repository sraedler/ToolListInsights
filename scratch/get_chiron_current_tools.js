const { getPoolTL, getPoolWT, sql } = require('C:\\git_repos\\ToolListInsights\\backend\\db');
require('dotenv').config({ path: 'C:\\git_repos\\ToolListInsights\\.env' });

async function run() {
  try {
    const poolTL = await getPoolTL();
    const poolWT = await getPoolWT();
    
    // Find Chiron machine first
    const machineResult = await poolTL.request()
      .query("SELECT Id, Name, MagazineSize FROM Machines WHERE Name LIKE '%Chiron%'");
      
    console.log('--- Chiron Machines in Toollist ---');
    console.log(machineResult.recordset);
    
    if (machineResult.recordset.length === 0) {
      console.log('No Chiron machine found.');
      process.exit(0);
    }
    
    const machineId = machineResult.recordset[0].Id;
    
    // Get all programs mapped to this machine (specifically Parkplatz / active)
    const programResult = await poolTL.request()
      .input('machineId', sql.Int, machineId)
      .query(`
        SELECT Id, ProgramName
        FROM MachineToProgram
        WHERE Machine = @machineId
      `);
      
    console.log('\n--- Chiron Programs ---');
    console.log(programResult.recordset);
    
    if (programResult.recordset.length === 0) {
      console.log('No programs found.');
      process.exit(0);
    }
    
    const programIds = programResult.recordset.map(p => p.Id);
    
    // Get tools mapped to these programs
    const toolsResult = await poolTL.request()
      .query(`SELECT T, ToolName, Comment FROM ProgramToTool WHERE MachineToProgramId IN (${programIds.join(',')}) ORDER BY T`);
      
    console.log(`\nFound ${toolsResult.recordset.length} tools in Chiron magazine.`);
    
    // Parse WinTool numbers
    const magazineTools = [];
    const wtToolIds = [];
    toolsResult.recordset.forEach(t => {
      const nameStr = t.ToolName || '';
      const idx = nameStr.lastIndexOf('-');
      if (idx !== -1) {
        const suffix = nameStr.substring(idx + 1);
        const nr = parseInt(suffix, 10);
        if (!isNaN(nr)) {
          magazineTools.push({ T: t.T, wtNr: nr, rawName: t.ToolName });
          wtToolIds.push(nr);
        }
      }
    });
    
    if (wtToolIds.length > 0) {
      // Resolve details from WinTool Tools
      const wtRes = await poolWT.request().query(`
        SELECT Nr, Descript, Ds as Diameter, CLength as Length
        FROM [WTDATA].[dbo].[Tools]
        WHERE Nr IN (${wtToolIds.join(',')})
      `);
      
      const wtMap = {};
      wtRes.recordset.forEach(row => {
        wtMap[row.Nr] = row;
      });
      
      console.log('\n--- Resolved Tools in Chiron Magazine ---');
      magazineTools.forEach(mt => {
        const detail = wtMap[mt.wtNr] || {};
        console.log(`T${mt.T}: wtNr #${mt.wtNr} (${detail.Descript || mt.rawName}), Ø ${detail.Diameter || 0}mm, L: ${detail.Length || 0}mm`);
      });
    } else {
      console.log('No tools parsed with WinTool numbers.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
