const mssql = require('mssql/msnodesqlv8');

const configD4 = {
  driver: 'msnodesqlv8',
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=D4;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

async function main() {
  try {
    const pool = await mssql.connect(configD4);
    const result = await pool.request().query('SELECT TOP 1 * FROM tSK_KALP');
    console.log(Object.keys(result.recordset[0]));
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}

main();
