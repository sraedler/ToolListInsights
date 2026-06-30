const mssql = require('mssql/msnodesqlv8');

const configWT = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WTDATA;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configWT);
    const result = await pool.request().query(`
      SELECT DISTINCT MachineNr
      FROM ToolLists
      WHERE MachineNr IS NOT NULL AND MachineNr <> ''
    `);
    console.log('Unique MachineNrs in WinTool:', result.recordset);
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
