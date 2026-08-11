const { getPoolTL } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const poolTL = await getPoolTL();
    const res = await poolTL.request().query(`
      SELECT Id, Machine, ProgramName
      FROM MachineToProgram
      WHERE LOWER(ProgramName) LIKE '%park%'
    `);
    console.log('=== PARK TOOL LISTS IN TOOLLIST DB ===');
    console.log(res.recordset);

    if (res.recordset.length > 0) {
      const pIds = res.recordset.map(r => r.Id);
      const toolsRes = await poolTL.request().query(`
        SELECT MachineToProgramId, ToolName, Place, Twin
        FROM ProgramToTool
        WHERE MachineToProgramId IN (${pIds.join(',')})
      `);
      console.log(`\nFound ${toolsRes.recordset.length} static park tools in ProgramToTool:`);
      console.log(toolsRes.recordset.slice(0, 15));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
