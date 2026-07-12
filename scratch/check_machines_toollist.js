const { getPoolTL } = require('../backend/db');

async function run() {
  try {
    const pool = await getPoolTL();
    const machines = await pool.query(`
      SELECT Id, Name, MagazineSize FROM Machines
    `);
    console.log('Machines:', machines.recordset);
    
    // For each machine, get active programs
    for (let m of machines.recordset) {
      const programs = await pool.request()
        .input('mId', m.Id)
        .query('SELECT Id, ProgramName FROM MachineToProgram WHERE Machine = @mId');
      console.log(`Machine ${m.Name} (Id: ${m.Id}) has programs:`, programs.recordset);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
