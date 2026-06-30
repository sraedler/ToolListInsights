const sql = require('mssql/msnodesqlv8');

async function run() {
  const connStr = 'Driver={ODBC Driver 17 for SQL Server};Server=192.168.100.8\\CIM4NET;Database=Toollist;Uid=werkzeug;Pwd=werkzeug;TrustServerCertificate=yes;';
  
  const config = {
    driver: 'msnodesqlv8',
    connectionString: connStr,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };
  
  console.log('Connecting to production Toollist database at 192.168.100.8\\CIM4NET...');
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
    console.log('Connected successfully!');
    
    // Find all programs matching L117-0155-SP3 or general L117
    const progRes = await pool.request().query(`
      SELECT mtp.Id, mtp.ProgramName, m.Name as MachineName
      FROM MachineToProgram mtp
      INNER JOIN Machines m ON m.Id = mtp.Machine
      WHERE mtp.ProgramName LIKE '%L117%' OR mtp.ProgramName LIKE '%155%'
    `);
    console.log('\n--- Production Programs matching L117 / 155 ---');
    console.log(progRes.recordset);
    
    // Check for tool 2932 in RS1/RS2
    const toolsRes = await pool.request().query(`
      SELECT mtp.ProgramName, m.Name as MachineName, ptt.T, ptt.ToolName
      FROM ProgramToTool ptt
      INNER JOIN MachineToProgram mtp ON mtp.Id = ptt.MachineToProgramId
      INNER JOIN Machines m ON m.Id = mtp.Machine
      WHERE ptt.ToolName LIKE '%2932%'
    `);
    console.log('\n--- Production Tools matching 2932 ---');
    console.log(toolsRes.recordset);
    
    await pool.close();
  } catch (err) {
    console.error('Error connecting/querying:', err.message);
  }
}
run();
