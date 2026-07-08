const { getPoolWT, getPoolTL } = require('../backend/db');
const { sql } = require('../backend/db');

async function run() {
  try {
    const poolWT = await getPoolWT();
    const poolTL = await getPoolTL();

    const machineName = 'C400';
    const machineResult = await poolTL.request()
      .input('name', sql.VarChar, `%${machineName}%`)
      .query('SELECT Id, Name, MagazineSize FROM Machines WHERE Name LIKE @name');
    
    const machine = machineResult.recordset[0];
    const magazineSize = machine.MagazineSize || 40;
    console.log(`C400 Magazine Size: ${magazineSize}`);

    const programResult = await poolTL.request()
      .input('machineId', sql.Int, machine.Id)
      .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @machineId');
    let activePrograms = programResult.recordset;
    let initialToolNrs = [];
    if (activePrograms.length > 0) {
      const activeProgramIds = activePrograms.map(p => p.Id);
      const toolsResult = await poolTL.request()
        .query(`SELECT ToolName FROM ProgramToTool WHERE MachineToProgramId IN (${activeProgramIds.join(',')})`);
      toolsResult.recordset.forEach(t => {
        const nameStr = t.ToolName || '';
        const idx = nameStr.lastIndexOf('-');
        const suffix = nameStr.substring(idx + 1);
        const nr = parseInt(suffix, 10);
        if (!isNaN(nr) && !initialToolNrs.includes(nr)) {
          initialToolNrs.push(nr);
        }
      });
    }
    console.log(`C400 Initial Magazine Tools Count: ${initialToolNrs.length}`);

    // Steps list
    const matchedListNrs = ['2859', '1441', '1522', '1522', '2110', '2231', '2231', '2223', '1008', '1487'];
    
    // Fetch tools for each list
    const mappingResult = await poolWT.request()
      .query(`SELECT ToolListNr, ToolNr FROM [WTDATA].[dbo].[ToolList] WHERE ToolListNr IN (${matchedListNrs.join(',')}) AND ToolNr IS NOT NULL`);
    
    const allToolsNeeded = new Set();
    const listToTools = {};
    mappingResult.recordset.forEach(row => {
      allToolsNeeded.add(row.ToolNr);
      if (!listToTools[row.ToolListNr]) {
        listToTools[row.ToolListNr] = [];
      }
      listToTools[row.ToolListNr].push(row.ToolNr);
    });

    console.log(`Total Unique Tools Needed across all 10 steps: ${allToolsNeeded.size}`);
    
    const missingTools = Array.from(allToolsNeeded).filter(t => !initialToolNrs.includes(t));
    console.log(`Missing tools that need to be loaded: ${missingTools.length}`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
