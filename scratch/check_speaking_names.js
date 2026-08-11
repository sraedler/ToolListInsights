const { getPoolWT, getPoolTL } = require('../backend/db');
require('dotenv').config();

async function run() {
  try {
    const poolWT = await getPoolWT();
    const resWT = await poolWT.request().query(`
      SELECT TOP 10 ZzIdent, ZzBezeichn, ZzKommentar
      FROM dbo.WinTool_Baugruppen
    `);
    console.log('=== WINTOL BAUGRUPPEN SAMPLE ===');
    console.log(resWT.recordset);

    const poolTL = await getPoolTL();
    const resTL = await poolTL.request().query(`
      SELECT TOP 10 Id, ProgramName
      FROM MachineToProgram
      WHERE Id = 3202 OR ProgramName LIKE '%3202%' OR Id IN (SELECT TOP 5 Id FROM MachineToProgram)
    `);
    console.log('\n=== TOOLLIST DB MACHINE TO PROGRAM SAMPLE ===');
    console.log(resTL.recordset);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
