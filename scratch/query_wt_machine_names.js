const mssql = require('mssql/msnodesqlv8');

const configWT = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WTDATA;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configWT);
    const result = await pool.request().query(`
      SELECT *
      FROM sys.tables
      WHERE name LIKE '%mach%' OR name LIKE '%masch%'
    `);
    console.log('Tables in WTDATA:', result.recordset.map(t => t.name));
    
    // Let's also check if there is a Machines table or similar
    const result2 = await pool.request().query(`
      SELECT TOP 20 * FROM Machines
    `).catch(err => ({ recordset: ['No Machines table: ' + err.message] }));
    console.log('Machines table data:', result2.recordset);
    
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
