const sql = require('mssql');
const { getPoolTL, getPoolWT } = require('../backend/db.js');

async function test() {
  try {
    const poolTL = await getPoolTL();
    
    console.log('=== MACHINES ===');
    const machines = await poolTL.request().query('SELECT Id, Name FROM Machines');
    console.log(machines.recordset);
    
    for (const machine of machines.recordset) {
      console.log(`\n=== PROGRAMS FOR MACHINE ${machine.Name} (Id: ${machine.Id}) ===`);
      const programs = await poolTL.request()
        .input('machineId', sql.Int, machine.Id)
        .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @machineId');
      console.log(programs.recordset);
      
      for (const prog of programs.recordset) {
        const toolsCount = await poolTL.request()
          .input('programId', sql.Int, prog.Id)
          .query('SELECT COUNT(*) as count FROM ProgramToTool WHERE MachineToProgramId = @programId');
        console.log(`  - Program: "${prog.ProgramName}" (Id: ${prog.Id}) -> Tools count: ${toolsCount.recordset[0].count}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

test();
