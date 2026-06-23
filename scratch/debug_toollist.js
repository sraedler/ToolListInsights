const sql = require('mssql/msnodesqlv8');

const connStrTL = 'Driver={ODBC Driver 17 for SQL Server};Server=SRVDEVELOP;Database=Toollist;Trusted_Connection=yes;TrustServerCertificate=yes;';

async function run() {
  try {
    const poolTL = new sql.ConnectionPool({ driver: 'msnodesqlv8', connectionString: connStrTL });
    await poolTL.connect();

    console.log('--- Tool counts per MachineToProgramId ---');
    const result = await poolTL.request().query(`
      SELECT 
        mp.Id as ProgramId,
        m.Name as MachineName,
        mp.ProgramName,
        COUNT(pt.Id) as ToolCount
      FROM MachineToProgram mp
      INNER JOIN Machines m ON m.Id = mp.Machine
      LEFT JOIN ProgramToTool pt ON pt.MachineToProgramId = mp.Id
      GROUP BY mp.Id, m.Name, mp.ProgramName
      ORDER BY m.Name, ToolCount DESC
    `);
    console.log(result.recordset);

    await poolTL.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
